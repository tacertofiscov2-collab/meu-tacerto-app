/* FOTOISA v1 — foto redonda da Isa (assistente virtual com IA do TaCerto), em webp leve: 96px ate 48 de tamanho, 256px acima */

/* ===================================================================
   FOTO DA ISA (10/10/2026 — tarefa de 10-10, Bloco A)

   O assistente do TaCerto deixou de ser o robo "Fisco" e virou a
   "Isa", assistente virtual com IA. A foto foi gerada por IA (pessoa
   que nao existe). Arquivos em public/isa/:
     isa-96.webp   recorte do rosto, 96x96 (~2 KB)  -> avatares pequenos
     isa-256.webp  recorte do rosto, 256x256 (~6 KB) -> avatares grandes
     isa-512.webp  foto inteira (com blazer), 512x512 (~10 KB) -> reserva
   Os originais (isa.png de 2,2 MB e isa-whatsapp.jpg) NAO sao usados no
   app: sao a fonte para gerar os webp (gerados no navegador, canvas).

   Uso: <FotoIsa size={40} />. Aceita as mesmas props de um icone
   (size, className, style; strokeWidth e ignorado), entao entra direto
   no lugar de um Icon (barra do Inicio, LinhaLista, Apresentacao).
   - borda: anel verde fino (o mesmo da foto antiga do Fisco).
   - online: bolinha verde no canto (so onde ja existia).
   =================================================================== */

export const FOTO_ISA_96 = "/isa/isa-96.webp";
export const FOTO_ISA_256 = "/isa/isa-256.webp";

export default function FotoIsa({ size = 40, borda = false, online = false, className = "", style }) {
  const src = size <= 48 ? FOTO_ISA_96 : FOTO_ISA_256;
  const bolinha = Math.max(7, Math.round(size * 0.27));
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <span
        className="block rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          boxSizing: "border-box",
          border: borda ? "1.5px solid rgba(34,197,94,0.45)" : "none",
          backgroundColor: "#8a8a8f",
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
      {online && (
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: bolinha,
            height: bolinha,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--primary)",
            border: `${Math.max(2, Math.round(bolinha * 0.15))}px solid var(--bg)`,
            boxSizing: "border-box",
          }}
        />
      )}
    </span>
  );
}
