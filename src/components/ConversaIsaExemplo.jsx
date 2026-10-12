/* CONVERSAISAEXEMPLO v1 — conversa de exemplo com a Isa no WhatsApp (tema claro do WhatsApp), desenhada no tamanho do app (390 de largura) para o celular de exemplo do tutorial e da Apresentação da Isa: audio, entrada, gasto, nota fiscal, boleto do DAS e duvida — tudo pelo WhatsApp */
import { ArrowLeft, CheckCheck, FileText, Mic, Play, Plus, Smile } from "lucide-react";
import { FOTO_ISA_256 } from "./FotoIsa.jsx";

/* ===================================================================
   TUDO PELO WHATSAPP (12/10/2026 — pedido do Fernando: "no tutorial
   tem que falar que a pessoa pode fazer tudo somente no chat do WhatsApp
   com a Isa: emissao de nota, tirar duvidas, lancamento de entradas e
   gastos, boleto do DAS... temos que dar forca ao chat do WhatsApp")

   Mesmas cores do WhatsApp claro do slide "Tudo pelo WhatsApp" das
   boas-vindas (src/pages/Welcome.jsx, WA), com letras do tamanho do
   app. Sem nome e sem valores ("R$ •••"), como nos outros exemplos.
   Regras: a Isa e "assistente virtual" (nunca pessoa nem contadora); o
   DAS nunca "em aberto"; a entrada so soma porque a pessoa disse que
   recebeu do frete.
   =================================================================== */
const WA = {
  fundo: "#efeae2", topo: "#f0f2f5", recebida: "#ffffff", enviada: "#d9fdd3",
  hora: "#667781", texto: "#111b21", acao: "#00a884", linha: "#e9edef",
  sombra: "0 1px 0.5px rgba(11,20,26,0.13)",
};

function Balao({ enviada = false, hora, children }) {
  return (
    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
      <div
        className="rounded-xl"
        style={{
          maxWidth: "82%",
          backgroundColor: enviada ? WA.enviada : WA.recebida,
          color: WA.texto,
          fontSize: 15,
          lineHeight: 1.35,
          padding: "7px 10px 5px",
          boxShadow: WA.sombra,
        }}
      >
        {children}
        <span className="flex items-center justify-end" style={{ gap: 3, color: WA.hora, fontSize: 11, marginTop: 2 }}>
          {hora} {enviada && <CheckCheck size={14} style={{ color: "#53bdeb" }} />}
        </span>
      </div>
    </div>
  );
}

/* Arquivo anexado dentro do balao (nota fiscal, boleto) */
function Anexo({ nome }) {
  return (
    <span
      className="flex items-center rounded-lg"
      style={{ gap: 8, marginTop: 6, padding: "8px 10px", backgroundColor: "#f5f6f6", border: `1px solid ${WA.linha}` }}
    >
      <FileText size={20} strokeWidth={1.9} style={{ color: "#e25b4f" }} className="shrink-0" />
      <span className="font-medium truncate" style={{ fontSize: 14 }}>{nome}</span>
    </span>
  );
}

/* Audio da pessoa (o microfone do chat do app abre esta conversa) */
function BalaoAudio({ hora }) {
  const barras = [6, 12, 9, 16, 11, 18, 8, 14, 10, 17, 7, 13, 9, 15, 6, 11, 8];
  return (
    <Balao enviada hora={hora}>
      <span className="flex items-center" style={{ gap: 8, minWidth: 190 }}>
        <Play size={20} fill={WA.hora} style={{ color: WA.hora }} className="shrink-0" />
        <span className="flex items-center flex-1" style={{ gap: 2.5, height: 20 }}>
          {barras.map((h, i) => (
            <span key={i} className="rounded-full" style={{ width: 3, height: h, backgroundColor: i < 6 ? WA.acao : "#a8b3b9" }} />
          ))}
        </span>
        <span style={{ fontSize: 12, color: WA.hora }}>0:08</span>
      </span>
    </Balao>
  );
}

export default function ConversaIsaExemplo() {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: WA.fundo }}>
      {/* topo da conversa */}
      <div
        className="flex items-center shrink-0"
        style={{ gap: 10, backgroundColor: WA.topo, padding: "18px 14px 12px", borderBottom: `1px solid ${WA.linha}` }}
      >
        <ArrowLeft size={22} style={{ color: WA.texto }} />
        <span className="rounded-full overflow-hidden shrink-0" style={{ width: 40, height: 40 }}>
          <img src={FOTO_ISA_256} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </span>
        <span className="flex flex-col">
          <span className="font-semibold" style={{ color: WA.texto, fontSize: 17 }}>Isa · TaCerto!</span>
          <span style={{ color: WA.hora, fontSize: 13 }}>assistente virtual</span>
        </span>
      </div>

      {/* conversa: entrada (audio), gasto, nota, DAS e duvida */}
      <div className="flex-1 min-h-0 flex flex-col justify-end overflow-hidden" style={{ gap: 7, padding: "12px 12px" }}>
        <BalaoAudio hora="08:10" />
        <Balao hora="08:10">Pronto! Somei o frete de R$ ••• no seu velocímetro.</Balao>
        <Balao enviada hora="08:12">Gastei R$ ••• de diesel</Balao>
        <Balao hora="08:12">Anotei nos seus gastos.</Balao>
        <Balao enviada hora="08:15">Emite a nota desse frete?</Balao>
        <Balao hora="08:16">
          Nota emitida! Está aqui:
          <Anexo nome="Nota fiscal.pdf" />
        </Balao>
        <Balao hora="08:16">
          Seu DAS vence dia 20. O boleto:
          <Anexo nome="Boleto do DAS.pdf" />
        </Balao>
        <Balao enviada hora="08:17">Quanto ainda posso faturar?</Balao>
        <Balao hora="08:17">Ainda cabem R$ ••• no seu limite do ano.</Balao>
      </div>

      {/* barra de digitar, no pe */}
      <div
        className="flex items-center shrink-0"
        style={{ gap: 8, padding: "8px 10px 22px", backgroundColor: WA.topo, borderTop: `1px solid ${WA.linha}` }}
      >
        <span className="flex-1 rounded-full flex items-center" style={{ gap: 10, backgroundColor: "#ffffff", height: 44, padding: "0 14px" }}>
          <Smile size={22} style={{ color: WA.hora }} />
          <span className="flex-1" style={{ color: WA.hora, fontSize: 16 }}>Mensagem</span>
          <Plus size={22} style={{ color: WA.hora }} />
        </span>
        <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 44, height: 44, backgroundColor: WA.acao }}>
          <Mic size={21} style={{ color: "#ffffff" }} />
        </span>
      </div>
    </div>
  );
}
