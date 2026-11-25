import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, test } from "node:test";
import { openLocalStore } from "../lib/local-store.mjs";
import { handleApi } from "../lib/service.mjs";
import { getSuggestions } from "../lib/suggestions.mjs";
import { createSupabaseStore } from "../lib/supabase.mjs";

const issue = { deviceType: "打印机", description: "打印机出纸口卡纸，屏幕显示 E03。" };
const input = { ...issue, name: "测试同事", area: "B区" };
const dir = await mkdtemp(join(tmpdir(), "smart-repair-test-"));
const dbFile = join(dir, "tickets.sqlite");
const store = () => openLocalStore({ REPAIR_DB_FILE: dbFile });
// Windows 上 SQLite 句柄在进程退出前可能仍占用文件，清理失败不应视为测试失败。
after(() => rm(dir, { recursive: true, force: true }).catch(() => {}));

function api(path, method = "GET", data, headers) {
  return handleApi(new Request(`https://repair.example/api/${path}/`, {
    method, headers, body: data === undefined ? undefined : JSON.stringify(data),
  }), store, {});
}

test("报修提交、查看列表、进度更新与数据库实际落盘", async () => {
  const created = await api("tickets", "POST", input);
  assert.equal(created.status, 201);
  const { ticket } = await created.json();
  assert.equal(ticket.status, "待处理");
  assert.equal(ticket.suggestionSource, "guide");
  assert.equal(ticket.suggestions.length, 3);

  const listed = await api("tickets");
  assert.deepEqual((await listed.json()).tickets, [ticket]);
  for (const status of ["处理中", "已完成"]) {
    const result = await api(`tickets/${ticket.id}`, "PATCH", { status });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).ticket.status, status);
  }

  const detail = await api(`tickets/${ticket.id}`);
  assert.equal((await detail.json()).ticket.status, "已完成");
  const check = new DatabaseSync(dbFile, { readOnly: true });
  assert.equal(check.prepare("SELECT status FROM tickets WHERE id = ?").get(ticket.id).status, "已完成");
  check.close();
});

test("校验非法区域、状态、跨站写入和缺失工单", async () => {
  assert.equal((await api("tickets", "POST", { ...input, area: "D区" })).status, 400);
  assert.equal((await api(`tickets/${crypto.randomUUID()}`, "PATCH", { status: "其他" })).status, 400);
  assert.equal((await api("tickets", "POST", input, { Origin: "https://other.example" })).status, 403);
  assert.equal((await api(`tickets/${crypto.randomUUID()}`)).status, 404);
});

test("建议接口返回三条，错误路由返回 404", async () => {
  const output = await api("suggest", "POST", issue);
  assert.equal(output.status, 200);
  assert.equal((await output.json()).suggestions.length, 3);
  const failure = await api("suggestion", "POST", issue);
  assert.equal(failure.status, 404);
  console.log("POST /api/suggestion → 404", await failure.text());
});

test("DeepSeek 请求合同及 401 回退", async () => {
  const env = { DEEPSEEK_API_KEY: "fixture-key" };
  const response = await getSuggestions(input, env, async (url, init) => {
    assert.equal(url, "https://api.deepseek.com/chat/completions");
    assert.equal(init.headers.Authorization, "Bearer fixture-key");
    const body = JSON.parse(init.body);
    assert.equal(body.model, "deepseek-flash");
    assert.equal(body.response_format.type, "json_object");
    assert.deepEqual(JSON.parse(body.messages[1].content), issue);
    return Response.json({ choices: [{ message: {
      content: '{"suggestions":["检查面板","核对进纸方向","查看错误代码"]}',
    } }] });
  });
  assert.equal(response.source, "deepseek");
  assert.equal(response.suggestions.length, 3);

  const rejected = await getSuggestions(issue, env, async () => new Response(null, { status: 401 }));
  assert.equal(rejected.source, "guide");
  assert.equal(rejected.suggestions.length, 3);
});

test("Vercel AI Gateway 优先调用并校验三条建议", async () => {
  const env = { AI_GATEWAY_API_KEY: "gateway-fixture" };
  let called;
  const response = await getSuggestions(input, env, async (url, init) => {
    called = { url, init };
    return Response.json({ choices: [{ message: {
      content: '{"suggestions":["检查打印队列","核对进纸方向","查看错误代码"]}',
    } }] });
  });
  assert.equal(response.source, "deepseek");
  assert.equal(response.suggestions.length, 3);
  assert.equal(called.url, "https://ai-gateway.vercel.sh/v1/chat/completions");
  assert.equal(called.init.headers.Authorization, "Bearer gateway-fixture");
  assert.equal(JSON.parse(called.init.body).model, "deepseek/deepseek-v3.2");
});

test("Supabase 写入和状态变更沿用数据库接口合同", async () => {
  const calls = [];
  const store = createSupabaseStore("https://demo.supabase.co", "sb_secret_fixture", async (url, init) => {
    calls.push({ url, init });
    return Response.json([init.body ? JSON.parse(init.body) : input]);
  });
  const id = crypto.randomUUID();
  await store.create({ ...input, id });
  await store.list();
  const updated = await store.update(id, "已完成", "2026-11-25T04:00:00Z");
  assert.equal(updated.status, "已完成");
  assert.equal(calls[0].url.pathname, "/rest/v1/tickets");
  assert.equal(calls[0].init.headers.apikey, "sb_secret_fixture");
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(calls[1].url.searchParams.get("order"), "createdAt.desc,id.desc");
  assert.equal(calls[2].url.searchParams.get("id"), `eq.${id}`);
});

test("D1 迁移创建工单表和排序索引", async () => {
  const testDb = new DatabaseSync(":memory:");
  testDb.exec(await readFile(new URL("../drizzle/0001_tickets.sql", import.meta.url), "utf8"));
  assert.equal(testDb.prepare("SELECT COUNT(*) AS count FROM tickets").get().count, 0);
  assert.ok(testDb.prepare("SELECT name FROM sqlite_master WHERE name = 'repair_tickets_by_date'").get());
  testDb.close();
});
