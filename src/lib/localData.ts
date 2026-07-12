export function getPerfilLocal() {
  if (typeof window === "undefined") return { nome: "Usuário", perfil: "mei", limite: 0 };
  return {
    nome: localStorage.getItem("tacerto_nome") || "Usuário",
    perfil: localStorage.getItem("tacerto_perfil") || "mei",
    limite: Number(localStorage.getItem("tacerto_limite")) || 0,
  };
}

export function salvarPerfilLocal({
  nome,
  perfil,
  limite,
}: {
  nome?: string;
  perfil?: string;
  limite?: number;
}) {
  if (typeof window === "undefined") return;
  if (nome) localStorage.setItem("tacerto_nome", nome);
  if (perfil) localStorage.setItem("tacerto_perfil", perfil);
  if (limite) localStorage.setItem("tacerto_limite", String(limite));
}
