import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import EsqueciSenha from "./pages/EsqueciSenha.jsx";
import CadastroObrigatorio from "./pages/CadastroObrigatorio.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/cadastro-obrigatorio" element={<CadastroObrigatorio />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
