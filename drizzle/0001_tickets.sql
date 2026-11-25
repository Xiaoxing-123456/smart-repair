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
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS repair_tickets_by_date ON tickets(createdAt DESC, id DESC);
