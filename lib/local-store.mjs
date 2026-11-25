import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { RequestError } from "./domain.mjs";
import { createSupabaseStore } from "./supabase.mjs";
import {
  addTicket, decodeTicket, newestTickets, ticketById, ticketTable, ticketValues, updateTicket,
} from "./sql-store.mjs";

let database;

export function openLocalStore(env) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return createSupabaseStore(url, key);
  if (url || key || env.VERCEL) {
    console.error("[repair.store] Incomplete Supabase configuration");
    throw new RequestError(503, "工单数据库尚未配置。");
  }

  if (!database) {
    const file = resolve(/* turbopackIgnore: true */ env.REPAIR_DB_FILE || ".repair/tickets.sqlite");
    mkdirSync(dirname(file), { recursive: true });
    database = new DatabaseSync(file);
    database.exec("PRAGMA busy_timeout = 5000");
    database.exec("PRAGMA journal_mode = WAL");
    database.exec(ticketTable);
  }
  return {
    list: () => database.prepare(newestTickets).all().map(decodeTicket),
    get: id => decodeTicket(database.prepare(ticketById).get(id)),
    create: ticket => database.prepare(addTicket).run(...ticketValues(ticket)),
    update: (id, status, updatedAt) => decodeTicket(database.prepare(updateTicket).get(status, updatedAt, id)),
  };
}
