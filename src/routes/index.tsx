import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { TaCertoLogo, BackButton } from "@/components/TaCertoLogo";

export const Route = createFileRoute("/")({
  component: OnboardingPage,
});

function calcularForcaSenha(s: string) {
  if (!s) return 0;
  let pontos = 0;
  if (s.length >= 8) pontos++;
  if (s.length >= 12) pontos++;
  if (/[A-Z]/.test(s)) pontos++;
  if (/\d/.test(s)) pontos++;
  if (/[^A-Za-z0-9]/.test(s)) pontos++;
  return Math.min(pontos, 4);
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition";
const btnPrimary =
  "w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50";
const cardCls = "bg-white rounded-2xl shadow-sm border border-gray-100 p-8";
const screenCls =
  "min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-white";

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
      ⚠ {msg}
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
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

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // step 0
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // step 1
  const [nome, setNome] = useState("");

  // step 2
  const [tipoMei, setTipoMei] = useState<"" | "MEI" | "MEI_CAMINHONEIRO">("");

  // step 3
  const [meiEsseAno, setMeiEsseAno] = useState<null | boolean>(null);
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
    if (!email || !senha) return setErro("Preencha email e senha.");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmarSenha) return setErro("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error && !error.message.toLowerCase().includes("already")) {
      setLoading(false);
      return setErro("Erro ao cadastrar: " + error.message);
    }
    const { error: err2 } = await supabase.auth.signInWithPassword({ email, password: senha });
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
      // segue mesmo sem sessão (visitante)
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className={screenCls}>
      <div className="w-full max-w-md">
        <TaCertoLogo />
        {step > 0 && <Progress step={step} />}
        <div className={cardCls}>
          {step > 0 && <BackButton onClick={() => setStep(step - 1)} />}

          {step === 0 && (
            <>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">👋</div>
                <h2 className="text-xl font-semibold text-gray-800">Bem-vindo ao TaCerto!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Crie sua conta ou continue como visitante
                </p>
              </div>

              {erro && <ErrorBox msg={erro} />}

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls + " mb-3"}
              />

              <div className="relative mb-2">
                <input
                  type={showSenha ? "text" : "password"}
                  placeholder="Crie uma senha (mínimo 8 caracteres)"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputCls + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {showSenha ? "🙈" : "👁"}
                </button>
              </div>

              {senha.length > 0 && (
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < forca
                          ? forca <= 1
                            ? "bg-red-400"
                            : forca === 2
                            ? "bg-amber-400"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {senha.length >= 8 && (
                <div className="relative mb-4">
                  <input
                    type={showSenha ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition pr-10 ${
                      confirmarSenha && confirmarSenha !== senha
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  />
                  {confirmarSenha && confirmarSenha === senha && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                      ✓
                    </span>
                  )}
                </div>
              )}

              <button onClick={handleCadastro} disabled={loading} className={btnPrimary}>
                {loading ? "Aguarde..." : "Criar minha conta"}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Continuar como visitante
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Já tem conta?{" "}
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Fazer login
                </button>
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">👋</div>
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
                    else {
                      setErro("");
                      setStep(2);
                    }
                  }
                }}
                className={inputCls + " mb-4"}
              />

              <button
                onClick={() => {
                  if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                  else {
                    setErro("");
                    setStep(2);
                  }
                }}
                className={btnPrimary}
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">📋</div>
                <h2 className="text-xl font-semibold text-gray-800">Qual é o seu MEI?</h2>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  {
                    v: "MEI" as const,
                    icon: "💼",
                    titulo: "MEI (outras atividades)",
                    desc: "Comércio, serviços e outras áreas · limite R$ 81.000/ano",
                  },
                  {
                    v: "MEI_CAMINHONEIRO" as const,
                    icon: "🚚",
                    titulo: "MEI Caminhoneiro",
                    desc: "Transportador autônomo de cargas · limite R$ 251.600/ano",
                  },
                ].map((o) => {
                  const sel = tipoMei === o.v;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setTipoMei(o.v)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition ${
                        sel
                          ? "border-2 border-green-600 bg-green-50"
                          : "border-2 border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <span className="text-2xl">{o.icon}</span>
                      <div className="flex-1">
                        <div
                          className={`text-sm font-medium ${
                            sel ? "text-green-700" : "text-gray-800"
                          }`}
                        >
                          {o.titulo}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{o.desc}</div>
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
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">
                  {tipoMei === "MEI_CAMINHONEIRO" ? "🚛" : "📅"}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Sobre seu MEI</h2>
                <p className="text-sm text-gray-500 mt-1">Você abriu seu MEI em {anoAtual}?</p>
                <p className="text-xs text-gray-400 mt-1">
                  Isso nos ajuda a calcular seu limite correto para o ano.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { v: true, l: "✅ Sim, esse ano" },
                  { v: false, l: "🕐 Não, já faz tempo" },
                ].map((o) => {
                  const sel = meiEsseAno === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => {
                        setMeiEsseAno(o.v);
                        if (!o.v) setMesMei("");
                      }}
                      className={`py-3 rounded-xl text-sm font-medium transition ${
                        sel
                          ? "border-2 border-green-600 bg-green-50 text-green-700"
                          : "border-2 border-gray-200 text-gray-600 hover:border-green-300"
                      }`}
                    >
                      {o.l}
                    </button>
                  );
                })}
              </div>

              {meiEsseAno === true && (
                <>
                  <p className="text-sm text-gray-600 mb-2">Qual mês você abriu?</p>
                  <select
                    value={mesMei}
                    onChange={(e) => setMesMei(e.target.value)}
                    className={inputCls + " mb-4"}
                  >
                    <option value="">Selecione o mês...</option>
                    {[
                      "Janeiro",
                      "Fevereiro",
                      "Março",
                      "Abril",
                      "Maio",
                      "Junho",
                      "Julho",
                      "Agosto",
                      "Setembro",
                      "Outubro",
                      "Novembro",
                      "Dezembro",
                    ].map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {mesMei && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-green-700 font-medium">
                        📌 Seu limite proporcional: R$ {limiteFinal.toLocaleString("pt-BR")},00
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Calculado a partir do mês selecionado até Dezembro
                      </p>
                    </div>
                  )}
                </>
              )}

              {meiEsseAno === false && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Limite cheio: R$ {limiteCheio.toLocaleString("pt-BR")},00 / ano
                  </p>
                </div>
              )}

              <button
                onClick={handleFinalizar}
                disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
                className={
                  btnPrimary +
                  " " +
                  (meiEsseAno === null || (meiEsseAno === true && !mesMei) ? "opacity-40" : "")
                }
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
