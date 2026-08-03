import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { toast } from "sonner";

const KEY = "tacerto_extratos_pendentes";
const LIMITE = 30;

function ler() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function salvar(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}

function iconePara(tipo) {
  if (!tipo) return FileText;
  if (tipo.startsWith("image/")) return ImageIcon;
  if (tipo === "application/pdf") return FileText;
  return FileSpreadsheet;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdicionarFaturamentoEnviar() {
  const navigate = useNavigate();
  const [arquivos, setArquivos] = useState(ler);
  const [processado, setProcessado] = useState(false);
  const fileRef = useRef(null);
  const camRef = useRef(null);

  useEffect(() => {
    salvar(arquivos);
  }, [arquivos]);

  const desabilitado = arquivos.length >= LIMITE;

  async function handleFiles(list) {
    if (!list || list.length === 0) return;
    if (arquivos.length >= LIMITE) {
      toast("Limite atingido", { duration: 3000 });
      return;
    }
    const restante = LIMITE - arquivos.length;
    const selecionados = Array.from(list).slice(0, restante);
    const novos = [];
    for (const f of selecionados) {
      try {
        const base64 = await toBase64(f);
        novos.push({
          id:
            (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
            "id-" + Math.random().toString(36).slice(2),
          nome: f.name,
          tipo: f.type || "",
          base64,
          criadoEm: new Date().toISOString(),
        });
      } catch {}
    }
    setArquivos((s) => [...s, ...novos]);
    if (arquivos.length + selecionados.length >= LIMITE) {
      toast("Limite atingido", { duration: 3000 });
    }
  }

  function removerArquivo(id) {
    setArquivos((s) => s.filter((a) => a.id !== id));
  }

  function processar() {
    setProcessado(true);
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1
          className="text-lg font-bold flex-1 text-center pr-10"
          style={{ color: "var(--text)" }}
        >
          Enviar extrato
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <p
          className="text-sm leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Envie PDFs, fotos (JPG, PNG, HEIC) ou arquivos OFX/CSV. Nossa IA lê
          e soma automaticamente as entradas do seu extrato bancário.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => !desabilitado && fileRef.current?.click()}
            disabled={desabilitado}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl disabled:opacity-40"
            style={{
              backgroundColor: "var(--field)",
              border: "1px solid var(--border)",
            }}
          >
            <Upload size={22} style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Enviar arquivo
            </span>
          </button>
          <button
            onClick={() => !desabilitado && camRef.current?.click()}
            disabled={desabilitado}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl disabled:opacity-40"
            style={{
              backgroundColor: "var(--field)",
              border: "1px solid var(--border)",
            }}
          >
            <Camera size={22} style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Tirar foto
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="application/pdf,image/*,.ofx,.csv"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>

        {arquivos.length > 0 && (
          <div className="mt-6 space-y-2">
            {arquivos.map((a) => {
              const Icone = iconePara(a.tipo);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: "var(--field)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Icone
                    size={20}
                    style={{ color: "var(--primary)" }}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {a.nome}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Aguardando processamento
                    </p>
                  </div>
                  <button
                    onClick={() => removerArquivo(a.id)}
                    aria-label="Remover"
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--surface)" }}
                  >
                    <X size={14} style={{ color: "var(--text)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-5 z-10"
        style={{
          backgroundColor: "var(--bg)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
        }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={processar}
            disabled={arquivos.length === 0}
            className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Processar arquivos
          </button>
        </div>
      </div>

      {processado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              IA em breve
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Nossa IA está sendo integrada. Em breve você poderá processar seus
              extratos automaticamente. Seus arquivos ficaram salvos e serão
              processados quando a IA estiver disponível.
            </p>
            <button
              onClick={() => {
                setProcessado(false);
                navigate("/adicionar-faturamento");
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}






