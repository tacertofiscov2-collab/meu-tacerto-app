import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthError, { translateAuthError } from "@/components/AuthError";

export default function AlterarSenha() {
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    setErro("");
    setOk(false);
    if (!senhaAtual) return setErro("Digite sua senha atual.");
    if (novaSenha.length < 8)
      return setErro("A nova senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);
    // TODO: idealmente reautenticar com a senha atual antes.
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);
    if (error) return setErro(translateAuthError(error.message));
    setOk(true);
    setSenhaAtual("");
    setNovaSenha("");
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
          style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Alterar senha
        </h1>
      </header>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex justify-center mb-3">
            <Lock size={40} strokeWidth={2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
            Crie uma nova senha para sua conta.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-[14px] mb-1.5" style={{ color: "var(--text)" }}>
                Senha atual
              </label>
              <div className="card-tacerto rounded-2xl px-4 py-4 flex items-center gap-3">
                <input
                  type={showAtual ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold outline-none"
                  style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowAtual(!showAtual)}
                  className="shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[14px] mb-1.5" style={{ color: "var(--text)" }}>
                Nova senha
              </label>
              <div className="card-tacerto rounded-2xl px-4 py-4 flex items-center gap-3">
                <input
                  type={showNova ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold outline-none placeholder:font-normal placeholder:opacity-50"
                  style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNova(!showNova)}
                  className="shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showNova ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && <AuthError>{erro}</AuthError>}
            {ok && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  color: "var(--primary)",
                }}
              >
                Senha atualizada com sucesso.
              </div>
            )}

            <button
              onClick={handleSalvar}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}