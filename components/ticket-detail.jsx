"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ClipboardList, Save } from "lucide-react";
import { statuses, ticketNumber } from "../lib/domain.mjs";
import { api } from "./api-client.mjs";
import { DeviceIcon, StatusBadge, Suggestions, TicketDate } from "./ticket-ui";

export function TicketDetail() {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      setLoadError("缺少工单编号。");
      return;
    }

    const request = new AbortController();
    api(`/api/tickets/${encodeURIComponent(id)}/`, { signal: request.signal })
      .then(data => {
        setTicket(data.ticket);
        setStatus(data.ticket.status);
        if (params.get("submitted") === "1") setNotice("报修已提交，可以在工单列表跟踪处理进度。");
      })
      .catch(failure => { if (!request.signal.aborted) setLoadError(failure.message); });
    return () => request.abort();
  }, [attempt]);

  async function save(event) {
    event.preventDefault();
    if (saving || status === ticket.status) return;
    setSaving(true);
    setNotice("");
    setSaveError("");
    try {
      const data = await api(`/api/tickets/${ticket.id}/`, { method: "PATCH", data: { status } });
      setTicket(data.ticket);
      setStatus(data.ticket.status);
      setNotice("工单状态已更新。");
    } catch (failure) {
      setSaveError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError || !ticket) {
    return (
      <div className="card list-empty">
        {loadError ? <>
          <p role="alert">{loadError}</p>
          <div className="empty-actions">
            <Link className="button button-outline" href="/tickets/">返回工单列表</Link>
            <button className="button button-outline" onClick={() => { setLoadError(""); setAttempt(value => value + 1); }}>重新加载</button>
          </div>
        </> : <p role="status">正在加载工单…</p>}
      </div>
    );
  }

  return (
    <>
      {notice && <p className="alert success" role="status"><CheckCircle2 size={18} />{notice}</p>}
      <div className="form-grid detail-grid">
        <section className="card form-card">
          <div className="card-heading detail-heading">
            <span className="heading-icon"><DeviceIcon type={ticket.deviceType} /></span>
            <div><h2>{ticket.deviceType}报修</h2><p>{ticketNumber(ticket.id)}</p></div>
            <StatusBadge status={ticket.status} />
          </div>
          <dl className="ticket-meta">
            <div><dt>提交人</dt><dd>{ticket.name}</dd></div>
            <div><dt>办公区</dt><dd>{ticket.area}</dd></div>
            <div><dt>提交时间</dt><dd><TicketDate value={ticket.createdAt} /></dd></div>
            <div><dt>最后更新</dt><dd><TicketDate value={ticket.updatedAt} /></dd></div>
          </dl>
          <section className="issue">
            <h3>故障描述</h3>
            <p>{ticket.description}</p>
          </section>
          <form className="status-form" onSubmit={save}>
            <label className="field">
              <span>处理状态</span>
              <span className="select-wrap">
                <select value={status} disabled={saving} onChange={event => setStatus(event.target.value)}>
                  {statuses.map(item => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </span>
            </label>
            <button className="button button-primary" disabled={saving || status === ticket.status}>
              <Save size={17} />{saving ? "正在保存…" : "保存状态"}
            </button>
          </form>
          {saveError && <p className="alert error" role="alert">{saveError}</p>}
        </section>
        <aside className="side-column" aria-label="排查与列表">
          <Suggestions result={{ suggestions: ticket.suggestions, source: ticket.suggestionSource }} />
          <Link className="button button-outline back-button" href="/tickets/"><ClipboardList size={18} />返回工单列表</Link>
        </aside>
      </div>
    </>
  );
}
