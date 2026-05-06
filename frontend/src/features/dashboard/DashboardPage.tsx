import { MetricCard, PageHeader, Panel, StatusBadge } from "../../shared/ui";
import { publishTasks } from "../../shared/mockData";
import { getDashboardMetrics, getDashboardTodos } from "./api";
import { useEffect, useState } from "react";
import type { DashboardMetric, DashboardTodo } from "./model";

const environmentItems = [
  { label: "引用温度", value: "25.3", unit: "℃", tone: "teal" },
  { label: "发布湿度", value: "63", unit: "%", tone: "blue" },
  { label: "账号热度", value: "26", unit: "℃", tone: "amber" },
];

const controlItems = [
  { label: "GEO 分析", status: "ON", active: true },
  { label: "AI 创作", status: "ON", active: true },
  { label: "发布排期", status: "OFF", active: false },
  { label: "风险告警", status: "ON", active: true },
];

const alarmItems = [
  { label: "正常", value: 18, className: "normal" },
  { label: "待审核", value: 9, className: "testing" },
  { label: "发布中", value: 6, className: "left" },
  { label: "异常", value: 1, className: "damage" },
];

const trendItems = [
  { day: "04.26", temp: 42, wet: 68, door: 22 },
  { day: "04.27", temp: 54, wet: 48, door: 30 },
  { day: "04.28", temp: 36, wet: 72, door: 26 },
  { day: "04.29", temp: 62, wet: 56, door: 38 },
  { day: "04.30", temp: 49, wet: 80, door: 44 },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [todos, setTodos] = useState<DashboardTodo[]>([]);

  useEffect(() => {
    getDashboardMetrics().then(setMetrics);
    getDashboardTodos().then(setTodos);
  }, []);

  return (
    <div className="page-stack">
      <PageHeader title="总览仪表盘" description="集中查看 GEO 任务、内容产出、发布状态和账号风险。" />
      <section className="monitor-console" aria-label="运营监控台">
        <div className="control-board">
          <div className="monitor-tabs" aria-label="监控分区">
            {["NO.1", "NO.2", "NO.3", "NO.4"].map((item, index) => (
              <span className={index === 1 ? "active" : ""} key={item}>{item}</span>
            ))}
          </div>
          <div className="control-grid">
            {controlItems.map((item) => (
              <div className="control-tile" key={item.label}>
                <span>{item.label}</span>
                <strong className={item.active ? "on" : ""}>{item.status}</strong>
              </div>
            ))}
          </div>
          <div className="climate-grid">
            <div className="climate-row">
              <span>内容温度</span>
              <strong>25<small>℃</small></strong>
              <b>+</b>
              <b>-</b>
            </div>
            <div className="climate-row">
              <span>引用湿度</span>
              <strong>40<small>%</small></strong>
              <b>+</b>
              <b>-</b>
            </div>
          </div>
        </div>
        <div className="environment-board">
          <div className="environment-title">
            <span>ENVIRONMENT</span>
            <strong>ON</strong>
          </div>
          <div className="gauge-card">
            <div className="gauge-ring">
              <span>16℃</span>
              <strong>25.3<small>℃</small></strong>
              <span>32℃</span>
            </div>
          </div>
          <div className="environment-actions">
            {environmentItems.map((item) => (
              <div className={`env-pill ${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}{item.unit}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="metric-grid">
        {metrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="运营趋势">
          <div className="trend-board">
            <div className="line-chart" aria-label="温度与引用趋势">
              <i className="line-one"></i>
              <i className="line-two"></i>
            </div>
            <div className="bar-chart" aria-label="设备状态分布">
              {trendItems.map((item) => (
                <div className="bar-group" key={item.day}>
                  <span className="temp" style={{ height: `${item.temp}%` }}></span>
                  <span className="wet" style={{ height: `${item.wet}%` }}></span>
                  <span className="door" style={{ height: `${item.door}%` }}></span>
                  <em>{item.day}</em>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="告警分布">
          <div className="alarm-board">
            {alarmItems.map((item) => (
              <div className={`alarm-tile ${item.className}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="two-column">
        <Panel title="待处理事项">
          <div className="list-card">
            {todos.map((item) => (
              <div className="list-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.module}</span>
                </div>
                <b>{item.priority}</b>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="发布任务状态">
          <div className="list-card">
            {publishTasks.map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.platform} / {task.account}</span>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
