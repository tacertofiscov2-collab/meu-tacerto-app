import FerramentaLayout from "../components/FerramentaLayout.jsx";
import { GuiaPagamento } from "../components/ferramentas.jsx";

export default function GuiaDAS() {
  return (
    <FerramentaLayout titulo="Guia de Pagamento do DAS">
      <GuiaPagamento />
    </FerramentaLayout>
  );
}
