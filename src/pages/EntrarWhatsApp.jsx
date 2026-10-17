/* ENTRARWHATSAPP v5 — igual ao onboarding novo: quadradinhos do codigo sem verde (so mais claros), botoes maiores, letras maiores, links dos Termos sem verde (v4: testes sem limite: qualquer 37 00000-0001 a 9999 e qualquer codigo de 6 numeros (ehTelefoneTeste) (v3: ponte do modo teste: numeros de teste entram sem o login por telefone do painel (contaDoNumeroTeste) (v2: aceita TELEFONES_TESTE e aviso no rodape; v1: login so pelo WhatsApp)) */
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { MODO_TESTE_LOGIN, contaDoNumeroTeste, ehTelefoneTeste } from "@/config/piloto";

/* ===================================================================
   ENTRAR COM O WHATSAPP (05/10/2026)

   E a UNICA porta de entrada do app (em /login e /cadastro, com a
   chave MOSTRAR_LOGIN_EMAIL = false em src/config/piloto.js). Serve
   para quem ja tem conta e para quem e novo: o Supabase cria a conta
   sozinho no primeiro codigo certo.

   1) NUMERO — (DDD) + numero, +55 fixo. "Receber codigo" chama
      supabase.auth.signInWithOtp({ phone }). O Supabase gera o codigo e
      chama a Edge Function enviar-otp-whatsapp (Send SMS Hook), que
      manda pela Z-API.
   2) CODIGO — 6 quadradinhos (mesmo visual do Cadastro). Confere
      sozinho ao completar os 6 digitos: verifyOtp({ type: "sms" }).
      "Reenviar codigo" so libera depois de 60s (o Supabase tambem so
      deixa pedir um novo a cada 60s).
   3) DEPOIS DE ENTRAR — grava "+55..." em perfis.whatsapp e decide:
      onboarding_ok = true -> /dashboard; senao -> /onboarding.

   CODIGO ERRADO x VENCIDO: o Supabase devolve a MESMA mensagem para os
   dois ("Token has expired or is invalid"). A tela decide pelo tempo
   desde o envio: passou de 10 minutos = vencido.

   Plano B (Z-API fora do ar): /entrar-email continua abrindo o login
   por e-mail e senha. Ver docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md.

   TECLADO DO iPHONE: raiz .tela-rolavel + .conteudo-rolavel como filho
   DIRETO (igual ao Cadastro). Campos com fonte de 16px (abaixo disso o
   Safari da zoom).
   =================================================================== */

const ESPERA_REENVIO_S = 60;
/* Tem que bater com o "SMS OTP Expiry" do painel (600s) e com a
   mensagem do WhatsApp ("Vale por 10 minutos"). */
const VALIDADE_CODIGO_MS = 10 * 60 * 1000;

const ERRO_ENVIO = "Não conseguimos enviar agora. Tente de novo em alguns minutos.";
const ERRO_INTERNET = "Sem internet. Confira sua conexão e tente de novo.";
const ERRO_MUITAS = "Muitas tentativas. Espere alguns minutos e tente de novo.";
const ERRO_NUMERO = "Confira o número: DDD + número do WhatsApp.";

/* Formata enquanto digita: (37) 99999-8888 */
function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* DDD sem zero (11 a 99) + 8 digitos (fixo) ou 9 comecando com 9 (celular).
   v2: com MODO_TESTE_LOGIN, os numeros de TELEFONES_TESTE (ex.:
   37 00000-0001) tambem valem, mesmo sem o 9 de celular. */
function telefoneValido(valor) {
  const d = String(valor).replace(/\D/g, "");
  if (ehTelefoneTeste(`55${d}`)) return true;
  if (!/^[1-9]{2}/.test(d)) return false;
  if (d.length === 10) return true;
  return d.length === 11 && d[2] === "9";
}

function semInternet() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function erroDeRede(m) {
  return m.includes("fetch") || m.includes("network") || m.includes("load failed");
}

export default function EntrarWhatsApp() {
  useTemaEscuroForcado();
  const navigate = useNavigate();

  // "numero" | "codigo"
  const [etapa, setEtapa] = useState("numero");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const enviadoEmRef = useRef(0);
  const conferindoRef = useRef(false);
  const acoesCodigoRef = useRef(null);

  const digitos = telefone.replace(/\D/g, "");
  const phone = `+55${digitos}`;
  /* v3: numero de teste com MODO_TESTE_LOGIN ligado (ver contaDoNumeroTeste) */
  /* v4: qualquer 37 00000-0001 a 9999 (ehTelefoneTeste) */
  const numeroDeTeste = ehTelefoneTeste(`55${digitos}`);

  /* Contagem do "Reenviar codigo" */
  useEffect(() => {
    if (segundos <= 0) return undefined;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--text)",
  };

  const botaoPrincipal = {
    backgroundColor: "transparent",
    color: "var(--primary)",
    border: "1px solid var(--primary)",
  };

  /* Centraliza quando cabe; rola quando o teclado aperta (ver Cadastro) */
  const centralizadoOuRolavel = { margin: "auto 0" };

  /* Mesmo ajuste do Cadastro: com o teclado subindo, rola ate os botoes */
  function aoFocarCodigo() {
    setTimeout(() => {
      acoesCodigoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  function voltar() {
    if (etapa === "codigo") return trocarNumero();
    navigate("/", { replace: true });
  }

  function trocarNumero() {
    setErro("");
    setAviso("");
    setCodigo("");
    setEtapa("numero");
  }

  /* Pede o codigo ao Supabase. Devolve true se foi enviado. */
  async function pedirCodigo() {
    setErro("");
    setAviso("");
    if (!telefoneValido(telefone)) {
      setErro(ERRO_NUMERO);
      return false;
    }
    if (semInternet()) {
      setErro(ERRO_INTERNET);
      return false;
    }
    /* v3: numero de teste nao pede codigo ao Supabase (o login por
       telefone do painel ainda esta desligado): vai direto para o codigo. */
    if (numeroDeTeste) {
      enviadoEmRef.current = Date.now();
      setSegundos(ESPERA_REENVIO_S);
      return true;
    }
    setEnviando(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        const m = String(error.message || "").toLowerCase();
        // "For security purposes, you can only request this after 45 seconds."
        const espera = m.match(/after (\d+) seconds?/);
        if (espera) {
          setSegundos(Number(espera[1]));
          setErro(`Espere ${espera[1]} segundos para pedir outro código.`);
        } else if (error.status === 429 || m.includes("rate limit") || m.includes("too many")) {
          setErro(ERRO_MUITAS);
        } else if (m.includes("invalid phone") || m.includes("phone number")) {
          setErro(ERRO_NUMERO);
        } else if (erroDeRede(m)) {
          setErro(ERRO_INTERNET);
        } else {
          setErro(ERRO_ENVIO);
        }
        return false;
      }
      enviadoEmRef.current = Date.now();
      setSegundos(ESPERA_REENVIO_S);
      return true;
    } catch (e) {
      setErro(erroDeRede(String(e?.message || "").toLowerCase()) ? ERRO_INTERNET : ERRO_ENVIO);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function receberCodigo() {
    if (enviando) return;
    const enviou = await pedirCodigo();
    if (enviou) {
      setCodigo("");
      setEtapa("codigo");
    }
  }

  async function reenviarCodigo() {
    if (enviando || segundos > 0) return;
    setCodigo("");
    const enviou = await pedirCodigo();
    if (enviou) setAviso("Enviamos um código novo.");
  }

  /* v3: PONTE DO MODO TESTE. Confere o codigo fixo e entra na conta de
     e-mail de teste do numero (contaDoNumeroTeste, em src/config/piloto.js).
     Primeira vez: a conta nao existe, entao e criada (o Supabase confirma
     o e-mail sozinho neste projeto) e ja entra. Devolve o usuario, ou
     null com a mensagem de erro na tela. */
  async function entrarComNumeroDeTeste(valor) {
    /* v4: qualquer codigo de 6 numeros vale para numero de teste */
    if (!/^\d{6}$/.test(valor)) {
      setErro("Digite os 6 números do código.");
      return null;
    }
    const { email, senha } = contaDoNumeroTeste(`55${digitos}`);
    let { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error && /invalid login credentials/i.test(error.message || "")) {
      ({ data, error } = await supabase.auth.signUp({ email, password: senha }));
    }
    if (error || !data?.session || !data?.user) {
      const m = String(error?.message || "").toLowerCase();
      setErro(erroDeRede(m) ? ERRO_INTERNET : "Não foi possível entrar. Tente de novo.");
      return null;
    }
    return data.user;
  }

  /* Confere o codigo. Chamado sozinho quando completa 6 digitos. */
  async function conferirCodigo(valor = codigo) {
    if (conferindoRef.current) return;
    if (valor.length < 6) {
      setErro("Digite os 6 números do código.");
      return;
    }
    if (semInternet()) {
      setErro(ERRO_INTERNET);
      return;
    }
    conferindoRef.current = true;
    setConferindo(true);
    setErro("");
    setAviso("");

    let user = null;
    try {
      /* v3: ponte do modo teste (sem o login por telefone do painel) */
      if (numeroDeTeste) {
        user = await entrarComNumeroDeTeste(valor);
        if (!user) {
          setCodigo("");
          return;
        }
      } else {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: valor, type: "sms" });
      if (error) {
        const m = String(error.message || "").toLowerCase();
        if (error.status === 429 || m.includes("rate limit") || m.includes("too many")) {
          setErro(ERRO_MUITAS);
        } else if (erroDeRede(m)) {
          setErro(ERRO_INTERNET);
        } else if (Date.now() - enviadoEmRef.current > VALIDADE_CODIGO_MS) {
          setErro("Esse código venceu. Toque em Reenviar código.");
        } else {
          setErro("Código errado. Confira e digite de novo.");
        }
        setCodigo("");
        return;
      }
      user = data?.user || null;
      }
    } catch (e) {
      setErro(erroDeRede(String(e?.message || "").toLowerCase()) ? ERRO_INTERNET : "Não foi possível entrar. Tente de novo.");
      setCodigo("");
      return;
    } finally {
      conferindoRef.current = false;
      setConferindo(false);
    }

    /* Entrou. Grava o numero no perfil e decide o destino pelo BANCO
       (igual ao Login): onboarding_ok = true -> Dashboard. */
    let precisaOnboarding = true;
    try {
      if (user) {
        await supabase.from("perfis").update({ whatsapp: phone }).eq("id", user.id);
        const { data: perfil } = await supabase
          .from("perfis")
          .select("onboarding_ok")
          .eq("id", user.id)
          .single();
        if (perfil && perfil.onboarding_ok === true) precisaOnboarding = false;
      }
    } catch {
      /* falha de rede depois de entrar: segue para o Dashboard (igual ao Login) */
      precisaOnboarding = false;
    }
    navigate(precisaOnboarding ? "/onboarding" : "/dashboard", { replace: true });
  }

  function aoDigitarCodigo(e) {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCodigo(valor);
    if (erro) setErro("");
    if (valor.length === 6) conferirCodigo(valor);
  }

  const podeEnviar = telefoneValido(telefone);

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="conteudo-rolavel hide-scrollbar flex flex-col px-6 pb-6">
        <TopoRolavel titulo="" simples onVoltar={voltar} />

        <div className="max-w-sm w-full mx-auto" style={centralizadoOuRolavel}>
          <div className="flex justify-center mb-7">
            <Gauge size={44} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          {/* ============ 1) NUMERO ============ */}
          {etapa === "numero" && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Entre com seu WhatsApp
              </h1>

              <div className="mt-5 space-y-3">
                <div className="flex items-stretch gap-2">
                  <div
                    className="flex items-center justify-center gap-1.5 px-3.5 rounded-xl shrink-0"
                    style={{ ...fieldStyle, fontSize: 16 }}
                  >
                    <span aria-hidden>🇧🇷</span>
                    <span style={{ color: "var(--text-secondary)" }}>+55</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(00) 00000-0000"
                    aria-label="Número do WhatsApp com DDD"
                    value={telefone}
                    onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); if (erro) setErro(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && podeEnviar) receberCodigo(); }}
                    className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-xl focus:outline-none placeholder:opacity-70"
                    style={{ ...fieldStyle, fontSize: 16 }}
                  />
                </div>

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={receberCodigo}
                  disabled={enviando || !podeEnviar}
                  className="w-full rounded-2xl font-semibold hover:opacity-90 disabled:opacity-40"
                  style={{ ...botaoPrincipal, padding: "15px 0", fontSize: 16 }}
                >
                  {enviando ? "Enviando..." : "Receber código"}
                </button>
              </div>
            </>
          )}

          {/* ============ 2) CODIGO ============ */}
          {etapa === "codigo" && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Digite o código
              </h1>
              <p className="text-[15px] text-center mt-2" style={{ color: "var(--text-secondary)" }}>
                Enviado para{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>+55 {telefone}</span>
              </p>

              {/* 6 quadradinhos: o campo real fica invisivel por cima e os
                  quadradinhos so desenham o que foi digitado (ver Cadastro).
                  Sem maxLength: assim colar "123 456" tambem funciona. */}
              <div className="mt-6">
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={codigo}
                    autoFocus
                    onFocus={aoFocarCodigo}
                    onChange={aoDigitarCodigo}
                    onKeyDown={(e) => { if (e.key === "Enter") conferirCodigo(); }}
                    className="absolute inset-0 w-full h-full opacity-0"
                    style={{ caretColor: "transparent", fontSize: 16 }}
                    aria-label="Código de 6 números"
                  />
                  <div className="flex items-center justify-center gap-2 pointer-events-none">
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const preenchido = codigo.length > i;
                      const atual = codigo.length === i;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-center rounded-xl"
                          style={{
                            width: 46,
                            height: 56,
                            fontSize: 24,
                            fontWeight: 700,
                            color: "var(--text)",
                            backgroundColor: "transparent",
                            border: `1px solid ${
                              atual || preenchido ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.18)"
                            }`,
                          }}
                        >
                          {codigo[i] || ""}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div ref={acoesCodigoRef} className="mt-5 space-y-3 scroll-mt-24">
                  {erro && <AuthError>{erro}</AuthError>}
                  {aviso && !erro && (
                    <p className="text-[13.5px] text-center" style={{ color: "var(--text-secondary)" }}>
                      {aviso}
                    </p>
                  )}

                  <button
                    onClick={() => conferirCodigo()}
                    disabled={conferindo || codigo.length < 6}
                    className="w-full rounded-2xl font-semibold hover:opacity-90 disabled:opacity-40"
                    style={{ ...botaoPrincipal, padding: "15px 0", fontSize: 16 }}
                  >
                    {conferindo ? "Entrando..." : "Entrar"}
                  </button>

                  <button
                    onClick={reenviarCodigo}
                    disabled={enviando || segundos > 0}
                    className="w-full text-center text-[15px] pt-1 disabled:opacity-40"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {enviando
                      ? "Enviando..."
                      : segundos > 0
                      ? `Reenviar código em ${segundos}s`
                      : "Reenviar código"}
                  </button>

                  <button
                    onClick={trocarNumero}
                    className="w-full text-center text-[15px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Trocar número
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* v2: aviso discreto do modo teste (some com MODO_TESTE_LOGIN = false) */}
      {MODO_TESTE_LOGIN && (
        <p className="px-6 pb-2 shrink-0 text-center" style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
          Modo teste: use 37 00000-0001 a 9999, qualquer código
        </p>
      )}

      {/* Termos so na etapa do numero (igual ao Cadastro) */}
      {etapa === "numero" && (
        <div className="px-6 pb-2 shrink-0">
          {/* v5: links sem verde (menos cor): texto claro sublinhado */}
          <p className="text-center text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Ao continuar, você concorda com nossos{" "}
            <button onClick={() => navigate("/termos-de-uso")} className="font-medium underline underline-offset-2" style={{ color: "var(--text)" }}>
              Termos de Uso
            </button>
            {" "}e{" "}
            <button onClick={() => navigate("/privacidade")} className="font-medium underline underline-offset-2" style={{ color: "var(--text)" }}>
              Política de Privacidade
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
