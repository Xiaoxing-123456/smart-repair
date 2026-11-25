export async function api(path, { method = "GET", data, signal } = {}) {
  const result = await fetch(path, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
    signal,
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload.error || "暂时无法连接服务，请稍后重试。");
  return payload;
}
