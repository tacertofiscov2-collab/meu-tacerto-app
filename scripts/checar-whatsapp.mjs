/* CHECAR-WHATSAPP v1 — impede links de saída para WhatsApp em src */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = fileURLToPath(new URL("../src/", import.meta.url));
const encontrados = [];
async function conferir(pasta) {
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    const arquivo = path.join(pasta, item.name);
    if (item.isDirectory()) await conferir(arquivo);
    else if (/\.(jsx?|tsx?|css|html|json|mjs)$/i.test(item.name)) {
      const linhas = (await readFile(arquivo, "utf8")).split(/\r?\n/);
      linhas.forEach((linha, i) => {
        if (/wa\.me|api\.whatsapp\.com/i.test(linha)) {
          encontrados.push(`${path.relative(raiz, arquivo)}:${i + 1}`);
        }
      });
    }
  }
}
await conferir(raiz);
if (encontrados.length) {
  console.error("Links de WhatsApp proibidos em src:\n" + encontrados.join("\n"));
  process.exitCode = 1;
} else console.log("OK: nenhum link de saída para WhatsApp em src.");
