import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, Gauge } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthError, { translateAuthError } from "@/components/AuthError";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";

/* ===================================================================
   LOGIN v3 — setinha volta sempre para a Welcome (tela dos slides)

   1) ESCOLHA — só os caminhos de entrada (Google e E-mail).
      O "Continuar com E-mail" vem em DESTAQUE, na cor da marca.
   2) E-MAIL  — os campos de e-mail e senha, com "Esqueceu sua senha?"
      logo abaixo da senha.
   =================================================================== */

export default function Login() {
  useTemaEscuroForcado();
  const navigate = useNavigate();




  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEntrar() {
    setErro("");
    if (!contato || !senha) return setErro("Preencha e-mail e senha.");
    if (!contato.includes("@")) return setErro("Digite um e-mail válido.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: contato, password: senha });
    if (error) {
      setLoading(false);
      return setErro(translateAuthError(error.message) || "E-mail ou senha incorretos.");
    }

    // Decide onboarding pelo BANCO: se o perfil ainda não tem tipo_mei,
    // a pessoa nunca completou o
    // onboarding → manda pro onboarding. Isso cobre o caso de quem confirmou
    // o e-mail e está entrando pela primeira vez (não passou pelo Cadastro),
    // e também quem abandonou o cadastro antes de terminar o onboarding.
    let precisaOnboarding = true;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("onboarding_ok")
          .eq("id", user.id)
          .single();
        if (perfil && perfil.onboarding_ok === true) precisaOnboarding = false;
      }
    } catch {
      /* falha de rede → por segurança, manda pro dashboard (usuário já logado) */
      precisaOnboarding = false;
    }

    setLoading(false);
    navigate(precisaOnboarding ? "/onboarding" : "/dashboard");
  }

  /* Fundo preto (do próprio app) com moldura clara — mesmo tratamento
     da tela de Cadastro. */
  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--text)",
  };

  const botaoSocialStyle = {
    backgroundColor: "transparent",
    color: "var(--text)",
    border: "1px solid rgba(255,255,255,0.22)",
  };

  /* ===================================================================
     LOGIN SOCIAL (Google)

     Para ATIVAR: habilitar o provider no Supabase (Authentication →
     Sign In / Providers) e criar o app no console do Google.
     Callback: https://txejrqynagsfhteaofai.supabase.co/auth/v1/callback
     Depois é só trocar o corpo da função por entrarCom("google").
     =================================================================== */

  // eslint-disable-next-line no-unused-vars
  async function entrarCom(provider) {
    setErro("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro(translateAuthError(error.message));
  }

  function handleGoogle() {
    entrarCom("google");
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Topo */}
      <div className="px-4 pt-5 shrink-0">
        {/* Vai DIRETO para a Welcome (slides). Com navigate(-1) a seta
            voltava para o Cadastro, porque as duas telas apontam uma para
            a outra e isso empilha no historico. */}
        <button
          onClick={() => navigate("/", { replace: true })}
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
          <div className="flex justify-center mb-7">
            <Gauge size={44} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Bem-vindo de volta!
              </h1>

              <div className="mt-5 space-y-3">
                <input
                  type="email"
                  inputMode="email"
                  placeholder="E-mail"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  className="campo-tacerto w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                  style={fieldStyle}
                />

                {/* Senha na mesma tela do e-mail */}
                <div className="relative">
                    <input
                      type={showSenha ? "text" : "password"}
                      placeholder="Sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleEntrar(); }}
                      className="campo-tacerto w-full px-4 py-3.5 pr-11 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
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
                  onClick={() => {
                    setErro("");
                    if (!contato.includes("@")) return setErro("Digite um e-mail válido.");
                    handleEntrar();
                  }}
                  disabled={loading || !contato.includes("@") || !senha}
                  className="w-full py-3 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                >
                  {loading ? "Aguarde..." : "Continuar"}
                </button>

                <button
                  onClick={() => navigate("/esqueci-senha")}
                  className="w-full text-center text-sm pt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Esqueceu sua senha?
                </button>

                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                  <span className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>ou</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                </div>

                <button
                  onClick={handleGoogle}
                  className="relative w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center hover:opacity-90"
                  style={botaoSocialStyle}
                >
                  <span className="absolute left-4 flex items-center">
                    {/* Icone do Google em VERDE (mesmo tratamento do Cadastro).
                        Para voltar ao colorido, trocar currentColor pelas cores
                        originais: #FFC107, #FF3D00, #4CAF50, #1976D2. */}
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ color: "var(--primary)" }}>
                      <path fill="currentColor" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                      <path fill="currentColor" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="currentColor" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                      <path fill="currentColor" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.1 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                    </svg>
                  </span>
                  Continuar com Google
                </button>

                {/* Saida para quem ainda nao tem conta */}
                <button
                  onClick={() => navigate("/cadastro", { replace: true })}
                  className="w-full text-center text-sm pt-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Não tem conta?{" "}
                  <span style={{ color: "var(--primary)", fontWeight: 600 }}>Cadastre-se</span>
                </button>

              </div>
          </>

        </div>
      </div>
    </div>
  );
}