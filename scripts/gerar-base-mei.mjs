/* GERAR-BASE-MEI v1 — gera o módulo da apostila sem alterar o Markdown */
import { readFile, writeFile } from "node:fs/promises";

const origem = new URL("../supabase/functions/isa-chat/base-mei.md", import.meta.url);
const destino = new URL("../supabase/functions/isa-chat/base-mei.ts", import.meta.url);
const apostila = await readFile(origem, "utf8");
// Escapa código e preserva inclusive os CR da fonte; nunca interpola a apostila.
const literal = apostila.replace(/\\/g, "\\\\").replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${").replace(/\r/g, "\\r");
await writeFile(destino,
  "/* BASE-MEI v1 — gerado por scripts/gerar-base-mei.mjs; edite somente a apostila */\n" +
  "export const BASE_MEI = `" + literal + "`;\n", "utf8");
console.log("base-mei.ts gerado; base-mei.md preservado.");
