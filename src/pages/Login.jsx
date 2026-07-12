import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/AuthLayout";
import SmartContactInput, { detectMode } from "@/components/SmartContactInput";
import GoogleButton from "@/components/GoogleButton";

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
      <div className="text-center mb-3">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
          <LogIn size={24} strokeWidth={2} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Entre na sua conta</h2>
      </div>

      {erro && <p className="text-red-500 text-xs text-center mb-2">{erro}</p>}

      <div className="mb-2">
        <SmartContactInput value={contato} onChange={setContato} />
      </div>

      <div className="relative mb-3">
        <input
          type={showSenha ? "text" : "password"}
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition"
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
        className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Aguarde..." : "Entrar"}
      </button>

      <button
        onClick={() => navigate("/esqueci-senha")}
        className="w-full mt-2 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
      >
        Esqueci minha senha
      </button>

      <div className="mt-2">
        <GoogleButton />
      </div>
    </AuthLayout>
  );
}
