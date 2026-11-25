import "./globals.css";

export const metadata = {
  title: {
    default: "智能报修小助手",
    template: "%s · 智能报修小助手",
  },
  description: "提交办公设备报修、查看自助排查建议与跟踪工单进度。",
};

export default function RootLayout({ children }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
