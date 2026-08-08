# GW Phone

Site + loja online da GW Phone — assistência técnica especializada em Apple e venda de iPhones
novos e seminovos em Botucatu-SP. Aplicação Next.js com painel de administração próprio.

**Ao vivo:** https://gw-phonne.vercel.app (deploy automático via Vercel a cada push na `main`)
**Painel da loja:** https://gw-phonne.vercel.app/admin

## Estrutura

- `app/page.jsx` — site público: hero, catálogo de iPhones, serviços, prazos, localização,
  contato, FAQ.
- `app/admin/` — painel de administração (login + dashboard), separado visualmente do site.
- `app/api/admin/` — rotas usadas pelo painel (login, catálogo, conteúdo do site, upload de foto).
- `lib/data.js` — leitura/gravação do catálogo e dos textos do site no Vercel Blob Storage.
- `lib/auth.js` — login com usuário/senha e sessão assinada (cookie).

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | O que é |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Criada automaticamente ao conectar o **Blob Storage** no dashboard da Vercel (Storage → Create Database → Blob). |
| `ADMIN_USERNAME` | Usuário de login do painel `/admin`. |
| `ADMIN_PASSWORD` | Senha de login do painel `/admin`. |
| `AUTH_SECRET` | Texto aleatório longo, usado para assinar a sessão de login. |

Veja `.env.example`. Depois de adicionar/alterar variáveis, é preciso fazer um novo deploy
(Vercel → Deployments → ⋯ → Redeploy) para elas passarem a valer.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```
