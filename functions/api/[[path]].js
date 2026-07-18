/**
 * Flor de Lis — Pages Function (proxy del panel hacia la API)
 * -----------------------------------------------------------
 * Archivo: functions/api/[[path]].js  (en el repo del PANEL admin)
 *
 * Reenvía cualquier llamada a /api/* del panel hacia el Worker,
 * pasándole el "pase" de Cloudflare Access (Cf-Access-Jwt-Assertion)
 * que Access inyecta al entrar. Así todo ocurre en el mismo dominio
 * (sin CORS) y el Worker reconoce tu identidad.
 */
const WORKER = "https://flor-de-lis-api.shweb-mty.workers.dev";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Reconstruye la URL destino en el Worker, conservando ruta y query.
  const target = WORKER + url.pathname + url.search;

  // Encabezados mínimos: tipo de contenido + el pase de Access.
  const headers = new Headers();
  const ct = request.headers.get("Content-Type");
  if (ct) headers.set("Content-Type", ct);
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) headers.set("Cf-Access-Jwt-Assertion", jwt);

  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
  };

  const resp = await fetch(target, init);

  // Devuelve la respuesta del Worker tal cual al navegador.
  const out = new Response(resp.body, { status: resp.status });
  out.headers.set("Content-Type", resp.headers.get("Content-Type") || "application/json; charset=utf-8");
  return out;
}
