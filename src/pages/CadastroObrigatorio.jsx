import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, CloudUpload, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPerfilLocal } from "@/lib/localData";
import { detectMode } from "@/components/SmartContactInput";
import AuthError, { translateAuthError } from "@/components/AuthError";

export default function CadastroObrigatorio() {
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
    const mode = detectMode(contato);
    if (mode === "phone") return setErro("Cadastro por telefone em breve. Use e-mail.");
    if (!contato || !senha) return setErro("Preencha e-mail e senha.");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: contato, password: senha });
    if (error && !error.message.toLowerCase().includes("already")) {
      setLoading(false);
      return setErro(translateAuthError(error.message));
    }
    const { error: err2 } = await supabase.auth.signInWithPassword({ email: contato, password: senha });
    if (err2) {
      setLoading(false);
      return setErro("Esse e-mail já tem conta. Verifique a senha.");
    }
    const { data } = await supabase.auth.getUser();
    const perfil = getPerfilLocal();
    if (data.user) {
      await supabase.from("perfis").upsert({
        id: data.user.id,
        nome: perfil.nome,
        perfil: perfil.perfil.toUpperCase(),
        plano: "gratuito",
        limite_personalizado: perfil.limite,
      });
    }
    setLoading(false);
    navigate("/dashboard");
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
            <CloudUpload size={44} strokeWidth={2} style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
            Salve seu progresso
          </h1>
          <p className="text-sm text-center mt-2" style={{ color: "var(--text-secondary)" }}>
            Crie sua conta em menos de 1 minuto e nunca perca seus lançamentos.
          </p>

          <div className="mt-6 space-y-4">
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

            {erro && <AuthError>{erro}</AuthError>}

            <button
              onClick={handleCadastrar}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
