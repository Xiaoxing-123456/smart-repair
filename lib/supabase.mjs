export function createSupabaseStore(url, key, request = fetch) {
  const endpoint = new URL("/rest/v1/tickets", url);
  const headers = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;

  async function query(method, parameters, data) {
    const target = new URL(endpoint);
    target.search = new URLSearchParams(parameters);
    const result = await request(target, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) throw new Error(`Supabase tickets ${method}: HTTP ${result.status}`);
    return result.json();
  }

  const byId = id => ({ id: `eq.${id}` });

  return {
    list: () => query("GET", { order: "createdAt.desc,id.desc" }),
    async get(id) { return (await query("GET", byId(id)))[0] ?? null; },
    async create(ticket) { await query("POST", {}, ticket); },
    async update(id, status, updatedAt) {
      return (await query("PATCH", byId(id), { status, updatedAt }))[0] ?? null;
    },
  };
}
