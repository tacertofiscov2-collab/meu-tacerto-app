import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { detectMode } from "@/components/SmartContactInput";
import AuthError, { translateAuthError } from "@/components/AuthError";

export default function Login() {
  const navigate = useNavigate();
  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEntrar() {
    setErro("");
    const mode = detectMode(contato);
    if (mode === "phone") {
      setErro("Login por telefone em breve. Use e-mail por enquanto.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: contato, password: senha });
    setLoading(false);
    if (error) return setErro(translateAuthError(error.message) || "E-mail ou senha incorretos.");
    navigate("/dashboard");
  }

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Topo */}
      <div className="px-4 pt-5 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-opacity hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      {/* Meio */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-6">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex justify-center mb-4">
            <Gauge size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
            Bem-vindo de volta!
          </h1>
          <p className="text-sm text-center mt-1.5" style={{ color: "var(--text-secondary)" }}>
            Acesse sua conta
          </p>




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
                className="w-full pl-11 pr-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 transition placeholder:opacity-70"
                style={fieldStyle}
              />
            </div>

            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-4 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 transition placeholder:opacity-70"
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

            {erro && <AuthError>{erro}</AuthError>}

            <button
              onClick={handleEntrar}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
            >
              {loading ? "Aguarde..." : "Entrar"}
            </button>

              onClick={handleEntrar}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
            >
              {loading ? "Aguarde..." : "Entrar"}
            </button>

            <button
              onClick={() => navigate("/esqueci-senha")}
              className="w-full text-center text-xs pt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 pb-6 shrink-0">
        <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
          Não tem conta?{" "}
          <button
            onClick={() => navigate("/cadastro")}
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            Cadastrar
          </button>
        </p>
      </div>
    </div>
  );
}
