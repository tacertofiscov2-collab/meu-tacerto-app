import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TaCertoLogo, BackButton } from "@/components/TaCertoLogo";

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleEnviar() {
    setErro("");
    if (!contato.trim()) {
      setErro("Digite seu e-mail ou telefone");
      return;
    }
    const ehEmail = contato.includes("@");
    const soDigitos = contato.replace(/\D/g, "");
    const ehTelefone = soDigitos.length >= 10 && !ehEmail;

    if (ehEmail) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(contato);
      setLoading(false);
      if (error) {
        setErro("Não foi possível enviar. Verifique o e-mail digitado.");
        return;
      }
      setSucesso(true);
    } else if (ehTelefone) {
      // TODO: integrar SMS Auth aqui (Twilio/MessageBird via Supabase)
      setErro("Recuperação por celular em desenvolvimento. Use seu e-mail por enquanto.");
    } else {
      setErro("Formato inválido. Digite um e-mail válido ou telefone com DDD.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-white">
      <div className="w-full max-w-md">
        <div className="mb-2">
          <BackButton onClick={() => navigate("/login")} />
        </div>
        <div className="text-center mb-8">
          <TaCertoLogo size="default" />
          <p className="text-xs text-gray-500 mt-1">Educação fiscal para seu MEI</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sucesso ? (
            <div className="text-center">
              <div className="text-6xl text-green-600 mb-4">✉</div>
              <h2 className="text-xl font-semibold text-gray-800">Link enviado!</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Verifique seu e-mail e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => navigate("/login")}
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

              {erro && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
                  ⚠ {erro}
                </div>
              )}

              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="Digite seu e-mail ou número de telefone"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition mb-4"
              />

              <button
                onClick={handleEnviar}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar código de recuperação"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
