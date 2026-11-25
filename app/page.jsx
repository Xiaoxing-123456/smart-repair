import { Chrome, PageIntro } from "../components/chrome";
import { RepairForm } from "../components/repair-form";

export default function HomePage() {
  return (
    <Chrome active="form">
      <PageIntro title="提交报修">请填写办公区、设备类型和故障描述；设备面板有错误码时一并写上，可获得更准确的排查建议。</PageIntro>
      <RepairForm />
    </Chrome>
  );
}
