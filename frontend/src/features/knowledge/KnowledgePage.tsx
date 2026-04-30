import { useEffect, useState } from "react";
import { ConfirmDialog, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { createKnowledgeItem, deleteKnowledgeItem, listKnowledgeItems, updateKnowledgeItem } from "./api";
import type { KnowledgeItem } from "./model";

interface KnowledgeForm {
  name: string;
  type: string;
  groupName: string;
  content: string;
  enabled: boolean;
}

const emptyKnowledgeForm: KnowledgeForm = {
  name: "",
  type: "md",
  groupName: "",
  content: "",
  enabled: true,
};

export function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [form, setForm] = useState<KnowledgeForm>(emptyKnowledgeForm);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<KnowledgeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setItems(await listKnowledgeItems());
  }

  function openCreate() {
    setError("");
    setEditingItem(null);
    setForm({ ...emptyKnowledgeForm });
  }

  function openEdit(item: KnowledgeItem) {
    setError("");
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      groupName: item.group,
      content: item.content ?? "",
      enabled: item.enabled ?? true,
    });
  }

  async function submitForm() {
    if (!form.name.trim() || !form.type.trim() || !form.groupName.trim()) {
      setError("请填写文档名称、类型和分组。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const command = {
        name: form.name.trim(),
        type: form.type.trim(),
        groupName: form.groupName.trim(),
        content: form.content.trim() || undefined,
        enabled: form.enabled,
      };
      if (editingItem) {
        await updateKnowledgeItem(editingItem.id, command);
      } else {
        await createKnowledgeItem(command);
      }
      setEditingItem(null);
      setForm(emptyKnowledgeForm);
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteItem) {
      return;
    }
    setSaving(true);
    try {
      await deleteKnowledgeItem(deleteItem.id);
      setDeleteItem(null);
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyKnowledgeForm;

  return (
    <div className="page-stack">
      <PageHeader title="知识库" description="沉淀产品手册、FAQ、行业洞察和销售资料。" actionText="新增知识库" onAction={openCreate} />
      <Panel title="知识文档" action={<button className="ghost-button" type="button">新增分组</button>}>
        <Toolbar>
          <input placeholder="搜索文档" />
          <select><option>全部类型</option><option>md</option><option>txt</option></select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>名称</th><th>类型</th><th>分组</th><th>最后编辑日期</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.type}</td><td>{item.group}</td><td>{item.updatedAt}</td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => openEdit(item)}>编辑</button>
                    <button className="danger-link" type="button" onClick={() => setDeleteItem(item)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {formVisible ? (
        <Modal
          title={editingItem ? "编辑知识文档" : "新增知识文档"}
          onClose={() => {
            setEditingItem(null);
            setForm(emptyKnowledgeForm);
            setError("");
          }}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => {
                setEditingItem(null);
                setForm(emptyKnowledgeForm);
                setError("");
              }}>取消</button>
              <button className="primary-button" type="submit" form="knowledge-form" disabled={saving}>
                {saving ? "保存中" : "保存"}
              </button>
            </>
          }
        >
          <form
            id="knowledge-form"
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="knowledge-name">文档名称</label>
              <input id="knowledge-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="knowledge-type">类型</label>
              <select id="knowledge-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="md">md</option>
                <option value="txt">txt</option>
                <option value="pdf">pdf</option>
                <option value="docx">docx</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="knowledge-group">分组</label>
              <input id="knowledge-group" value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="knowledge-content">内容摘要</label>
              <textarea id="knowledge-content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            </div>
            <label className="inline-check">
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
              启用文档
            </label>
          </form>
        </Modal>
      ) : null}
      {deleteItem ? (
        <ConfirmDialog
          title="删除知识文档"
          description={`确认删除“${deleteItem.name}”？删除后 AI 创作将无法引用该知识内容。`}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
