'use client';
import { useEffect, useState } from 'react';

export default function ContentManager() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((data) => setContent(data.content))
      .catch(() => setMsg({ type: 'err', text: 'Falha ao carregar conteúdo.' }))
      .finally(() => setLoading(false));
  }, []);

  function updateField(path, value) {
    setContent((c) => {
      const next = structuredClone(c);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) ref = ref[path[i]];
      ref[path[path.length - 1]] = value;
      return next;
    });
  }

  function updateHour(idx, key, value) {
    setContent((c) => {
      const next = structuredClone(c);
      next.hours[idx][key] = value;
      return next;
    });
  }

  function addHourRow() {
    setContent((c) => ({ ...c, hours: [...c.hours, { day: '', time: '', closed: false }] }));
  }

  function removeHourRow(idx) {
    setContent((c) => ({ ...c, hours: c.hours.filter((_, i) => i !== idx) }));
  }

  function updateFaq(idx, key, value) {
    setContent((c) => {
      const next = structuredClone(c);
      next.faq[idx][key] = value;
      return next;
    });
  }

  function addFaqRow() {
    setContent((c) => ({ ...c, faq: [...c.faq, { q: '', a: '' }] }));
  }

  function removeFaqRow(idx) {
    setContent((c) => ({ ...c, faq: c.faq.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');
      setContent(data.content);
      setMsg({ type: 'ok', text: 'Conteúdo do site atualizado.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Falha ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="hint">Carregando conteúdo…</p>;
  if (!content) return <p className="hint">Não foi possível carregar o conteúdo.</p>;

  return (
    <form className="admin-form" onSubmit={handleSave}>
      {msg ? <div className={`admin-msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div> : null}

      <div className="admin-card">
        <h2>Endereço</h2>
        <p className="hint">Aparece na seção &quot;Localização&quot; e no mapa do site.</p>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Rua e número</label>
            <input
              type="text"
              value={content.address.street}
              onChange={(e) => updateField(['address', 'street'], e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Complemento</label>
            <input
              type="text"
              value={content.address.complement}
              onChange={(e) => updateField(['address', 'complement'], e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Cidade / UF</label>
            <input
              type="text"
              value={content.address.city}
              onChange={(e) => updateField(['address', 'city'], e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Horário de funcionamento</h2>
        {content.hours.map((h, idx) => (
          <div className="admin-form-row" key={idx} style={{ marginBottom: 10, alignItems: 'end' }}>
            <div className="admin-field">
              <label>Dia</label>
              <input type="text" value={h.day} onChange={(e) => updateHour(idx, 'day', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Horário</label>
              <input type="text" value={h.time} onChange={(e) => updateHour(idx, 'time', e.target.value)} />
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={h.closed}
                onChange={(e) => updateHour(idx, 'closed', e.target.checked)}
              />
              Fechado
            </label>
            <button className="admin-btn admin-btn-danger" type="button" onClick={() => removeHourRow(idx)}>
              Remover
            </button>
          </div>
        ))}
        <button className="admin-btn admin-btn-ghost" type="button" onClick={addHourRow}>
          + Adicionar linha
        </button>
      </div>

      <div className="admin-card">
        <h2>Contatos (WhatsApp)</h2>
        <p className="hint">Formato: código do país + DDD + número, sem espaços. Ex: 5514981328577.</p>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Técnico</label>
            <input
              type="tel"
              value={content.contacts.tecnico}
              onChange={(e) => updateField(['contacts', 'tecnico'], e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Loja</label>
            <input
              type="tel"
              value={content.contacts.loja}
              onChange={(e) => updateField(['contacts', 'loja'], e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Instagram (URL)</label>
            <input
              type="url"
              value={content.instagram}
              onChange={(e) => updateField(['instagram'], e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Perguntas frequentes</h2>
        {content.faq.map((item, idx) => (
          <div className="admin-faq-item" key={idx}>
            <div className="admin-field">
              <label>Pergunta</label>
              <input type="text" value={item.q} onChange={(e) => updateFaq(idx, 'q', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Resposta</label>
              <textarea value={item.a} onChange={(e) => updateFaq(idx, 'a', e.target.value)} />
            </div>
            <button className="admin-btn admin-btn-danger" type="button" onClick={() => removeFaqRow(idx)}>
              Remover pergunta
            </button>
          </div>
        ))}
        <button className="admin-btn admin-btn-ghost" type="button" onClick={addFaqRow}>
          + Adicionar pergunta
        </button>
      </div>

      <button className="admin-btn admin-btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}
