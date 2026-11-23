// 本地预览服务（仅开发用，部署时不需要）。用法：node tools/serve.mjs [端口]
// ES modules 需要通过 HTTP 访问，不能直接双击 index.html。
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2]) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

export function startServer(listenPort = port) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
      if (!file.startsWith(root + sep) && file !== root) {
        response.writeHead(403).end();
        return;
      }
      const data = await readFile(file);
      response.writeHead(200, { "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream" }).end(data);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  return new Promise((resolveServer) => {
    server.listen(listenPort, "127.0.0.1", () => resolveServer(server));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startServer(port);
  console.log(`Preview: http://127.0.0.1:${port}/`);
}
