/* ONBOARDING-VERIFICAR-SCROLL v3 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, ArrowRight, Briefcase, Truck, CheckCircle2, Clock, Gauge, CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { setUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, limiteProporcional, LIMITE_NOME_INPUT } from "@/lib/fiscal";
import SeletorMesAno from "@/components/SeletorMesAno";
import Valor from "@/components/Valor";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function telefoneValido(valor) {
  const d = String(valor).replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

function Progress({ step }) {
  return (
    <div className="flex justify-center gap-2 mb-5">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: s === step ? 28 : 8,
            backgroundColor: s <= step ? "var(--primary)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const origemGoogle = searchParams.get("origem") === "google";

  const [step, setStep] = useState(origemGoogle ? 0 : 1);
  const [erro, setErro] = useState("");

  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipoMei, setTipoMei] = useState("");
  const [meiEsseAno, setMeiEsseAno] = useState(null);
  const [mesMei, setMesMei] = useState("");
  const [seletorMes, setSeletorMes] = useState(false);

  const inputCodigoRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const anteriores = [];
    ["font-small", "font-large"].forEach((c) => {
      if (root.classList.contains(c)) {
        anteriores.push(c);
        root.classList.remove(c);
      }
    });
    root.classList.add("font-medium");
    return () => {
      root.classList.remove("font-medium");
      anteriores.forEach((c) => root.classList.add(c));
    };
  }, []);

  // Foca o input oculto quando o step verificar abre
  useEffect(() => {
    if (step === "verificar" && inputCodigoRef.current) {
      setTimeout(() => inputCodigoRef.current?.focus(), 100);
    }
  }, [step]);

  const anoAtual = new Date().getFullYear();
  const tipoCanonico = tipoMei === "MEI_CAMINHONEIRO" ? "MEI_CAMINHONEIRO" : "MEI";
  const limiteCheio = LIMITES_ANUAIS[tipoCanonico];
  const limiteFinal =
    meiEsseAno && mesMei
      ? limiteProporcional(tipoCanonico, parseInt(mesMei), anoAtual, anoAtual)
      : limiteCheio;

  const progressStep =
    step === 3
      ? meiEsseAno === false || (meiEsseAno === true && mesMei) ? 3 : 2
      : step === 0 || step === "verificar" ? 1 : step;

  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--text)",
  };

  const btnPrincipal = {
    backgroundColor: "transparent",
    border: "1.5px solid var(--primary)",
    color: "var(--primary)",
    width: 232,
    height: 52,
  };
  const btnPrincipalClasse =
    "btn-pill-tacerto mx-auto flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] disabled:opacity-35";

  function estiloCard(selecionado, algoSelecionado) {
    const claro = !algoSelecionado || selecionado;
    return {
      backgroundColor: selecionado ? "rgba(34,197,94,0.07)" : "var(--field)",
      border: selecionado
        ? "1px solid var(--primary)"
        : "1px solid rgba(255,255,255,0.22)",
      opacity: claro ? 1 : 0.42,
      transition:
        "background-color 180ms ease, border-color 180ms ease, opacity 180ms ease",
    };
  }

  async function salvarWhatsapp(userId) {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos || !userId) return;
    try {
      await supabase
        .from("perfis")
        .update({ whatsapp: `+55${digitos}` })
        .eq("id", userId);
    } catch { /* coluna ainda nao criada ou falha de rede */ }
  }

  function conferirCodigo() {
    setErro("");
    if (codigo.replace(/\D/g, "").length < 4) {
      return setErro("Digite o codigo que enviamos.");
    }
    setCodigo("");
    setStep(1);
  }

  async function handleFinalizar() {
    salvarPerfilLocal({
      nome,
      perfil: tipoCanonico.toLowerCase(),
      limite: limiteFinal,
    });
    setUserState({
      nome,
      tipo: tipoCanonico,
      mesAbertura: meiEsseAno && mesMei ? parseInt(mesMei) : null,
      anoAbertura: meiEsseAno && mesMei ? anoAtual : null,
    });
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await salvarWhatsapp(data.user.id);
        await supabase.from("perfis").update({
          nome,
          tipo_mei: tipoCanonico,
          onboarding_ok: true,
          mes_abertura: meiEsseAno && mesMei ? parseInt(mesMei) : null,
          ano_abertura: meiEsseAno && mesMei ? anoAtual : null,
          atualizado_em: new Date().toISOString(),
        }).eq("id", data.user.id);
      }
    } catch { /* visitante */ }
    navigate("/dashboard");
  }

  function handleBack() {
    if (step === "verificar") { setErro(""); setStep(0); }
    else if (step === 1 && origemGoogle) { setErro(""); setStep(0); }
    else if (step > 1) setStep(step - 1);
    else navigate(-1);
  }

  const isVerificar = step === "verificar";

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Input oculto do codigo — fora do scroll para nao bloquear iOS */}
      {isVerificar && (
        <input
          ref={inputCodigoRef}
          type="tel"
          inputMode="numeric"
          value={codigo}
          maxLength={6}
          onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); if (erro) setErro(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") conferirCodigo(); }}
          aria-label="Codigo de verificacao"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            caretColor: "transparent",
          }}
        />
      )}

      <div className="px-4 pt-5 shrink-0 flex items-center">
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex flex-col px-6"
        style={{ overflowY: isVerificar ? "auto" : "hidden", WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="max-w-sm w-full mx-auto flex-1 min-h-0 flex flex-col"
          style={{ justifyContent: isVerificar ? "flex-start" : "center" }}
        >
          <div className="flex justify-center mb-5 shrink-0" style={{ marginTop: isVerificar ? 24 : 0 }}>
            <Gauge size={48} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          {step !== 0 && step !== "verificar" && (
            <div className="shrink-0">
              <Progress step={progressStep} />
            </div>
          )}

          {/* ====== STEP 0: WHATSAPP ====== */}
          {step === 0 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Qual e o seu WhatsApp?
              </h1>

              <div className="flex items-stretch gap-2">
                <div
                  className="flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-sm shrink-0"
                  style={fieldStyle}
                >
                  <span aria-hidden style={{ fontSize: 16 }}>🇧🇷</span>
                  <span style={{ color: "var(--text-secondary)" }}>+55</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); if (erro) setErro(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && telefoneValido(telefone)) {
                      setErro("");
                      setStep("verificar");
                    }
                  }}
                  className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                  style={fieldStyle}
                  autoFocus
                />
              </div>

              <div style={{ minHeight: 26 }} className="flex items-center justify-center mt-1">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!telefoneValido(telefone)) {
                    return setErro("Digite um numero de WhatsApp valido com DDD.");
                  }
                  setErro("");
                  setStep("verificar");
                }}
                disabled={!telefoneValido(telefone)}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Continuar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* ====== STEP VERIFICAR: CODIGO ====== */}
          {step === "verificar" && (
            <div
              className="w-full shrink-0"
              style={{ paddingBottom: 48 }}
              onClick={() => inputCodigoRef.current?.focus()}
            >
              <h1
                className="text-2xl font-bold text-center mb-2"
                style={{ color: "var(--text)" }}
              >
                Confirme seu WhatsApp
              </h1>
              <p
                className="text-sm text-center mb-6 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Enviamos um codigo para{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>+55 {telefone}</span>
              </p>

              <div
                className="flex items-center justify-center gap-2"
                onClick={() => inputCodigoRef.current?.focus()}
              >
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
                          atual || preenchido
                            ? "var(--primary)"
                            : "rgba(255,255,255,0.22)"
                        }`,
                      }}
                    >
                      {codigo[i] || ""}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}

                <button
                  onClick={conferirCodigo}
                  disabled={codigo.length < 4}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Validar codigo
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>

                <button
                  onClick={() => setErro("Reenvio disponivel quando o envio de codigo for ativado.")}
                  className="w-full text-center text-sm pt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Reenviar codigo
                </button>
              </div>
            </div>
          )}

          {/* ====== STEP 1: NOME ====== */}
          {step === 1 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Como posso te chamar?
              </h1>

              <input
                type="text"
                name="apelido-tacerto"
                placeholder="Digite seu nome ou apelido"
                value={nome}
                maxLength={LIMITE_NOME_INPUT}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                onChange={(e) => { setNome(e.target.value); if (erro) setErro(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                    else { setErro(""); setStep(2); }
                  }
                }}
                className="campo-tacerto w-full px-4 py-3.5 rounded-xl text-sm placeholder:opacity-70"
                style={fieldStyle}
              />

              <div style={{ minHeight: 26 }} className="flex items-center justify-center">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                  else { setErro(""); setStep(2); }
                }}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Continuar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* ====== STEP 2: TIPO MEI ====== */}
          {step === 2 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Qual e o seu MEI?
              </h1>

              <div className="space-y-2.5">
                {[
                  { v: "MEI", Icon: Briefcase, titulo: "MEI (outras atividades)",
                    limite: LIMITES_ANUAIS.MEI },
                  { v: "MEI_CAMINHONEIRO", Icon: Truck, titulo: "MEI Caminhoneiro",
                    limite: LIMITES_ANUAIS.MEI_CAMINHONEIRO },
                ].map((o) => {
                  const sel = tipoMei === o.v;
                  const Ico = o.Icon;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setTipoMei(o.v)}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-xl text-left"
                      style={estiloCard(sel, !!tipoMei)}
                    >
                      <Ico
                        size={24}
                        strokeWidth={1.75}
                        className="shrink-0"
                        style={{ color: sel ? "var(--primary)" : "var(--text-secondary)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {o.titulo}
                        div>
                        <div
                          className="text-[12px] mt-0.5 flex items-center gap-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Limite: <Valor tamanho="sm">{o.limite}</Valor>
                          <span style={{ color: "var(--text-secondary)" }}>/ ano</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setStep(3)}
                  disabled={!tipoMei}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Continuar
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}

          {/* ====== STEP 3: ABERTURA ====== */}
          {step === 3 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Voce abriu seu MEI em {anoAtual}?
              </h1>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { v: true, Icon: CheckCircle2, l: "Sim, esse ano" },
                  { v: false, Icon: Clock, l: "Nao, ja faz tempo" },
                ].map((o) => {
                  const sel = meiEsseAno === o.v;
                  const Ico = o.Icon;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => { setMeiEsseAno(o.v); if (!o.v) setMesMei(""); }}
                      className="py-3 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5"
                      style={{
                        ...estiloCard(sel, meiEsseAno !== null),
                        color: "var(--text)",
                      }}
                    >
                      <Ico
                        size={14}
                        strokeWidth={1.75}
                        style={{ color: sel ? "var(--primary)" : "var(--text-secondary)" }}
                      />
                      {o.l}
                    </button>
                  );
                })}
              </div>

              <div style={{ minHeight: 96 }} className="pt-3">
                {meiEsseAno === true && (
                  <>
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Qual mes voce abriu?
                    </p>
                    <button
                      onClick={() => setSeletorMes(true)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 rounded-xl"
                      style={fieldStyle}
                    >
                      <div className="flex-1 min-w-0 text-left flex items-center gap-2">
                        <span
                          className="text-sm shrink-0"
                          style={{
                            fontWeight: mesMei ? 600 : 400,
                            color: mesMei ? "var(--text)" : "var(--text-secondary)",
                          }}
                        >
                          {mesMei ? MESES[parseInt(mesMei) - 1] : "Selecione o mes"}
                        </span>
                        {mesMei && (
                          <>
                            <span
                              className="shrink-0 text-sm"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              .
                            </span>
                            <span
                              className="min-w-0 flex items-center"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <Valor tamanho="sm">{limiteFinal}</Valor>
                            </span>
                          </>
                        )}
                      </div>
                      <CalendarDays size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
                    </button>
                  </>
                )}

                {meiEsseAno === false && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <p
                      className="text-xs font-medium inline-flex items-center gap-1.5"
                      style={{ color: "var(--text)" }}
                    >
                      <CheckCircle2
                        size={14}
                        strokeWidth={2}
                        style={{ color: "var(--text-secondary)" }}
                      />
                      Limite cheio: <Valor tamanho="sm">{limiteCheio}</Valor> / ano
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleFinalizar}
                disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Comecar a usar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>
      </div>

      <SeletorMesAno
        aberto={seletorMes}
        titulo="Mes de abertura"
        mes={mesMei ? parseInt(mesMei) : null}
        ano={anoAtual}
        comAno={false}
        onFechar={() => setSeletorMes(false)}
        onSelecionar={(m) => { setMesMei(String(m)); setSeletorMes(false); }}
      />
    </div>
  );
}