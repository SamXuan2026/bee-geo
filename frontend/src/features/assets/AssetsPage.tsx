import { useEffect, useState } from "react";
import { ConfirmDialog, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { createAsset, deleteAsset, listAssets, updateAsset } from "./api";
import type { AssetItem } from "./model";

interface AssetForm {
  name: string;
  type: string;
  tag: string;
  storageUrl: string;
  enabled: boolean;
}

const emptyAssetForm: AssetForm = {
  name: "",
  type: "图片",
  tag: "",
  storageUrl: "",
  enabled: true,
};

export function AssetsPage() {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [form, setForm] = useState<AssetForm>(emptyAssetForm);
  const [editingItem, setEditingItem] = useState<AssetItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AssetItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setItems(await listAssets());
  }

  function openCreate() {
    setError("");
    setEditingItem(null);
    setForm({ ...emptyAssetForm });
  }

  function openEdit(item: AssetItem) {
    setError("");
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      tag: item.tag,
      storageUrl: item.storageUrl ?? "",
      enabled: item.enabled ?? true,
    });
  }

  async function submitForm() {
    if (!form.name.trim() || !form.type.trim() || !form.tag.trim()) {
      setError("请填写素材名称、类型和标签。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const command = {
        name: form.name.trim(),
        type: form.type.trim(),
        tag: form.tag.trim(),
        storageUrl: form.storageUrl.trim() || undefined,
        enabled: form.enabled,
      };
      if (editingItem) {
        await updateAsset(editingItem.id, command);
      } else {
        await createAsset(command);
      }
      setEditingItem(null);
      setForm(emptyAssetForm);
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
      await deleteAsset(deleteItem.id);
      setDeleteItem(null);
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyAssetForm;

  return (
    <div className="page-stack">
      <PageHeader title="素材库" description="管理品牌、活动、视频和表格素材，供创作与发布复用。" actionText="添加素材" onAction={openCreate} />
      <div className="card-grid three">
        <article className="feature-card"><span>12 个</span><h3>品牌素材</h3><p>Logo、KV、宣传图等品牌统一资产。</p></article>
        <article className="feature-card"><span>8 个</span><h3>活动素材</h3><p>海报、长图、落地页配图等活动资源。</p></article>
        <article className="feature-card"><span>5 个</span><h3>视频素材</h3><p>封面、字幕条、转场图等视频用素材。</p></article>
      </div>
      <Panel title="素材列表">
        <Toolbar>
          <input placeholder="搜索素材" />
          <select><option>全部标签</option><option>品牌素材</option><option>活动素材</option></select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>名称</th><th>标签</th><th>类型</th><th>最后编辑时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.tag}</td><td>{item.type}</td><td>{item.updatedAt}</td>
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
          title={editingItem ? "编辑素材" : "添加素材"}
          onClose={() => {
            setEditingItem(null);
            setForm(emptyAssetForm);
            setError("");
          }}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => {
                setEditingItem(null);
                setForm(emptyAssetForm);
                setError("");
              }}>取消</button>
              <button className="primary-button" type="submit" form="asset-form" disabled={saving}>
                {saving ? "保存中" : "保存"}
              </button>
            </>
          }
        >
          <form
            id="asset-form"
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="asset-name">素材名称</label>
              <input id="asset-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="asset-type">素材类型</label>
              <select id="asset-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="图片">图片</option>
                <option value="视频">视频</option>
                <option value="表格">表格</option>
                <option value="文档">文档</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="asset-tag">标签</label>
              <input id="asset-tag" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="asset-url">存储地址</label>
              <input id="asset-url" value={form.storageUrl} onChange={(event) => setForm({ ...form, storageUrl: event.target.value })} />
            </div>
            <label className="inline-check">
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
              启用素材
            </label>
          </form>
        </Modal>
      ) : null}
      {deleteItem ? (
        <ConfirmDialog
          title="删除素材"
          description={`确认删除“${deleteItem.name}”？删除后创作和发布流程将无法引用该素材。`}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
