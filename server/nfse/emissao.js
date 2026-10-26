/* NFSE/EMISSAO v1 — nota fiscal própria do TaCerto (NFS-e Nacional) para MEI.
   Roda no servidor (Node), nunca no app. Usa a biblioteca open-nfse (MIT).

   Ambientes (variável NFSE_AMBIENTE):
     "simulado"          (padrão) servidor falso em memória, sem certificado.
     "producao-restrita" ambiente de TESTE do governo: precisa de certificado A1 real.
     "producao"          nota de verdade. Só ligar depois de testar na restrita.

   Certificado (fase de teste, um emissor só):
     NFSE_CERT_PFX_BASE64 e NFSE_CERT_SENHA — o A1 (.pfx) em base64 e a senha.
   Custódia do certificado de CADA usuário fica para a fase 2 (ver
   docs/NOTA-PROPRIA-STATUS.md). */
import {
  NfseClient, Ambiente, OpcaoSimplesNacional, RegimeEspecialTributacao,
  createInMemoryDpsCounter, createInMemoryRetryStore, parsePfx,
  buildDps, buildDpsXml, validateDpsXml, gerarDanfse, ReceitaRejectionError,
} from "open-nfse";
import { NfseClientFake } from "open-nfse/testing";

export const AMBIENTES = {
  simulado: null,
  "producao-restrita": Ambiente.ProducaoRestrita,
  producao: Ambiente.Producao,
};

const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

/** Converte os dados do TaCerto (perfil + nota) para o formato da NFS-e de MEI. */
export function montarParametros({ perfil, nota }) {
  const cnpj = soDigitos(perfil?.cnpj);
  if (cnpj.length !== 14) throw new Error("CNPJ do MEI ausente ou inválido.");
  const codMunicipio = soDigitos(perfil?.codMunicipio);
  if (codMunicipio.length !== 7) throw new Error("Código IBGE do município ausente.");
  const valor = Math.round(Number(nota?.valor) * 100) / 100;
  if (!(valor > 0)) throw new Error("Valor da nota inválido.");
  const cTribNac = soDigitos(nota?.cTribNac);
  if (cTribNac.length !== 6) throw new Error("Código do serviço (cTribNac) inválido.");
  const descricao = String(nota?.descricao ?? "").trim();
  if (!descricao) throw new Error("Descreva o serviço.");

  const docTomador = soDigitos(nota?.tomador?.documento);
  const tomador = docTomador
    ? {
        documento: docTomador.length === 14 ? { CNPJ: docTomador } : { CPF: docTomador },
        nome: String(nota?.tomador?.nome ?? "").trim() || "Consumidor",
        ...(nota?.tomador?.email ? { email: nota.tomador.email } : {}),
      }
    : undefined;

  return {
    emitente: {
      cnpj,
      codMunicipio,
      // MEI: regime fixo. O total de tributos (indTotTrib) a biblioteca preenche sozinha.
      regime: { opSimpNac: OpcaoSimplesNacional.Mei, regEspTrib: RegimeEspecialTributacao.Nenhum },
    },
    serie: "1",
    servico: {
      cTribNac,
      descricao: descricao.slice(0, 2000),
      ...(nota?.codMunicipioPrestacao ? { codMunicipioPrestacao: soDigitos(nota.codMunicipioPrestacao) } : {}),
    },
    valores: { vServ: valor },
    ...(tomador ? { tomador } : {}),
  };
}

/** Confere o XML da nota contra os esquemas oficiais (XSD), sem enviar nada. */
export async function conferirNoXsd(parametros, nDPS = "1") {
  const dps = buildDps({ ...parametros, nDPS, tpAmb: "2" });
  const xml = buildDpsXml(dps);
  await validateDpsXml(xml); // lança XsdValidationError se algo estiver fora do padrão
  return xml;
}

let clienteCache = null;
/** Cria o cliente do ambiente escolhido (simulado por padrão). */
export function criarCliente(env = process.env) {
  const nome = env.NFSE_AMBIENTE || "simulado";
  if (!(nome in AMBIENTES)) throw new Error(`NFSE_AMBIENTE inválido: ${nome}`);
  if (nome === "simulado") {
    clienteCache ??= new NfseClientFake();
    return { cliente: clienteCache, ambiente: nome };
  }
  if (!env.NFSE_CERT_PFX_BASE64 || !env.NFSE_CERT_SENHA) {
    throw new Error("Certificado A1 não configurado (NFSE_CERT_PFX_BASE64 / NFSE_CERT_SENHA).");
  }
  const pfx = Buffer.from(env.NFSE_CERT_PFX_BASE64, "base64");
  parsePfx(pfx, env.NFSE_CERT_SENHA); // falha cedo se senha ou arquivo estiverem errados
  return {
    cliente: new NfseClient({
      ambiente: AMBIENTES[nome],
      certificado: { pfx, password: env.NFSE_CERT_SENHA },
      // TODO fase 2: contador de nDPS e fila de reenvio no Postgres (Supabase).
      dpsCounter: createInMemoryDpsCounter(),
      retryStore: createInMemoryRetryStore(),
    }),
    ambiente: nome,
  };
}

/** Emite a nota e devolve chave, XML e o PDF (DANFSe) em base64. */
export async function emitirNota({ perfil, nota }, env = process.env) {
  const parametros = montarParametros({ perfil, nota });
  await conferirNoXsd(parametros);
  const { cliente, ambiente } = criarCliente(env);
  try {
    const r = await cliente.emitir(parametros);
    if (r.status !== "ok") {
      return { ok: false, motivo: "pendente", mensagem: "O sistema da nota está ocupado. Vamos tentar de novo sozinhos." };
    }
    const emitida = r.nfse;
    const pdf = await gerarDanfse(emitida.nfse, {
      ambiente: AMBIENTES[ambiente] ?? Ambiente.ProducaoRestrita,
      ...(ambiente !== "producao" ? { observacoes: "NOTA DE TESTE — SEM VALOR FISCAL" } : {}),
    });
    return {
      ok: true,
      ambiente,
      chaveAcesso: emitida.chaveAcesso,
      xml: emitida.xmlNfse,
      pdfBase64: pdf.toString("base64"),
    };
  } catch (e) {
    if (e instanceof ReceitaRejectionError) {
      return { ok: false, motivo: "rejeitada", codigo: e.codigo, mensagem: e.descricao };
    }
    throw e;
  }
}
