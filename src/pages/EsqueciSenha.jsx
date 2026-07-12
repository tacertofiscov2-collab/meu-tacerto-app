import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/AuthLayout";
import SmartContactInput, { detectMode } from "@/components/SmartContactInput";

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleEnviar() {
    setErro("");
    const mode = detectMode(contato);
    if (mode === "email") {
      if (!contato.trim() || !contato.includes("@")) return setErro("Digite um e-mail válido.");
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(contato);
      setLoading(false);
      if (error) return setErro("Não foi possível enviar. Verifique o e-mail digitado.");
      setSucesso(true);
    } else {
      if ((contato || "").replace(/\D/g, "").length < 10)
        return setErro("Digite um celular válido com DDD.");
      setErro("Recuperação por celular em desenvolvimento. Use e-mail por enquanto.");
    }
  }

  return (
    <AuthLayout onBack={() => navigate("/login")}>
      {sucesso ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <KeyRound size={32} strokeWidth={2} className="text-green-600" />
          </div>
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
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
              <KeyRound size={28} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Recuperar acesso</h2>
            <p className="text-xs text-gray-500 mt-1">Informe seu e-mail ou celular cadastrado</p>
          </div>

          {erro && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
              ⚠ {erro}
            </div>
          )}

          <div className="mb-4">
            <SmartContactInput value={contato} onChange={setContato} />
          </div>

          <button
            onClick={handleEnviar}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar código de recuperação"}
          </button>
        </>
      )}
    </AuthLayout>
  );
}

