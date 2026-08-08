'use client';
import { useEffect, useState } from 'react';

const EMPTY_FORM = {
  model: '',
  condition: 'seminovo',
  description: '',
  imageUrl: '',
  available: true,
};

export default function CatalogManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setMsg({ type: 'err', text: 'Falha ao carregar o catálogo.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMsg(null);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      model: item.model || '',
      condition: item.condition || 'seminovo',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      available: item.available !== false,
    });
    setShowForm(true);
    setMsg(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no upload.');
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao enviar imagem.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.model.trim()) {
      setMsg({ type: 'err', text: 'Informe o modelo do aparelho.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const payload = { ...form };
      const url = editingId ? `/api/admin/catalog/${editingId}` : '/api/admin/catalog';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');
      setMsg({ type: 'ok', text: editingId ? 'Aparelho atualizado.' : 'Aparelho adicionado.' });
      closeForm();
      loadItems();
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remover "${item.model}" do catálogo?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover.');
      setItems((list) => list.filter((i) => i.id !== item.id));
      setMsg({ type: 'ok', text: 'Aparelho removido.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao remover.' });
    }
  }

  async function toggleAvailable(item) {
    try {
      const res = await fetch(`/api/admin/catalog/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((list) => list.map((i) => (i.id === item.id ? data.item : i)));
    } catch {
      setMsg({ type: 'err', text: 'Falha ao atualizar disponibilidade.' });
    }
  }

  const total = items.length;
  const novos = items.filter((i) => i.condition === 'novo').length;
  const seminovos = items.filter((i) => i.condition === 'seminovo').length;
  const indisponiveis = items.filter((i) => i.available === false).length;

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-stats">
          <span className="admin-stat">
            Total: <b>{total}</b>
          </span>
          <span className="admin-stat">
            Novos: <b>{novos}</b>
          </span>
          <span className="admin-stat">
            Seminovos: <b>{seminovos}</b>
          </span>
          <span className="admin-stat">
            Fora da vitrine: <b>{indisponiveis}</b>
          </span>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd} type="button">
          + Adicionar aparelho
        </button>
      </div>

      {msg ? <div className={`admin-msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div> : null}

      {showForm ? (
        <div className="admin-card">
          <h2>{editingId ? 'Editar aparelho' : 'Novo aparelho'}</h2>
          <p className="hint">
            Preço em branco ou 0 aparece como &quot;Consulte disponibilidade&quot; pro cliente no site.
          </p>
          <form className="admin-form" onSubmit={handleSave}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="model">Modelo *</label>
                <input
                  id="model"
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="iPhone 13 Pro"
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="condition">Condição</label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                >
                  <option value="seminovo">Seminovo</option>
                  <option value="novo">Novo</option>
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="O que o cliente precisa saber sobre esse aparelho."
              />
            </div>

            <div className="admin-field">
              <label>Foto</label>
              <div className="admin-dropzone">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="Pré-visualização" />
                ) : (
                  <div className="ph-64">sem foto</div>
                )}
                <div className="admin-foto-opcoes">
                  <div>
                    <span className="admin-foto-rotulo">Enviar do computador</span>
                    <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                    {uploading ? <p className="hint" style={{ margin: '6px 0 0' }}>Enviando…</p> : null}
                  </div>
                  <div>
                    <span className="admin-foto-rotulo">ou colar o endereço de uma imagem</span>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value.trim() }))}
                      placeholder="https://..."
                    />
                  </div>
                  {form.imageUrl ? (
                    <button
                      className="admin-btn admin-btn-danger"
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    >
                      Remover foto
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
              />
              Visível na vitrine do cliente
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="admin-btn admin-btn-primary" type="submit" disabled={saving || uploading}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button className="admin-btn admin-btn-ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? (
        <p className="hint">Carregando catálogo…</p>
      ) : items.length === 0 ? (
        <p className="hint">Nenhum aparelho cadastrado ainda.</p>
      ) : (
        <div className="admin-product-grid">
          {items.map((item) => (
            <div className="admin-product-card" key={item.id}>
              <div className="admin-product-media">
                <div className="admin-badge-row">
                  <span className={`admin-badge ${item.condition}`}>
                    {item.condition === 'novo' ? 'Novo' : 'Seminovo'}
                  </span>
                  {item.available === false ? <span className="admin-badge off">Oculto</span> : null}
                </div>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.model} />
                ) : (
                  <svg className="ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="6" y="2" width="12" height="20" rx="2.4" />
                    <line x1="10" y1="19" x2="14" y2="19" />
                  </svg>
                )}
              </div>
              <div className="admin-product-body">
                <div className="admin-product-title">{item.model}</div>
                <div className="admin-product-meta">
                  {item.description ? item.description : 'Sem descrição'}
                </div>
                <div className="admin-product-actions">
                  <button className="admin-btn admin-btn-ghost" type="button" onClick={() => openEdit(item)}>
                    Editar
                  </button>
                  <button className="admin-btn admin-btn-ghost" type="button" onClick={() => toggleAvailable(item)}>
                    {item.available === false ? 'Mostrar' : 'Ocultar'}
                  </button>
                  <button className="admin-btn admin-btn-danger" type="button" onClick={() => handleDelete(item)}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
