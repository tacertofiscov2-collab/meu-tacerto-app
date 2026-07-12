import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Eye, EyeOff, Briefcase, Truck, ClipboardList, CalendarDays,
  CheckCircle2, Clock, Info, Hand,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { AuthLayout } from "@/components/AuthLayout";
import SmartContactInput, { detectMode } from "@/components/SmartContactInput";

function calcularForcaSenha(s) {
  if (!s) return 0;
  let p = 0;
  if (s.length >= 8) p++;
  if (s.length >= 12) p++;
  if (/[A-Z]/.test(s)) p++;
  if (/\d/.test(s)) p++;
  if (/[^A-Za-z0-9]/.test(s)) p++;
  return Math.min(p, 4);
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition";
const btnPrimary =
  "w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50";
const btnSecondary =
  "w-full py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors";

function ErrorBox({ msg }) {
  return (
    <div className="mb-3 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
      ⚠ {msg}
    </div>
  );
}

function Progress({ step }) {
  return (
    <div className="flex justify-center gap-2 mb-4">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all ${
            s === step ? "w-8 bg-green-600" : s < step ? "w-2 bg-green-600" : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function MonthPicker({ value, onChange }) {
  const ref = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 1);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="relative mb-3">
      {!atTop && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent z-10 rounded-t-xl" />
      )}
      {!atBottom && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent z-10 rounded-b-xl" />
      )}
      <div
        ref={ref}
        className="h-[160px] overflow-y-auto rounded-xl border border-gray-200 hide-scrollbar overscroll-contain"
      >
        {MESES.map((mes, i) => {
          const val = String(i + 1);
          const sel = value === val;
          const label = `Mês ${String(i + 1).padStart(2, "0")} · ${mes}`;
          return (
            <button
              key={mes}
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(val)}
              className={`w-full h-[44px] px-4 flex items-center gap-3 border-b border-gray-100 border-l-4 transition-all text-left focus:outline-none ${
                sel ? "bg-green-50 border-l-green-600 text-green-700"
                    : "border-l-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm ${sel ? "font-semibold" : "font-medium"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [tipoMei, setTipoMei] = useState("");
  const [meiEsseAno, setMeiEsseAno] = useState(null);
  const [mesMei, setMesMei] = useState("");

  const anoAtual = new Date().getFullYear();
  const forca = calcularForcaSenha(senha);
  const limiteCheio = tipoMei === "MEI_CAMINHONEIRO" ? 251600 : 81000;
  const limiteFinal = (() => {
    if (meiEsseAno && mesMei) {
      const mes = parseInt(mesMei);
      const mesesRestantes = 12 - mes + 1;
      return Math.round((limiteCheio / 12) * mesesRestantes);
    }
    return limiteCheio;
  })();

  async function handleCadastro() {
    setErro("");
    const mode = detectMode(contato);
    if (mode === "phone") return setErro("Cadastro por celular em breve. Use e-mail por enquanto.");
    if (!contato || !senha) return setErro("Preencha email e senha.");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmarSenha) return setErro("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: contato, password: senha });
    if (error && !error.message.toLowerCase().includes("already")) {
      setLoading(false);
      return setErro("Erro ao cadastrar: " + error.message);
    }
    const { error: err2 } = await supabase.auth.signInWithPassword({ email: contato, password: senha });
    setLoading(false);
    if (err2) return setErro("Erro ao entrar. Tente novamente.");
    setStep(1);
  }


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
    } catch {
      /* visitante */
    }
    navigate("/dashboard");
  }

  const onBack = step > 0 ? () => setStep(step - 1) : undefined;

  return (
    <AuthLayout onBack={onBack}>
      {step > 0 && <Progress step={step} />}
      {step === 0 && (
        <>
          <p className="text-sm text-gray-500 text-center mb-4">
            Crie sua conta ou continue como visitante
          </p>

          {erro && <ErrorBox msg={erro} />}

          <div className="mb-3">
            <SmartContactInput value={contato} onChange={setContato} />
          </div>


          <div className="relative mb-2">
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Crie uma senha (mín. 8 caracteres)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {senha.length > 0 && (
            <div className="flex gap-1 mb-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${
                    i < forca
                      ? forca <= 1 ? "bg-red-400" : forca === 2 ? "bg-amber-400" : "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}

          {senha.length >= 8 && (
            <div className="relative mb-3">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition pr-10 ${
                  confirmarSenha && confirmarSenha !== senha ? "border-red-300" : "border-gray-200"
                }`}
              />
              {confirmarSenha && confirmarSenha === senha && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>
              )}
            </div>
          )}

          <button onClick={handleCadastro} disabled={loading} className={btnPrimary}>
            {loading ? "Aguarde..." : "Criar minha conta"}
          </button>

          <button onClick={() => setStep(1)} className={btnSecondary + " mt-2"}>
            Continuar como visitante
          </button>

          <p className="text-center text-xs text-gray-500 mt-3">
            Já tem conta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Fazer login
            </button>
          </p>
        </>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
              <Hand size={28} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Como posso te chamar?</h2>
            <p className="text-sm text-gray-500 mt-1">Seu nome ou apelido</p>
          </div>
          {erro && <ErrorBox msg={erro} />}
          <input
            type="text"
            placeholder="Ex: João Silva"
            value={nome}
            maxLength={30}
            onChange={(e) => {
              const v = e.target.value;
              if (nome === "" && v.length === 1) setNome(v.toUpperCase());
              else setNome(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                else { setErro(""); setStep(2); }
              }
            }}
            className={inputCls}
          />
          <button
            onClick={() => {
              if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
              else { setErro(""); setStep(2); }
            }}
            className={btnPrimary}
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
              <ClipboardList size={28} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Qual é o seu MEI?</h2>
          </div>

          <div className="space-y-2 mb-4">
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
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                    sel ? "border-2 border-green-600 bg-green-50"
                        : "border-2 border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <Ico size={20} strokeWidth={2} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${sel ? "text-green-700" : "text-gray-800"}`}>
                      {o.titulo}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{o.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!tipoMei}
            className={btnPrimary + " " + (!tipoMei ? "opacity-40" : "")}
          >
            Continuar
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="text-center mb-3">
            <div className="flex justify-center mb-1">
              <CalendarDays size={32} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Sobre seu MEI</h2>
            <p className="text-xs text-gray-500 mt-1">Você abriu seu MEI em {anoAtual}?</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
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
                  className={`py-2.5 rounded-xl text-xs font-medium transition inline-flex items-center justify-center gap-1.5 ${
                    sel ? "border-2 border-green-600 bg-green-50 text-green-700"
                        : "border-2 border-gray-200 text-gray-600 hover:border-green-300"
                  }`}
                >
                  <Ico size={14} strokeWidth={2} />
                  {o.l}
                </button>
              );
            })}
          </div>

          {meiEsseAno === true && (
            <>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Qual mês você abriu?</p>
              <MonthPicker value={mesMei} onChange={setMesMei} />
              {mesMei && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 mb-3">
                  <p className="text-xs text-green-700 font-medium inline-flex items-center gap-1.5">
                    <Info size={14} strokeWidth={2} />
                    Limite: R$ {limiteFinal.toLocaleString("pt-BR")},00
                  </p>
                </div>
              )}
            </>
          )}


          {meiEsseAno === false && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 mb-3">
              <p className="text-xs text-green-700 font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} strokeWidth={2} />
                Limite cheio: R$ {limiteCheio.toLocaleString("pt-BR")},00 / ano
              </p>
            </div>
          )}

          <button
            onClick={handleFinalizar}
            disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
            className={
              btnPrimary + " " +
              (meiEsseAno === null || (meiEsseAno === true && !mesMei) ? "opacity-40" : "")
            }
          >
            Começar a usar!
          </button>
        </>
      )}
    </AuthLayout>
  );
}
