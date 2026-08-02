import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { detectMode } from "@/components/SmartContactInput";
import AuthError, { translateAuthError } from "@/components/AuthError";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";

export default function EsqueciSenha() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  async function handleEnviar() {
    setErro("");
    const mode = detectMode(contato);
    if (mode === "email") {
      if (!contato.trim() || !contato.includes("@")) return setErro("Digite um e-mail válido.");
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(contato);
      setLoading(false);
      if (error) return setErro(translateAuthError(error.message) || "Não foi possível enviar. Verifique o e-mail digitado.");
      setSucesso(true);
    } else {
      // TODO: integrar SMS Auth depois
      if ((contato || "").replace(/\D/g, "").length < 10)
        return setErro("Digite um telefone válido com DDD.");
      setErro("Recuperação por telefone em desenvolvimento. Use seu e-mail por enquanto.");
    }
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="px-4 pt-5 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-6">
        <div className="max-w-sm w-full mx-auto">
          {sucesso ? (
            <>
              <div className="flex justify-center mb-4">
                <Mail size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
              </div>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Link enviado!
              </h1>
              <p className="text-sm text-center mt-1.5" style={{ color: "var(--text-secondary)" }}>
                Verifique seu e-mail e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Voltar ao login
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <KeyRound size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
              </div>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Recuperar acesso
              </h1>
              <p className="text-sm text-center mt-1.5" style={{ color: "var(--text-secondary)" }}>
                Informe seu e-mail ou telefone cadastrado
              </p>

              <div className="mt-6 space-y-5">
                <input
                  type="text"
                  placeholder="Digite seu e-mail ou telefone"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
                  style={fieldStyle}
                />

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={handleEnviar}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
                >
                  {loading ? "Enviando..." : "Enviar código de recuperação"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
