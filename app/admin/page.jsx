'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CatalogManager from '@/components/admin/CatalogManager';
import ContentManager from '@/components/admin/ContentManager';
import PostsManager from '@/components/admin/PostsManager';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('catalogo');

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <img src="/assets/logo.png" alt="GW Phone" />
          GW Phone
          <span className="tag">Admin</span>
        </div>
        <div className="admin-topbar-actions">
          <a className="admin-view-site" href="/" target="_blank" rel="noopener">
            Ver site →
          </a>
          <button className="admin-logout" onClick={handleLogout} type="button">
            Sair
          </button>
        </div>
      </div>

      <div className="admin-body">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'catalogo' ? 'active' : ''}`}
            onClick={() => setTab('catalogo')}
            type="button"
          >
            Catálogo
          </button>
          <button
            className={`admin-tab ${tab === 'dicas' ? 'active' : ''}`}
            onClick={() => setTab('dicas')}
            type="button"
          >
            Dicas
          </button>
          <button
            className={`admin-tab ${tab === 'conteudo' ? 'active' : ''}`}
            onClick={() => setTab('conteudo')}
            type="button"
          >
            Conteúdo do site
          </button>
        </div>

        {tab === 'catalogo' ? <CatalogManager /> : null}
        {tab === 'dicas' ? <PostsManager /> : null}
        {tab === 'conteudo' ? <ContentManager /> : null}
      </div>
    </div>
  );
}
