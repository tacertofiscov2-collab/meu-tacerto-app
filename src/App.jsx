import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SwipeBack from "./components/SwipeBack.jsx";
import TransicaoTela from "./components/TransicaoTela.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Perfil from "./pages/Perfil.jsx";
import ExcluirConta from "./pages/ExcluirConta.jsx";
import Welcome from "./pages/Welcome.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import EsqueciSenha from "./pages/EsqueciSenha.jsx";
import CadastroObrigatorio from "./pages/CadastroObrigatorio.jsx";
import Sobre from "./pages/Sobre.jsx";
import Termos from "./pages/Termos.jsx";
import Lancar from "./pages/Lancar.jsx";
import LimiteAtingido from "./pages/LimiteAtingido.jsx";
import EmConstrucao from "./pages/EmConstrucao.jsx";
import Historico from "./pages/Historico.jsx";
import Alertas from "./pages/Alertas.jsx";
import Preferencias from "./pages/Preferencias.jsx";
import Faq from "./pages/Faq.jsx";
import Contas from "./pages/Contas.jsx";
import Velocimetro from "./pages/Velocimetro.jsx";
import AlterarSenha from "./pages/AlterarSenha.jsx";
import EditarPerfil from "./pages/EditarPerfil.jsx";
import ResumoPerfil from "./pages/ResumoPerfil.jsx";
import InformacoesFiscais from "./pages/InformacoesFiscais.jsx";
import RegraVinte from "./pages/RegraVinte.jsx";
import DevSimulador from "./pages/DevSimulador.jsx";
import AdicionarFaturamento from "./pages/AdicionarFaturamento.jsx";
import AdicionarFaturamentoDigitar from "./pages/AdicionarFaturamentoDigitar.jsx";
import AdicionarFaturamentoEnviar from "./pages/AdicionarFaturamentoEnviar.jsx";
import AdicionarFaturamentoColar from "./pages/AdicionarFaturamentoColar.jsx";

/* ===================================================================
   NAVEGAÇÃO POR GESTO — DESATIVADA DE PROPÓSITO

   O gesto de "arrastar para voltar" entre telas foi desligado. Não é
   bug esquecido: a decisão está documentada em PENDENCIAS_FUTURAS.md,
   na raiz do projeto. Resumo: dentro do navegador o resultado nunca
   ficou 100% liso, e a solução correta é empacotar com Capacitor
   antes do lançamento, ganhando o gesto nativo do próprio sistema.

   Os componentes AbasDeslizantes.jsx, TelaComVoltarReal.jsx e
   VoltarAnimadoContext.js continuam no projeto, prontos para quando
   for a hora — só não estão mais em uso aqui.

   CONTINUAM ATIVOS (não mexer): os slides do Welcome e o carrossel
   A/B do velocímetro no Dashboard. Esses são deslizes INTERNOS de
   componente, funcionam bem e não dependem de nada disto.
   =================================================================== */

export default function App() {
  return (
    <BrowserRouter>
      <SwipeBack />
      <TransicaoTela>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/cadastro-obrigatorio" element={<CadastroObrigatorio />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />

          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/preferencias" element={<Preferencias />} />
          <Route path="/contas" element={<Contas />} />
          <Route path="/alterar-senha" element={<AlterarSenha />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/excluir-conta" element={<ExcluirConta />} />
          <Route path="/perfil/informacoes-fiscais" element={<InformacoesFiscais />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/perfil/resumo" element={<ResumoPerfil />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/regra-vinte" element={<RegraVinte />} />

          <Route path="/lancar" element={<Lancar />} />
          <Route path="/lancar/limite-atingido" element={<LimiteAtingido />} />
          <Route path="/velocimetro" element={<Velocimetro />} />
          <Route path="/dev/simulador" element={<DevSimulador />} />
          <Route path="/adicionar-faturamento" element={<AdicionarFaturamento />} />
          <Route path="/adicionar-faturamento/digitar" element={<AdicionarFaturamentoDigitar />} />
          <Route path="/adicionar-faturamento/enviar" element={<AdicionarFaturamentoEnviar />} />
          <Route path="/adicionar-faturamento/colar" element={<AdicionarFaturamentoColar />} />
          <Route path="*" element={<EmConstrucao />} />
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