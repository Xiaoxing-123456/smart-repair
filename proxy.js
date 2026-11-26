import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

// 账号来源：
// 1) REPAIR_ACCESS_PASSWORD → 固定用户名 repair 的老口令（保持兼容）
// 2) REPAIR_ACCOUNTS → 额外内部账号，格式 "用户名:密码,用户名2:密码2"
function accounts(env) {
  const list = [];
  if (env.REPAIR_ACCESS_PASSWORD) {
    list.push({ user: "repair", password: env.REPAIR_ACCESS_PASSWORD });
  }
  for (const pair of (env.REPAIR_ACCOUNTS || "").split(",")) {
    const sep = pair.indexOf(":");
    if (sep < 1) continue;
    const user = pair.slice(0, sep).trim();
    const password = pair.slice(sep + 1).trim();
    if (user && password) list.push({ user, password });
  }
  return list;
}

function sameHeader(supplied, expected) {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function expectedHeader({ user, password }) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

export function proxy(request) {
  const list = accounts(process.env);

  // 没有配置任何账号（或显式设置 REPAIR_ACCESS_MODE=open）时，直接放行，公开演示用。
  // 想恢复登录：配置 REPAIR_ACCESS_PASSWORD 或 REPAIR_ACCOUNTS 后重新部署即可。
  if ((process.env.REPAIR_ACCESS_MODE || "").toLowerCase() === "open" || list.length === 0) {
    return NextResponse.next();
  }
  const supplied = request.headers.get("authorization") || "";
  if (supplied && list.some((account) => sameHeader(supplied, expectedHeader(account)))) {
    return NextResponse.next();
  }

  return new Response("请使用内部维修账号登录。", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Smart Repair", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
