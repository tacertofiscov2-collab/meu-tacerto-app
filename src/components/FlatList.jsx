import { ChevronRight } from "lucide-react";

/**
 * FlatList — padrão visual "Pierre" para telas internas do TaCerto!.
 *
 * - <SectionTitle>: pequeno título em cinza, começa uma seção agrupada.
 * - <FlatItem>: linha horizontal flat (sem card em volta), com ícone à esquerda
 *   em cor --primary (line-art puro, sem fundo), texto, e ChevronRight à direita.
 * - <FlatGroup>: agrupa itens da mesma seção com separador sutil entre eles.
 *
 * Convenção: padding lateral do container da tela = px-5 (20px).
 * Aqui os itens ocupam a largura total; o separador começa após o ícone
 * (margin-left ~ ícone + gap) para não cortar a linha visualmente.
 */

const SEPARATOR = "1px solid rgba(255,255,255,0.06)";

export function SectionTitle({ children, className = "" }) {
  return (
    <p
      className={`text-[13px] mt-6 mb-2 ${className}`}
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </p>
  );
}

export function FlatGroup({ children, className = "" }) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <div className={className}>
      {arr.map((child, i) => (
        <div
          key={i}
          style={
            i > 0
              ? { borderTop: `1px solid var(--border)`, opacity: 1 }
              : undefined
          }
        >
          <div
            style={
              i > 0
                ? {
                    marginLeft: 34, // ~ícone 22 + gap 12
                    borderTop: `1px solid var(--border)`,
                    opacity: 0.3,
                    marginTop: -1,
                  }
                : undefined
            }
          />
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * FlatItem — linha flat com ícone + texto + chevron.
 *
 * Props:
 * - Icon: componente do lucide-react (linha, sem preenchimento)
 * - label: texto do item
 * - sub: subtítulo opcional (linha abaixo, cor secundária)
 * - right: nó React customizado à direita (substitui o ChevronRight padrão)
 * - onClick: handler
 * - cor: cor do label (ex: vermelho para "Sair")
 * - iconCor: sobrescreve a cor do ícone (por padrão --primary)
 * - semChevron: esconde o ChevronRight
 * - as: elemento raiz ("button" | "div"), padrão "button"
 */
export function FlatItem({
  Icon,
  label,
  sub,
  right,
  onClick,
  cor,
  iconCor,
  semChevron = false,
  as = "button",
  className = "",
}) {
  const Root = as;
  const rootProps =
    as === "button"
      ? { onClick, type: "button" }
      : {};
  return (
    <Root
      {...rootProps}
      className={`w-full flex items-center gap-3 py-3.5 text-left active:opacity-70 ${className}`}
      style={{ backgroundColor: "transparent" }}
    >
      {Icon && (
        <Icon
          size={22}
          strokeWidth={1.75}
          style={{ color: iconCor || cor || "var(--primary)" }}
          className="shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-[16px] leading-tight"
          style={{ color: cor || "var(--text)" }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {sub}
          </p>
        )}
      </div>
      {right !== undefined
        ? right
        : !semChevron && (
            <ChevronRight
              size={18}
              style={{ color: "var(--text-secondary)" }}
              className="shrink-0"
            />
          )}
    </Root>
  );
}

// Suppress unused ref
void SEPARATOR;
