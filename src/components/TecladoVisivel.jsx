/* TECLADOVISIVEL v6 — desativado: quem resolve agora e o CSS */
import { useEffect } from "react";

/* ===================================================================
   TECLADOVISIVEL — DESATIVADO DE PROPOSITO (17/09/2026)

   Este componente nao faz mais nada. Ele continua aqui, e continua
   ligado no App.jsx, so para registrar a historia — e para ser o lugar
   certo caso a solucao em CSS nao de conta de algum caso.

   O PROBLEMA QUE ELE TENTAVA RESOLVER:
     No iPhone, tocar num campo na metade de baixo da tela fazia o
     teclado cobrir o que estava sendo digitado.

   O QUE FOI TENTADO, E POR QUE CADA UMA FALHOU:

     v1 — rolava o container com scrollTop.
          Falhou: o `.tela-rolavel` usa `height: 100dvh`, que nao
          encolhe com o teclado (bug 6 do handoff). Nao havia para
          onde rolar. Medido no aparelho: faltavam 101px, existiam 18.

     v2 — encolhia a altura da tela via style inline.
          Falhou: a altura vem da classe CSS e o inline nem sempre
          vencia.

     v4 — criava padding no fim e rolava na marra depois de 350ms.
          Funcionava as vezes, mas com solavanco: a tela ja tinha
          assentado errada quando o ajuste chegava. E deixava residuo —
          o container ficava rolado e o topo aparecia cortado.

     v5 — criava o espaco no toque e deixava o Safari rolar.
          Melhorou, mas ainda embolava ao abrir e fechar varias vezes.

   O QUE RESOLVEU — CSS PURO, no src/index.css:

       .tela-rolavel:focus-within > .conteudo-rolavel {
         padding-bottom: 55vh;
       }

     Quando qualquer campo dentro da tela recebe foco, o conteudo ganha
     meia tela de espaco no fim. Com espaco disponivel, o Safari rola
     sozinho ate o campo — animacao nativa, suave, sem solavanco. Ao
     perder o foco, o espaco some. Sem timeout, sem medicao, sem
     residuo, e vale para todas as telas de uma vez.

   LICAO: o navegador ja sabia fazer o trabalho. Faltava dar espaco.
   =================================================================== */

export default function TecladoVisivel() {
  useEffect(() => {
    /* Nada a fazer. Ver o bloco acima. */
  }, []);

  return null;
}