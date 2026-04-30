import { useMemo, useState } from "react";
import { AssetsPage } from "../features/assets/AssetsPage";
import { CreationPage } from "../features/creation/CreationPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { GeoPage } from "../features/geo/GeoPage";
import { IntegrationPage } from "../features/integration/IntegrationPage";
import { KeywordsPage } from "../features/keywords/KeywordsPage";
import { KnowledgePage } from "../features/knowledge/KnowledgePage";
import { PersonaPage } from "../features/persona/PersonaPage";
import { PublishPage } from "../features/publish/PublishPage";
import { UsersPage } from "../features/users/UsersPage";
import type { ModuleKey } from "../shared/types";

interface NavItem {
  key: ModuleKey;
  label: string;
  group: string;
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", group: "总览" },
  { key: "geo", label: "GEO分析", group: "洞察" },
  { key: "creation", label: "AI创作", group: "内容" },
  { key: "publish", label: "发布中心", group: "发布" },
  { key: "keywords", label: "关键词库", group: "资产" },
  { key: "knowledge", label: "知识库", group: "资产" },
  { key: "assets", label: "素材库", group: "资产" },
  { key: "persona", label: "AI人设", group: "内容" },
  { key: "integration", label: "集成设置", group: "系统" },
  { key: "users", label: "用户管理", group: "系统" },
];

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const activeItem = useMemo(
    () => navItems.find((item) => item.key === activeModule) ?? navItems[0],
    [activeModule],
  );

  const renderPage = () => {
    if (activeModule === "dashboard") return <DashboardPage />;
    if (activeModule === "keywords") return <KeywordsPage />;
    if (activeModule === "knowledge") return <KnowledgePage />;
    if (activeModule === "assets") return <AssetsPage />;
    if (activeModule === "geo") return <GeoPage onCreateDraft={() => setActiveModule("creation")} />;
    if (activeModule === "creation") return <CreationPage onOpenPublish={() => setActiveModule("publish")} />;
    if (activeModule === "persona") return <PersonaPage />;
    if (activeModule === "publish") return <PublishPage />;
    if (activeModule === "integration") return <IntegrationPage />;
    return <UsersPage />;
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand-area">
          <span className="brand-mark">b</span>
          <strong>bee-geo</strong>
        </div>
        <nav aria-label="主导航">
          {navItems.slice(0, 4).map((item) => (
            <button
              className={activeModule === item.key ? "active" : ""}
              key={item.key}
              type="button"
              onClick={() => setActiveModule(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="market-pill">
          <span>Market:</span>
          <strong>GEO / AI</strong>
        </div>
        <div className="user-zone">
          <button type="button" aria-label="通知">铃</button>
          <span>林</span>
        </div>
      </header>

      <div className="page-frame">
        <aside className="module-dock" aria-label="模块导航">
          <div className="breadcrumb">Console / {activeItem.group}</div>
          {navItems.map((item) => (
            <button
              className={activeModule === item.key ? "active" : ""}
              key={item.key}
              type="button"
              onClick={() => setActiveModule(item.key)}
            >
              <small>{item.group}</small>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>
        <main className="content-area">
          <section className="portfolio-hero">
            <div>
              <p>Dashboard / {activeItem.label}</p>
              <h1>{activeItem.label}</h1>
            </div>
            <div className="arc-widget" aria-label="GEO 经营指标">
              <div className="arc-line"></div>
              <span className="arc-dot one"></span>
              <span className="arc-dot two"></span>
              <span className="arc-dot three"></span>
              <div className="arc-value">
                <small>内容发布闭环率</small>
                <strong>96.4%</strong>
                <button type="button">View</button>
              </div>
            </div>
          </section>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
