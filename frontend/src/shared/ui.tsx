import type { ReactNode } from "react";
import { contentStatusText, credentialStatusText } from "./statusMachine";
import type { ContentStatus, CredentialStatus } from "./types";

type PageHeaderBaseProps = {
  title: string;
  description: string;
};

type PageHeaderProps = PageHeaderBaseProps & (
  | {
      actionText: string;
      onAction: () => void;
      actionDisabled?: boolean;
      actionTitle?: string;
    }
  | {
      actionText?: undefined;
      onAction?: undefined;
      actionDisabled?: undefined;
      actionTitle?: undefined;
    }
);

export function PageHeader(props: PageHeaderProps) {
  const actionButton = props.actionText ? (
    <button className="primary-button" type="button" onClick={props.onAction} disabled={props.actionDisabled} title={props.actionTitle}>
      {props.actionText}
    </button>
  ) : null;

  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">bee-geo</p>
        <h1>{props.title}</h1>
        <p>{props.description}</p>
      </div>
      {actionButton}
    </div>
  );
}

export function MetricCard(props: { label: string; value: string; hint: string }) {
  return (
    <article className="metric-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <em>{props.hint}</em>
    </article>
  );
}

export function StatusBadge(props: { status: ContentStatus | CredentialStatus | string }) {
  const text =
    props.status in contentStatusText
      ? contentStatusText[props.status as ContentStatus]
      : props.status in credentialStatusText
        ? credentialStatusText[props.status as CredentialStatus]
        : props.status;

  return <span className={`status-badge status-${props.status}`}>{text}</span>;
}

export function Panel(props: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{props.title}</h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

export function EmptyState(props: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{props.title}</strong>
      <span>{props.description}</span>
    </div>
  );
}

export function Toolbar(props: { children: ReactNode }) {
  return <div className="toolbar">{props.children}</div>;
}

export function Modal(props: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer: ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={props.title}>
        <header className="modal-header">
          <h2>{props.title}</h2>
          <button className="icon-close" type="button" onClick={props.onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="modal-body">{props.children}</div>
        <footer className="modal-footer">{props.footer}</footer>
      </section>
    </div>
  );
}

export function ConfirmDialog(props: {
  title: string;
  description: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={props.title}
      onClose={props.onCancel}
      footer={
        <>
          <button className="ghost-button" type="button" onClick={props.onCancel}>取消</button>
          <button className="danger-button" type="button" onClick={props.onConfirm}>
            {props.confirmText ?? "确认删除"}
          </button>
        </>
      }
    >
      <p className="confirm-text">{props.description}</p>
    </Modal>
  );
}
