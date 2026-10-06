/* APP v14 — rotas /suporte (chat de suporte), /declaracao-anual e /declaracao-anual/calcular, atras das chaves MOSTRAR_SUPORTE e MOSTRAR_DECLARACAO_ANUAL (v13: login so pelo WhatsApp: /login e /cadastro abrem EntrarWhatsApp; /entrar-email (plano B) abre o Login antigo; esqueci/alterar senha e alterar-whatsapp atras de MOSTRAR_LOGIN_EMAIL (v12: rota /como-pagar-das; v11: /privacidade, /termos-de-uso, /como-emitir-nota; v10: rotas escondidas voltam para o /dashboard) */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import SwipeBack from "./components/SwipeBack.jsx";
import TecladoVisivel from "./components/TecladoVisivel.jsx";
import TransicaoTela from "./components/TransicaoTela.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Perfil from "./pages/Perfil.jsx";
import ExcluirConta from "./pages/ExcluirConta.jsx";
import Welcome from "./pages/Welcome.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import EntrarWhatsApp from "./pages/EntrarWhatsApp.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import EsqueciSenha from "./pages/EsqueciSenha.jsx";
import CadastroObrigatorio from "./pages/CadastroObrigatorio.jsx";
import Sobre from "./pages/Sobre.jsx";
import Termos from "./pages/Termos.jsx";
import Lancar from "./pages/Lancar.jsx";
import LimiteAtingido from "./pages/LimiteAtingido.jsx";
import EmConstrucao from "./pages/EmConstrucao.jsx";
import Historico from "./pages/Historico.jsx";
import HistoricoNotas from "./pages/HistoricoNotas.jsx";
import Alertas from "./pages/Alertas.jsx";
import Preferencias from "./pages/Preferencias.jsx";
import Faq from "./pages/Faq.jsx";
import Velocimetro from "./pages/Velocimetro.jsx";
import AlterarSenha from "./pages/AlterarSenha.jsx";
import AlterarWhatsapp from "./pages/AlterarWhatsapp.jsx";
import ConectarBanco from "./pages/ConectarBanco.jsx";
import EscolherBanco from "./pages/EscolherBanco.jsx";
import RetornoBanco from "./pages/RetornoBanco.jsx";
import ConferirEntradas from "./pages/ConferirEntradas.jsx";
import Saidas from "./pages/Saidas.jsx";
import HistoricoDas from "./pages/HistoricoDas.jsx";
import EditarPerfil from "./pages/EditarPerfil.jsx";
import ResumoPerfil from "./pages/ResumoPerfil.jsx";
import InformacoesFiscais from "./pages/InformacoesFiscais.jsx";
import RegraVinte from "./pages/RegraVinte.jsx";
import DevSimulador from "./pages/DevSimulador.jsx";
import AdicionarFaturamento from "./pages/AdicionarFaturamento.jsx";
import AdicionarFaturamentoDigitar from "./pages/AdicionarFaturamentoDigitar.jsx";
import AdicionarFaturamentoEnviar from "./pages/AdicionarFaturamentoEnviar.jsx";
import AdicionarFaturamentoColar from "./pages/AdicionarFaturamentoColar.jsx";
import ChatFiscoPagina from "./pages/ChatFiscoPagina.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Privacidade from "./pages/Privacidade.jsx";
import TermosDeUso from "./pages/TermosDeUso.jsx";
import ComoEmitirNota from "./pages/ComoEmitirNota.jsx";
import ComoPagarDas from "./pages/ComoPagarDas.jsx";
import Suporte from "./pages/Suporte.jsx";
import DeclaracaoAnual from "./pages/DeclaracaoAnual.jsx";
import CalcularDeclaracao from "./pages/CalcularDeclaracao.jsx";
import {
  MOSTRAR_OPEN_FINANCE, MOSTRAR_CHAT_FISCO, MOSTRAR_NOTAS_FISCAIS,
  MOSTRAR_SAIDAS, MOSTRAR_HISTORICO_DAS, MOSTRAR_ADICIONAR_MOVIMENTACOES,
  MOSTRAR_RESUMO_ANO, MOSTRAR_PREFERENCIAS, MOSTRAR_SOBRE, MOSTRAR_INACABADOS,
  MOSTRAR_TUTORIAL_NOTA, MOSTRAR_TUTORIAL_DAS, MOSTRAR_LOGIN_EMAIL,
  MOSTRAR_SUPORTE, MOSTRAR_DECLARACAO_ANUAL,
} from "./config/piloto.js";

/* ===================================================================
   PILOTO (04/10/2026) — ROTAS ESCONDIDAS

   O que nao e usado no piloto continua aqui, mas atras de uma chave de
   src/config/piloto.js. Com a chave desligada, quem abrir o endereco
   direto (ex.: digitando /saidas) volta para o /dashboard — nunca fica
   tela branca. Para religar, e so trocar a chave para true.
   =================================================================== */
function RotaComChave({ ligada, children }) {
  return ligada ? children : <Navigate to="/dashboard" replace />;
}

/* ===================================================================
   NAVEGACAO POR GESTO - DESATIVADA DE PROPOSITO

   O gesto de "arrastar para voltar" entre telas foi desligado. Nao e
   bug esquecido: a decisao esta documentada em PENDENCIAS_FUTURAS.md,
   na raiz do projeto. Resumo: dentro do navegador o resultado nunca
   ficou 100% liso, e a solucao correta e empacotar com Capacitor
   antes do lancamento, ganhando o gesto nativo do proprio sistema.

   Os componentes AbasDeslizantes.jsx, TelaComVoltarReal.jsx e
   VoltarAnimadoContext.js continuam no projeto, prontos para quando
   for a hora - so nao estao mais em uso aqui.

   CONTINUAM ATIVOS (nao mexer): os slides do Welcome e o carrossel
   A/B do velocimetro no Dashboard. Esses sao deslizes INTERNOS de
   componente, funcionam bem e nao dependem de nada disto.
   =================================================================== */

/* ===================================================================
   TECLADOVISIVEL — POR QUE ESTA AQUI (17/09/2026)

   No iPhone, tocar num campo na metade de baixo da tela fazia o
   teclado cobrir justamente o que estava sendo digitado. Acontecia na
   ExcluirConta (campo "EXCLUIR"), AlterarSenha, EditarPerfil, Lancar,
   Historico e nas telas de AdicionarFaturamento — oito telas com o
   mesmo defeito.

   Em vez de corrigir uma por uma, o TecladoVisivel fica aqui e vale
   para o app INTEIRO, inclusive para telas que ainda nao existem. Ele
   escuta qualquer campo receber foco e, se estiver coberto, rola o
   suficiente para aparecer. Se ja estiver visivel, nao faz nada — por
   isso nao briga com o Cadastro, a AlterarWhatsapp e o Onboarding, que
   tem tratamento proprio.

   Nao desenha nada na tela. Ver src/components/TecladoVisivel.jsx.
   =================================================================== */

/* ===================================================================
   CONEXAO BANCARIA — CAMINHO B (24/09/2026)

     /conectar-banco           "Conexao bancaria" (a casa do banco)
     /conectar-banco/escolher  "Escolha seu banco" + folha "Conectar
                               conta" (EscolherBanco.jsx)
     /conectar-banco/retorno   o banco devolve a pessoa para ca com
                               ?itemId=... (RetornoBanco.jsx)
     /conferir-entradas        conferencia agrupada por pagador
                               (ConferirEntradas.jsx) — aberta pela faixa
                               de Lancar e pelo "Conferir agora"
     /saidas                   tela Saidas (Saidas.jsx) — aberta pelo
                               Perfil, junto com os itens do MEI
     /das                      Historico de DAS (HistoricoDas.jsx) —
                               tambem pelo Perfil
   =================================================================== */

export default function App() {
  return (
    <BrowserRouter>
      <SplashScreen />
      <SwipeBack />
      <TecladoVisivel />
      <TransicaoTela>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          {/* v13: com MOSTRAR_LOGIN_EMAIL = false, /login e /cadastro abrem a
              entrada pelo WhatsApp. /entrar-email (sem link em lugar nenhum)
              e o plano B: login por e-mail e senha. */}
          <Route path="/login" element={MOSTRAR_LOGIN_EMAIL ? <Login /> : <EntrarWhatsApp />} />
          <Route path="/cadastro" element={MOSTRAR_LOGIN_EMAIL ? <Cadastro /> : <EntrarWhatsApp />} />
          <Route path="/entrar-email" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/esqueci-senha" element={<RotaComChave ligada={MOSTRAR_LOGIN_EMAIL}><EsqueciSenha /></RotaComChave>} />
          <Route path="/cadastro-obrigatorio" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><CadastroObrigatorio /></RotaComChave>} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />

          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/preferencias" element={<RotaComChave ligada={MOSTRAR_PREFERENCIAS}><Preferencias /></RotaComChave>} />
          <Route path="/alterar-senha" element={<RotaComChave ligada={MOSTRAR_LOGIN_EMAIL}><AlterarSenha /></RotaComChave>} />
          <Route path="/alterar-whatsapp" element={<RotaComChave ligada={MOSTRAR_LOGIN_EMAIL}><AlterarWhatsapp /></RotaComChave>} />
          <Route path="/conectar-banco" element={<RotaComChave ligada={MOSTRAR_OPEN_FINANCE}><ConectarBanco /></RotaComChave>} />
          <Route path="/conectar-banco/escolher" element={<RotaComChave ligada={MOSTRAR_OPEN_FINANCE}><EscolherBanco /></RotaComChave>} />
          <Route path="/conectar-banco/retorno" element={<RotaComChave ligada={MOSTRAR_OPEN_FINANCE}><RetornoBanco /></RotaComChave>} />
          <Route path="/conferir-entradas" element={<ConferirEntradas />} />
          <Route path="/saidas" element={<RotaComChave ligada={MOSTRAR_SAIDAS}><Saidas /></RotaComChave>} />
          <Route path="/das" element={<RotaComChave ligada={MOSTRAR_HISTORICO_DAS}><HistoricoDas /></RotaComChave>} />
          <Route path="/faq" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><Faq /></RotaComChave>} />
          <Route path="/sobre" element={<RotaComChave ligada={MOSTRAR_SOBRE}><Sobre /></RotaComChave>} />
          <Route path="/termos" element={<Termos />} />
          {/* Piloto (v11): documentos completos (o /termos e o resumo) */}
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/como-emitir-nota" element={<RotaComChave ligada={MOSTRAR_TUTORIAL_NOTA}><ComoEmitirNota /></RotaComChave>} />
          {/* Piloto (v12): passo a passo do boleto do DAS */}
          <Route path="/como-pagar-das" element={<RotaComChave ligada={MOSTRAR_TUTORIAL_DAS}><ComoPagarDas /></RotaComChave>} />
          {/* v14: suporte (chat com perguntas prontas) e declaracao anual */}
          <Route path="/suporte" element={<RotaComChave ligada={MOSTRAR_SUPORTE}><Suporte /></RotaComChave>} />
          <Route path="/declaracao-anual" element={<RotaComChave ligada={MOSTRAR_DECLARACAO_ANUAL}><DeclaracaoAnual /></RotaComChave>} />
          <Route path="/declaracao-anual/calcular" element={<RotaComChave ligada={MOSTRAR_DECLARACAO_ANUAL}><CalcularDeclaracao /></RotaComChave>} />
          <Route path="/excluir-conta" element={<ExcluirConta />} />
          <Route path="/perfil/informacoes-fiscais" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><InformacoesFiscais /></RotaComChave>} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/notas-fiscais" element={<RotaComChave ligada={MOSTRAR_NOTAS_FISCAIS}><HistoricoNotas /></RotaComChave>} />
          <Route path="/perfil/resumo" element={<RotaComChave ligada={MOSTRAR_RESUMO_ANO}><ResumoPerfil /></RotaComChave>} />
          <Route path="/alertas" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><Alertas /></RotaComChave>} />
          <Route path="/regra-vinte" element={<RegraVinte />} />
          <Route path="/fisco" element={<RotaComChave ligada={MOSTRAR_CHAT_FISCO}><ChatFiscoPagina /></RotaComChave>} />

          <Route path="/lancar" element={<Lancar />} />
          <Route path="/lancar/limite-atingido" element={<LimiteAtingido />} />
          <Route path="/velocimetro" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><Velocimetro /></RotaComChave>} />
          <Route path="/dev/simulador" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><DevSimulador /></RotaComChave>} />
          <Route path="/adicionar-faturamento" element={<RotaComChave ligada={MOSTRAR_ADICIONAR_MOVIMENTACOES}><AdicionarFaturamento /></RotaComChave>} />
          <Route path="/adicionar-faturamento/digitar" element={<RotaComChave ligada={MOSTRAR_ADICIONAR_MOVIMENTACOES}><AdicionarFaturamentoDigitar /></RotaComChave>} />
          <Route path="/adicionar-faturamento/enviar" element={<RotaComChave ligada={MOSTRAR_ADICIONAR_MOVIMENTACOES}><AdicionarFaturamentoEnviar /></RotaComChave>} />
          <Route path="/adicionar-faturamento/colar" element={<RotaComChave ligada={MOSTRAR_ADICIONAR_MOVIMENTACOES}><AdicionarFaturamentoColar /></RotaComChave>} />
          {/* Endereco desconhecido: no piloto volta para o /dashboard em vez
              da tela "Em construcao" (MOSTRAR_INACABADOS). */}
          <Route path="*" element={<RotaComChave ligada={MOSTRAR_INACABADOS}><EmConstrucao /></RotaComChave>} />
        </Routes>
      </TransicaoTela>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          },
        }}
      />
    </BrowserRouter>
  );
}