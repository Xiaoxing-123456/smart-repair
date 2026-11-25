import { AlarmClock, CircleCheck, Clock3, Laptop, Printer, Projector, Sparkles } from "lucide-react";

const deviceIcons = { 电脑: Laptop, 打印机: Printer, 投影仪: Projector };
export function DeviceIcon({ type, size = 23 }) {
  const Icon = deviceIcons[type] || Laptop;
  return <Icon size={size} aria-hidden="true" />;
}

const badges = {
  待处理: { className: "pending", Icon: Clock3 },
  处理中: { className: "working", Icon: AlarmClock },
  已完成: { className: "done", Icon: CircleCheck },
};

export function StatusBadge({ status }) {
  const { className, Icon } = badges[status] || badges.待处理;
  return <span className={`badge ${className}`}><Icon size={14} />{status}</span>;
}

const formatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function TicketDate({ value }) {
  return <time dateTime={value}>{formatter.format(new Date(value))}</time>;
}

export function Suggestions({ result, busy }) {
  return (
    <section className="card advice" aria-labelledby="advice-title" aria-busy={busy}>
      <div className="advice-heading">
        <span className="advice-icon"><Sparkles size={22} strokeWidth={1.9} /></span>
        <div>
          <h2 id="advice-title">自助排查建议</h2>
          <p>{result ? (result.source === "deepseek" ? "由 DeepSeek 生成" : "来自内置排查指南") : "根据设备与故障现象提供"}</p>
        </div>
      </div>
      {result ? (
        <ol className="suggestions">
          {result.suggestions.map((suggestion, index) => <li key={index}><span>{index + 1}</span><p>{suggestion}</p></li>)}
        </ol>
      ) : (
        <div className="advice-empty">
          <div className="advice-illustration" aria-hidden="true">
            <span className="illustration-orbit orbit-one" />
            <span className="illustration-orbit orbit-two" />
            <span className="illustration-sheet">
              <span className="sheet-mark"><Sparkles size={16} strokeWidth={2.3} /></span>
              <i /><i /><i />
            </span>
            <span className="illustration-detail"><Sparkles size={20} strokeWidth={1.7} /></span>
            <span className="illustration-dot" />
          </div>
          <p role="status">{busy ? "正在获取排查建议…" : "填写设备信息和故障描述后，可预览建议。"}</p>
        </div>
      )}
    </section>
  );
}
