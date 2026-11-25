import { Chrome, PageIntro } from "../../components/chrome";
import { TicketList } from "../../components/ticket-list";

export const metadata = { title: "工单列表" };

export default function TicketsPage() {
  return (
    <Chrome active="tickets">
      <PageIntro title="工单列表">查看已提交的报修记录与当前处理状态。</PageIntro>
      <TicketList />
    </Chrome>
  );
}
