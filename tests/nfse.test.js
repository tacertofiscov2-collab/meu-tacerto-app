/* NFSE.TEST v1 — testes da nota própria SEM certificado real e SEM internet:
   monta a nota de MEI, confere nos esquemas oficiais (XSD), assina com um
   certificado de mentira (autoassinado), emite no servidor simulado e gera o PDF.
   Rodar: npm run test:nfse */
import test from "node:test";
import assert from "node:assert/strict";
import forge from "node-forge";
import { SignedXml } from "xml-crypto";
import { buildDps, buildDpsXml, signDpsXml, parsePfx } from "open-nfse";
import { montarParametros, conferirNoXsd, emitirNota } from "../server/nfse/emissao.js";

const perfil = { cnpj: "60.296.558/0001-98", codMunicipio: "3122306" }; // Divinópolis/MG
const nota = {
  valor: 150,
  descricao: "Manutenção de computador",
  cTribNac: "140101",
  tomador: { documento: "529.982.247-25", nome: "Cliente Teste" },
};

function pfxDeMentira() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 864e5);
  const nome = [{ name: "commonName", value: "TESTE TACERTO:60296558000198" }, { name: "countryName", value: "BR" }];
  cert.setSubject(nome);
  cert.setIssuer(nome);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "teste", { algorithm: "3des" });
  return { pfx: Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary"), certPem: forge.pki.certificateToPem(cert) };
}

test("monta a nota de MEI com os dados do TaCerto", () => {
  const p = montarParametros({ perfil, nota });
  assert.equal(p.emitente.cnpj, "60296558000198");
  assert.equal(p.emitente.regime.opSimpNac, "2"); // 2 = MEI
  assert.equal(p.valores.vServ, 150);
  assert.deepEqual(p.tomador.documento, { CPF: "52998224725" });
});

test("recusa dados incompletos com mensagem clara", () => {
  assert.throws(() => montarParametros({ perfil: {}, nota }), /CNPJ/);
  assert.throws(() => montarParametros({ perfil, nota: { ...nota, valor: 0 } }), /Valor/);
  assert.throws(() => montarParametros({ perfil, nota: { ...nota, cTribNac: "1" } }), /cTribNac/);
});

test("o XML passa nos esquemas oficiais do governo (XSD)", async () => {
  const xml = await conferirNoXsd(montarParametros({ perfil, nota }));
  assert.match(xml, /<opSimpNac>2<\/opSimpNac>/);
});

test("assina o XML e a assinatura confere (certificado de mentira)", () => {
  const { pfx, certPem } = pfxDeMentira();
  const dps = buildDps({ ...montarParametros({ perfil, nota }), nDPS: "1", tpAmb: "2" });
  const assinado = signDpsXml(buildDpsXml(dps), parsePfx(pfx, "teste"));
  assert.match(assinado, /<Signature/);
  const assinatura = assinado.match(/<Signature[\s\S]*<\/Signature>/)[0];
  const verificador = new SignedXml({ publicCert: certPem });
  verificador.loadSignature(assinatura);
  assert.equal(verificador.checkSignature(assinado), true);
});

test("emite no servidor simulado e gera o PDF da nota", async () => {
  const r = await emitirNota({ perfil, nota }, { NFSE_AMBIENTE: "simulado" });
  assert.equal(r.ok, true);
  assert.match(r.chaveAcesso, /^\d{50}$/);
  assert.equal(Buffer.from(r.pdfBase64, "base64").subarray(0, 4).toString(), "%PDF");
});

test("sem certificado, os ambientes reais avisam em vez de quebrar", async () => {
  await assert.rejects(
    emitirNota({ perfil, nota }, { NFSE_AMBIENTE: "producao-restrita" }),
    /Certificado A1 não configurado/,
  );
});
