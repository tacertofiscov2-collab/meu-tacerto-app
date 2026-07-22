/* ===================================================================
   COR DO BALÃO DO FISCO — apenas 3 cores (verde / amarelo / vermelho)
   O velocímetro tem 6 cores; o balão simplifica em 3 níveis.
   =================================================================== */

   export const BALAO_CORES = {
    verde: "#22c55e",
    amarelo: "#f59e0b",
    vermelho: "#ef4444",
  };
  
  export function corBalaoDaFaixa(faixa) {
    if (faixa === "tranquilo" || faixa === "fique_de_olho") return BALAO_CORES.verde;
    if (faixa === "atencao" || faixa === "perto_do_limite") return BALAO_CORES.amarelo;
    return BALAO_CORES.vermelho;
  }