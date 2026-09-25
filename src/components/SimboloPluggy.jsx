/* SIMBOLOPLUGGY v1 — mostra so os aneis da Pluggy a partir do logo completo */

/* ===================================================================
   SIMBOLO DA PLUGGY

   Usa o arquivo oficial public/pluggy-logo.png (logo completo: aneis +
   nome "pluggy") e mostra SO os aneis, escondendo o nome. Nao edita o
   arquivo: e uma "janela" do tamanho do simbolo por cima da imagem.

   Uso:  <SimboloPluggy altura={22} />
   `altura` e a altura dos aneis em px; a largura acompanha.

   Autorizacao de uso: confirmada com a Pluggy (24/09/2026).

   Se a Pluggy mandar um arquivo so do simbolo, basta trocar o src e
   zerar o recorte (SIMBOLO = tamanho inteiro do arquivo novo).
   =================================================================== */

// Tamanho original do arquivo pluggy-logo.png
const LOGO = { largura: 1628, altura: 405 };

// Onde ficam os aneis dentro do logo (em px do arquivo original)
const SIMBOLO = { x: 0, y: 78, largura: 305, altura: 211 };

export default function SimboloPluggy({ altura = 22, className = "", style = {} }) {
  const escala = altura / SIMBOLO.altura;

  return (
    <span
      role="img"
      aria-label="Pluggy"
      className={`relative inline-block overflow-hidden shrink-0 ${className}`}
      style={{
        width: Math.round(SIMBOLO.largura * escala),
        height: altura,
        ...style,
      }}
    >
      <img
        src="/pluggy-logo.png"
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          left: -SIMBOLO.x * escala,
          top: -SIMBOLO.y * escala,
          width: LOGO.largura * escala,
          height: LOGO.altura * escala,
          maxWidth: "none",
        }}
      />
    </span>
  );
}