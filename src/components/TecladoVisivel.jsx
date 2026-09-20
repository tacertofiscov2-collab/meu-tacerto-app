/* TECLADOVISIVEL v9 — NEUTRALIZADO. So registro do que foi tentado. */
import { useEffect } from "react";

/* ===================================================================
   ⚠️ ESTE COMPONENTE NAO FAZ NADA — E DE PROPOSITO

   Ele continua importado no App.jsx so para manter este registro
   junto do codigo. Nao apague sem ler ate o fim: aqui esta tudo que
   foi tentado contra o bug do teclado no iPhone, em 17 e 18/09/2026.
   Sem isso, a proxima pessoa (voce, o Ruan, ou uma IA em outro chat)
   vai repetir as mesmas oito tentativas.

   ===================================================================
   O PROBLEMA
   ===================================================================

   No iPhone, ao tocar num campo que fica na metade de baixo da tela,
   o teclado sobe e cobre o campo. A pessoa nao ve o que digita.

   ONDE AINDA ACONTECE (18/09/2026):
     - EditarPerfil  -> campo de e-mail
     - ExcluirConta  -> campo "EXCLUIR" e textarea de motivo

   ONDE FOI RESOLVIDO:
     - Onboarding    -> ver ONBOARDING v4, explicado abaixo
     - Cadastro      -> ver CADASTRO v12

   ===================================================================
   A MEDICAO QUE EXPLICA TUDO (EditarPerfil, iPhone real)
   ===================================================================

       janela   633
       visivel  412      <- o teclado ocupa 221px
       campo em 449      <- o campo esta 37px ABAIXO do visivel
       --- cadeia de pais ---
       4 h565 s1140 auto  conteudo-rolavel   <- 575px de rolagem sobrando
       5 h633 s633  hidd  tela-rolavel       <- NAO ENCOLHEU
       6 h633 s633  visi  DIV (TransicaoTela)
       7 h633 s633  visi  DIV (#root)

   LEIA A LINHA 5: o `.tela-rolavel` usa `height: 100dvh` no
   index.css. O dvh (dynamic viewport height) DEVERIA encolher quando
   o teclado sobe. NESTE IPHONE ELE NAO ENCOLHE — ficou com 633px
   enquanto a area visivel tinha 412px.

   Por isso o Safari nao rolava sozinho: para ele, o campo em 449
   estava dentro de um container de 633px, ou seja, visivel. E por
   isso quase tudo que se tentou falhou — o problema nao estava na
   tela, estava numa unidade de CSS que mente.

   ===================================================================
   O QUE FOI TENTADO, E POR QUE CADA UMA FALHOU
   ===================================================================

   1. scrollTop no container (v1)
      Falhou: nao havia para onde rolar. Medido na ExcluirConta:
      faltavam 101px, existiam 18px de rolagem.

   2. Encolher a altura da tela por style inline (v2)
      Falhou: a altura vem da classe CSS e o inline nao vencia.

   3. Padding no fim + scrollTop depois de 350ms (v4)
      Funcionava as vezes, com solavanco, e deixava residuo: o
      container ficava rolado e o topo aparecia cortado.

   4. Padding no toque + deixar o Safari rolar (v5)
      Melhorou, mas embolava ao abrir e fechar varias vezes.

   5. CSS puro com :focus-within dando 55vh de espaco no fim
      Ajuda e continua no index.css, mas nao resolve sozinha — o
      espaco existe, o container e que nao encolhe.

   6. Remover `interactive-widget=resizes-content` do index.html
      Nao mudou nada. A linha foi devolvida.

   7. Corrigir o script do index.html
      ESSA VALEU A PENA, mas por outro motivo: o script disparava
      scrollTo(0,0) tres vezes ao ABRIR o teclado (a trava usava
      folga de 60px e respondia "fechado" no meio da animacao),
      desfazendo qualquer rolagem. Hoje ele espera o viewport
      assentar. Corrigido, mas nao era a causa principal.

   8. Trocar `height: 100%` por `100dvh` no TransicaoTela
      Nao adiantou — ver a medicao acima: o dvh nao encolhe.

   9. Forcar a altura real do visualViewport no #root por JS (v8)
      Tambem nao resolveu. Foi a ultima tentativa antes de parar.

   ===================================================================
   O QUE FUNCIONOU NAS TELAS JA CORRIGIDAS
   ===================================================================

   Nao foi nenhuma das tentativas acima. Foi mudar a ESTRUTURA da
   tela, imitando o que a tela do codigo de 6 digitos ja fazia:

     a) deixar o conteudo ROLAR (overflowY: auto)
     b) ancorar no TOPO (justify-content: flex-start), nunca no
        centro — `center` prende o bloco no meio da altura cheia
     c) folga generosa no fim (300px ou mais)

   Ver ONBOARDING v4: la o `temCampoDeTexto` aplica isso apenas aos
   steps que abrem teclado. Os outros seguem centralizados.

   ===================================================================
   O CAMINHO QUE SOBROU, SE ALGUEM QUISER TENTAR DE NOVO
   ===================================================================

   A) Mudar o layout, nao lutar com o teclado. Campo de e-mail numa
      tela propria, curta, com o campo no topo — como a
      AlterarWhatsapp.jsx. Resolve por desenho, sem truque.

   B) Esperar o Capacitor. Empacotado como app nativo, o teclado
      passa a ser tratado pelo sistema e isso deixa de existir. Ja
      esta no roadmap (ver PENDENCIAS_FUTURAS.md).

   A decisao de 18/09/2026 foi seguir para outras tarefas. As duas
   telas afetadas sao de uso raro, por quem ja tem conta criada.
   =================================================================== */

export default function TecladoVisivel() {
  useEffect(() => {
    /* Nada a fazer. Ver o bloco acima antes de escrever codigo aqui. */
  }, []);

  return null;
}