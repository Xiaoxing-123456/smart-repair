export const ticketTable = `
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  area TEXT NOT NULL CHECK (area IN ('A区', 'B区', 'C区')),
  deviceType TEXT NOT NULL CHECK (deviceType IN ('电脑', '打印机', '投影仪')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 5 AND 1000),
  status TEXT NOT NULL CHECK (status IN ('待处理', '处理中', '已完成')),
  suggestions TEXT NOT NULL,
  suggestionSource TEXT NOT NULL CHECK (suggestionSource IN ('deepseek', 'guide')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)`;

export const newestTickets = "SELECT * FROM tickets ORDER BY createdAt DESC, id DESC";
export const ticketById = "SELECT * FROM tickets WHERE id = ?";
export const addTicket = `
  INSERT INTO tickets
    (id, name, area, deviceType, description, status, suggestions, suggestionSource, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
export const updateTicket = "UPDATE tickets SET status = ?, updatedAt = ? WHERE id = ? RETURNING *";

export function ticketValues(ticket) {
  return [
    ticket.id, ticket.name, ticket.area, ticket.deviceType, ticket.description, ticket.status,
    JSON.stringify(ticket.suggestions), ticket.suggestionSource, ticket.createdAt, ticket.updatedAt,
  ];
}

export function decodeTicket(row) {
  return row ? { ...row, suggestions: JSON.parse(row.suggestions) } : null;
}
