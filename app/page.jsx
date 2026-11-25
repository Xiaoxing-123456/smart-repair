import { Chrome, PageIntro } from "../components/chrome";
import { RepairForm } from "../components/repair-form";

export default function HomePage() {
  return (
    <Chrome active="form">
      <PageIntro title="提交报修">填写故障信息，获取自助排查建议并跟踪维修进度。</PageIntro>
      <RepairForm />
    </Chrome>
  );
}
