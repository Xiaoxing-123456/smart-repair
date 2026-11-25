import assets from "./assets.generated.mjs";
import { handleApi } from "../lib/service.mjs";
import { createSupabaseStore } from "../lib/supabase.mjs";
import { addTicket, decodeTicket, newestTickets, ticketById, ticketValues, updateTicket } from "../lib/sql-store.mjs";

function openWorkerStore(env) {
  if (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY) {
    return createSupabaseStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  }
  if (!env.DB) throw new Error("Missing D1 database binding");

  return {
    async list() { return (await env.DB.prepare(newestTickets).all()).results.map(decodeTicket); },
    async get(id) { return decodeTicket(await env.DB.prepare(ticketById).bind(id).first()); },
    async create(ticket) { await env.DB.prepare(addTicket).bind(...ticketValues(ticket)).run(); },
    async update(id, status, updatedAt) {
      return decodeTicket(await env.DB.prepare(updateTicket).bind(status, updatedAt, id).first());
    },
  };
}

const media = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  txt: "text/x-component; charset=utf-8",
  json: "application/json",
  ico: "image/x-icon",
  png: "image/png",
  webp: "image/webp",
  woff2: "font/woff2",
};

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) return handleApi(request, () => openWorkerStore(env), env);

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const staticPath = path.endsWith("/") ? path + "index.html" : path;
    if (!assets[staticPath] && assets[path + "/index.html"]) {
      url.pathname += "/";
      return Response.redirect(url, 308);
    }

    const key = assets[staticPath] ? staticPath : "/404.html";
    const status = key === staticPath ? 200 : 404;
    if (!assets[key]) return new Response("页面不存在", { status: 404 });
    const content = request.method === "HEAD" ? null : Uint8Array.from(atob(assets[key]), byte => byte.charCodeAt(0));
    const extension = key.split(".").at(-1);
    return new Response(content, {
      status,
      headers: {
        "Content-Type": media[extension] || "application/octet-stream",
        "Cache-Control": key.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "no-cache",
      },
    });
  },
};
