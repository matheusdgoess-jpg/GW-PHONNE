'use client';
import { useEffect, useState } from 'react';

const EMPTY_FORM = { title: '', excerpt: '', body: '', published: true };

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export default function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setMsg({ type: 'err', text: 'Falha ao carregar as dicas.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMsg(null);
  }

  function openEdit(post) {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      excerpt: post.excerpt || '',
      body: post.body || '',
      published: post.published !== false,
    });
    setShowForm(true);
    setMsg(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setMsg({ type: 'err', text: 'Informe o título da dica.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');
      setMsg({ type: 'ok', text: editingId ? 'Dica atualizada.' : 'Dica publicada.' });
      closeForm();
      loadPosts();
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post) {
    if (!confirm(`Apagar a dica "${post.title}"? Isso não tem volta.`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover.');
      setPosts((list) => list.filter((p) => p.id !== post.id));
      setMsg({ type: 'ok', text: 'Dica removida.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao remover.' });
    }
  }

  async function togglePublished(post) {
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: post.published === false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((list) => list.map((p) => (p.id === post.id ? data.post : p)));
    } catch {
      setMsg({ type: 'err', text: 'Falha ao alterar a publicação.' });
    }
  }

  const publicadas = posts.filter((p) => p.published !== false).length;

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-stats">
          <span className="admin-stat">
            Total: <b>{posts.length}</b>
          </span>
          <span className="admin-stat">
            No ar: <b>{publicadas}</b>
          </span>
          <span className="admin-stat">
            Rascunhos: <b>{posts.length - publicadas}</b>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="admin-btn admin-btn-ghost" href="/dicas" target="_blank" rel="noopener">
            Ver página →
          </a>
          <button className="admin-btn admin-btn-primary" onClick={openAdd} type="button">
            + Nova dica
          </button>
        </div>
      </div>

      {msg ? <div className={`admin-msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div> : null}

      {showForm ? (
        <div className="admin-card">
          <h2>{editingId ? 'Editar dica' : 'Nova dica'}</h2>
          <p className="hint">
            No texto: comece a linha com <code>## </code> para criar um subtítulo, com{' '}
            <code>- </code> para itens de lista, e use <code>**palavra**</code> para negrito. Deixe
            uma linha em branco entre os parágrafos.
          </p>
          <form className="admin-form" onSubmit={handleSave}>
            <div className="admin-field">
              <label htmlFor="post-title">Título *</label>
              <input
                id="post-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Como cuidar da bateria do iPhone"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="post-excerpt">Resumo</label>
              <input
                id="post-excerpt"
                type="text"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Uma frase curta que aparece na lista e no Google"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="post-body">Texto da dica</label>
              <textarea
                id="post-body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={18}
                style={{ minHeight: 320, fontFamily: 'inherit', lineHeight: 1.6 }}
                placeholder={'Primeiro parágrafo.\n\n## Um subtítulo\n\n- Primeiro item\n- Segundo item'}
              />
            </div>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Publicada (visível no site)
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>
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
        <p className="hint">Carregando dicas…</p>
      ) : posts.length === 0 ? (
        <p className="hint">Nenhuma dica cadastrada ainda.</p>
      ) : (
        <div className="admin-posts">
          {posts.map((post) => (
            <div className="admin-post-row" key={post.id}>
              <div className="admin-post-info">
                <div className="admin-post-title">
                  {post.title}
                  {post.published === false ? (
                    <span className="admin-badge off" style={{ marginLeft: 8 }}>
                      Rascunho
                    </span>
                  ) : null}
                </div>
                <div className="admin-post-meta mono">
                  {formatarData(post.createdAt)} · /dicas/{post.slug}
                </div>
                {post.excerpt ? <div className="admin-post-excerpt">{post.excerpt}</div> : null}
              </div>
              <div className="admin-post-actions">
                <button className="admin-btn admin-btn-ghost" type="button" onClick={() => openEdit(post)}>
                  Editar
                </button>
                <button
                  className="admin-btn admin-btn-ghost"
                  type="button"
                  onClick={() => togglePublished(post)}
                >
                  {post.published === false ? 'Publicar' : 'Despublicar'}
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  type="button"
                  onClick={() => handleDelete(post)}
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
