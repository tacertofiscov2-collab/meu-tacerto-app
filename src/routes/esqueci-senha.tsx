import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TaCertoLogo, BackButton } from "@/components/TaCertoLogo";

export const Route = createFileRoute("/esqueci-senha")({
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<"email" | "celular">("email");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleEnviarEmail() {
    setErro("");
    if (!email) return setErro("Digite seu e-mail");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) return setErro("Não foi possível enviar. Verifique o e-mail digitado.");
    setSucesso(true);
  }

  // TODO: integrar SMS Auth aqui (Twilio/MessageBird via Supabase)
  function handleEnviarSMS() {
    // desabilitado
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-white">
      <div className="w-full max-w-md">
        <div className="mb-2">
          <BackButton onClick={() => navigate({ to: "/login" })} />
        </div>
        <TaCertoLogo />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sucesso ? (
            <div className="text-center">
              <div className="text-6xl text-green-600 mb-4">✉</div>
              <h2 className="text-xl font-semibold text-gray-800">Link enviado!</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Verifique seu e-mail e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => navigate({ to: "/login" })}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔑</div>
                <h2 className="text-xl font-semibold text-gray-800">Recuperar acesso</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Informe seu e-mail ou celular cadastrado
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => {
                    setAba("email");
                    setErro("");
                  }}
                  className={`py-2 rounded-xl text-sm font-medium transition ${
                    aba === "email"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  E-mail
                </button>
                <button
                  onClick={() => {
                    setAba("celular");
                    setErro("");
                  }}
                  className={`py-2 rounded-xl text-sm font-medium transition ${
                    aba === "celular"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  Celular
                </button>
              </div>

              {erro && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
                  ⚠ {erro}
                </div>
              )}

              {aba === "email" ? (
                <>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition mb-4"
                  />
                  <button
                    onClick={handleEnviarEmail}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition mb-2"
                  />
                  <button
                    onClick={handleEnviarSMS}
                    disabled
                    className="w-full py-3 rounded-xl bg-green-600 text-white font-medium text-sm opacity-50 cursor-not-allowed"
                  >
                    Enviar código por SMS
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Em breve — em desenvolvimento
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
