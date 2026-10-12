/* SELORECOMENDADO v1 — selo pequeno "Recomendado" no canto de cima de um botao/cartao (um componente so, reaproveitado: Enviar extrato em todo lugar e "A Isa me manda o boleto" na pagina do DAS) */

/* ===================================================================
   SELO "RECOMENDADO" (12/10/2026 — tarefa de 10-10, Blocos D e I)

   Fica "pendurado" na borda de cima do cartao, no canto direito, com o
   fundo da tela por tras (corta a linha da borda, como uma etiqueta).
   O cartao precisa de position: relative (className "relative").

     <button className="relative ...">
       <SeloRecomendado />
       ...
     </button>

   `noCanto={false}`: o selo fica na linha, junto do texto (para onde
   nao cabe pendurado, ex.: dentro de uma lista).
   =================================================================== */
export default function SeloRecomendado({ noCanto = true, texto = "Recomendado" }) {
  const estilo = {
    fontSize: 11,
    lineHeight: "16px",
    padding: "1px 8px",
    color: "var(--primary)",
    border: "1px solid rgba(34,197,94,0.45)",
    backgroundColor: "var(--bg)",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };
  if (noCanto) {
    return (
      <span
        className="rounded-full font-semibold pointer-events-none"
        style={{ ...estilo, position: "absolute", top: -9, right: 14 }}
      >
        {texto}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full font-semibold align-middle" style={estilo}>
      {texto}
    </span>
  );
}
