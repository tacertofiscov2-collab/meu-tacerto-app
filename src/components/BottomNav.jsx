import { useNavigate } from "react-router-dom";
import { Home, Receipt, LayoutGrid, User } from "lucide-react";

export default function BottomNav({ ativo }) {
  const navigate = useNavigate();
  const itens = [
    { Icon: Home, label: "Início", route: "/dashboard", key: "inicio" },
    { Icon: Receipt, label: "Histórico", route: "/historico", key: "historico" },
    { Icon: LayoutGrid, label: "Menu", route: "/menu", key: "menu" },
    { Icon: User, label: "Perfil", route: "/perfil", key: "perfil" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {itens.map(({ Icon, label, route, key }) => {
          const ehAtivo = key === ativo;
          return (
            <button
              key={key}
              onClick={() => navigate(route)}
              className="flex flex-col items-center justify-center gap-1 py-3 hover:opacity-90"
              style={{ color: ehAtivo ? "var(--primary)" : "var(--text-secondary)" }}
            >
              <Icon size={22} strokeWidth={ehAtivo ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
