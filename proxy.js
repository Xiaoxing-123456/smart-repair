import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function proxy(request) {
  const password = process.env.REPAIR_ACCESS_PASSWORD;
  if (!password) {
    return process.env.VERCEL
      ? new Response("请在部署环境配置 REPAIR_ACCESS_PASSWORD。", { status: 503 })
      : NextResponse.next();
  }

  const expected = Buffer.from(`Basic ${Buffer.from(`repair:${password}`).toString("base64")}`);
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) {
    return NextResponse.next();
  }

  return new Response("请使用内部维修账号登录。", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Smart Repair", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
