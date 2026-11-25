import { handleApi } from "../../lib/service.mjs";
import { openLocalStore } from "../../lib/local-store.mjs";

export default async function repairApi(req, res) {
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const origin = `${proto}://${req.headers.host}`;
  const headers = new Headers();
  if (req.headers.origin) headers.set("Origin", req.headers.origin);
  const request = new Request(new URL(req.url, origin), {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body ?? null),
  });
  const response = await handleApi(request, () => openLocalStore(process.env), process.env);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
}

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };
