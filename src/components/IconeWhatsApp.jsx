/* ICONEWHATSAPP v1 — simbolo do WhatsApp so em contorno, no mesmo jeito dos icones do app (size, strokeWidth, cor pelo style.color) */

/* ===================================================================
   ICONE DO WHATSAPP (05/10/2026 — pedido do Fernando: "no balao do
   Fisco coloque o simbolo do WhatsApp, so o contorno verde")

   O pacote de icones (lucide) nao tem marcas, entao o desenho e daqui:
   o balao redondo com a pontinha embaixo, a esquerda, e o telefone
   dentro (o mesmo telefone do lucide, menor). Tudo em contorno, na cor
   do texto (currentColor): use style={{ color: "var(--primary)" }}.
   =================================================================== */
export default function IconeWhatsApp({ size = 24, strokeWidth = 2, className = "", style }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* balao: circulo (centro 12,12; raio 8,5) com a pontinha em 3,21 */}
      <path d="M3 21l1.64-4.75A8.5 8.5 0 1 1 7.75 19.36Z" />
      {/* telefone: o do lucide, reduzido para 38% e centrado no balao */}
      <g transform="translate(7.44 7.44) scale(0.38)">
        <path
          strokeWidth={strokeWidth / 0.38 * 0.8}
          d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        />
      </g>
    </svg>
  );
}
