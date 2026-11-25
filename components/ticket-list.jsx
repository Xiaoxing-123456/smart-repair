"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Plus, Search } from "lucide-react";
import { statuses, ticketNumber } from "../lib/domain.mjs";
import { api } from "./api-client.mjs";
import { DeviceIcon, StatusBadge, TicketDate } from "./ticket-ui";

const filters = ["全部", ...statuses];

export function TicketList() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部");

  useEffect(() => {
    const request = new AbortController();
    api("/api/tickets/", { signal: request.signal })
      .then(data => setTickets(data.tickets))
      .catch(failure => { if (!request.signal.aborted) setError(failure.message); });
    return () => request.abort();
  }, [attempt]);

  const counts = useMemo(() => tickets?.reduce((result, ticket) => {
    result[ticket.status] += 1;
    return result;
  }, { 待处理: 0, 处理中: 0, 已完成: 0 }), [tickets]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tickets?.filter(ticket =>
      (status === "全部" || status === ticket.status) &&
      [ticketNumber(ticket.id), ticket.name, ticket.area, ticket.deviceType, ticket.description]
        .some(value => value.toLowerCase().includes(term)),
    );
  }, [query, status, tickets]);

  function retry() {
    setError("");
    setAttempt(value => value + 1);
  }

  return (
    <section className="card ticket-list" aria-label="报修记录">
      <div className="list-controls">
        <div className="filters" role="group" aria-label="按工单状态筛选">
          {filters.map(filter => <button type="button" key={filter} aria-pressed={status === filter}
            onClick={() => setStatus(filter)}>{filter}{counts && <span>{filter === "全部" ? tickets.length : counts[filter]}</span>}</button>)}
        </div>
        <Link className="button button-primary" href="/"><Plus size={18} />新建报修</Link>
      </div>
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input type="search" placeholder="搜索工单号、姓名或设备" aria-label="搜索工单" value={query}
          onChange={event => setQuery(event.target.value)} />
      </label>
      {error ? (
        <div className="list-empty"><p role="alert">{error}</p><button className="button button-outline" onClick={retry}>重新加载</button></div>
      ) : !visible ? (
        <div className="list-empty"><p role="status">正在加载工单…</p></div>
      ) : visible.length === 0 ? (
        <div className="list-empty">
          <span className="heading-icon"><ClipboardList size={23} /></span>
          <h2>{tickets.length ? "没有匹配的工单" : "还没有报修工单"}</h2>
          <p>{tickets.length ? "可更换关键词或状态再查找。" : "提交报修后，可以在这里查看处理进度。"}</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">工单 / 设备</th><th scope="col">提交人</th><th scope="col">办公区</th><th scope="col">状态</th><th scope="col">提交时间</th><th scope="col"><span className="sr-only">详情</span></th></tr></thead>
            <tbody>
              {visible.map(ticket => (
                <tr key={ticket.id}>
                  <th scope="row">
                    <Link className="table-ticket" href={`/tickets/detail/?id=${ticket.id}`}>
                      <span className="table-icon"><DeviceIcon type={ticket.deviceType} size={19} /></span>
                      <span><strong>{ticket.deviceType}</strong><small>{ticketNumber(ticket.id)}</small></span>
                    </Link>
                  </th>
                  <td>{ticket.name}</td>
                  <td>{ticket.area}</td>
                  <td><StatusBadge status={ticket.status} /></td>
                  <td><TicketDate value={ticket.createdAt} /></td>
                  <td><Link className="icon-link" aria-label={`查看 ${ticketNumber(ticket.id)}`} href={`/tickets/detail/?id=${ticket.id}`}><ChevronRight size={18} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
