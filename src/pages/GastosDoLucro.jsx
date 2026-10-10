/* GASTOSDOLUCRO v1 — "Meu lucro" > Gastos: por categoria (Diesel e Arla, Pedágio...) e, tocando na categoria, cada gasto com o selo "com nota" / "sem nota"; tocar no gasto deixa anexar a nota (foto ou PDF), trocar a categoria ou marcar como pessoal */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Receipt, Camera, Tag, UserRound } from "lucide-react";
import { toast } from "sonner";
import TopoRolavel from "../components/TopoRolavel.jsx";
import FolhaDeBaixo from "../components/FolhaDeBaixo.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import { categoriasSaida, rotuloCategoriaSaida } from "@/lib/categorias";
import { nomeParaDescricao } from "@/lib/openfinance";
import {
  listarSaidasDoAno, resumoDoMes, resumoDoAno, mudarGasto, anexarNotaDoGasto,
} from "@/lib/lucro";

/* ===================================================================
   GASTOS (10/10/2026 — tarefa de 08-10, Etapa 4)

   /meu-lucro/gastos?ver=mes&mes=10          -> categorias do periodo
   /meu-lucro/gastos?ver=mes&mes=10&cat=...  -> os gastos da categoria
   So gasto do NEGOCIO (do_negocio = true; ver src/lib/lucro.js).

   Cada gasto: selo "com nota" (anexou foto/PDF — so esses ajudam no
   Imposto de Renda) ou "sem nota". Tocar abre uma folha com:
     - Anexar nota (foto ou PDF)  -> comprovantes/<id>/gastos/... e
       saidas.com_nota = true
     - Trocar categoria
     - Não é do negócio           -> vira pessoal (sai do lucro e do IR)
   =================================================================== */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function diaMes(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeDoGasto(s) {
  if (s.recebedor_nome) return nomeParaDescricao(s.recebedor_nome);
  const limpa = String(s.descricao || "").replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, " ").replace(/\s+/g, " ").trim();
  return limpa ? nomeParaDescricao(limpa) : "Gasto";
}

export default function GastosDoLucro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tipoMEI } = useAppState();
  const ano = new Date().getFullYear();
  const ver = params.get("ver") === "ano" ? "ano" : "mes";
  const mes = Number(params.get("mes")) || new Date().getMonth() + 1;
  const cat = params.get("cat");

  const [userId, setUserId] = useState(null);
  const [saidas, setSaidas] = useState(null);
  const [escolhido, setEscolhido] = useState(null);
  const [trocando, setTrocando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const arquivoRef = useRef(null);

  async function carregar() {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { setSaidas([]); return; }
      setUserId(data.user.id);
      setSaidas(await listarSaidasDoAno(data.user.id, ano));
    } catch {
      setSaidas([]);
    }
  }
  useEffect(() => { carregar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const r = useMemo(() => {
    const base = { lancamentos: [], saidas: saidas || [], ano, tipoMEI };
    return ver === "ano" ? resumoDoAno(base) : resumoDoMes({ ...base, mes });
  }, [saidas, ver, mes, ano, tipoMEI]);

  const periodo = ver === "ano" ? `em ${ano}` : `em ${MESES[mes - 1]}`;
  const itens = cat ? r.gastosDoNegocio.filter((s) => (s.categoria || "outros") === cat) : [];

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/meu-lucro", { replace: true });
  }

  async function aplicar(patch, aviso) {
    if (!escolhido || !userId) return;
    try {
      await mudarGasto(userId, escolhido.id, patch);
      toast.success(aviso);
      setEscolhido(null);
      setTrocando(false);
      carregar();
    } catch {
      toast.error("Não consegui mudar agora. Tente de novo.");
    }
  }

  async function anexar(arquivo) {
    if (!arquivo || !escolhido || !userId) return;
    setEnviando(true);
    try {
      await anexarNotaDoGasto(userId, escolhido, arquivo);
      toast.success("Nota guardada");
      setEscolhido(null);
      carregar();
    } catch (e) {
      toast.error(e?.message || "Não consegui guardar a nota.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="conteudo-rolavel hide-scrollbar px-5" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
        <TopoRolavel titulo={cat ? rotuloCategoriaSaida(cat, tipoMEI) : "Gastos"} onVoltar={voltar} />
        <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 2 }}>{periodo}</p>

        {saidas && !cat && (
          r.porCategoria.length ? (
            <SecaoLista style={{ marginTop: 12 }}>
              {r.porCategoria.map((c) => (
                <LinhaLista
                  key={c.id}
                  rotulo={c.rotulo}
                  detalhe={c.quantidade === 1 ? "1 gasto" : `${c.quantidade} gastos`}
                  valor={<Valor px={15.5} peso={600}>{c.total}</Valor>}
                  onClick={() => navigate(`/meu-lucro/gastos?ver=${ver}&mes=${mes}&cat=${c.id}`, { state: { de: "lucro" } })}
                />
              ))}
            </SecaoLista>
          ) : (
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 24 }}>Nenhum gasto do negócio {periodo}.</p>
          )
        )}

        {saidas && cat && (
          <SecaoLista style={{ marginTop: 12 }}>
            {itens.map((s) => (
              <LinhaLista
                key={s.id}
                rotulo={nomeDoGasto(s)}
                maxLinhas={2}
                detalhe={<SeloNota comNota={s.com_nota} data={diaMes(s.data)} />}
                valor={<Valor px={15.5} peso={600}>{s.valor}</Valor>}
                onClick={() => { setEscolhido(s); setTrocando(false); }}
              />
            ))}
          </SecaoLista>
        )}
      </div>

      <FolhaDeBaixo aberto={!!escolhido} onFechar={() => !enviando && setEscolhido(null)} titulo={escolhido ? nomeDoGasto(escolhido) : ""}>
        {escolhido && !trocando && (
          <div style={{ paddingBottom: 8 }}>
            <SecaoLista style={{ marginTop: 0 }}>
              <LinhaLista
                Icon={Camera}
                rotulo={escolhido.com_nota ? "Anexar outra nota" : "Anexar nota"}
                detalhe="Foto ou PDF. Ajuda no Imposto de Renda."
                onClick={() => !enviando && arquivoRef.current?.click()}
              />
              <LinhaLista Icon={Tag} rotulo="Trocar categoria" valor={rotuloCategoriaSaida(escolhido.categoria || "outros", tipoMEI)} onClick={() => setTrocando(true)} />
              <LinhaLista Icon={UserRound} rotulo="Não é do negócio" detalhe="Sai do lucro e do Imposto de Renda." onClick={() => aplicar({ doNegocio: false }, "Marcado como pessoal")} />
            </SecaoLista>
            {enviando && <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 14, marginTop: 8 }}>Enviando...</p>}
          </div>
        )}
        {escolhido && trocando && (
          <div style={{ paddingBottom: 8 }}>
            <SecaoLista style={{ marginTop: 0 }}>
              {categoriasSaida(tipoMEI).map((c) => (
                <LinhaLista
                  key={c.id}
                  rotulo={c.rotulo}
                  semSeta
                  valor={(escolhido.categoria || "outros") === c.id ? "Atual" : null}
                  onClick={() => aplicar({ categoria: c.id, doNegocio: true }, "Categoria trocada")}
                />
              ))}
            </SecaoLista>
          </div>
        )}
      </FolhaDeBaixo>

      <input
        ref={arquivoRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          anexar(f);
        }}
      />
    </div>
  );
}

/* "05/03 · com nota" (icone do recibo) ou "05/03 · sem nota" */
function SeloNota({ comNota, data }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 5 }}>
      {data} ·
      {comNota ? (
        <span className="inline-flex items-center" style={{ gap: 3, color: "var(--text-secondary)" }}>
          <Receipt size={13} strokeWidth={2} /> com nota
        </span>
      ) : (
        <span>sem nota</span>
      )}
    </span>
  );
}
