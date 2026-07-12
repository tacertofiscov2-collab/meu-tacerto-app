import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TaCertoLogo, BackButton } from "@/components/TaCertoLogo";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEntrar() {
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) return setErro("Email ou senha incorretos");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-2">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <div className="text-center mb-8">
          <TaCertoLogo size="default" />
          <p className="text-xs text-gray-500 mt-1">Sua vida fiscal organizada de forma simples</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Entre na sua conta</h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-6">Acesse para continuar</p>

          {erro && <p className="text-red-500 text-xs text-center mb-3">{erro}</p>}

          <label className="block text-sm text-gray-600 mb-1">E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition mb-4"
          />

          <label className="block text-sm text-gray-600 mb-1">Senha</label>
          <div className="relative mb-4">
            <input
              type={showSenha ? "text" : "password"}
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            onClick={handleEntrar}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Aguarde..." : "Entrar"}
          </button>

          <button
            onClick={() => navigate("/esqueci-senha")}
            className="w-full mt-3 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          Ao continuar, você aceita nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  );
}
