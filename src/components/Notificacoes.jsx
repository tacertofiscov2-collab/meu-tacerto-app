/* NOTIFICACOES v3 — "Atualize seu velocímetro" diz "Leva poucos minutos" (com o extrato pode levar mais de 1 minuto; resposta 8 do Fernando) (v2: segunda notificacao: "Atualize seu velocimetro" (abre a FolhaAtualizarVelocimetro) (v1: sininho discreto no topo do Inicio + folha "Notificacoes"; a primeira e a Apresentacao do Fisco.ia (tutorial)) */
import { useState } from "react";
import { Bell, PlayCircle, Gauge } from "lucide-react";
import FolhaDeBaixo from "./FolhaDeBaixo.jsx";
import { SecaoLista, LinhaLista } from "./ListaSimples.jsx";
import { useMarcaDaConta } from "@/lib/marcasDaConta";

/* ===================================================================
   NOTIFICACOES (05/10/2026 — pedido do Fernando)

   - Sininho no canto de cima, a direita, do Inicio. Bem discreto: so o
     icone cinza, sem circulo em volta. Notificacao nova = pontinho
     verde no sininho.
   - Tocar abre a folha "Notificacoes" (lista simples, como o Perfil).
     Notificacao nova tem o pontinho verde no fim da linha.
   - A primeira notificacao (desde o primeiro login) e a "Apresentacao
     do Fisco.ia": abre o tutorial (ApresentacaoFisco). Ela continua na
     lista depois de vista, para rever quando quiser.
   - "Lida" = a pessoa tocou nela. Fica guardado por conta e aparelho
     (useMarcaDaConta). Por enquanto a lista e fixa aqui no codigo.
   - v2: "Atualize seu velocimetro" (tambem desde o primeiro login):
     abre a folha com os 2 jeitos faceis (digitar o total do ano no "+"
     ou mandar valores/extrato pro Fisco no WhatsApp).
   =================================================================== */
export const NOTIFICACOES = [
  {
    id: "apresentacao",
    Icon: PlayCircle,
    titulo: "Apresentação do Fisco.ia",
    detalhe: "Veja como o app funciona",
  },
  {
    id: "atualizar",
    Icon: Gauge,
    titulo: "Atualize seu velocímetro",
    detalhe: "Leva poucos minutos",
  },
];

const CHAVE_LIDAS = "tacerto_notificacoes_lidas";

function PontoNovo({ style }) {
  return (
    <span
      aria-label="Nova"
      className="inline-block rounded-full"
      style={{ width: 8, height: 8, backgroundColor: "var(--primary)", ...style }}
    />
  );
}

/* onAbrir(id): chamado ao tocar numa notificacao (o Inicio abre o que for) */
export default function BotaoNotificacoes({ onAbrir }) {
  const [aberto, setAberto] = useState(false);
  const [lidas, salvarLidas, carregou] = useMarcaDaConta(CHAVE_LIDAS, []);
  const listaLidas = Array.isArray(lidas) ? lidas : [];
  const ehNova = (n) => carregou && !listaLidas.includes(n.id);
  const temNova = NOTIFICACOES.some(ehNova);

  function abrirNotificacao(n) {
    if (!listaLidas.includes(n.id)) salvarLidas([...listaLidas, n.id]);
    setAberto(false);
    onAbrir?.(n.id);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={temNova ? "Notificações (nova)" : "Notificações"}
        className="toque relative flex items-center justify-center"
        style={{ width: 38, height: 34, background: "none", border: "none", padding: 0, marginRight: -8 }}
      >
        <Bell size={22} strokeWidth={1.9} style={{ color: "var(--text-secondary)" }} />
        {temNova && (
          <PontoNovo style={{ position: "absolute", top: 5, right: 9, width: 7, height: 7, boxShadow: "0 0 0 1.5px var(--bg)" }} />
        )}
      </button>

      <FolhaDeBaixo aberto={aberto} onFechar={() => setAberto(false)} titulo="Notificações">
        <div style={{ paddingBottom: 8 }}>
          <SecaoLista style={{ marginTop: 0 }}>
            {NOTIFICACOES.map((n) => (
              <LinhaLista
                key={n.id}
                Icon={n.Icon}
                rotulo={n.titulo}
                detalhe={n.detalhe}
                valor={ehNova(n) ? <PontoNovo /> : null}
                onClick={() => abrirNotificacao(n)}
              />
            ))}
          </SecaoLista>
        </div>
      </FolhaDeBaixo>
    </>
  );
}
