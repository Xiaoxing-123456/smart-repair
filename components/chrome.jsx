import Link from "next/link";
import { ClipboardList, ChevronRight, Wrench, SquarePen } from "lucide-react";

export function Chrome({ active, children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">跳转到内容</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-icon"><Wrench size={21} strokeWidth={2.4} /></span>
            <span>智能报修小助手</span>
          </Link>
          <nav aria-label="主导航">
            <Link href="/" aria-current={active === "form" ? "page" : undefined}>
              <SquarePen size={17} /> <span>提交报修</span>
            </Link>
            <Link href="/tickets/" aria-current={active === "tickets" ? "page" : undefined}>
              <ClipboardList size={17} /> <span>工单列表</span>
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="main-shell">{children}</main>
      <footer className="footer"><span>智能报修小助手</span><span>办公设备支持</span></footer>
    </>
  );
}

export function PageIntro({ parent, title, children }) {
  return (
    <div className="page-intro">
      <div className="breadcrumb">
        {parent?.href ? <Link href={parent.href}>{parent.label}</Link> : <span>{parent?.label || "办公设备支持"}</span>}
        <ChevronRight size={14} aria-hidden="true" />
        <span>{title}</span>
      </div>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
