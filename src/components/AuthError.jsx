export function translateAuthError(message) {
  if (!message) return "";
  const m = String(message).toLowerCase();

  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Esse e-mail já está cadastrado. Tente fazer login.";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Digite um e-mail válido.";
  if (m.includes("password should be at least") || m.includes("password is too short"))
    return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("weak password") || m.includes("password should contain"))
    return "Escolha uma senha mais forte.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  if (m.includes("user not found"))
    return "Não encontramos uma conta com esse e-mail.";
  if (m.includes("email link is invalid") || m.includes("token has expired"))
    return "Link inválido ou expirado. Solicite um novo.";

  // Fallback: se ainda parecer inglês, dá uma mensagem genérica em pt-BR
  if (/[a-z]/i.test(m) && !/[áéíóúâêôãõç]/i.test(m))
    return "Não foi possível concluir. Tente novamente.";
  return message;
}

export default function AuthError({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="text-xs text-center px-3 py-2 rounded-lg"
      style={{
        backgroundColor: "rgba(248, 113, 113, 0.08)",
        border: "1px solid rgba(248, 113, 113, 0.25)",
        color: "#fca5a5",
      }}
    >
      {children}
    </div>
  );
}
