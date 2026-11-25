"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ClipboardPenLine, Info, Send, Sparkles } from "lucide-react";
import { areas, devices } from "../lib/domain.mjs";
import { api } from "./api-client.mjs";
import { DeviceIcon, Suggestions } from "./ticket-ui";

export function RepairForm() {
  const router = useRouter();
  const [input, setInput] = useState({ name: "", area: "", deviceType: "", description: "" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function update(field, value) {
    setInput(prev => ({ ...prev, [field]: value }));
    if (field === "deviceType" || field === "description") setResult(null);
    setError("");
  }

  async function send(mode) {
    if (busy) return;
    setError("");
    setBusy(mode);
    try {
      if (mode === "preview") {
        const { deviceType, description } = input;
        setResult(await api("/api/suggest/", { method: "POST", data: { deviceType, description } }));
      } else {
        const { ticket } = await api("/api/tickets/", { method: "POST", data: input });
        router.push(`/tickets/detail/?id=${ticket.id}&submitted=1`);
        return;
      }
    } catch (failure) {
      setError(failure.message);
    }
    setBusy("");
  }

  return (
    <div className="form-grid">
      <section className="card form-card" aria-labelledby="form-heading">
        <div className="card-heading">
          <span className="heading-icon"><ClipboardPenLine size={23} strokeWidth={1.8} /></span>
          <div>
            <h2 id="form-heading">报修信息</h2>
            <p>请提供设备故障的具体情况。</p>
          </div>
        </div>
        <form onSubmit={event => { event.preventDefault(); send("submit"); }}>
          <fieldset disabled={Boolean(busy)}>
            <div className="identity-fields">
              <label className="field">
                <span>姓名 <span aria-hidden="true" className="required">*</span></span>
                <input name="name" autoComplete="name" placeholder="请输入姓名" value={input.name} maxLength={40}
                  required onChange={event => update("name", event.target.value)} />
              </label>
              <label className="field">
                <span>办公区 <span aria-hidden="true" className="required">*</span></span>
                <span className="select-wrap">
                  <select name="area" required value={input.area} onChange={event => update("area", event.target.value)}>
                    <option value="" disabled>请选择办公区</option>
                    {areas.map(area => <option key={area}>{area}</option>)}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </label>
            </div>
            <div className="device-field" role="group" aria-labelledby="device-label">
              <p className="field-label" id="device-label">设备类型 <span aria-hidden="true" className="required">*</span></p>
              <div className="device-options">
                {devices.map(type => (
                  <label className="device-option" key={type}>
                    <input type="radio" name="deviceType" value={type} required checked={input.deviceType === type}
                      onChange={() => update("deviceType", type)} />
                    <span className="device-face"><DeviceIcon type={type} /><span>{type}</span><span className="radio-mark" /></span>
                  </label>
                ))}
              </div>
            </div>
            <label className="field description-field">
              <span>故障描述 <span aria-hidden="true" className="required">*</span></span>
              <span className="textarea-wrap">
                <textarea name="description" placeholder="例如：打印机在出纸口卡纸，屏幕显示 E03。" required
                  minLength={5} maxLength={1000} value={input.description}
                  onChange={event => update("description", event.target.value)} />
                <span className="character-count">{input.description.length} / 1000</span>
              </span>
            </label>
          </fieldset>
          {error && <p className="alert error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button button-outline" type="button" onClick={() => send("preview")}
              disabled={Boolean(busy) || !input.deviceType || input.description.trim().length < 5}>
              <Sparkles size={17} /> {busy === "preview" ? "正在预览…" : "预览排查建议"}
            </button>
            <button className="button button-primary" type="submit" disabled={Boolean(busy)}>
              <Send size={17} /> {busy === "submit" ? "正在提交…" : "提交报修"}
            </button>
          </div>
        </form>
      </section>
      <aside className="side-column" aria-label="排查与说明">
        <Suggestions result={result} busy={busy === "preview"} />
        <section className="card note">
          <Info size={19} aria-hidden="true" />
          <div><h2>报修前请留意</h2><p>尽量写清报错文字和故障发生时间。若设备冒烟或有焦糊味，请立即停止使用。</p></div>
        </section>
      </aside>
    </div>
  );
}
