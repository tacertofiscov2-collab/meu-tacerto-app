import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  const [step, setStep] = useState(1);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [tipoMei, setTipoMei] = useState("");
  const [meiEsseAno, setMeiEsseAno] = useState(null);
  const [mesMei, setMesMei] = useState("");
  const [seletorMes, setSeletorMes] = useState(false);

  // Onboarding ignora a preferência de fonte — sempre tamanho padrão.
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
      : step;

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  // MUD 5 — botão pill padronizado, com seta e glow ao pressionar
  const btnPrincipal = {
    backgroundColor: "transparent",
    border: "1.5px solid var(--primary)",
    color: "var(--primary)",
    width: 232,
    height: 52,
  };
  const btnPrincipalClasse =
    "btn-pill-tacerto mx-auto flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] disabled:opacity-35";

  // MUD 3 e 4 — selecionado = borda verde discreta; não selecionado = apagado
  function estiloCard(selecionado, algoSelecionado) {
    const claro = !algoSelecionado || selecionado;
    return {
      backgroundColor: selecionado ? "rgba(34,197,94,0.07)" : "var(--field)",
      border: selecionado
        ? "1px solid var(--primary)"
        : "1px solid transparent",
      opacity: claro ? 1 : 0.42,
      transition:
        "background-color 180ms ease, border-color 180ms ease, opacity 180ms ease",
    };
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
        await supabase.from("perfis").upsert({
          id: data.user.id,
          nome,
          perfil: tipoMei,
          plano: "gratuito",
          mei_esse_ano: meiEsseAno,
          mes_abertura_mei: mesMei ? parseInt(mesMei) : null,
          limite_personalizado: limiteFinal,
        });
      }
    } catch { /* visitante */ }
    navigate("/dashboard");
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  }

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
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

      {/* Bloco central com altura fixa: cabeçalho + conteúdo + rodapé do passo */}
      <div className="flex-1 min-h-0 flex flex-col px-6 overflow-hidden">
        <div className="max-w-sm w-full mx-auto flex-1 min-h-0 flex flex-col justify-center">
          <div className="flex justify-center mb-5 shrink-0">
            <Gauge size={48} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <div className="shrink-0">
            <Progress step={progressStep} />
          </div>

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

              {/* Altura reservada — evita o layout pular quando o erro aparece */}
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

          {step === 2 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Qual é o seu MEI?
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
                      {/* MUD 3 — sem fundo verde, só o ícone */}
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
                        </div>
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

          {step === 3 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Você abriu seu MEI em {anoAtual}?
              </h1>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { v: true, Icon: CheckCircle2, l: "Sim, esse ano" },
                  { v: false, Icon: Clock, l: "Não, já faz tempo" },
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

              {/* Área reservada — mantém o botão no mesmo lugar nos dois casos */}
              <div style={{ minHeight: 96 }} className="pt-3">
                {meiEsseAno === true && (
                  <>
                    <p
                      className="text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Qual mês você abriu?
                    </p>
                    {/* MUD 6 — mês e limite na MESMA LINHA, ícone de calendário */}
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
                          {mesMei ? MESES[parseInt(mesMei) - 1] : "Selecione o mês"}
                        </span>
                        {mesMei && (
                          <>
                            <span
                              className="shrink-0 text-sm"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              ·
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
                      backgroundColor: "var(--field)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* MUD 4 — ícone neutro, não verde */}
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
                Começar a usar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>
      </div>

      <SeletorMesAno
        aberto={seletorMes}
        titulo="Mês de abertura"
        mes={mesMei ? parseInt(mesMei) : null}
        ano={anoAtual}
        comAno={false}
        onFechar={() => setSeletorMes(false)}
        onSelecionar={(m) => { setMesMei(String(m)); setSeletorMes(false); }}
      />
    </div>
  );
}