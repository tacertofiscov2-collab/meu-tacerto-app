import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gauge, X } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function isoDe(ano, mes, dia) {
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}
function hojeISO() {
  const d = new Date();
  return isoDe(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function diasNoMes(mes, ano) {
  return new Date(ano, mes, 0).getDate();
}
function primeiroDiaSemana(mes, ano) {
  return new Date(ano, mes - 1, 1).getDay();
}

function Cabecalho({ titulo, onFechar }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-1">
      <div className="flex items-center gap-2">
        <Gauge size={20} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
        <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
          {titulo}
        </span>
      </div>
      <button
        onClick={onFechar}
        aria-label="Fechar"
        className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
        style={{ backgroundColor: "var(--field)" }}
      >
        <X size={15} style={{ color: "var(--text-secondary)" }} />
      </button>
    </div>
  );
}

function NavegadorMes({ label, onAnterior, onProximo, podeProximo }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <button
        onClick={onAnterior}
        aria-label="Mês anterior"
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
        style={{ backgroundColor: "var(--field)" }}
      >
        <ChevronLeft size={18} style={{ color: "var(--text)" }} />
      </button>
      <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
        {label}
      </span>
      <button
        onClick={onProximo}
        disabled={!podeProximo}
        aria-label="Próximo mês"
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-30"
        style={{ backgroundColor: "var(--field)" }}
      >
        <ChevronRight size={18} style={{ color: "var(--text)" }} />
      </button>
    </div>
  );
}

/**
 * Calendário do TaCerto! — modo "dia" (data completa) ou "mesAno".
 *
 * Props:
 * - aberto: boolean
 * - modo: "dia" | "mesAno"
 * - valorISO: "aaaa-mm-dd" (modo dia)
 * - mes / ano: números (modo mesAno)
 * - maxHoje: bloqueia datas futuras (padrão true)
 * - onFechar(): fecha sem salvar
 * - onSelecionar(iso) — modo dia
 * - onSelecionarMesAno(mes, ano) — modo mesAno
 */
export default function Calendario({
  aberto,
  modo = "dia",
  valorISO,
  mes,
  ano,
  maxHoje = true,
  onFechar,
  onSelecionar,
  onSelecionarMesAno,
}) {
  const hoje = hojeISO();
  const [ay, am, ad] = (valorISO || hoje).split("-").map(Number);

  const [mesVisivel, setMesVisivel] = useState(am || new Date().getMonth() + 1);
  const [anoVisivel, setAnoVisivel] = useState(ay || new Date().getFullYear());
  const [mesSel, setMesSel] = useState(mes || null);
  const [anoSel, setAnoSel] = useState(ano || new Date().getFullYear());

  useEffect(() => {
    if (!aberto) return;
    if (modo === "dia") {
      const [y, m] = (valorISO || hoje).split("-").map(Number);
      setMesVisivel(m);
      setAnoVisivel(y);
    } else {
      setMesSel(mes || null);
      setAnoSel(ano || new Date().getFullYear());
    }
  }, [aberto, modo, valorISO, mes, ano, hoje]);

  const anosLista = useMemo(() => {
    const atual = new Date().getFullYear();
    const arr = [];
    for (let a = atual; a >= atual - 25; a--) arr.push(a);
    return arr;
  }, []);

  if (!aberto) return null;

  const celulas = [];
  if (modo === "dia") {
    const total = diasNoMes(mesVisivel, anoVisivel);
    const offset = primeiroDiaSemana(mesVisivel, anoVisivel);
    for (let i = 0; i < offset; i++) celulas.push(null);
    for (let d = 1; d <= total; d++) celulas.push(d);
  }

  const [hy, hm, hd] = hoje.split("-").map(Number);
  const podeAvancarMes =
    !maxHoje || anoVisivel < hy || (anoVisivel === hy && mesVisivel < hm);

  function irMes(delta) {
    let m = mesVisivel + delta;
    let a = anoVisivel;
    if (m < 1) {
      m = 12;
      a -= 1;
    }
    if (m > 12) {
      m = 1;
      a += 1;
    }
    setMesVisivel(m);
    setAnoVisivel(a);
  }

  const painelStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={painelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <Cabecalho
          titulo={modo === "dia" ? "Escolha a data" : "Abertura do MEI"}
          onFechar={onFechar}
        />

        {modo === "dia" ? (
          <>
            <NavegadorMes
              label={`${MESES[mesVisivel - 1]} ${anoVisivel}`}
              onAnterior={() => irMes(-1)}
              onProximo={() => irMes(1)}
              podeProximo={podeAvancarMes}
            />

            <div className="grid grid-cols-7 px-4 pb-1">
              {DIAS.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[11px] font-medium py-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-4 pb-3">
              {celulas.map((d, i) => {
                if (d === null) return <div key={`v${i}`} />;
                const iso = isoDe(anoVisivel, mesVisivel, d);
                const selecionado =
                  valorISO && iso === valorISO;
                const ehHoje = iso === hoje;
                const futuro = maxHoje && iso > hoje;

                return (
                  <button
                    key={iso}
                    disabled={futuro}
                    onClick={() => onSelecionar?.(iso)}
                    className="aspect-square rounded-xl flex items-center justify-center text-sm transition active:scale-95 disabled:opacity-25"
                    style={{
                      backgroundColor: selecionado
                        ? "var(--primary)"
                        : "transparent",
                      color: selecionado
                        ? "var(--primary-contrast)"
                        : "var(--text)",
                      fontWeight: selecionado || ehHoje ? 700 : 400,
                      border: ehHoje && !selecionado
                        ? "1.5px solid var(--primary)"
                        : "1.5px solid transparent",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => onSelecionar?.(hoje)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold active:opacity-80"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Hoje
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pt-2 pb-1">
              <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                Mês
              </p>
              <div className="grid grid-cols-4 gap-2">
                {MESES_CURTO.map((m, i) => {
                  const num = i + 1;
                  const ativo = mesSel === num;
                  const bloqueado =
                    maxHoje && anoSel === hy && num > hm;
                  return (
                    <button
                      key={m}
                      disabled={bloqueado}
                      onClick={() => setMesSel(num)}
                      className="py-2.5 rounded-xl text-[13px] transition active:scale-95 disabled:opacity-25"
                      style={{
                        backgroundColor: ativo ? "var(--primary)" : "var(--field)",
                        color: ativo ? "var(--primary-contrast)" : "var(--text)",
                        fontWeight: ativo ? 700 : 400,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 pt-4 pb-2">
              <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                Ano
              </p>
              <div
                className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {anosLista.map((a) => {
                  const ativo = anoSel === a;
                  return (
                    <button
                      key={a}
                      onClick={() => {
                        setAnoSel(a);
                        if (maxHoje && a === hy && mesSel && mesSel > hm) {
                          setMesSel(hm);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl text-[13px] shrink-0 transition active:scale-95"
                      style={{
                        backgroundColor: ativo ? "var(--primary)" : "var(--field)",
                        color: ativo ? "var(--primary-contrast)" : "var(--text)",
                        fontWeight: ativo ? 700 : 400,
                        scrollSnapAlign: "center",
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pt-2 pb-4 flex gap-2">
              <button
                onClick={onFechar}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => mesSel && onSelecionarMesAno?.(mesSel, anoSel)}
                disabled={!mesSel}
                className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Salvar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}