import { Chrome, PageIntro } from "../../../components/chrome";
import { TicketDetail } from "../../../components/ticket-detail";

export const metadata = { title: "工单详情" };

export default function TicketPage() {
  return (
    <Chrome active="tickets">
      <PageIntro parent={{ href: "/tickets/", label: "工单列表" }} title="工单详情">查看报修信息、自助排查建议与处理进度。</PageIntro>
      <TicketDetail />
    </Chrome>
  );
}
