import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, CloudUpload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPerfilLocal } from "@/lib/localData";
import { TaCertoLogo } from "@/components/TaCertoLogo";

export default function CadastroObrigatorio() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCadastrar() {
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
    if (err2) {
      setLoading(false);
      return setErro("Esse email já tem conta. Verifique a senha.");
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

  async function copiarSenha() {
    try {
      await navigator.clipboard.writeText(senha);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-white">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-green-600 hover:text-green-700"
            aria-label="Voltar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">Voltar</span>
          <div className="ml-auto">
            <TaCertoLogo size="small" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl mb-4">
            💾
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Salve seu progresso</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Crie seu cadastro grátis e nunca perca seus lançamentos.
          </p>

          {erro && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
              ⚠ {erro}
            </div>
          )}

          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition mb-3"
          />

          <div className="relative mb-3">
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Crie uma senha (mín. 8 caracteres)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="text-gray-400 px-1"
              >
                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {senha.length >= 8 && (
                <button
                  type="button"
                  onClick={copiarSenha}
                  className="text-gray-400 text-sm px-1"
                  aria-label="Copiar senha"
                >
                  📋
                </button>
              )}
            </div>
          </div>

          {senha.length >= 8 && (
            <div className="relative mb-4">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirme a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition ${
                  confirmarSenha && confirmarSenha !== senha
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-gray-400 px-1"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {confirmarSenha && confirmarSenha === senha && (
                  <span className="text-green-600 px-1">✓</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleCadastrar}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Criando cadastro..." : "Criar cadastro grátis"}
          </button>
        </div>
      </div>
    </div>
  );
}
