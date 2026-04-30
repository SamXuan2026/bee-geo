import { MetricCard, PageHeader, Panel, StatusBadge } from "../../shared/ui";
import { publishTasks } from "../../shared/mockData";
import { getDashboardMetrics, getDashboardTodos } from "./api";
import { useEffect, useState } from "react";
import type { DashboardMetric, DashboardTodo } from "./model";

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
      <div className="metric-grid">
        {metrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
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
