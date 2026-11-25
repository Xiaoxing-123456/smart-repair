import { readIssue, readStatus, readTicket, RequestError } from "./domain.mjs";
import { getSuggestions } from "./suggestions.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request) {
  const body = await request.text();
  if (body.length > 10000) throw new RequestError(413, "请求内容过长。");
  try {
    return JSON.parse(body);
  } catch {
    throw new RequestError(400, "请求内容须为 JSON。");
  }
}

export async function handleApi(request, openStore, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const method = request.method;

  try {
    if (method !== "GET" && request.headers.has("origin") && request.headers.get("origin") !== url.origin) {
      throw new RequestError(403, "请从本网站提交请求。");
    }
    if (path === "/api/suggest" && method === "POST") {
      const issue = readIssue(await readBody(request));
      return json(await getSuggestions(issue, env));
    }
    if (path === "/api/tickets" && method === "GET") {
      const store = await openStore();
      return json({ tickets: await store.list() });
    }
    if (path === "/api/tickets" && method === "POST") {
      const input = readTicket(await readBody(request));
      const store = await openStore();
      const result = await getSuggestions(input, env);
      const now = new Date().toISOString();
      const ticket = {
        id: crypto.randomUUID(),
        ...input,
        status: "待处理",
        suggestions: result.suggestions,
        suggestionSource: result.source,
        createdAt: now,
        updatedAt: now,
      };
      await store.create(ticket);
      return json({ ticket }, 201);
    }
    const id = path.startsWith("/api/tickets/") ? path.slice(13) : "";
    if (uuid.test(id) && (method === "GET" || method === "PATCH")) {
      const store = await openStore();
      const ticket = method === "GET"
        ? await store.get(id)
        : await store.update(id, readStatus(await readBody(request)), new Date().toISOString());
      if (!ticket) throw new RequestError(404, "找不到这张工单。");
      return json({ ticket });
    }
    return json({ error: "接口不存在。" }, 404);
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);

    console.error("[repair.api]", method, path, error.message);
    return json({ error: "暂时无法处理请求，请稍后重试。" }, 500);
  }
}
