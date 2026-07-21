import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Briefcase, Truck, CheckCircle2, Clock, Info, Gauge, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { setUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, limiteProporcional } from "@/lib/fiscal";
import SeletorMesAno from "@/components/SeletorMesAno";
import Valor from "@/components/Valor";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Progress({ step }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
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

function StepTitle({ children }) {
  return (
    <h1
      className="text-2xl font-bold text-center mb-6"
      style={{ color: "var(--text)" }}
    >
      {children}
    </h1>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [tipoMei, setTipoMei] = useState("");
  const [meiEsseAno, setMeiEsseAno] = useState(null);
  const [mesMei, setMesMei] = useState("");
  const [seletorMes, setSeletorMes] = useState(false);

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

  // Botão principal: pill estreita, transparente, palavra em verde
  const btnPrincipal = {
    backgroundColor: "transparent",
    border: "1.5px solid var(--primary)",
    color: "var(--primary)",
  };
  const btnPrincipalClasse =
    "mx-auto block px-10 py-3 rounded-full font-semibold text-sm transition active:scale-[0.98] disabled:opacity-35";

  // Estilo de card selecionável: nada selecionado = ambos claros
  function estiloCard(selecionado, algoSelecionado) {
    const claro = !algoSelecionado || selecionado;
    return {
      backgroundColor: claro ? "var(--surface-selected)" : "var(--field)",
      border: "none",
      opacity: claro ? 1 : 0.45,
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
      className="w-full flex flex-col"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        height: "100dvh",
        overflow: "hidden",
      }}
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

      <div className="flex-1 min-h-0 flex flex-col justify-center px-6 pb-6 overflow-hidden">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex justify-center mb-7">
            <Gauge size={50} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <Progress step={progressStep} />

          {step === 1 && (
            <>
              <StepTitle>Como posso te chamar?</StepTitle>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Digite seu nome ou apelido"
                  value={nome}
                  maxLength={30}
                  autoFocus
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                      else { setErro(""); setStep(2); }
                    }
                  }}
                  className="w-full px-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
                  style={fieldStyle}
                />

                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "#ef4444" }}>
                    {erro}
                  </p>
                )}

                <button
                  onClick={() => {
                    if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                    else { setErro(""); setStep(2); }
                  }}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle>Qual é o seu MEI?</StepTitle>

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
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition"
                      style={estiloCard(sel, !!tipoMei)}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
                      >
                        <Ico size={20} strokeWidth={1.75} style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {o.titulo}
                        </div>
                        <div
                          className="text-[12px] mt-0.5"
                          style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}
                        >
                          Limite: <Valor tamanho="sm">{o.limite}</Valor>{" "}
                          <span style={{ color: "var(--text)" }}>/ ano</span>
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
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepTitle>Você abriu seu MEI em {anoAtual}?</StepTitle>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
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
                      className="py-3 rounded-xl text-xs font-medium transition inline-flex items-center justify-center gap-1.5"
                      style={{
                        ...estiloCard(sel, meiEsseAno !== null),
                        color: "var(--text)",
                      }}
                    >
                      <Ico size={14} strokeWidth={1.75} />
                      {o.l}
                    </button>
                  );
                })}
              </div>

              {meiEsseAno === true && (
                <>
                  <p
                    className="text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Qual mês você abriu?
                  </p>
                  <button
                    onClick={() => setSeletorMes(true)}
                    className="w-full h-[48px] px-4 flex items-center justify-between rounded-xl text-sm transition mb-3"
                    style={{
                      ...fieldStyle,
                      fontWeight: mesMei ? 600 : 400,
                      color: mesMei ? "var(--text)" : "var(--text-secondary)",
                    }}
                  >
                    <span>
                      {mesMei ? MESES[parseInt(mesMei) - 1] : "Selecione o mês"}
                    </span>
                    <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} />
                  </button>

                  {mesMei && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        backgroundColor: "var(--field)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p
                        className="text-xs font-medium inline-flex items-center gap-1.5"
                        style={{ color: "var(--text)" }}
                      >
                        <Info size={14} strokeWidth={2} style={{ color: "var(--primary)" }} />
                        Limite: <Valor tamanho="sm">{limiteFinal}</Valor>
                      </p>
                    </div>
                  )}
                </>
              )}

              {meiEsseAno === false && (
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: "var(--field)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-xs font-medium inline-flex items-center gap-1.5"
                    style={{ color: "var(--text)" }}
                  >
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: "var(--primary)" }} />
                    Limite cheio: <Valor tamanho="sm">{limiteCheio}</Valor> / ano
                  </p>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleFinalizar}
                  disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Começar a usar!
                </button>
              </div>
            </>
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
        onSelecionar={(m) => {
          setMesMei(String(m));
          setSeletorMes(false);
        }}
      />
    </div>
  );
}