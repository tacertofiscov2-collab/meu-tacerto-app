/* ARQUIVOPENDENTE v1 — "caixinha" na memoria para levar a foto ou o PDF escolhido no chat da Isa (Inicio e /fisco) ate o "+" (Lancar), que ja abre lendo o comprovante */

/* ===================================================================
   ARQUIVO PENDENTE (12/10/2026 — pedido do Fernando: o chat da Isa
   voltou a ter foto, galeria e documento, agora funcionando)

   O arquivo e escolhido NA TELA DO CHAT (o iPhone so abre o seletor
   dentro do toque) e a Lancar processa ao abrir. Ele fica so aqui, na
   memoria: nao vai para a URL nem para o historico do navegador. Assim
   voltar, avancar ou recarregar a pagina nao manda o mesmo arquivo de
   novo (pegarArquivoPendente devolve e esvazia).
   =================================================================== */

let pendente = null;

export function deixarArquivoPendente(arquivo) {
  pendente = arquivo || null;
}

/* Devolve o arquivo (ou null) e esvazia a caixinha */
export function pegarArquivoPendente() {
  const arquivo = pendente;
  pendente = null;
  return arquivo;
}
