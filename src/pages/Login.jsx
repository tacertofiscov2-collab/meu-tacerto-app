import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Hand } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/AuthLayout";
import SmartContactInput, { detectMode } from "@/components/SmartContactInput";

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
      setErro("Login por celular em breve. Use e-mail por enquanto.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: contato, password: senha });
    setLoading(false);
    if (error) return setErro("Email ou senha incorretos");
    navigate("/dashboard");
  }

  return (
    <AuthLayout onBack={() => navigate(-1)}>
      <h2 className="text-xl font-semibold text-gray-800 text-center">Entre na sua conta</h2>
      <p className="text-sm text-gray-500 text-center mt-1 mb-4">Acesse para continuar</p>

      {erro && <p className="text-red-500 text-xs text-center mb-3">{erro}</p>}

      <div className="mb-3">
        <SmartContactInput value={contato} onChange={setContato} />
      </div>


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
        className="w-full mt-2 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
      >
        Esqueci minha senha
      </button>
    </AuthLayout>
  );
}
