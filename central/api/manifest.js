/* MANIFEST v1 — manifesto do PWA com o nome do projeto (cada Central tem o seu). */
import { projeto } from "./_lib.js";

export default function handler(req, res) {
  const p = projeto();
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(
    JSON.stringify({
      name: p.nome,
      short_name: p.nomeCurto,
      id: `/?central=${p.id}`,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0A0A0A",
      theme_color: "#0A0A0A",
      lang: "pt-BR",
      icons: [
        { src: `/icones/${p.id}-192.png`, sizes: "192x192", type: "image/png" },
        { src: `/icones/${p.id}-512.png`, sizes: "512x512", type: "image/png" },
        { src: `/icones/${p.id}-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    })
  );
}
