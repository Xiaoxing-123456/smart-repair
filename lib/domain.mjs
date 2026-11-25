export const areas = ["A区", "B区", "C区"];
export const devices = ["电脑", "打印机", "投影仪"];
export const statuses = ["待处理", "处理中", "已完成"];

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readText(value, label, min, max) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length < min || trimmed.length > max) {
    throw new RequestError(400, `${label}须为 ${min}–${max} 个字符。`);
  }
  return trimmed;
}

function readChoice(value, options, label) {
  if (!options.includes(value)) throw new RequestError(400, `请选择有效的${label}。`);
  return value;
}

export function readIssue(data) {
  return {
    deviceType: readChoice(data?.deviceType, devices, "设备类型"),
    description: readText(data?.description, "故障描述", 5, 1000),
  };
}

export function readTicket(data) {
  return {
    name: readText(data?.name, "姓名", 1, 40),
    area: readChoice(data?.area, areas, "办公区"),
    ...readIssue(data),
  };
}

export function readStatus(data) {
  return readChoice(data?.status, statuses, "工单状态");
}

export function ticketNumber(id) {
  return `WX-${id.slice(0, 8).toUpperCase()}`;
}
