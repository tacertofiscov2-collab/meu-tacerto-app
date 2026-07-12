import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, CloudUpload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPerfilLocal } from "@/lib/localData";
import { AuthLayout } from "@/components/AuthLayout";
import EmailPhoneTabs from "@/components/EmailPhoneTabs";

export default function CadastroObrigatorio() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCadastrar() {
    setErro("");
    if (mode === "phone") return setErro("Cadastro por celular em breve. Use e-mail.");
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

  return (
    <AuthLayout onBack={() => navigate(-1)}>
      <div className="text-center mb-4">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
          <CloudUpload size={28} strokeWidth={2} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Salve seu progresso</h2>
        <p className="text-xs text-gray-500 mt-1">
          Crie seu cadastro grátis e nunca perca seus lançamentos.
        </p>
      </div>

      {erro && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
          ⚠ {erro}
        </div>
      )}

      <div className="mb-3">
        <EmailPhoneTabs
          mode={mode}
          onModeChange={setMode}
          email={email}
          onEmailChange={setEmail}
          phone={phone}
          onPhoneChange={setPhone}
        />
      </div>

      <div className="relative mb-3">
        <input
          type={showSenha ? "text" : "password"}
          placeholder="Crie uma senha (mín. 8 caracteres)"
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

      {senha.length >= 8 && (
        <div className="relative mb-4">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirme a senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition ${
              confirmarSenha && confirmarSenha !== senha ? "border-red-300" : "border-gray-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      )}

      <button
        onClick={handleCadastrar}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Criando cadastro..." : "Criar cadastro grátis"}
      </button>
    </AuthLayout>
  );
}
