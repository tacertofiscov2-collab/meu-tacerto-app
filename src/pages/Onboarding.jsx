import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Briefcase, Truck, ClipboardList, CalendarDays,
  CheckCircle2, Clock, Info, Pencil, ChevronDown, Gauge,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { setUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, limiteProporcional } from "@/lib/fiscal";
import AuthError from "@/components/AuthError";

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

function StepTitle({ Icon, children }) {
  return (
    <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2 mb-6">
      <Icon size={26} strokeWidth={2} style={{ color: "var(--primary)" }} />
      {children}
    </h1>
  );
}

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = parseInt(value) - 1;
      listRef.current.scrollTop = Math.max(0, idx * 44 - 44);
    }
  }, [open, value]);

  const label = value
    ? `Mês ${String(value).padStart(2, "0")} · ${MESES[parseInt(value) - 1]}`
    : "Selecione o mês";

  const selected = !!value;

  return (
    <div className="relative mb-3" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-[48px] px-4 flex items-center justify-between rounded-xl text-sm transition"
        style={{
          backgroundColor: "var(--field)",
          border: `1px solid ${open ? "var(--primary)" : "var(--border)"}`,
          color: selected ? "var(--text)" : "var(--text-secondary)",
          fontWeight: selected ? 600 : 400,
        }}
      >
        <span>{label}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: open ? "var(--primary)" : "var(--text-secondary)" }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            ref={listRef}
            className="max-h-[220px] overflow-y-auto overscroll-contain hide-scrollbar"
          >
            {MESES.map((mes, i) => {
              const val = String(i + 1);
              const sel = value === val;
              const item = `Mês ${String(i + 1).padStart(2, "0")} · ${mes}`;
              return (
                <button
                  key={mes}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(val); setOpen(false); }}
                  className="w-full h-[44px] px-4 flex items-center border-l-4 text-left focus:outline-none text-sm"
                  style={{
                    borderLeftColor: sel ? "var(--primary)" : "transparent",
                    backgroundColor: sel ? "rgba(34,197,94,0.12)" : "transparent",
                    color: sel ? "var(--primary)" : "var(--text)",
                    fontWeight: sel ? 600 : 500,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
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

  const anoAtual = new Date().getFullYear();
  const tipoCanonico = tipoMei === "MEI_CAMINHONEIRO" ? "MEI_CAMINHONEIRO" : "MEI";
  const limiteCheio = LIMITES_ANUAIS[tipoCanonico];
  const limiteFinal = (() => {
    if (meiEsseAno && mesMei) {
      return limiteProporcional(tipoCanonico, parseInt(mesMei), anoAtual, anoAtual);
    }
    return limiteCheio;
  })();

  const progressStep =
    step === 3
      ? meiEsseAno === false || (meiEsseAno === true && mesMei) ? 3 : 2
      : step;

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  async function handleFinalizar() {
    salvarPerfilLocal({
      nome,
      perfil: (tipoMei || "MEI").toLowerCase(),
      limite: limiteFinal,
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

  const primaryBtn = "w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40 transition-opacity";
  const primaryStyle = { backgroundColor: "var(--primary)", color: "var(--primary-contrast)" };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Top bar: back arrow only */}
      <div className="px-4 pt-5 shrink-0 relative flex items-center">
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-6">
        <div className="max-w-sm w-full mx-auto">
          {/* Gauge above progress */}
          <div className="flex justify-center mb-8">
            <Gauge size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <Progress step={progressStep} />

          {step === 1 && (
            <>
              <StepTitle Icon={Pencil}>Como posso te chamar?</StepTitle>

              <div className="space-y-5">
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

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={() => {
                    if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                    else { setErro(""); setStep(2); }
                  }}
                  className={primaryBtn}
                  style={primaryStyle}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle Icon={ClipboardList}>Qual é o seu MEI?</StepTitle>

              <div className="space-y-2.5">
                {[
                  { v: "MEI", Icon: Briefcase, titulo: "MEI (outras atividades)",
                    desc: "Comércio, serviços · limite R$ 81.000/ano" },
                  { v: "MEI_CAMINHONEIRO", Icon: Truck, titulo: "MEI Caminhoneiro",
                    desc: "Transporte de cargas · limite R$ 251.600/ano" },
                ].map((o) => {
                  const sel = tipoMei === o.v;
                  const Ico = o.Icon;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setTipoMei(o.v)}
                      className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition"
                      style={{
                        backgroundColor: sel ? "rgba(34,197,94,0.10)" : "var(--field)",
                        border: `1.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
                      >
                        <Ico size={20} strokeWidth={1.75} style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: sel ? "var(--primary)" : "var(--text)" }}
                        >
                          {o.titulo}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {o.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!tipoMei}
                className={primaryBtn + " mt-6"}
                style={primaryStyle}
              >
                Continuar
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <StepTitle Icon={CalendarDays}>Sobre seu MEI</StepTitle>
              <p className="text-sm text-center -mt-3 mb-6" style={{ color: "var(--text-secondary)" }}>
                Você abriu seu MEI em {anoAtual}?
              </p>

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
                        backgroundColor: sel ? "rgba(34,197,94,0.10)" : "var(--field)",
                        border: `1.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                        color: sel ? "var(--primary)" : "var(--text-secondary)",
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
                  <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Qual mês você abriu?
                  </p>
                  <MonthPicker value={mesMei} onChange={setMesMei} />
                  {mesMei && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        backgroundColor: "var(--field)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                        <Info size={14} strokeWidth={2} style={{ color: "var(--primary)" }} />
                        Limite: R$ {limiteFinal.toLocaleString("pt-BR")},00
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
                  <p className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: "var(--primary)" }} />
                    Limite cheio: R$ {limiteCheio.toLocaleString("pt-BR")},00 / ano
                  </p>
                </div>
              )}

              <button
                onClick={handleFinalizar}
                disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
                className={primaryBtn + " mt-6"}
                style={primaryStyle}
              >
                Começar a usar!
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
