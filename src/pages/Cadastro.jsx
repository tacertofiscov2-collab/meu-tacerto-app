import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { detectMode } from "@/components/SmartContactInput";

export default function Cadastro() {
  const navigate = useNavigate();
  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  async function handleCadastrar() {
    setErro("");
    if (!contato || !senha) return setErro("Preencha e-mail e senha.");
    const mode = detectMode(contato);
    if (mode === "phone") return setErro("Cadastro por telefone em breve. Use e-mail.");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: contato, password: senha });
    if (error) {
      setLoading(false);
      return setErro(error.message);
    }
    await supabase.auth.signInWithPassword({ email: contato, password: senha });
    setLoading(false);
    navigate("/onboarding");
  }

  function handleGoogle() {
    // TODO: configurar Google OAuth no Supabase depois
    setErro("Login com Google em breve.");
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
          <div className="flex justify-center mb-4">
            <Gauge size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
            Crie sua conta
          </h1>
          <p className="text-sm text-center mt-1.5" style={{ color: "var(--text-secondary)" }}>
            Crie em 1 minuto e tenha a experiência completa do app.
          </p>

          {erro && (
            <p className="text-xs text-center mt-4" style={{ color: "var(--danger)" }}>
              {erro}
            </p>
          )}

          <div className="mt-6 space-y-5">
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                type="text"
                placeholder="Digite seu e-mail ou telefone"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
                style={fieldStyle}
              />
            </div>

            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Crie uma senha (mín. 8 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-4 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-secondary)" }}
              >
                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={handleCadastrar}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
            >
              {loading ? "Aguarde..." : "Cadastrar"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              Ao criar sua conta, você concorda com nossos{" "}
              <button
                onClick={() => navigate("/termos")}
                className="font-medium"
                style={{ color: "var(--primary)" }}
              >
                Termos de Uso e Política de Privacidade
              </button>
            </p>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>ou</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            </div>

            <button
              onClick={handleGoogle}
              className="w-full py-3 rounded-xl font-medium text-sm inline-flex items-center justify-center gap-2 hover:opacity-90"
              style={{ backgroundColor: "var(--field)", color: "var(--text)", border: "1px solid var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.1 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              Continuar com Google
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 shrink-0">
        <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
          Já tem conta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
