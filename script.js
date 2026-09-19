const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open); });
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); }));
const closeMenu = () => { nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); };
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();menuButton?.focus();}});
window.addEventListener('resize',()=>{if(innerWidth>1000)closeMenu();},{passive:true});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) return; entry.target.classList.add('visible'); observer.unobserve(entry.target); }), { threshold: 0.12 });
  revealElements.forEach(element => observer.observe(element));
} else revealElements.forEach(element => element.classList.add('visible'));
document.getElementById('year').textContent = new Date().getFullYear();

const phoneDigits = phone => `55${String(phone || '').replace(/\D/g, '').replace(/^55/, '')}`;
const updateContact = phone => {
  const formatted = String(phone || '(14) 98132-8577');
  document.querySelectorAll('.js-phone').forEach(element => { element.textContent = formatted; });
  document.querySelectorAll('.js-whatsapp').forEach(link => { const url = new URL(link.href); link.href = `https://wa.me/${phoneDigits(formatted)}${url.search}`; });
};

const safeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const trackingStatus = { recebido: 'Recebido', diagnostico: 'Em diagnóstico', reparo: 'Em reparo', pronto: 'Pronto para retirada', entregue: 'Entregue' };
const trackingSteps = ['recebido', 'diagnostico', 'reparo', 'pronto', 'entregue'];
const publicDate = value => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'A combinar';

let publicClient = null;
if (window.supabase && window.GW_SUPABASE?.url && window.GW_SUPABASE?.publishableKey) publicClient = window.supabase.createClient(window.GW_SUPABASE.url, window.GW_SUPABASE.publishableKey);
async function loadRepairPortfolio(){
  const section=document.getElementById('resultados');const grid=document.getElementById('public-results-grid');if(!section||!grid)return;
  document.querySelectorAll('a[href="#resultados"]').forEach(link=>link.hidden=true);
  if(!publicClient)return;
  const {data,error}=await publicClient.from('repair_portfolio').select('title,device_model,repair_type,description,image_path').eq('published',true).order('sort_order').order('created_at',{ascending:false});
  if(error||!data?.length){section.hidden=true;document.querySelectorAll('a[href="#resultados"]').forEach(link=>link.hidden=true);return;}
  grid.innerHTML=data.map(item=>{const imageUrl=publicClient.storage.from('repair-portfolio').getPublicUrl(item.image_path).data.publicUrl;return `<article class="result-card reveal visible"><img src="${safeText(imageUrl)}" alt="${safeText(item.title)}" loading="lazy"><div><small>${safeText(item.repair_type.toUpperCase())}</small><h3>${safeText(item.title)}</h3><p>${safeText(item.device_model)}${item.description?` · ${safeText(item.description)}`:''}</p></div></article>`}).join('');
  section.hidden=false;
  document.querySelectorAll('a[href="#resultados"]').forEach(link=>link.hidden=false);
}
const trackingForm = document.getElementById('tracking-form');
const trackingResult = document.getElementById('tracking-result');

trackingForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (trackingForm.querySelector('button').disabled) return;
  if (!trackingForm.checkValidity()) return trackingForm.reportValidity();
  const button = trackingForm.querySelector('button');
  const values = Object.fromEntries(new FormData(trackingForm).entries());
  button.disabled = true; button.innerHTML = 'Consultando…';
  trackingResult.innerHTML = '<div class="tracking-loading"><i></i><span>Buscando sua ordem de serviço…</span></div>';
  try {
    if (!publicClient) throw new Error('Serviço indisponível');
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),12000);
    let response;
    try { response = await publicClient.rpc('track_service_order', { p_order_id: Number(values.orderNumber), p_pickup_code: String(values.pickupCode).trim().toUpperCase() }).abortSignal(controller.signal); }
    finally { clearTimeout(timeout); }
    const { data, error } = response;
    if (error) throw error;
    const order = data?.[0];
    if (!order) { trackingResult.innerHTML = '<div class="tracking-not-found"><span>!</span><div><b>OS não localizada</b><p>Confira o número e o código exatamente como aparecem na sua via.</p></div></div>'; return; }
    const currentIndex = trackingSteps.indexOf(order.status);
    trackingResult.innerHTML = `<div class="tracking-found"><div class="tracking-found-head"><div><small>ORDEM DE SERVIÇO</small><h3>#OS-${safeText(order.order_id)}</h3></div><span>${safeText(trackingStatus[order.status] || order.status)}</span></div><div class="tracking-device"><small>APARELHO</small><b>${safeText(order.device)}</b><p>Entrada: ${publicDate(order.opened_at)} · Previsão: ${publicDate(order.deadline)}</p></div><div class="tracking-timeline">${trackingSteps.map((step, index) => `<div class="${index < currentIndex ? 'done' : index === currentIndex ? 'current' : ''}"><i>${index < currentIndex ? '✓' : index + 1}</i><span>${trackingStatus[step]}</span></div>`).join('')}</div><p class="tracking-update">Última atualização: ${new Date(order.updated_at).toLocaleString('pt-BR')}</p></div>`;
  } catch (_) { trackingResult.innerHTML = '<div class="tracking-not-found"><span>!</span><div><b>Consulta indisponível</b><p>Tente novamente em alguns instantes.</p></div></div>'; }
  finally { button.disabled = false; button.innerHTML = 'Consultar andamento <span>→</span>'; }
});

const trackEvent = (eventType, serviceName = null) => { if (!publicClient) return; publicClient.from('site_events').insert({ event_type: eventType, page_path: location.pathname, product_name: serviceName }).then(() => {}).catch(() => {}); };
trackEvent('page_view');
document.addEventListener('click', event => { const link = event.target.closest('a[href*="wa.me"]'); if (link) trackEvent('whatsapp_click', link.dataset.service || null); });

async function loadTechnicalContact() { if (!publicClient) return; const { data } = await publicClient.from('public_settings').select('tech_phone').eq('id', 1).single(); if (data?.tech_phone) updateContact(data.tech_phone); }
updateContact('(14) 98132-8577');
loadTechnicalContact().catch(() => {});
loadRepairPortfolio().catch(() => {});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
