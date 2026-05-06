import { useEffect, useState } from "react";
import { contentWriteRoles, hasAnyRole, permissionTitle } from "../../shared/permissions";
import type { UserRoleCode } from "../../shared/types";
import { ConfirmDialog, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { createPersona, deletePersona, listPersonas, updatePersona } from "./api";
import type { PersonaItem } from "./model";

interface PersonaForm {
  name: string;
  creator: string;
  roleName: string;
  tone: string;
  status: "启用" | "停用";
  promptTemplate: string;
}

const emptyPersonaForm: PersonaForm = {
  name: "",
  creator: "",
  roleName: "",
  tone: "",
  status: "启用",
  promptTemplate: "",
};

export function PersonaPage(props: { currentRole: UserRoleCode }) {
  const [items, setItems] = useState<PersonaItem[]>([]);
  const [form, setForm] = useState<PersonaForm>(emptyPersonaForm);
  const [builderText, setBuilderText] = useState("");
  const [builderResult, setBuilderResult] = useState({
    role: "企业内容增长顾问",
    focus: "选型建议、业务价值、风险提醒",
    tone: "专业克制",
  });
  const [keyword, setKeyword] = useState("");
  const [editingItem, setEditingItem] = useState<PersonaItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PersonaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canWrite = hasAnyRole(props.currentRole, contentWriteRoles);
  const deniedTitle = permissionTitle(contentWriteRoles);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setItems(await listPersonas());
  }

  function openCreate() {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    setError("");
    setNotice("");
    setEditingItem(null);
    setForm({ ...emptyPersonaForm });
  }

  function openEdit(item: PersonaItem) {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    setError("");
    setNotice("");
    setEditingItem(item);
    setForm({
      name: item.name,
      creator: item.creator,
      roleName: item.role,
      tone: item.tone ?? "",
      status: item.status,
      promptTemplate: item.promptTemplate ?? "",
    });
  }

  async function submitForm() {
    if (!canWrite) {
      setError(deniedTitle);
      return;
    }
    if (!form.name.trim() || !form.creator.trim() || !form.roleName.trim()) {
      setError("请填写人设名称、创建者和角色定位。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const command = {
        name: form.name.trim(),
        creator: form.creator.trim(),
        roleName: form.roleName.trim(),
        tone: form.tone.trim() || undefined,
        status: form.status,
        promptTemplate: form.promptTemplate.trim() || undefined,
      };
      if (editingItem) {
        await updatePersona(editingItem.id, command);
      } else {
        await createPersona(command);
      }
      setEditingItem(null);
      setForm(emptyPersonaForm);
      setNotice(editingItem ? "AI 人设已更新" : "AI 人设已添加");
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canWrite) {
      setError(deniedTitle);
      return;
    }
    if (!deleteItem) {
      return;
    }
    setSaving(true);
    try {
      await deletePersona(deleteItem.id);
      setDeleteItem(null);
      setNotice("AI 人设已删除");
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyPersonaForm;
  const filteredItems = items.filter((item) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return (
      !normalizedKeyword ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.creator.toLowerCase().includes(normalizedKeyword) ||
      item.role.toLowerCase().includes(normalizedKeyword)
    );
  });

  function generatePersona() {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    const source = builderText.trim();
    const nextResult = {
      role: source.includes("销售") ? "销售转化顾问" : "企业内容增长顾问",
      focus: source.includes("安全") ? "权限控制、审计留痕、数据防泄漏" : "选型建议、业务价值、风险提醒",
      tone: source.includes("活泼") ? "清晰直接" : "专业克制",
    };
    setBuilderResult(nextResult);
    setForm({
      name: `${nextResult.role}人设`,
      creator: "系统生成",
      roleName: nextResult.role,
      tone: nextResult.tone,
      status: "启用",
      promptTemplate: `请以${nextResult.role}身份输出内容，表达重心聚焦${nextResult.focus}，语气保持${nextResult.tone}。`,
    });
    setEditingItem(null);
    setNotice("已生成结构化人设，可直接保存");
  }

  return (
    <div className="page-stack">
      <PageHeader title="AI 人设" description="管理内容表达风格，让 AI 创作保持稳定的人设和语气。" actionText="添加 AI 人设" onAction={openCreate} actionDisabled={!canWrite} actionTitle={canWrite ? undefined : deniedTitle} />
      {notice ? <div className="success-banner">{notice}</div> : null}
      <div className="persona-builder">
        <div>
          <span>生成 AI 人设</span>
          <h2>输入内容或上传文件生成结构化人设</h2>
          <textarea value={builderText} onChange={(event) => setBuilderText(event.target.value)} placeholder="请输入人设素材，例如角色定位、表达重心、核心视角、情感温度。" />
          <button className="primary-button" type="button" onClick={generatePersona} disabled={!canWrite} title={canWrite ? undefined : deniedTitle}>生成 AI 人设</button>
        </div>
        <div className="persona-result">
          <strong>结构化结果</strong>
          <dl>
            <div><dt>角色定位</dt><dd>{builderResult.role}</dd></div>
            <div><dt>表达重心</dt><dd>{builderResult.focus}</dd></div>
            <div><dt>情感温度</dt><dd>{builderResult.tone}</dd></div>
          </dl>
        </div>
      </div>
      <Panel title="人设列表">
        <Toolbar><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索人设" /></Toolbar>
        <table>
          <thead>
            <tr><th>人设名称</th><th>创建者</th><th>角色定位</th><th>最后编辑时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.creator}</td><td>{item.role}</td><td>{item.updatedAt}</td><td>{item.status}</td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => openEdit(item)} disabled={!canWrite} title={canWrite ? undefined : deniedTitle}>编辑</button>
                    <button className="danger-link" type="button" onClick={() => setDeleteItem(item)} disabled={!canWrite} title={canWrite ? undefined : deniedTitle}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {formVisible ? (
        <Modal
          title={editingItem ? "编辑 AI 人设" : "添加 AI 人设"}
          onClose={() => {
            setEditingItem(null);
            setForm(emptyPersonaForm);
            setError("");
          }}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => {
                setEditingItem(null);
                setForm(emptyPersonaForm);
                setError("");
              }}>取消</button>
              <button className="primary-button" type="submit" form="persona-form" disabled={saving || !canWrite} title={canWrite ? undefined : deniedTitle}>
                {saving ? "保存中" : "保存"}
              </button>
            </>
          }
        >
          <form
            id="persona-form"
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="persona-name">人设名称</label>
              <input id="persona-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="persona-creator">创建者</label>
              <input id="persona-creator" value={form.creator} onChange={(event) => setForm({ ...form, creator: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="persona-role">角色定位</label>
              <input id="persona-role" value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="persona-tone">表达语气</label>
              <input id="persona-tone" value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="persona-status">状态</label>
              <select id="persona-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "启用" | "停用" })}>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="persona-prompt">提示词模板</label>
              <textarea id="persona-prompt" value={form.promptTemplate} onChange={(event) => setForm({ ...form, promptTemplate: event.target.value })} />
            </div>
          </form>
        </Modal>
      ) : null}
      {deleteItem ? (
        <ConfirmDialog
          title="删除 AI 人设"
          description={`确认删除“${deleteItem.name}”？删除后 AI 创作将无法继续使用该表达风格。`}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
