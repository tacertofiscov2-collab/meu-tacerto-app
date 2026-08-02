import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SwipeBack from "./components/SwipeBack.jsx";
import TransicaoTela from "./components/TransicaoTela.jsx";
import AbasDeslizantes from "./components/AbasDeslizantes.jsx";
import TelaComVoltarReal from "./components/TelaComVoltarReal.jsx";
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

          {/* Início e Perfil vivem juntos numa pilha deslizável.
              Ver src/components/AbasDeslizantes.jsx */}
          <Route path="/dashboard" element={<AbasDeslizantes />} />
          <Route path="/perfil" element={<AbasDeslizantes />} />

          {/* ===================================================
              Telas com deslize que revela a tela de ORIGEM real.
              A origem vem do state do navigate:
                navigate("/rota", { state: { de: "dashboard" } })
              Sem state, cai no `padrao` da rota.
              Ver src/components/TelaComVoltarReal.jsx
              =================================================== */}
          <Route
            path="/editar-perfil"
            element={<TelaComVoltarReal><EditarPerfil /></TelaComVoltarReal>}
          />
          <Route
            path="/preferencias"
            element={<TelaComVoltarReal><Preferencias /></TelaComVoltarReal>}
          />
          <Route
            path="/contas"
            element={<TelaComVoltarReal><Contas /></TelaComVoltarReal>}
          />
          <Route
            path="/alterar-senha"
            element={<TelaComVoltarReal><AlterarSenha /></TelaComVoltarReal>}
          />
          <Route
            path="/faq"
            element={<TelaComVoltarReal><Faq /></TelaComVoltarReal>}
          />
          <Route
            path="/sobre"
            element={<TelaComVoltarReal><Sobre /></TelaComVoltarReal>}
          />
          <Route
            path="/termos"
            element={<TelaComVoltarReal><Termos /></TelaComVoltarReal>}
          />
          <Route
            path="/excluir-conta"
            element={<TelaComVoltarReal><ExcluirConta /></TelaComVoltarReal>}
          />
          <Route
            path="/perfil/informacoes-fiscais"
            element={<TelaComVoltarReal><InformacoesFiscais /></TelaComVoltarReal>}
          />
          {/* Abertas dos dois lados: o padrão é o Dashboard, mas o
              Perfil manda `state: { de: "perfil" }` quando abre. */}
          <Route
            path="/historico"
            element={<TelaComVoltarReal padrao="dashboard"><Historico /></TelaComVoltarReal>}
          />
          <Route
            path="/perfil/resumo"
            element={<TelaComVoltarReal padrao="dashboard"><ResumoPerfil /></TelaComVoltarReal>}
          />
          <Route
            path="/alertas"
            element={<TelaComVoltarReal padrao="dashboard"><Alertas /></TelaComVoltarReal>}
          />
          <Route
            path="/regra-vinte"
            element={<TelaComVoltarReal padrao="dashboard"><RegraVinte /></TelaComVoltarReal>}
          />

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
