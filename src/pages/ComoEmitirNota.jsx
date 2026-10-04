/* COMOEMITIRNOTA v1 — passo a passo para emitir a NFS-e no Emissor Nacional (piloto) */
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { linkWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   CONTEUDO PROVISORIO - CONFERIR PASSOS NO SITE REAL

   COMO EMITIR SUA NOTA (04/10/2026 — extra C do piloto)

   Tutorial simples, aberto pelo botao "Como emitir nota" do Dashboard
   (chave MOSTRAR_TUTORIAL_NOTA em src/config/piloto.js). O app NAO
   emite nota no piloto: a pessoa emite sozinha no Emissor Nacional da
   NFS-e, entrando com a conta gov.br.

   ⚠️ Os nomes dos botoes do site ("Emitir NFS-e", "Download DANFSe")
   foram escritos de memoria: conferir no site real antes do piloto.
   ⚠️ Conferir com o contador o aviso do topo (NFS-e x CT-e para o
   agregado de transportadora).
   =================================================================== */

const LINK_EMISSOR_NACIONAL = "https://www.nfse.gov.br/EmissorNacional";

const PASSOS = [
  {
    titulo: "Entre no Emissor Nacional",
    texto: "Abra o site pelo botão lá embaixo e entre com a sua conta gov.br.",
  },
  {
    titulo: "Comece uma nota nova",
    texto: "No menu, toque em \"Emitir NFS-e\".",
  },
  {
    titulo: "Quem contratou o frete",
    texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ da transportadora. O nome dela aparece sozinho.",
  },
  {
    titulo: "O serviço",
    texto: "Informe a cidade onde o serviço foi feito, escolha o código do serviço de transporte e escreva a descrição. Exemplo: \"Frete de [cidade] para [cidade], dia [data]\".",
  },
  {
    titulo: "O valor",
    texto: "Digite o valor do frete.",
  },
  {
    titulo: "Emita",
    texto: "Confira tudo e toque em \"Emitir NFS-e\".",
  },
  {
    titulo: "Baixe o PDF",
    texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para a transportadora.",
  },
];

export default function ComoEmitirNota() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Aberta direto pelo endereco (sem tela antes): volta para o Dashboard */
  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Filho DIRETO de .tela-rolavel (padrao de rolagem do app) */}
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Como emitir sua nota" onVoltar={voltar} />

        {/* Aviso do topo (texto pedido pelo Fernando) */}
        <div
          className="rounded-2xl flex mt-2"
          style={{
            gap: 10,
            padding: "12px 14px",
            backgroundColor: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.40)",
          }}
        >
          <AlertTriangle size={18} strokeWidth={2.2} className="shrink-0" style={{ color: "#f59e0b", marginTop: 2 }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>
            Agregado de transportadora geralmente emite NFS-e. Se você pega frete direto,
            pode precisar de CT-e —{" "}
            <a
              href={linkWhatsAppFisco("Pego frete direto. Preciso emitir CT-e?")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
              style={{ color: "var(--primary)", textDecoration: "none" }}
            >
              fale com o Fisco no WhatsApp
            </a>
            .
          </p>
        </div>

        <div className="space-y-2 mt-4">
          {PASSOS.map((p, i) => (
            <div
              key={p.titulo}
              className="rounded-2xl px-4 py-3.5 flex"
              style={{ gap: 12, border: "1px solid var(--border)", backgroundColor: "transparent" }}
            >
              <span
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: "rgba(34,197,94,0.14)",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  {p.titulo}
                </p>
                <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                  {p.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={LINK_EMISSOR_NACIONAL}
          target="_blank"
          rel="noopener noreferrer"
          className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-5 active:scale-[0.98] transition"
          style={{
            gap: 8,
            paddingTop: 14,
            paddingBottom: 14,
            fontSize: 16,
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
            textDecoration: "none",
          }}
        >
          Abrir o Emissor Nacional
          <ExternalLink size={17} strokeWidth={2.2} />
        </a>
      </div>
    </div>
  );
}
