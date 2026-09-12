const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = amount => { const d = new Date(); d.setDate(d.getDate() - amount); return d.toISOString().slice(0, 10); };
const client = window.supabase.createClient(
  window.GW_SUPABASE.url,
  window.GW_SUPABASE.publishableKey,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const seed = {
  settings: { monthlyGoal: 0, marginGoal: 0, salesGoal: 0, managerName: 'Gestor', businessName: 'IMG TECH', sound: false, theme: 'dark' },
  public: { storePhone: '(14) 98132-8577', techPhone: '(14) 98132-8577', instagram: '@img_tecnico', address: 'Atendimento mediante combinação prévia', weekdays: 'Atendimento com horário combinado', saturday: 'Sob consulta', sunday: 'Fechado', headline: 'Tecnologia para reparar. Precisão para cuidar.' },
  clients: [],
  sales: [],
  orders: [],
  inventory: [],
  devices: [],
  expenses: [],
  tasks: [],
  catalog: [],
  estimates: [],
  suppliers: [],
  financialEntries: [],
  followups: [],
  siteEvents: [],
  members: [],
  audit: []
  ,portfolio: []
  ,portfolioReady: false
};

let state = structuredClone(seed);
let currentUserId = null;
let currentMember = null;
let saveInFlight = Promise.resolve();
const hasRole = role => Boolean(currentMember?.active && currentMember.roles?.includes(role));
const save = () => {
  const snapshot = { settings: structuredClone(state.settings), public: structuredClone(state.public) };
  saveInFlight = saveInFlight.then(async () => {
    const { error } = await client.from('manager_state').upsert({ id: 1, data: snapshot, updated_at: new Date().toISOString(), updated_by: currentUserId });
    if (error) showToast('Falha ao sincronizar', 'Verifique a internet e tente novamente.');
  });
  return saveInFlight;
};

async function savePublicSettings() {
  const payload = {
    id: 1,
    store_phone: state.public.storePhone,
    tech_phone: state.public.techPhone,
    instagram: state.public.instagram,
    address: state.public.address,
    weekdays: state.public.weekdays,
    saturday: state.public.saturday,
    sunday: state.public.sunday,
    headline: state.public.headline,
    updated_at: new Date().toISOString()
  };
  const { error } = await client.from('public_settings').upsert(payload);
  if (error) throw error;
}

async function loadOperationalData() {
  const results = await Promise.all([
    client.from('clients').select('*').order('created_at', { ascending: false }),
    client.from('sales').select('*').order('sale_date', { ascending: false }),
    client.from('service_orders').select('*').order('created_at', { ascending: false }),
    client.from('inventory').select('*').order('name'),
    client.from('expenses').select('*').order('expense_date', { ascending: false }),
    client.from('tasks').select('*').order('due_date'),
    client.from('catalog_products').select('*').order('sort_order'),
    client.from('site_events').select('*').order('created_at', { ascending: false }).limit(500),
    client.from('team_members').select('*').order('name'),
    client.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    client.from('estimates').select('*').order('created_at', { ascending: false }),
    client.from('suppliers').select('*').order('name'),
    client.from('financial_entries').select('*').order('due_date'),
    client.from('customer_followups').select('*').order('scheduled_for'),
    client.from('devices').select('*').order('created_at', { ascending: false })
  ]);
  const failed = results.find(result => result.error);
  if (failed) throw failed.error;
  const [clients, sales, orders, inventory, expenses, tasks, catalog, events, members, audit, estimates, suppliers, financialEntries, followups, devices] = results.map(result => result.data || []);
  state.clients = clients.map(item => ({ id:item.id, name:item.name, phone:item.phone, email:item.email || '', document:item.document || '', address:item.address || '', cep:item.cep || '', city:item.city || '', state:item.state || '', notes:item.notes || '', since:item.created_at.slice(0,10), total:+item.total, visits:+item.visits }));
  state.sales = sales.map(item => ({ id:item.id, createdAt:item.created_at, date:item.sale_date, clientId:item.client_id, inventoryId:item.inventory_id, quantity:+item.quantity || 1, client:item.client_name, clientPhone:item.client_phone || '', clientDocument:item.client_document || '', clientEmail:item.client_email || '', clientAddress:item.client_address || '', clientCep:item.client_cep || '', clientCity:item.client_city || '', clientState:item.client_state || '', product:item.product, payment:item.payment_method, value:+item.amount, discount:+item.discount || 0, cost:+item.cost, cardFee:+item.card_fee, commission:+item.commission, installments:+item.installments, tradeIn:item.trade_in || '', notes:item.notes || '', sellerId:item.seller_id || '', sellerName:item.seller_name || '', warrantyType:item.warranty_type || '', warrantyTerm:item.warranty_term || '', deviceImei:item.device_imei || '', deviceSerial:item.device_serial || '', deviceStorage:item.device_storage || '', deviceColor:item.device_color || '', deviceBatteryHealth:item.device_battery_health, productCondition:item.product_condition || '' }));
  state.orders = orders.map(item => ({ id:+item.id, opened:item.created_at.slice(0,10), clientId:item.client_id, client:item.client_name, phone:item.phone, customerDocument:item.customer_document||'', device:item.device, imeiSerial:item.imei_serial || '', service:item.service, checklist:item.checklist || {}, value:+item.estimate, status:item.status, approvalStatus:item.approval_status, deadline:item.deadline, notes:item.notes || '', deviceCondition:item.device_condition||'', includedItems:item.included_items||'', unlockArrangement:item.unlock_arrangement||'', authorizationMethod:item.authorization_method||'', customerAccepted:item.customer_accepted, privacyAcknowledged:item.privacy_acknowledged, backupAcknowledged:item.backup_acknowledged, waterResistanceAcknowledged:item.water_resistance_acknowledged, dataResetAuthorized:item.data_reset_authorized, findMyStatus:item.find_my_status||'', simStatus:item.sim_status||'', oldPartsPreference:item.old_parts_preference||'', approvalReference:item.approval_reference||'', approvedAmount:item.approved_amount===null?null:+item.approved_amount, authorizedPickupName:item.authorized_pickup_name||'', authorizedPickupDocument:item.authorized_pickup_document||'', deliveryAcknowledged:item.delivery_acknowledged, deliveryNotes:item.delivery_notes||'', deliveredAt:item.delivered_at, acceptedAt:item.accepted_at, pickupCode:item.pickup_code||'' }));
  state.inventory = inventory.map(item => ({ id:item.id, name:item.name, category:item.category, qty:+item.quantity, min:+item.minimum_quantity, cost:+item.unit_cost, price:+item.sale_price, serialNumber:item.serial_number || '', notes:item.notes || '' }));
  state.expenses = expenses.map(item => ({ id:item.id, date:item.expense_date, description:item.description, category:item.category, payment:item.payment_method || '', value:+item.amount, recurring:item.recurring, notes:item.notes || '' }));
  state.tasks = tasks.map(item => ({ id:item.id, title:item.title, date:item.due_date, category:item.category, priority:item.priority, notes:item.notes || '', assignedTo:item.assigned_to || '', done:item.done }));
  state.catalog = catalog;
  state.siteEvents = events;
  state.members = members.map(item => ({ id:item.user_id, name:item.name, email:item.email, roles:item.roles || [], active:item.active, createdAt:item.created_at, updatedAt:item.updated_at }));
  state.audit = audit;
  state.estimates = estimates.map(item=>({id:+item.id,clientId:item.client_id,client:item.client_name,phone:item.phone||'',device:item.device,description:item.description,value:+item.amount,validUntil:item.valid_until,status:item.status,notes:item.notes||'',createdAt:item.created_at}));
  state.suppliers = suppliers.map(item=>({id:item.id,name:item.name,document:item.document||'',contact:item.contact_name||'',phone:item.phone||'',email:item.email||'',notes:item.notes||''}));
  state.financialEntries = financialEntries.map(item=>({id:item.id,type:item.entry_type,description:item.description,category:item.category,value:+item.amount,dueDate:item.due_date,status:item.status,paymentDate:item.payment_date,payment:item.payment_method||'',notes:item.notes||''}));
  state.followups = followups.map(item=>({id:item.id,clientId:item.client_id,client:item.client_name,channel:item.channel,date:item.scheduled_for,message:item.message,status:item.status}));
  state.devices = devices.map(item=>({id:item.id,inventoryId:item.inventory_id,supplierId:item.supplier_id,brand:item.brand,model:item.model,storage:item.storage||'',color:item.color||'',condition:item.condition,grade:item.grade||'',imei1:item.imei1||'',imei2:item.imei2||'',serialNumber:item.serial_number||'',batteryHealth:item.battery_health,purchaseDate:item.purchase_date,purchasePrice:+item.purchase_price,salePrice:+item.sale_price,status:item.status,includesBox:item.includes_box,includesCable:item.includes_cable,includesCharger:item.includes_charger,notes:item.notes||'',createdAt:item.created_at}));
  const portfolioResult = await client.from('repair_portfolio').select('*').order('sort_order').order('created_at', { ascending: false });
  state.portfolioReady = !portfolioResult.error;
  state.portfolio = (portfolioResult.data || []).map(item => ({ id:item.id,title:item.title,deviceModel:item.device_model,repairType:item.repair_type,description:item.description||'',imagePath:item.image_path,published:item.published,sortOrder:item.sort_order,createdAt:item.created_at,publicUrl:client.storage.from('repair-portfolio').getPublicUrl(item.image_path).data.publicUrl }));
}
const sum = items => items.reduce((total, value) => total + value, 0);
const startOfWeek = () => { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0, 10); };
const monthPrefix = () => today().slice(0, 7);
const initials = name => name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const getSales = predicate => state.sales.filter(predicate);
const revenue = sales => sum(sales.map(s => +s.value));
const profit = sales => sum(sales.map(s => +s.value - +s.cost - +(s.cardFee || 0) - +(s.commission || 0)));

const motivational = [
  'Excelência não é um ato. É o nosso padrão em cada detalhe.',
  'Cada cliente bem atendido é uma história que volta e indica.',
  'Grandes resultados nascem da consistência dos pequenos cuidados.',
  'Hoje é mais uma chance de transformar confiança em resultado.',
  'Cuidamos de tecnologia. Construímos relacionamentos.',
  'O próximo nível da IMG TECH começa nas decisões de hoje.'
];

function openApp() {
  $('#app').hidden = false;
  $('#manager-display').textContent = currentMember?.name || state.settings.managerName || 'Gestor';
  $('#manager-avatar').textContent = initials(currentMember?.name || state.settings.managerName || 'G');
  $('.manager small').textContent = currentMember?.roles?.map(roleName).join(' + ') || 'Administrador';
  applyPermissions();
  renderAll();
}

const roleName = role => ({admin:'ADM Geral',vendedor:'Vendedor',tecnico:'Técnico'})[role] || role;
function canAccess(page) {
  if (hasRole('admin')) return true;
  if (['sales','estimates','crm'].includes(page)) return hasRole('vendedor');
  if (page === 'portfolio') return hasRole('tecnico');
  if (['dashboard','orders','clients','inventory','devices','tasks','tools'].includes(page)) return hasRole('vendedor') || hasRole('tecnico');
  return false;
}
function applyPermissions() {
  $$('.nav-item[data-page],.mobile-nav-item[data-page]').forEach(button => button.hidden = !canAccess(button.dataset.page));
  $$('[data-open="sale"]').forEach(button => button.hidden = !(hasRole('admin') || hasRole('vendedor')));
  $$('[data-open="order"]').forEach(button => button.hidden = !(hasRole('admin') || hasRole('tecnico') || hasRole('vendedor')));
  $$('[data-open="expense"],[data-open="employee"]').forEach(button => button.hidden = !hasRole('admin'));
  $$('[data-open="supplier"],[data-open="financeEntry"]').forEach(button => button.hidden = !hasRole('admin'));
  $$('[data-open="inventory"]').forEach(button => button.hidden = !(hasRole('admin') || hasRole('tecnico')));
  $$('[data-open="device"],[data-command="device"]').forEach(button => button.hidden = !(hasRole('admin') || hasRole('tecnico')));
  $$('[data-page-link="settings"]').forEach(button => button.hidden = !hasRole('admin'));
  $$('[data-command="sale"]').forEach(button => button.hidden = !(hasRole('admin') || hasRole('vendedor')));
  $$('[data-command="expense"]').forEach(button => button.hidden = !hasRole('admin'));
}

function setupLiveSync() {
  let refreshTimer;
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        await loadOperationalData();
        const refreshedMember = state.members.find(member => member.id === currentUserId);
        if (!refreshedMember?.active) { await client.auth.signOut(); location.replace('/PainelIMG'); return; }
        currentMember = refreshedMember;
        applyPermissions();
        renderAll();
      } catch (_) { /* mantém a última visão válida */ }
    }, 450);
  };
  client.channel('gw-operacao-ao-vivo')
    .on('postgres_changes', { event: '*', schema: 'public' }, refresh)
    .subscribe();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

function exportOperationalBackup() {
  const backup = {
    generatedAt: new Date().toISOString(),
    business: state.settings.businessName,
    clients: state.clients,
    sales: state.sales,
    serviceOrders: state.orders,
    inventory: state.inventory,
    devices: state.devices,
    expenses: state.expenses,
    tasks: state.tasks,
    catalog: state.catalog
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gw-phonne-backup-${today()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Backup gerado', 'Guarde o arquivo em um local seguro.');
}

function showToast(title, message = '') {
  $('#toast b').textContent = title;
  $('#toast small').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2800);
}

function navigate(page) {
  if (!canAccess(page)) return showToast('Acesso restrito', 'Sua função não permite abrir esta área.');
  $$('.page').forEach(item => item.classList.toggle('active', item.id === `page-${page}`));
  $$('.nav-item[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === page));
  $$('.mobile-nav-item[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === page));
  const names = { dashboard: 'Visão geral', sales: 'Vendas', estimates:'Orçamentos', orders: 'Ordens de serviço', clients: 'Clientes', crm:'Pós-venda', inventory: 'Estoque', devices:'Dispositivos', suppliers:'Fornecedores', finance: 'Financeiro', tools:'Ferramentas', tasks: 'Agenda & tarefas', team: 'Equipe & acessos', site: 'Site público', settings: 'Configurações' };
  $('#page-title').textContent = names[page];
  $('.sidebar').classList.remove('open');
  $('#sidebar-overlay').classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDashboard() {
  const daily = getSales(s => s.date === today());
  const weekly = getSales(s => s.date >= startOfWeek());
  const monthly = getSales(s => s.date.startsWith(monthPrefix()));
  const monthlyRevenue = revenue(monthly);
  const monthlyExpenses = sum((state.expenses || []).filter(e => e.date.startsWith(monthPrefix())).map(e => +e.value));
  const monthlyProfit = profit(monthly) - monthlyExpenses;
  const pct = state.settings.monthlyGoal > 0 ? Math.min(100, Math.round(monthlyRevenue / state.settings.monthlyGoal * 100) || 0) : 0;
  $('#daily-message').textContent = `“${motivational[new Date().getDate() % motivational.length]}”`;
  $('#sales-today').textContent = money(revenue(daily)); $('#sales-today-count').textContent = `${daily.length} venda${daily.length === 1 ? '' : 's'}`;
  $('#sales-week').textContent = money(revenue(weekly)); $('#sales-week-count').textContent = `${weekly.length} vendas na semana`;
  $('#profit-month').textContent = money(monthlyProfit); $('#profit-margin').textContent = `${monthlyRevenue ? Math.round(monthlyProfit / monthlyRevenue * 100) : 0}% de margem`;
  $('#clients-total').textContent = state.clients.length; $('#clients-new').textContent = `${state.clients.filter(c => c.since.startsWith(monthPrefix())).length} novos no mês`;
  $('#goal-percent').textContent = `${pct}%`; $('#goal-ring').style.setProperty('--pct', `${pct * 3.6}deg`);
  $('#target-current').textContent = money(monthlyRevenue); $('#target-total').textContent = money(state.settings.monthlyGoal); $('#target-progress').style.width = `${pct}%`;
  $('#target-remaining').textContent = state.settings.monthlyGoal <= 0 ? 'Defina a primeira meta mensal nas configurações.' : pct >= 100 ? 'Meta alcançada. Excelente trabalho!' : `Faltam ${money(Math.max(0, state.settings.monthlyGoal - monthlyRevenue))} para alcançar a meta.`;
  $('#average-ticket').textContent = money(monthly.length ? monthlyRevenue / monthly.length : 0);
  const elapsed = new Date().getDate(); const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  $('#projection').textContent = money(elapsed ? monthlyRevenue / elapsed * days : 0);
  $('#recent-orders').innerHTML = state.orders.slice().sort((a,b) => b.id-a.id).slice(0,4).map(o => `<div class="compact-item"><div class="compact-icon">#${String(o.id).slice(-2)}</div><div><b>${o.device} · ${o.client}</b><small>${o.service}</small></div><span class="status ${o.status}">${statusName(o.status)}</span></div>`).join('') || empty('Nenhuma ordem registrada.');
  $('#recent-sales').innerHTML = state.sales.slice().sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id).slice(0,4).map(s => `<div class="compact-item"><div class="compact-icon">${initials(s.client)}</div><div><b>${s.product}</b><small>${s.client} · ${formatDate(s.date)}</small></div><strong>${money(s.value)}</strong></div>`).join('') || empty('Nenhuma venda registrada.');
  const low = state.inventory.filter(item => item.qty <= item.min).length;
  $('#insight-grid').innerHTML = `<div class="insight"><span>⚡</span><div><b>${daily.length ? 'Dia em movimento' : 'Primeira venda do dia'}</b><small>${daily.length ? `${daily.length} vendas registradas hoje. Continue o ritmo.` : 'Registre a primeira oportunidade assim que ela chegar.'}</small></div></div><div class="insight"><span>◫</span><div><b>${state.inventory.length ? `${low} itens pedem atenção` : 'Cadastre seu estoque'}</b><small>${state.inventory.length ? 'Confira o estoque mínimo para não perder vendas e reparos.' : 'Ative os alertas inteligentes adicionando aparelhos, peças e acessórios.'}</small></div></div><div class="insight"><span>◎</span><div><b>${state.clients.length ? 'Relacionamento é receita' : 'Construa sua base'}</b><small>${state.clients.length ? `${state.clients.length} clientes na base. Use o histórico para gerar novas oportunidades.` : 'Cadastre o primeiro cliente para iniciar um histórico de relacionamento.'}</small></div></div>`;
  const whatsappMonth = (state.siteEvents || []).filter(event => event.event_type === 'whatsapp_click' && event.created_at.startsWith(monthPrefix())).length;
  $('#insight-grid').insertAdjacentHTML('beforeend', `<div class="insight"><span>↗</span><div><b>${whatsappMonth} contatos pelo site</b><small>Cliques no WhatsApp registrados neste mês.</small></div></div>`);
  $('#open-orders-count').textContent = state.orders.filter(o => o.status !== 'entregue').length;
  renderOperations();
  renderChart(+$('#chart-period').value);
}

function renderOperations() {
  const pending = (state.tasks || []).filter(task => !task.done).sort((a,b) => a.date.localeCompare(b.date));
  $('#tasks-count').textContent = pending.length;
  $('#task-preview').innerHTML = pending.slice(0,3).map(task => `<div class="task-row"><button class="task-check" data-task-done="${task.id}"></button><div><b>${task.title}</b><small>${task.category} · ${formatDate(task.date)}</small></div><span class="priority ${task.priority}">${task.priority}</span></div>`).join('') || `<div class="smart-empty"><span>✓</span><div><b>Agenda limpa</b><small>Crie lembretes de retorno, compras e prioridades da equipe.</small></div><button data-open="task">Criar tarefa</button></div>`;
  const openOrders = state.orders.filter(order => order.status !== 'entregue').length;
  const lowStock = state.inventory.filter(item => item.qty <= item.min).length;
  const goalProgress = state.settings.monthlyGoal ? Math.round(revenue(getSales(s => s.date.startsWith(monthPrefix()))) / state.settings.monthlyGoal * 100) : 0;
  $('#business-radar').innerHTML = `<div><span>Operação</span><b>${openOrders ? `${openOrders} OS em andamento` : 'Sem OS pendentes'}</b><i class="${openOrders ? 'attention' : 'healthy'}"></i></div><div><span>Estoque</span><b>${!state.inventory.length ? 'Aguardando cadastro' : lowStock ? `${lowStock} itens para repor` : 'Estoque sob controle'}</b><i class="${!state.inventory.length ? 'neutral' : lowStock ? 'attention' : 'healthy'}"></i></div><div><span>Meta mensal</span><b>${state.settings.monthlyGoal ? `${goalProgress}% alcançada` : 'Aguardando definição'}</b><i class="${goalProgress >= 75 ? 'healthy' : 'neutral'}"></i></div>`;
}

function renderChart(period) {
  const data = Array.from({ length: period }, (_, index) => {
    const date = daysAgo(period - index - 1); const sales = getSales(s => s.date === date);
    return { date, revenue: revenue(sales), profit: profit(sales) };
  });
  const max = Math.max(...data.map(d => d.revenue), 1000); const w = 700, h = 230, pad = 20;
  const points = key => data.map((d,i) => `${pad + i * (w - pad*2) / Math.max(1,data.length-1)},${h - d[key] / max * (h-50)}`).join(' ');
  const labels = data.filter((_,i) => i % Math.max(1,Math.floor(period/6)) === 0).map((d,i) => `<text x="${pad + (i*Math.max(1,Math.floor(period/6))) * (w-pad*2)/Math.max(1,data.length-1)}" y="255" fill="#6c6963" font-size="9">${d.date.slice(8)}/${d.date.slice(5,7)}</text>`).join('');
  $('#performance-chart').innerHTML = `<defs><linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8322d" stop-opacity=".32"/><stop offset="1" stop-color="#e8322d" stop-opacity="0"/></linearGradient></defs>${[45,90,135,180,225].map(y=>`<line x1="20" y1="${y}" x2="680" y2="${y}" stroke="currentColor" opacity=".08"/>`).join('')}<polygon points="20,230 ${points('revenue')} 680,230" fill="url(#fillSales)"/><polyline points="${points('revenue')}" fill="none" stroke="#e8322d" stroke-width="3" vector-effect="non-scaling-stroke"/><polyline points="${points('profit')}" fill="none" stroke="#e7b65a" stroke-width="2" vector-effect="non-scaling-stroke"/>${labels}`;
}

function renderSales() {
  const monthly = getSales(s => s.date.startsWith(monthPrefix()));
  $('#sales-summary').innerHTML = [['Faturamento do mês',money(revenue(monthly))],['Lucro do mês',money(profit(monthly))],['Vendas realizadas',monthly.length],['Ticket médio',money(monthly.length ? revenue(monthly)/monthly.length : 0)]].map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
  filterSales();
}
function filterSales(){ const term = ($('[data-search="sales"]').value||'').toLowerCase(); const method=$('#sales-filter').value; const rows=state.sales.filter(s=>(method==='all'||s.payment===method)&&`${s.client} ${s.product} ${s.sellerName} ${s.warrantyTerm}`.toLowerCase().includes(term)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||'')); $('#sales-table').innerHTML=rows.map(s=>`<tr><td>${formatDate(s.date)}</td><td><b>${html(s.client)}</b></td><td>${html(s.product)}${s.quantity>1?`<small style="display:block">Quantidade: ${s.quantity}</small>`:''}${s.tradeIn?`<small style="display:block">Troca: ${html(s.tradeIn)}</small>`:''}</td><td><b>${html(s.sellerName||'Não informado')}</b><small style="display:block">Garantia: ${html(window.GW_SALE_WARRANTY_TERMS?.[s.warrantyType]?.label||'Personalizada')}</small></td><td><span class="status ok">${html(s.payment)}${s.installments>1?` · ${s.installments}x`:''}</span></td><td><b>${money(s.value)}</b></td><td><b style="color:var(--green)">${money(s.value-s.cost-(s.cardFee||0)-(s.commission||0))}</b></td><td><div class="row-actions"><button class="row-action" data-print-sale="${s.id}" title="Recibo">⎙</button>${hasRole('admin')?`<button class="row-action" data-delete="sale" data-id="${s.id}" title="Excluir">×</button>`:''}</div></td></tr>`).join('')||`<tr><td colspan="8">Nenhuma venda encontrada.</td></tr>`; }

function warrantyReceiptHtml(term){
  const lines=String(term||'Termo não informado.').split(/\n+/).map(line=>line.trim()).filter(Boolean);
  let output='';
  let listOpen=false;
  const closeList=()=>{if(listOpen){output+='</ul>';listOpen=false;}};
  lines.forEach(line=>{
    if(line.startsWith('- ')){
      if(!listOpen){output+='<ul>';listOpen=true;}
      output+=`<li>${html(line.slice(2))}</li>`;
      return;
    }
    closeList();
    if(line===line.toUpperCase()&&line.length<80){output+=`<h3>${html(line)}</h3>`;return;}
    const clause=line.match(/^(Cláusula\s+\d+ª:)(.*)$/i);
    output+=clause?`<p><b>${html(clause[1])}</b>${html(clause[2])}</p>`:`<p>${html(line)}</p>`;
  });
  closeList();
  return output;
}

function printSaleReceipt(sale){
  if(!sale)return;
  const popup=window.open('','_blank','width=980,height=900');
  const receiptNumber=`GW${String(sale.id).replace(/-/g,'').slice(0,10).toUpperCase()}`;
  const saleDate=new Date(`${sale.date}T12:00:00`).toLocaleDateString('pt-BR');
  const unitValue=(sale.value+(sale.discount||0))/Math.max(1,sale.quantity);
  const conditionName=({novo:'NOVO',seminovo:'SEMINOVO',recondicionado:'RECONDICIONADO'})[sale.productCondition]||'';
  const productDetails=[sale.product,conditionName,sale.deviceStorage,sale.deviceColor,sale.deviceImei?`IMEI: ${sale.deviceImei}`:'',sale.deviceSerial?`Série: ${sale.deviceSerial}`:'',sale.deviceBatteryHealth===null||sale.deviceBatteryHealth===undefined?'':`Saúde da bateria: ${sale.deviceBatteryHealth}%`].filter(Boolean).join(' - ');
  const warrantyLabel=window.GW_SALE_WARRANTY_TERMS?.[sale.warrantyType]?.label||'Termo personalizado';
  const logoUrl=new URL('/assets/logo.png',location.origin).href;
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Recibo ${receiptNumber} | IMG TECH</title><style>
    @page{size:A4;margin:9mm}*{box-sizing:border-box}body{margin:0;color:#171717;font:10px Arial,sans-serif;line-height:1.38}main{max-width:190mm;margin:auto}.stub{border:1px solid #777;margin-bottom:5mm}.stub-title{padding:2mm;font-size:12px;font-weight:800;border-bottom:1px solid #777}.stub-grid{display:grid;grid-template-columns:1fr 1.5fr .85fr}.stub-grid div{min-height:10mm;padding:1.5mm;border-right:1px solid #777}.stub-grid div:last-child{border:0}.dash{border-top:1px dashed #333;margin:0 0 4mm}.brand-grid{display:grid;grid-template-columns:35mm 1fr 48mm;border:1px solid #777;margin-bottom:5mm}.brand-grid>div{padding:3mm;border-right:1px solid #777;text-align:center;display:flex;flex-direction:column;justify-content:center}.brand-grid>div:last-child{border:0}.brand-grid img{width:22mm;height:22mm;object-fit:contain;margin:auto}.brand-name{font-weight:800;font-size:12px}.sale-meta{font-size:11px;line-height:1.45}.sale-meta b{font-size:12px}.section-title{font-size:11px;margin:4mm 0 1mm;font-weight:800}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #888;padding:1.5mm;vertical-align:top;overflow-wrap:anywhere}th{background:#eef0f1;text-align:center;font-size:10px}td.right{text-align:right}td.center{text-align:center}.client-grid td{height:7mm}.product-table .code{width:18mm}.product-table .qty{width:10mm}.product-table .money-col{width:26mm}.payment-table th:nth-child(1){width:34%}.payment-table th:nth-child(4){width:14mm}.notes{min-height:8mm;border-bottom:1px solid #aaa;padding:1mm 0}.terms{margin-top:5mm;font-size:8.7px;line-height:1.45}.terms h2{font-size:11px;margin:0 0 3mm}.terms h3{font-size:9.5px;margin:4mm 0 1.5mm;border-bottom:1px solid #ccc;padding-bottom:1mm;break-after:avoid}.terms p{margin:0 0 2.2mm;text-align:justify}.terms ul{margin:0 0 2.5mm;padding-left:6mm}.terms li{margin:.7mm 0;text-align:justify}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:13mm;break-inside:avoid}.signature{border-top:1px solid #333;text-align:center;padding-top:2mm;font-size:9px}.thanks{text-align:center;font:10px Georgia,serif;margin-top:3mm}.muted{color:#555}.no-print{position:fixed;right:15px;top:15px;border:0;border-radius:8px;padding:10px 16px;background:#e8322d;color:#fff;font-weight:700}@media print{.no-print{display:none}}
  </style></head><body><button class="no-print" onclick="window.print()">Imprimir novamente</button><main>
    <section class="stub"><div class="stub-title">RECIBO DE IMG TECH - PRODUTOS E/OU SERVIÇOS CONSTANTES NO PEDIDO</div><div class="stub-grid"><div><b>Data de recebimento</b><br>${saleDate}</div><div><b>Identificação e assinatura do recebedor</b></div><div><b>Recibo da venda:</b><br>${receiptNumber}</div></div></section><div class="dash"></div>
    <header class="brand-grid"><div><img src="${logoUrl}" alt="IMG TECH"></div><div><span class="brand-name">IMG TECH</span><span>${html(state.public.address)}</span><b>CNPJ: 48.335.037/0001-05</b><span><b>Telefone:</b> ${html(state.public.storePhone)} &nbsp; ${html(state.public.instagram)}</span></div><div class="sale-meta"><b>${saleDate}</b><strong>VENDEDOR: ${html((sale.sellerName||'Não informado').toUpperCase())}</strong><span>RECIBO DA VENDA:</span><b>${receiptNumber}</b></div></header>
    <h2 class="section-title">DESTINATÁRIO/REMETENTE</h2><table class="client-grid"><tr><th>Nome/Razão social</th><th>Telefone</th><th>CPF/CNPJ</th><th>E-mail</th></tr><tr><td>${html(sale.client)}</td><td>${html(sale.clientPhone||'')}</td><td>${html(sale.clientDocument||'')}</td><td>${html(sale.clientEmail||'')}</td></tr><tr><th>Endereço</th><th>CEP</th><th>Cidade</th><th>Estado</th></tr><tr><td>${html(sale.clientAddress||'')}</td><td>${html(sale.clientCep||'')}</td><td>${html(sale.clientCity||'')}</td><td>${html(sale.clientState||'')}</td></tr></table>
    <h2 class="section-title">DADOS DO PRODUTO</h2><table class="product-table"><tr><th class="code">Cód.</th><th>Produto</th><th class="qty">Qtd</th><th class="money-col">Valor unitário</th><th class="money-col">Desconto</th><th class="money-col">Valor total</th></tr><tr><td>${html(receiptNumber.slice(-8))}</td><td>${html(productDetails)}<br><b>Garantia:</b> ${html(warrantyLabel)}</td><td class="center">${sale.quantity}</td><td class="right">${money(unitValue)}</td><td class="right">${money(sale.discount||0)}</td><td class="right"><b>${money(sale.value)}</b></td></tr><tr><td colspan="3" class="right"><b>Total</b></td><td class="right">${money(unitValue*sale.quantity)}</td><td class="right">${money(sale.discount||0)}</td><td class="right"><b>${money(sale.value)}</b></td></tr></table>
    <h2 class="section-title">PAGAMENTO</h2><table class="payment-table"><tr><th>Forma de pagamento</th><th>Detalhes</th><th>Valor pago</th><th>Parcelas</th></tr><tr><td>${html(sale.payment.toUpperCase())}</td><td>${sale.tradeIn?`Troca: ${html(sale.tradeIn)}`:''}</td><td class="right">${money(sale.value)}</td><td class="center">${sale.installments}</td></tr><tr><td colspan="2" class="right"><b>Total</b></td><td class="right"><b>${money(sale.value)}</b></td><td></td></tr></table>
    <h2 class="section-title">OBSERVAÇÃO</h2><div class="notes">${html(sale.notes||'')}</div>
    <section class="terms"><h2>DADOS ADICIONAIS - ${html(warrantyLabel.toUpperCase())}</h2>${warrantyReceiptHtml(sale.warrantyTerm)}</section>
    <section class="signatures"><div class="signature">${html(sale.client.toUpperCase())}<br><span class="muted">COMPRADOR</span></div><div class="signature">IMG TECH<br><span class="muted">VENDEDORA</span></div></section><div class="thanks">OBRIGADO PELA PREFERÊNCIA.</div>
  </main><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  popup.document.close();
}

const estimateStatusName=status=>({rascunho:'Rascunho',enviado:'Enviado',aprovado:'Aprovado',recusado:'Recusado',convertido:'Convertido'})[status]||status;
function renderEstimates(){
  const approved=state.estimates.filter(item=>item.status==='aprovado');
  $('#estimates-summary').innerHTML=[['Orçamentos',state.estimates.length],['Em análise',state.estimates.filter(item=>['rascunho','enviado'].includes(item.status)).length],['Aprovados',approved.length],['Valor aprovado',money(sum(approved.map(item=>item.value)))]].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
  filterEstimates();
}
function filterEstimates(){
  const term=($('[data-search="estimates"]').value||'').toLowerCase();
  const status=$('#estimates-filter').value;
  const rows=state.estimates.filter(item=>(status==='all'||item.status===status)&&`${item.client} ${item.device} ${item.description}`.toLowerCase().includes(term));
  $('#estimates-table').innerHTML=rows.map(item=>`<tr><td><b>#${String(item.id).padStart(4,'0')}</b></td><td><b>${html(item.client)}</b><small style="display:block">${html(item.phone)}</small></td><td>${html(item.device)}<small style="display:block">${html(item.description)}</small></td><td>${formatDate(item.validUntil)}</td><td><b>${money(item.value)}</b></td><td><select class="inline-select" data-estimate-status="${item.id}">${['rascunho','enviado','aprovado','recusado'].map(option=>`<option value="${option}" ${item.status===option?'selected':''}>${estimateStatusName(option)}</option>`).join('')}</select></td><td><div class="row-actions"><button class="row-action" data-print-estimate="${item.id}" title="Imprimir">⎙</button>${hasRole('admin')?`<button class="row-action" data-delete="estimate" data-id="${item.id}" title="Excluir">×</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="7">Nenhum orçamento encontrado.</td></tr>';
}

function printEstimate(item){
  if(!item)return;
  const popup=window.open('','_blank','width=850,height=900');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Orçamento ${item.id} | IMG TECH</title><style>body{font:15px Arial;color:#171717;padding:42px;line-height:1.55}header{display:flex;justify-content:space-between;border-bottom:3px solid #e8322d;padding-bottom:18px}h1{margin:0}.box{border:1px solid #ccc;border-radius:8px;padding:16px;margin:22px 0}.total{font-size:28px;color:#e8322d}.signature{margin-top:75px;border-top:1px solid;text-align:center;padding-top:8px}@media print{button{display:none}}</style></head><body><header><div><h1>IMG TECH</h1><span>iPhones e assistência especializada Apple</span></div><b>ORÇAMENTO #${String(item.id).padStart(4,'0')}</b></header><div class="box"><b>Cliente</b><br>${html(item.client)} · ${html(item.phone||'')}<br><br><b>Aparelho</b><br>${html(item.device)}</div><h3>Descrição</h3><p>${html(item.description)}</p>${item.notes?`<p><b>Observações:</b> ${html(item.notes)}</p>`:''}<div class="box"><span>Valor total</span><br><b class="total">${money(item.value)}</b><br><small>Proposta válida até ${formatDate(item.validUntil)}.</small></div><p>Valores e disponibilidade sujeitos à confirmação até a data de validade indicada.</p><div class="signature">IMG TECH</div><script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}

const statusName = status => ({recebido:'Recebido',diagnostico:'Diagnóstico',reparo:'Em reparo',pronto:'Pronto',entregue:'Entregue'})[status] || status;
let orderView = 'kanban';
function orderMatches(o){
  const term = ($('#order-search')?.value || '').trim().toLowerCase();
  const filter = $('#orders-filter')?.value || 'ativas';
  const statusMatches = filter === 'all' || (filter === 'ativas' ? o.status !== 'entregue' : o.status === filter);
  return statusMatches && `${o.id} ${o.client} ${o.phone} ${o.device} ${o.imeiSerial} ${o.service}`.toLowerCase().includes(term);
}
function orderActions(o, canAdvance){return `<div class="row-actions"><button class="row-action" data-print-order="${o.id}" title="Imprimir OS">⎙</button>${canAdvance&&o.status!=='entregue'?`<button class="row-action" data-advance="${o.id}" title="${o.status==='pronto'?'Confirmar entrega':'Avançar etapa'}">→</button>`:''}</div>`;}
function renderOrders(){
  const canAdvance=hasRole('admin')||hasRole('tecnico');
  const active=state.orders.filter(o=>o.status!=='entregue');
  const overdue=active.filter(o=>o.deadline&&o.deadline<today());
  $('#orders-summary').innerHTML=[['OS ativas',active.length],['Aguardando aprovação',active.filter(o=>o.approvalStatus!=='aprovado').length],['Prontas para retirada',active.filter(o=>o.status==='pronto').length],['Prazos vencidos',overdue.length]].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
  const filtered=state.orders.filter(orderMatches);
  const groups=['recebido','diagnostico','reparo','pronto'];
  $('#orders-kanban').innerHTML=groups.map(status=>{const orders=filtered.filter(o=>o.status===status);return `<div class="kanban-column"><div class="kanban-head"><b>${statusName(status)}</b><span>${orders.length}</span></div>${orders.map(o=>`<article class="order-card"><span>#OS-${o.id} · Retirada ${html(o.pickupCode)}</span><h3>${html(o.device)}</h3><p>${html(o.client)} · ${html(o.service)}</p><small>${o.imeiSerial?`IMEI/Série: ${html(o.imeiSerial)} · `:''}Aceite: ${o.customerAccepted?'registrado':'pendente'}</small>${canAdvance?`<label class="order-approval">Autorização<select data-order-approval="${o.id}"><option value="pendente" ${o.approvalStatus==='pendente'?'selected':''}>Pendente</option><option value="aprovado" ${o.approvalStatus==='aprovado'?'selected':''}>Aprovado</option><option value="recusado" ${o.approvalStatus==='recusado'?'selected':''}>Recusado</option></select></label>`:`<span class="status ${o.approvalStatus==='aprovado'?'ok':'recebido'}">${o.approvalStatus==='aprovado'?'Aprovado':'Aguardando aprovação'}</span>`}<div class="order-card-footer"><small>Prazo ${formatDate(o.deadline)}</small>${orderActions(o,canAdvance)}</div></article>`).join('')||empty('Nenhuma OS nesta etapa.')}</div>`}).join('');
  $('#orders-table').innerHTML=filtered.map(o=>`<tr><td><b>#OS-${o.id}</b><small style="display:block">${html(o.pickupCode)}</small></td><td><b>${html(o.client)}</b><small style="display:block">${html(o.phone)}</small></td><td>${html(o.device)}<small style="display:block">${html(o.imeiSerial)}</small></td><td>${html(o.service)}</td><td>${formatDate(o.deadline)}</td><td><span class="status ${o.status==='entregue'||o.status==='pronto'?'ok':'recebido'}">${statusName(o.status)}</span></td><td>${orderActions(o,canAdvance)}</td></tr>`).join('')||'<tr><td colspan="7">Nenhuma ordem encontrada.</td></tr>';
  $('#orders-kanban').hidden=orderView!=='kanban'; $('#orders-list').hidden=orderView!=='list';
  $$('[data-order-view]').forEach(button=>button.classList.toggle('active',button.dataset.orderView===orderView));
}

function printServiceOrder(order){
  if(!order)return;
  const checklistLabels={screen:'Tela',camera:'Câmeras',buttons:'Botões',charging:'Carregamento',biometry:'Biometria',audio:'Áudio',wifi:'Wi-Fi/Bluetooth'};
  const checklistStates={ok:'Funcionando',falha:'Com falha',nao_testado:'Não testado'};
  const checklist=Object.entries(order.checklist||{}).map(([key,value])=>`${checklistLabels[key]||key}: ${checklistStates[value]||(value?'Funcionando':'Não testado')}`).join(' · ');
  const unlockNames={sem_bloqueio:'Sem bloqueio',cliente_presente:'Cliente desbloqueia presencialmente',apos_autorizacao:'Acesso somente após autorização'};
  const authorizationNames={presencial:'Aceite presencial',whatsapp:'Aprovação por WhatsApp',assinatura_impressa:'Assinatura na via impressa'};
  const findMyNames={desativado:'Desativado',ativado:'Ativado',nao_testado:'Não conferido'};
  const simNames={retirado:'Retirado',no_aparelho:'Entregue no aparelho',esim:'eSIM',nao_testado:'Não conferido'};
  const oldPartsNames={devolver:'Devolver ao cliente',descartar:'Descarte autorizado',nao_aplicavel:'Não se aplica'};
  const popup=window.open('','_blank','width=850,height=900');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>OS ${order.id} | IMG TECH</title><style>@page{margin:10mm}body{font:11px Arial;color:#171717;line-height:1.4}header{display:flex;justify-content:space-between;border-bottom:3px solid #e8322d;padding-bottom:10px}h1{margin:0}h2{font-size:12px;margin:12px 0 6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.box{border:1px solid #bbb;border-radius:6px;padding:8px}.terms{font-size:8.5px;border:1px solid #bbb;border-radius:6px;padding:8px}.terms li{margin:3px 0}.signature{margin-top:28px;display:flex;gap:36px}.signature div{flex:1;border-top:1px solid;text-align:center;padding-top:6px}.code{font:700 17px monospace;color:#e8322d}@media print{button{display:none}}</style></head><body><header><div><h1>IMG TECH</h1><span>Assistência especializada Apple</span></div><div><b>ORDEM DE SERVIÇO #${order.id}</b><br>Código de retirada: <span class="code">${html(order.pickupCode)}</span></div></header><h2>Cliente e equipamento</h2><section class="grid"><div class="box"><b>Cliente</b><br>${html(order.client)} · ${html(order.phone)}<br>Documento: ${html(order.customerDocument||'não informado')}</div><div class="box"><b>Aparelho</b><br>${html(order.device)}<br>${html(order.imeiSerial||'IMEI/série não informado')}</div><div class="box"><b>Estado declarado na entrada</b><br>${html(order.deviceCondition||'Não informado')}</div><div class="box"><b>Itens entregues</b><br>${html(order.includedItems||'Somente o aparelho')}</div></section><h2>Conferências preventivas</h2><section class="grid"><div class="box"><b>Buscar iPhone / Conta Apple</b><br>${html(findMyNames[order.findMyStatus]||'Não conferido')}<br><b>Chip / linha</b>: ${html(simNames[order.simStatus]||'Não conferido')}</div><div class="box"><b>Peças substituídas</b><br>${html(oldPartsNames[order.oldPartsPreference]||'Não informado')}<br><b>Redefinição de dados</b>: ${order.dataResetAuthorized?'Autorizada se necessária':'NÃO autorizada'}</div><div class="box"><b>Pessoa autorizada para retirada</b><br>${html(order.authorizedPickupName||'Somente o cliente')}<br>${html(order.authorizedPickupDocument||'')}</div><div class="box"><b>Acesso ao aparelho</b><br>${html(unlockNames[order.unlockArrangement]||'Não informado')}<br>A senha não é registrada nesta OS.</div></section><h2>Solicitação e checklist</h2><section class="box"><b>Defeito/serviço relatado</b><p>${html(order.service)}</p><b>Checklist funcional</b><p>${html(checklist||'Não preenchido')}</p><b>Observações</b><p>${html(order.notes||'—')}</p></section><section class="grid"><div class="box"><b>Valor informado</b><br>${money(order.value)}<br><small>Serviços adicionais dependem de aprovação.</small></div><div class="box"><b>Autorização</b><br>${html(authorizationNames[order.authorizationMethod]||'Não informada')}<br>Status: ${order.approvalStatus==='aprovado'?'APROVADO':order.approvalStatus==='recusado'?'RECUSADO':'PENDENTE'}${order.approvalReference?`<br>Referência: ${html(order.approvalReference)} · ${money(order.approvedAmount)}`:''}</div></section><h2>Ciência e autorização</h2><div class="terms"><ol><li>O cliente confirma os dados, o estado aparente e os itens entregues descritos nesta OS.</li><li>A abertura autoriza o diagnóstico. Reparos, peças ou valores adicionais somente serão executados após aprovação registrada.</li><li>O cliente foi orientado a manter cópia de segurança. A IMG TECH tratará somente os dados necessários ao atendimento.</li><li>A abertura do aparelho pode alterar a vedação existente. Defeitos ocultos ou intermitentes serão comunicados antes de serviço adicional.</li><li>A retirada será conferida pelo código acima e pela identificação do cliente ou pessoa autorizada.</li></ol><b>Aceite: ${order.customerAccepted?'SIM':'NÃO'} · Privacidade: ${order.privacyAcknowledged?'SIM':'NÃO'} · Backup: ${order.backupAcknowledged?'SIM':'NÃO'} · Abertura/vedação: ${order.waterResistanceAcknowledged?'SIM':'NÃO'}</b></div><div class="signature"><div>Responsável IMG TECH</div><div>Cliente / responsável</div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}

function renderClients(){ filterClients(); }
function filterClients(){const term=($('[data-search="clients"]').value||'').toLowerCase();const clients=state.clients.filter(c=>`${c.name} ${c.phone}`.toLowerCase().includes(term));$('#client-count-label').textContent=`${clients.length} clientes`;$('#clients-grid').innerHTML=clients.map(c=>`<article class="client-card"><div class="client-top"><div class="avatar">${initials(c.name)}</div><div><h3>${c.name}</h3><small>${c.phone}${c.email?` · ${c.email}`:''}</small></div></div><div><div><span>Total movimentado</span><b>${money(c.total)}</b></div><div><span>Atendimentos</span><b>${c.visits}</b></div></div></article>`).join('')||empty('Nenhum cliente encontrado.');}

function renderCrm(){
  const pending=state.followups.filter(item=>item.status==='pendente');
  $('#crm-summary').innerHTML=[['Contatos agendados',state.followups.length],['Pendentes',pending.length],['Para hoje',pending.filter(item=>item.date===today()).length],['Concluídos',state.followups.filter(item=>item.status==='concluido').length]].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
  filterCrm();
}
function filterCrm(){
  const term=($('[data-search="crm"]').value||'').toLowerCase();const status=$('#crm-filter').value;
  const rows=state.followups.filter(item=>(status==='all'||item.status===status)&&`${item.client} ${item.message}`.toLowerCase().includes(term));
  $('#crm-table').innerHTML=rows.map(item=>`<tr><td>${formatDate(item.date)}</td><td><b>${html(item.client)}</b></td><td>${html(item.channel)}</td><td>${html(item.message)}</td><td><span class="status ${item.status==='concluido'?'ok':'recebido'}">${item.status==='concluido'?'Concluído':'Pendente'}</span></td><td><div class="row-actions">${item.status==='pendente'?`<button class="row-action" data-followup-done="${item.id}" title="Concluir">✓</button>`:''}<button class="row-action" data-delete="followup" data-id="${item.id}" title="Excluir">×</button></div></td></tr>`).join('')||'<tr><td colspan="6">Nenhum contato agendado.</td></tr>';
}

function renderInventory(){filterInventory();const low=state.inventory.filter(i=>i.qty<=i.min);$('#inventory-alert').classList.toggle('show',low.length>0);$('#inventory-alert').textContent=low.length?`⚠ ${low.length} ${low.length===1?'item atingiu':'itens atingiram'} o estoque mínimo: ${low.map(i=>i.name).join(', ')}.`:'';}
function filterInventory(){const term=($('[data-search="inventory"]').value||'').toLowerCase();const category=$('#inventory-filter').value;const items=state.inventory.filter(i=>(category==='all'||i.category===category)&&i.name.toLowerCase().includes(term));const canManage=hasRole('admin')||hasRole('tecnico');$('#inventory-table').innerHTML=items.map(i=>`<tr><td><b>${html(i.name)}</b></td><td>${html(i.category)}</td><td><div class="stock ${i.qty<=i.min?'low':''}"><b>${i.qty}</b><i style="--stock:${Math.min(100,i.qty/Math.max(i.min*2,1)*100)}%"></i></div></td><td>${money(i.cost)}</td><td><b>${money(i.price)}</b></td><td><span class="status ${i.qty<=i.min?'reparo':'ok'}">${i.qty<=i.min?'Repor':'Disponível'}</span></td><td>${canManage?`<div class="row-actions"><button class="row-action" data-edit-inventory="${i.id}" title="Editar item">✎</button><button class="row-action" data-delete="inventory" data-id="${i.id}" title="Excluir item">×</button></div>`:''}</td></tr>`).join('')||`<tr><td colspan="7">Nenhum item encontrado.</td></tr>`;}

const deviceStatusName=status=>({estoque:'Em estoque',reservado:'Reservado',vendido:'Vendido',assistencia:'Na assistência',defeito:'Com defeito'})[status]||status;
const deviceConditionName=condition=>({novo:'Novo',seminovo:'Seminovo',recondicionado:'Recondicionado'})[condition]||condition;
function renderDevices(){
  const devices=state.devices||[];
  $('#devices-summary').innerHTML=[['Cadastrados',devices.length],['Em estoque',devices.filter(item=>item.status==='estoque').length],['Reservados',devices.filter(item=>item.status==='reservado').length],['Vendidos',devices.filter(item=>item.status==='vendido').length]].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
  filterDevices();
}
function filterDevices(){
  const term=($('[data-search="devices"]').value||'').toLowerCase();
  const status=$('#devices-filter').value;
  const canManage=hasRole('admin')||hasRole('tecnico');
  const rows=(state.devices||[]).filter(item=>(status==='all'||item.status===status)&&`${item.brand} ${item.model} ${item.storage} ${item.color} ${item.imei1} ${item.imei2} ${item.serialNumber}`.toLowerCase().includes(term));
  $('#devices-table').innerHTML=rows.map(item=>`<tr><td><div class="device-identity"><b>${html(item.brand)} ${html(item.model)}</b><small>${html([item.storage,item.color].filter(Boolean).join(' · ')||'Detalhes não informados')}</small></div></td><td><div class="device-codes"><code>${html(item.imei1||'IMEI não informado')}</code><small>${html(item.serialNumber?`Série: ${item.serialNumber}`:(item.imei2?`IMEI 2: ${item.imei2}`:'Sem número de série'))}</small></div></td><td><span class="condition-chip">${deviceConditionName(item.condition)}${item.grade?` · Grau ${html(item.grade)}`:''}</span></td><td>${item.batteryHealth===null||item.batteryHealth===undefined?'—':`<div class="battery-meter ${item.batteryHealth<80?'low':''}"><b>${item.batteryHealth}%</b><i style="--battery:${item.batteryHealth}%"></i></div>`}</td><td>${money(item.purchasePrice)}</td><td><b>${money(item.salePrice)}</b></td><td><span class="status ${item.status==='estoque'?'ok':item.status==='defeito'?'reparo':'recebido'}">${deviceStatusName(item.status)}</span></td><td><div class="row-actions"><button class="row-action" data-print-device="${item.id}" title="Imprimir etiqueta">▧</button>${canManage?`<button class="row-action" data-edit-device="${item.id}" title="Editar dispositivo">✎</button><button class="row-action" data-delete="device" data-id="${item.id}" title="Excluir dispositivo">×</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="8">Nenhum dispositivo cadastrado.</td></tr>';
}

function renderSuppliers(){filterSuppliers();}
function filterSuppliers(){const term=($('[data-search="suppliers"]').value||'').toLowerCase();const rows=state.suppliers.filter(item=>`${item.name} ${item.document} ${item.contact}`.toLowerCase().includes(term));$('#suppliers-count').textContent=`${rows.length} fornecedores`;$('#suppliers-table').innerHTML=rows.map(item=>`<tr><td><b>${html(item.name)}</b><small style="display:block">${html(item.notes)}</small></td><td>${html(item.document||'—')}</td><td>${html(item.contact||'—')}</td><td>${html(item.phone||'—')}</td><td>${html(item.email||'—')}</td><td>${hasRole('admin')?`<button class="row-action" data-delete="supplier" data-id="${item.id}">×</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">Nenhum fornecedor cadastrado.</td></tr>';}

function renderFinance() {
  const monthlySales = getSales(s => s.date.startsWith(monthPrefix()));
  const monthlyExpenses = (state.expenses || []).filter(e => e.date.startsWith(monthPrefix()));
  const gross = profit(monthlySales), expenses = sum(monthlyExpenses.map(e => +e.value)), net = gross - expenses;
  $('#finance-summary').innerHTML = [['Faturamento', money(revenue(monthlySales))], ['Lucro bruto', money(gross)], ['Despesas', money(expenses)], ['Resultado líquido', money(net)]].map(([a,b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  $('#expenses-table').innerHTML = monthlyExpenses.slice().sort((a,b) => b.date.localeCompare(a.date)).map(e => `<tr><td>${formatDate(e.date)}</td><td><b>${e.description}</b></td><td>${e.category}</td><td><b>${money(e.value)}</b></td><td><button class="row-action" data-delete="expense" data-id="${e.id}">⋮</button></td></tr>`).join('') || `<tr><td colspan="5">Nenhuma despesa registrada.</td></tr>`;
  const todaySales = getSales(s => s.date === today());
  const todayExpenses = (state.expenses || []).filter(e => e.date === today());
  const pix = revenue(todaySales.filter(s => s.payment === 'Pix')), card = revenue(todaySales.filter(s => s.payment === 'Cartão')), cash = revenue(todaySales.filter(s => s.payment === 'Dinheiro'));
  $('#cash-closing').innerHTML = `<div><span>Pix</span><b>${money(pix)}</b></div><div><span>Cartão</span><b>${money(card)}</b></div><div><span>Dinheiro</span><b>${money(cash)}</b></div><div class="closing-total"><span>Saldo do dia</span><b>${money(revenue(todaySales)-sum(todayExpenses.map(e=>+e.value)))}</b></div>`;
  const entries=state.financialEntries.slice().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  $('#financial-entries-table').innerHTML=entries.map(item=>`<tr><td>${formatDate(item.dueDate)}</td><td><span class="status ${item.type==='receber'?'ok':'reparo'}">${item.type==='receber'?'Receber':'Pagar'}</span></td><td><b>${html(item.description)}</b></td><td>${html(item.category)}</td><td><b>${money(item.value)}</b></td><td><span class="status ${item.status==='pago'?'ok':item.dueDate<today()?'reparo':'recebido'}">${item.status==='pago'?'Liquidado':item.dueDate<today()?'Atrasado':'Pendente'}</span></td><td><div class="row-actions">${item.status!=='pago'?`<button class="row-action" data-settle-finance="${item.id}" title="Liquidar">✓</button>`:''}<button class="row-action" data-delete="financeEntry" data-id="${item.id}" title="Excluir">×</button></div></td></tr>`).join('')||'<tr><td colspan="7">Nenhuma conta cadastrada.</td></tr>';
  const payable=entries.filter(item=>item.type==='pagar'&&item.status!=='pago');const receivable=entries.filter(item=>item.type==='receber'&&item.status!=='pago');
  $('#finance-summary').innerHTML = [['Faturamento', money(revenue(monthlySales))], ['Resultado líquido', money(net)], ['A pagar',money(sum(payable.map(item=>item.value)))],['A receber',money(sum(receivable.map(item=>item.value)))]].map(([a,b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
}

function renderTasks() {
  const tasks = (state.tasks || []).slice().sort((a,b) => Number(a.done)-Number(b.done) || a.date.localeCompare(b.date));
  $('#tasks-list').innerHTML = tasks.map(task => `<div class="task-row ${task.done ? 'done' : ''}"><button class="task-check" data-task-done="${task.id}">${task.done ? '✓' : ''}</button><div><b>${task.title}</b><small>${task.category} · ${formatDate(task.date)}${task.notes ? ` · ${task.notes}` : ''}</small></div><span class="priority ${task.priority}">${task.priority}</span><button class="row-action" data-delete="task" data-id="${task.id}">×</button></div>`).join('') || `<div class="feature-empty"><div class="empty-orbit">✓</div><h3>Sua agenda começa limpa.</h3><p>Crie tarefas para retornos de clientes, compras, entregas e prioridades da equipe.</p><button class="primary red" data-open="task">Criar primeira tarefa</button></div>`;
  const focus = tasks.find(task => !task.done);
  $('#focus-task').innerHTML = focus ? `<div class="focus-card"><span>${focus.category}</span><h3>${focus.title}</h3><small>Prazo ${formatDate(focus.date)}</small><button data-task-done="${focus.id}">Concluir prioridade →</button></div>` : `<div class="focus-complete">Tudo em ordem.<br><b>Continue avançando.</b></div>`;
}

function renderCatalogAdmin() {
  const target = $('#catalog-admin-table');
  if (!target) return;
  target.innerHTML = (state.catalog || []).map(product => `<tr><td><b>${product.name}</b><small style="display:block">${product.description}</small></td><td>${product.condition === 'novo' ? 'Novo' : 'Seminovo'}</td><td>${product.sort_order}</td><td><button class="status ${product.available ? 'ok' : 'reparo'}" data-toggle-product="${product.id}">${product.available ? 'Publicado' : 'Oculto'}</button></td><td><button class="row-action" data-delete="catalog" data-id="${product.id}">×</button></td></tr>`).join('') || `<tr><td colspan="5">Nenhum aparelho cadastrado.</td></tr>`;
}

function renderTeam() {
  if (!$('#team-table')) return;
  const active = state.members.filter(member => member.active);
  $('#team-summary').innerHTML = [
    ['Integrantes ativos', active.length],
    ['ADM Geral', active.filter(member => member.roles.includes('admin')).length],
    ['Vendedores', active.filter(member => member.roles.includes('vendedor')).length],
    ['Técnicos', active.filter(member => member.roles.includes('tecnico')).length]
  ].map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
  const lastActivity = new Map();
  state.audit.forEach(entry => { if (entry.actor_id && !lastActivity.has(entry.actor_id)) lastActivity.set(entry.actor_id, entry.created_at); });
  $('#team-table').innerHTML = state.members.map(member => {
    const self = member.id === currentUserId;
    const roleButtons = ['admin','vendedor','tecnico'].map(role => `<button class="role-chip ${member.roles.includes(role)?'active':''}" data-member-role="${role}" data-user-id="${member.id}" ${self&&role==='admin'?'disabled':''}>${roleName(role)}</button>`).join('');
    return `<tr><td><b>${html(member.name)}</b><small style="display:block">${html(member.email)}${self?' · Você':''}</small></td><td><div class="role-chips">${roleButtons}</div></td><td><span class="status ${member.active?'ok':'reparo'}">${member.active?'Ativo':'Desativado'}</span></td><td>${lastActivity.has(member.id)?new Date(lastActivity.get(member.id)).toLocaleString('pt-BR'):'Sem atividade'}</td><td><button class="row-action team-toggle" data-member-active="${member.id}" ${self?'disabled':''}>${member.active?'Desativar':'Ativar'}</button></td></tr>`;
  }).join('') || '<tr><td colspan="5">Nenhum integrante cadastrado.</td></tr>';
  const tableNames={clients:'clientes',sales:'vendas',service_orders:'ordens de serviço',inventory:'estoque',devices:'dispositivos',expenses:'despesas',tasks:'tarefas',estimates:'orçamentos',suppliers:'fornecedores',financial_entries:'contas financeiras',customer_followups:'pós-venda'};
  const actionNames={INSERT:'criou',UPDATE:'alterou',DELETE:'removeu'};
  $('#team-activity').innerHTML = state.audit.slice(0,20).map(entry=>{
    const member=state.members.find(item=>item.id===entry.actor_id);
    return `<div class="activity-row"><div class="avatar">${initials(member?.name||'Sistema')}</div><div><b>${html(member?.name||'Sistema')} ${actionNames[entry.action]||entry.action} ${tableNames[entry.table_name]||entry.table_name}</b><small>${new Date(entry.created_at).toLocaleString('pt-BR')} · Registro ${html(entry.record_id||'—')}</small></div></div>`;
  }).join('') || '<div class="feature-empty"><div class="empty-orbit">◎</div><h3>Histórico pronto.</h3><p>As próximas alterações serão registradas com o nome de quem realizou.</p></div>';
}

function renderPortfolio(){
  const target=$('#portfolio-admin-grid'); if(!target)return;
  $('#portfolio-count').textContent=`${state.portfolio.length} ${state.portfolio.length===1?'item':'itens'}`;
  if(!state.portfolioReady){target.innerHTML='<div class="portfolio-empty"><b>Galeria aguardando ativação</b><p>A estrutura está pronta. Execute a migração 012 no Supabase para liberar os envios.</p></div>';return;}
  target.innerHTML=state.portfolio.map(item=>`<article class="portfolio-card"><img src="${html(item.publicUrl)}" alt="${html(item.title)}" loading="lazy"><div class="portfolio-card-body"><small>${html(item.repairType.toUpperCase())}</small><h3>${html(item.title)}</h3><p>${html(item.deviceModel)}${item.description?` · ${html(item.description)}`:''}</p><div class="portfolio-actions"><button data-portfolio-toggle="${item.id}">${item.published?'Ocultar':'Publicar'}</button><button class="danger" data-portfolio-delete="${item.id}">Excluir</button></div></div></article>`).join('')||'<div class="portfolio-empty"><b>Nenhum resultado publicado.</b><p>Envie a primeira imagem de um reparo finalizado pelo formulário ao lado.</p></div>';
}

function renderForms(){ const site=$('#site-form'); Object.entries(state.public).forEach(([key,value])=>{if(site.elements[key])site.elements[key].value=value}); const settings=$('#settings-form'); Object.entries(state.settings).forEach(([key,value])=>{if(settings.elements[key]) settings.elements[key].type==='checkbox'?settings.elements[key].checked=value:settings.elements[key].value=value}); }
function renderAll(){renderDashboard();renderSales();renderEstimates();renderOrders();renderClients();renderCrm();renderInventory();renderDevices();renderSuppliers();renderFinance();renderTasks();renderCatalogAdmin();renderTeam();renderPortfolio();renderForms();}
const formatDate = date => date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) : '—';
const empty = text => `<div style="padding:18px;color:#696660;font-size:10px">${text}</div>`;

const formTemplates = {
  sale: { kicker:'COMERCIAL',title:'Registrar nova venda',fields:()=>{const available=state.inventory.filter(item=>item.qty>0);const sellers=state.members.filter(member=>member.active&&(member.roles.includes('admin')||member.roles.includes('vendedor')));const sellerField=hasRole('admin')?`<label>Vendedor responsável<select name="sellerId" required><option value="">Selecione...</option>${sellers.map(member=>`<option value="${member.id}" ${member.id===currentUserId?'selected':''}>${html(member.name)}</option>`).join('')}</select></label>`:`<label>Vendedor responsável<input value="${html(currentMember?.name||'Usuário atual')}" disabled><input name="sellerId" type="hidden" value="${currentUserId}"></label>`;const warrantyOptions=Object.entries(window.GW_SALE_WARRANTY_TERMS||{}).map(([value,term])=>`<option value="${value}">${html(term.shortLabel)}</option>`).join('');return `<div class="field-grid"><label>Data da venda<input name="date" type="date" value="${today()}" required></label>${sellerField}<label>Cliente<input name="client" id="sale-client" list="clients-list" autocomplete="off" required><datalist id="clients-list">${state.clients.map(c=>`<option value="${html(c.name)}"></option>`).join('')}</datalist></label><label>Telefone / WhatsApp<input name="clientPhone" id="sale-client-phone" required></label><label>CPF / CNPJ<input name="clientDocument" id="sale-client-document"></label><label>E-mail<input name="clientEmail" id="sale-client-email" type="email"></label><label class="wide">Endereço completo<input name="clientAddress" id="sale-client-address"></label><label>CEP<input name="clientCep" id="sale-client-cep" inputmode="numeric"></label><label>Cidade<input name="clientCity" id="sale-client-city"></label><label>Estado<input name="clientState" id="sale-client-state" maxlength="2" placeholder="SP"></label><label>Termo de garantia<select name="warrantyPreset" id="sale-warranty" required><option value="">Selecione o termo...</option>${warrantyOptions}<option value="personalizado">Termo personalizado</option></select><small class="stock-helper" id="sale-warranty-helper">O termo integral será impresso abaixo do recibo.</small></label><label class="wide">Complemento ou termo personalizado<textarea name="warrantyDetails" id="sale-warranty-details" rows="3" placeholder="Opcional para os termos prontos. Obrigatório no personalizado."></textarea></label><label class="wide">Produto do estoque<select name="inventoryId" id="sale-inventory" required><option value="">${available.length?'Selecione um item disponível...':'Nenhum item disponível no estoque'}</option>${available.map(item=>`<option value="${item.id}">${html(item.name)} · ${item.qty} em estoque</option>`).join('')}</select><small class="stock-helper" id="sale-stock-helper">${available.length?'Escolha o produto para preencher preço, custo e dados do aparelho automaticamente.':'Cadastre ou reponha um item no Estoque antes de registrar a venda.'}</small></label><label>Quantidade<input name="quantity" id="sale-quantity" type="number" min="1" value="1" required></label><label>Desconto<input name="discount" id="sale-discount" type="number" min="0" step=".01" value="0"></label><label>Valor total da venda<input name="value" id="sale-value" type="number" min="0" step=".01" required></label><label>Custo total<input name="cost" id="sale-cost" type="number" step=".01" readonly tabindex="-1"></label><label>Pagamento<select name="payment"><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Troca + volta</option></select></label><label>Parcelas<input name="installments" type="number" min="1" value="1"></label><label>Taxa do cartão<input name="cardFee" type="number" step=".01" min="0" value="0"></label><label>Comissão<input name="commission" type="number" step=".01" min="0" value="0"></label><label class="wide">Aparelho recebido na troca<input name="tradeIn" placeholder="Opcional"></label><label class="wide">Observação do recibo<input name="notes"></label></div>`;}},
  estimate:{kicker:'PROPOSTA',title:'Criar orçamento',fields:()=>`<div class="field-grid"><label>Cliente<input name="client" list="clients-list" required><datalist id="clients-list">${state.clients.map(c=>`<option value="${html(c.name)}"></option>`).join('')}</datalist></label><label>Telefone<input name="phone"></label><label class="wide">Aparelho / produto<input name="device" placeholder="Ex.: iPhone 15 Pro ou troca de tela" required></label><label class="wide">Descrição da proposta<textarea name="description" rows="3" required></textarea></label><label>Valor total<input name="value" type="number" min="0" step=".01" required></label><label>Válido até<input name="validUntil" type="date" value="${daysAgo(-7)}" required></label><label>Status<select name="status"><option value="rascunho">Rascunho</option><option value="enviado">Enviado</option><option value="aprovado">Aprovado</option></select></label><label class="wide">Observações<textarea name="notes" rows="2"></textarea></label></div>`},
  order:{kicker:'ASSISTÊNCIA',title:'Abrir ordem de serviço segura',fields:`<div class="field-grid"><label>Cliente<input name="client" list="clients-list" required></label><label>Telefone / WhatsApp<input name="phone" required></label><label>Documento para conferência<input name="customerDocument" placeholder="Opcional"></label><label>Aparelho<input name="device" placeholder="Ex.: iPhone 13 128 GB" required></label><label>IMEI ou número de série<input name="imeiSerial" required></label><label class="wide">Estado do aparelho na entrada<textarea name="deviceCondition" rows="2" required placeholder="Ex.: tela trincada no canto, riscos na lateral e tampa intacta"></textarea></label><label class="wide">Itens entregues com o aparelho<input name="includedItems" required placeholder="Ex.: somente aparelho; ou aparelho, capa e cabo"></label><label class="wide">Defeito relatado e serviço solicitado<textarea name="service" rows="2" required></textarea></label><label>Valor inicialmente informado<input name="value" type="number" min="0" step=".01" value="0"></label><label>Prazo previsto<input name="deadline" type="date" value="${daysAgo(-1)}"></label><label>Acesso para diagnóstico<select name="unlockArrangement" required><option value="sem_bloqueio">Sem bloqueio</option><option value="cliente_presente">Cliente desbloqueia presencialmente</option><option value="apos_autorizacao">Somente após autorização</option></select></label><label>Buscar iPhone / Conta Apple<select name="findMyStatus"><option value="nao_testado">Não conferido</option><option value="desativado">Desativado</option><option value="ativado">Ativado</option></select></label><label>Chip / linha<select name="simStatus"><option value="nao_testado">Não conferido</option><option value="retirado">Chip retirado</option><option value="no_aparelho">Chip entregue no aparelho</option><option value="esim">eSIM</option></select></label><label>Peças substituídas<select name="oldPartsPreference"><option value="devolver">Devolver ao cliente</option><option value="descartar">Cliente autoriza descarte</option><option value="nao_aplicavel">Não se aplica</option></select></label><label>Forma do aceite<select name="authorizationMethod" required><option value="presencial">Aceite presencial</option><option value="whatsapp">Aprovação por WhatsApp</option><option value="assinatura_impressa">Assinatura na via impressa</option></select></label><label>Redefinição de dados<select name="dataResetAuthorized"><option value="nao">Não autorizada</option><option value="sim">Autorizada se necessária</option></select></label><label>Pessoa autorizada para retirada<input name="authorizedPickupName" placeholder="Opcional"></label><label>Documento da pessoa autorizada<input name="authorizedPickupDocument" placeholder="Opcional"></label><fieldset class="wide functional-checklist"><legend>Checklist funcional de entrada</legend>${[['screen','Tela'],['camera','Câmeras'],['buttons','Botões'],['charging','Carregamento'],['biometry','Biometria'],['audio','Áudio'],['wifi','Wi-Fi / Bluetooth']].map(([name,label])=>`<label>${label}<select name="check_${name}"><option value="nao_testado">Não testado</option><option value="ok">Funcionando</option><option value="falha">Com falha</option></select></label>`).join('')}</fieldset><label class="wide">Observações adicionais<textarea name="notes" rows="3"></textarea></label><fieldset class="wide acceptance-box"><legend>Conferência obrigatória</legend><label><input type="checkbox" name="customerAccepted" required> Cliente conferiu os dados, o estado e os itens entregues e autoriza o diagnóstico.</label><label><input type="checkbox" name="backupAcknowledged" required> Cliente foi orientado a manter backup dos dados importantes.</label><label><input type="checkbox" name="privacyAcknowledged" required> Cliente está ciente do tratamento mínimo de dados necessário ao atendimento.</label><label><input type="checkbox" name="waterResistanceAcknowledged" required> Cliente está ciente de que a abertura do aparelho pode alterar a vedação existente.</label><label><input type="checkbox" name="serviceApproved"> O orçamento/serviço acima já foi expressamente aprovado.</label></fieldset><p class="wide form-hint">Nunca registre senha ou código de desbloqueio nas observações. Serviços ou valores adicionais exigem nova aprovação.</p></div>`},
  client:{kicker:'RELACIONAMENTO',title:'Cadastrar cliente',fields:`<div class="field-grid"><label>Nome completo<input name="name" required></label><label>Telefone / WhatsApp<input name="phone" required></label><label>CPF / CNPJ<input name="document"></label><label>E-mail<input name="email" type="email"></label><label class="wide">Endereço completo<input name="address"></label><label>CEP<input name="cep" inputmode="numeric"></label><label>Cidade<input name="city"></label><label>Estado<input name="state" maxlength="2" placeholder="SP"></label><label class="wide">Observações<textarea name="notes" rows="3"></textarea></label></div>`},
  inventory:{kicker:'ESTOQUE',title:'Adicionar item',fields:`<div class="field-grid"><label class="wide">Nome do item<input name="name" required></label><label>Categoria<select name="category"><option>Aparelho</option><option>Peça</option><option>Acessório</option></select></label><label>Quantidade<input name="qty" type="number" min="0" required></label><label>Estoque mínimo<input name="min" type="number" min="0" value="1"></label><label>Custo unitário<input name="cost" type="number" step=".01"></label><label>Preço de venda<input name="price" type="number" step=".01"></label><label class="wide">Número de série / referência<input name="serialNumber"></label><label class="wide">Observações<textarea name="notes" rows="2"></textarea></label></div>`},
  device:{kicker:'DISPOSITIVOS',title:'Cadastrar dispositivo',fields:()=>`<div class="field-grid device-form"><label>Marca<input name="brand" value="Apple" required></label><label>Modelo<input name="model" list="device-models" placeholder="Ex.: iPhone 15 Pro" required><datalist id="device-models">${state.inventory.filter(item=>item.category==='Aparelho').map(item=>`<option value="${html(item.name)}"></option>`).join('')}</datalist></label><label>Capacidade<input name="storage" placeholder="Ex.: 256 GB"></label><label>Cor<input name="color" placeholder="Ex.: Titânio natural"></label><label>Condição<select name="condition"><option value="novo">Novo</option><option value="seminovo" selected>Seminovo</option><option value="recondicionado">Recondicionado</option></select></label><label>Classificação estética<select name="grade"><option value="">Não classificado</option><option value="A">Grau A</option><option value="B">Grau B</option><option value="C">Grau C</option></select></label><label>IMEI 1<input name="imei1" inputmode="numeric" maxlength="15" pattern="[0-9]{15}" placeholder="15 dígitos"><small class="form-note">Informe o IMEI 1 ou o número de série.</small></label><label>IMEI 2<input name="imei2" inputmode="numeric" maxlength="15" pattern="[0-9]{15}" placeholder="Opcional · 15 dígitos"></label><label>Número de série<input name="serialNumber" maxlength="80" autocomplete="off"></label><label>Saúde da bateria (%)<input name="batteryHealth" type="number" min="0" max="100" placeholder="Ex.: 92"></label><label>Data da compra<input name="purchaseDate" type="date" value="${today()}"></label><label>Fornecedor<select name="supplierId"><option value="">Não vincular</option>${state.suppliers.map(item=>`<option value="${item.id}">${html(item.name)}</option>`).join('')}</select></label><label>Item do estoque<select name="inventoryId"><option value="">Não vincular</option>${state.inventory.filter(item=>item.category==='Aparelho').map(item=>`<option value="${item.id}">${html(item.name)}</option>`).join('')}</select></label><label>Status<select name="status"><option value="estoque">Em estoque</option><option value="reservado">Reservado</option><option value="vendido">Vendido</option><option value="assistencia">Na assistência</option><option value="defeito">Com defeito</option></select></label><label>Valor de compra<input name="purchasePrice" type="number" min="0" step=".01" value="0"></label><label>Preço de venda<input name="salePrice" type="number" min="0" step=".01" value="0"></label><fieldset class="wide device-accessories"><legend>Itens inclusos</legend><label><input type="checkbox" name="includesBox"> Caixa</label><label><input type="checkbox" name="includesCable"> Cabo</label><label><input type="checkbox" name="includesCharger"> Carregador</label></fieldset><label class="wide">Observações, procedência e detalhes<textarea name="notes" rows="3"></textarea></label></div>`},
  supplier:{kicker:'COMPRAS',title:'Cadastrar fornecedor',fields:`<div class="field-grid"><label class="wide">Nome / razão social<input name="name" required></label><label>CPF ou CNPJ<input name="document"></label><label>Responsável pelo contato<input name="contact"></label><label>Telefone / WhatsApp<input name="phone"></label><label>E-mail<input name="email" type="email"></label><label class="wide">Produtos, condições e observações<textarea name="notes" rows="3"></textarea></label></div>`},
  financeEntry:{kicker:'FINANCEIRO',title:'Cadastrar conta',fields:`<div class="field-grid"><label>Tipo<select name="type"><option value="pagar">Conta a pagar</option><option value="receber">Conta a receber</option></select></label><label>Vencimento<input name="dueDate" type="date" value="${today()}" required></label><label class="wide">Descrição<input name="description" required></label><label>Categoria<select name="category"><option>Fornecedor</option><option>Cliente</option><option>Aluguel</option><option>Impostos</option><option>Serviços</option><option>Outros</option></select></label><label>Valor<input name="value" type="number" min="0" step=".01" required></label><label>Status<select name="status"><option value="pendente">Pendente</option><option value="pago">Liquidado</option></select></label><label>Forma de pagamento<input name="payment" placeholder="Opcional"></label><label class="wide">Observações<textarea name="notes" rows="2"></textarea></label></div>`},
  followup:{kicker:'PÓS-VENDA',title:'Agendar contato',fields:()=>`<div class="field-grid"><label>Cliente<input name="client" list="clients-list" required><datalist id="clients-list">${state.clients.map(c=>`<option value="${html(c.name)}"></option>`).join('')}</datalist></label><label>Data do contato<input name="date" type="date" value="${today()}" required></label><label>Canal<select name="channel"><option>WhatsApp</option><option>Ligação</option><option>Instagram</option><option>E-mail</option></select></label><label class="wide">Mensagem / objetivo<textarea name="message" rows="3" required placeholder="Ex.: Confirmar satisfação após a troca de tela"></textarea></label></div>`},
  expense:{kicker:'FINANCEIRO',title:'Registrar despesa',fields:`<div class="field-grid"><label>Data<input name="date" type="date" value="${today()}" required></label><label>Categoria<select name="category"><option>Peças e produtos</option><option>Aluguel</option><option>Marketing</option><option>Impostos</option><option>Serviços</option><option>Outros</option></select></label><label class="wide">Descrição<input name="description" required placeholder="Ex.: Compra de ferramentas"></label><label>Valor<input name="value" type="number" min="0" step=".01" required></label><label>Forma de pagamento<select name="payment"><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Boleto</option></select></label><label><input type="checkbox" name="recurring"> Despesa recorrente</label><label class="wide">Observações<input name="notes"></label></div>`},
  task:{kicker:'AGENDA',title:'Criar tarefa',fields:`<div class="field-grid"><label class="wide">Título da tarefa<input name="title" required placeholder="Ex.: Retornar orçamento"></label><label>Data<input name="date" type="date" value="${today()}" required></label><label>Categoria<select name="category"><option>Cliente</option><option>Assistência</option><option>Compras</option><option>Financeiro</option><option>Equipe</option><option>Outro</option></select></label><label>Prioridade<select name="priority"><option value="alta">Alta</option><option value="media" selected>Média</option><option value="baixa">Baixa</option></select></label><label>Responsável<input name="assignedTo" placeholder="Nome da pessoa"></label><label class="wide">Observações<textarea name="notes" rows="3"></textarea></label></div>`},
  catalog:{kicker:'CATÁLOGO',title:'Publicar aparelho',fields:`<div class="field-grid"><label class="wide">Nome do aparelho<input name="name" placeholder="Ex.: iPhone 15 Pro 256 GB" required></label><label>Condição<select name="condition"><option value="novo">Novo</option><option value="seminovo">Seminovo</option></select></label><label>Ordem de exibição<input name="sortOrder" type="number" min="0" value="100"></label><label class="wide">Arquivo da imagem<input name="imagePath" placeholder="iphone-15-pro.webp" required></label><label class="wide">Descrição<textarea name="description" rows="3" required></textarea></label><label><input type="checkbox" name="available" checked> Publicar imediatamente</label></div>`},
  employee:{kicker:'EQUIPE',title:'Criar acesso individual',fields:`<div class="field-grid"><label class="wide">Nome do funcionário<input name="name" autocomplete="off" required></label><label class="wide">E-mail de acesso<input name="email" type="email" autocomplete="off" required></label><fieldset class="wide role-selector"><legend>Funções permitidas</legend><label><input type="checkbox" name="roleAdmin"> ADM Geral</label><label><input type="checkbox" name="roleSeller"> Vendedor</label><label><input type="checkbox" name="roleTech"> Técnico</label></fieldset><p class="wide form-hint">A senha inicial padrão fica protegida no Supabase e não aparece no código público. Sua senha de ADM não será alterada.</p></div>`}
};
let activeForm = null;
let activeRecordId = null;
function bindSaleInventoryFields(){
  const inventorySelect=$('#sale-inventory');
  if(!inventorySelect)return;
  const quantityInput=$('#sale-quantity');
  const discountInput=$('#sale-discount');
  const valueInput=$('#sale-value');
  const costInput=$('#sale-cost');
  const helper=$('#sale-stock-helper');
  const refresh=()=>{
    const item=state.inventory.find(entry=>entry.id===inventorySelect.value);
    if(!item){quantityInput.max='';valueInput.value='';costInput.value='';return;}
    const quantity=Math.max(1,Math.min(item.qty,+quantityInput.value||1));
    const discount=Math.max(0,+discountInput.value||0);
    quantityInput.max=String(item.qty);
    quantityInput.value=String(quantity);
    valueInput.value=Math.max(0,item.price*quantity-discount).toFixed(2);
    costInput.value=(item.cost*quantity).toFixed(2);
    const device=state.devices.find(entry=>entry.inventoryId===item.id&&entry.status==='estoque')||state.devices.find(entry=>entry.inventoryId===item.id);
    const deviceDetails=device?[device.imei1?`IMEI ${device.imei1}`:'',device.storage,device.color,device.batteryHealth===null?'':`${device.batteryHealth}% de bateria`].filter(Boolean).join(' · '):'';
    helper.textContent=`Disponível: ${item.qty} · Preço unitário: ${money(item.price)}${deviceDetails?` · ${deviceDetails}`:''}.`;
  };
  inventorySelect.addEventListener('change',refresh);
  quantityInput.addEventListener('input',refresh);
  discountInput.addEventListener('input',refresh);
}
function bindSaleClientFields(){
  const clientInput=$('#sale-client');
  if(!clientInput)return;
  const fillClient=()=>{
    const match=state.clients.find(item=>item.name.toLowerCase()===clientInput.value.trim().toLowerCase());
    if(!match)return;
    const fields={clientPhone:match.phone,clientDocument:match.document,clientEmail:match.email,clientAddress:match.address,clientCep:match.cep,clientCity:match.city,clientState:match.state};
    Object.entries(fields).forEach(([name,value])=>{const input=$(`#sale-${name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`);if(input)input.value=value||'';});
  };
  clientInput.addEventListener('input',fillClient);
  clientInput.addEventListener('change',fillClient);
}
function bindSaleWarrantyFields(){
  const select=$('#sale-warranty');
  const helper=$('#sale-warranty-helper');
  const details=$('#sale-warranty-details');
  if(!select)return;
  const refresh=()=>{
    const preset=window.GW_SALE_WARRANTY_TERMS?.[select.value];
    helper.textContent=preset?`${preset.label}. O texto integral será impresso abaixo do recibo.`:select.value==='personalizado'?'Digite abaixo todo o termo que será assinado.':'Selecione o termo correspondente ao aparelho.';
    details.required=select.value==='personalizado';
  };
  select.addEventListener('change',refresh);
  refresh();
}
function openDialog(type){if(type==='employee'&&!hasRole('admin'))return showToast('Acesso restrito');if(type==='device'&&!(hasRole('admin')||hasRole('tecnico')))return showToast('Acesso restrito');activeForm=type;activeRecordId=null;const template=formTemplates[type];$('#dialog-kicker').textContent=template.kicker;$('#dialog-title').textContent=template.title;$('#dialog-fields').innerHTML=typeof template.fields==='function'?template.fields():template.fields;if(type==='sale'){bindSaleInventoryFields();bindSaleClientFields();bindSaleWarrantyFields();}$('#record-dialog').showModal();}
function openInventoryEdit(id){
  if(!(hasRole('admin')||hasRole('tecnico')))return showToast('Acesso restrito');
  const item=state.inventory.find(entry=>entry.id===id);
  if(!item)return showToast('Item não encontrado');
  openDialog('inventory');
  activeForm='inventory-edit';
  activeRecordId=item.id;
  $('#dialog-title').textContent='Editar item do estoque';
  const form=$('#record-form');
  form.elements.name.value=item.name;
  form.elements.category.value=item.category;
  form.elements.qty.value=item.qty;
  form.elements.min.value=item.min;
  form.elements.cost.value=item.cost;
  form.elements.price.value=item.price;
  form.elements.serialNumber.value=item.serialNumber;
  form.elements.notes.value=item.notes;
}
function openDeviceEdit(id){
  if(!(hasRole('admin')||hasRole('tecnico')))return showToast('Acesso restrito');
  const item=state.devices.find(entry=>entry.id===id);
  if(!item)return showToast('Dispositivo não encontrado');
  openDialog('device');
  activeForm='device-edit';
  activeRecordId=item.id;
  $('#dialog-title').textContent='Editar dispositivo';
  const form=$('#record-form');
  ['brand','model','storage','color','condition','grade','imei1','imei2','serialNumber','purchaseDate','supplierId','inventoryId','status','purchasePrice','salePrice','notes'].forEach(name=>{if(form.elements[name])form.elements[name].value=item[name]??''});
  form.elements.batteryHealth.value=item.batteryHealth??'';
  form.elements.includesBox.checked=item.includesBox;
  form.elements.includesCable.checked=item.includesCable;
  form.elements.includesCharger.checked=item.includesCharger;
}
function printDeviceLabel(item){
  if(!item)return;
  const popup=window.open('','_blank','width=520,height=650');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Etiqueta ${html(item.model)} | IMG TECH</title><style>@page{size:80mm 55mm;margin:3mm}*{box-sizing:border-box}body{margin:0;font:10px Arial;color:#151515}.label{width:74mm;min-height:49mm;border:2px solid #171717;border-radius:4mm;padding:4mm}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e8322d;padding-bottom:2mm}.brand b{font-size:16px}.brand span{font-weight:700;color:#e8322d}.model{font-size:15px;margin:3mm 0 1mm}.meta{font-size:10px;margin-bottom:2mm}.codes{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.codes div{border:1px solid #bbb;border-radius:2mm;padding:2mm;overflow:hidden}.codes small{display:block;color:#666}.codes b{font:9px monospace}.footer{display:flex;justify-content:space-between;align-items:end;margin-top:3mm}.price{font-size:16px}.battery{text-align:right;font-size:9px}@media print{button{display:none}}</style></head><body><div class="label"><div class="brand"><b>IMG TECH</b><span>${html(deviceStatusName(item.status).toUpperCase())}</span></div><h1 class="model">${html(item.brand)} ${html(item.model)}</h1><div class="meta">${html([item.storage,item.color,deviceConditionName(item.condition),item.grade?`Grau ${item.grade}`:''].filter(Boolean).join(' · '))}</div><div class="codes"><div><small>IMEI 1</small><b>${html(item.imei1||'Não informado')}</b></div><div><small>NÚMERO DE SÉRIE</small><b>${html(item.serialNumber||'Não informado')}</b></div></div><div class="footer"><div><small>PREÇO</small><div class="price"><b>${money(item.salePrice)}</b></div></div><div class="battery">Saúde da bateria<br><b>${item.batteryHealth??'—'}%</b></div></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}
async function saveRecord(){
  const values=Object.fromEntries(new FormData($('#record-form')).entries());
  Object.keys(values).forEach(key=>{if(typeof values[key]==='string')values[key]=values[key].replace(/[<>]/g,'').trim()});
  if(activeForm==='catalog'&&!/^[a-z0-9._-]+$/i.test(values.imagePath||'')) throw new Error('Use apenas o nome do arquivo da imagem, como iphone-15-pro.webp.');
  if(activeForm==='employee'){
    const roles=[values.roleAdmin==='on'?'admin':null,values.roleSeller==='on'?'vendedor':null,values.roleTech==='on'?'tecnico':null].filter(Boolean);
    if(!roles.length)throw new Error('Selecione pelo menos uma função.');
    const {data,error}=await client.functions.invoke('manage-employee',{body:{name:values.name,email:values.email,roles}});
    if(error||data?.error)throw new Error(data?.error||error.message);
    await loadOperationalData();renderAll();showToast('Acesso criado',`${values.name} já pode entrar com o próprio login.`);return;
  }
  const linkedClient = values.client ? state.clients.find(item => item.name.toLowerCase() === values.client.toLowerCase()) : null;
  let devicePayload;
  if(activeForm==='device'||activeForm==='device-edit'){
    if(!values.imei1&&!values.serialNumber)throw new Error('Informe pelo menos o IMEI 1 ou o número de série.');
    if(values.imei1&&!/^\d{15}$/.test(values.imei1))throw new Error('O IMEI 1 precisa ter exatamente 15 números.');
    if(values.imei2&&!/^\d{15}$/.test(values.imei2))throw new Error('O IMEI 2 precisa ter exatamente 15 números.');
    devicePayload={inventory_id:values.inventoryId||null,supplier_id:values.supplierId||null,brand:values.brand,model:values.model,storage:values.storage||null,color:values.color||null,condition:values.condition,grade:values.grade||null,imei1:values.imei1||null,imei2:values.imei2||null,serial_number:values.serialNumber||null,battery_health:values.batteryHealth===''?null:+values.batteryHealth,purchase_date:values.purchaseDate||null,purchase_price:+values.purchasePrice||0,sale_price:+values.salePrice||0,status:values.status,includes_box:values.includesBox==='on',includes_cable:values.includesCable==='on',includes_charger:values.includesCharger==='on',notes:values.notes||null};
  }
  let warrantyTerm='';
  if(activeForm==='sale'){
    const warrantyPreset=window.GW_SALE_WARRANTY_TERMS?.[values.warrantyPreset];
    if(values.warrantyPreset==='personalizado'&&!values.warrantyDetails)throw new Error('Descreva o termo de garantia personalizado.');
    const standardTerm=warrantyPreset?.text?.replaceAll('[Loja]','IMG TECH')||'';
    warrantyTerm=values.warrantyPreset==='personalizado'?values.warrantyDetails:[standardTerm,values.warrantyDetails?`CONDIÇÕES ADICIONAIS\n${values.warrantyDetails}`:''].filter(Boolean).join('\n\n');
    if(!warrantyTerm)throw new Error('Selecione o termo de garantia da venda.');
    if(!state.members.some(member=>member.id===values.sellerId&&member.active&&(member.roles.includes('admin')||member.roles.includes('vendedor'))))throw new Error('Selecione um vendedor ativo.');
  }
  let operation;
  if(activeForm==='sale') operation=client.rpc('record_sale_with_stock',{p_inventory_id:values.inventoryId,p_quantity:+values.quantity,p_sale_date:values.date,p_client_id:linkedClient?.id||null,p_client_name:values.client,p_payment_method:values.payment,p_amount:+values.value,p_card_fee:+values.cardFee||0,p_commission:+values.commission||0,p_installments:+values.installments||1,p_trade_in:values.tradeIn||null,p_notes:values.notes||null,p_seller_id:values.sellerId,p_warranty_term:warrantyTerm,p_warranty_type:values.warrantyPreset,p_client_phone:values.clientPhone,p_client_document:values.clientDocument||null,p_client_email:values.clientEmail||null,p_client_address:values.clientAddress||null,p_client_cep:values.clientCep||null,p_client_city:values.clientCity||null,p_client_state:values.clientState||null,p_discount:+values.discount||0});
  if(activeForm==='estimate') operation=client.from('estimates').insert({client_id:linkedClient?.id||null,client_name:values.client,phone:values.phone||null,device:values.device,description:values.description,amount:+values.value||0,valid_until:values.validUntil,status:values.status,notes:values.notes||null,created_by:currentUserId});
  if(activeForm==='order') operation=client.from('service_orders').insert({client_id:linkedClient?.id||null,client_name:values.client,phone:values.phone,customer_document:values.customerDocument||null,device:values.device,imei_serial:values.imeiSerial,service:values.service,estimate:+values.value||0,deadline:values.deadline||null,warranty_days:0,notes:values.notes||null,device_condition:values.deviceCondition,included_items:values.includedItems,unlock_arrangement:values.unlockArrangement,find_my_status:values.findMyStatus,sim_status:values.simStatus,old_parts_preference:values.oldPartsPreference,data_reset_authorized:values.dataResetAuthorized==='sim',authorized_pickup_name:values.authorizedPickupName||null,authorized_pickup_document:values.authorizedPickupDocument||null,authorization_method:values.authorizationMethod,customer_accepted:values.customerAccepted==='on',privacy_acknowledged:values.privacyAcknowledged==='on',backup_acknowledged:values.backupAcknowledged==='on',water_resistance_acknowledged:values.waterResistanceAcknowledged==='on',accepted_at:new Date().toISOString(),approval_status:values.serviceApproved==='on'?'aprovado':'pendente',approval_reference:values.serviceApproved==='on'?`${values.authorizationMethod} na abertura da OS`:null,approved_amount:values.serviceApproved==='on'?(+values.value||0):null,checklist:{screen:values.check_screen,camera:values.check_camera,buttons:values.check_buttons,charging:values.check_charging,biometry:values.check_biometry,audio:values.check_audio,wifi:values.check_wifi},created_by:currentUserId});
  if(activeForm==='client') operation=client.from('clients').insert({name:values.name,phone:values.phone,email:values.email||null,document:values.document||null,address:values.address||null,cep:values.cep||null,city:values.city||null,state:values.state?.toUpperCase()||null,notes:values.notes||null});
  if(activeForm==='inventory') operation=client.from('inventory').insert({name:values.name,category:values.category,quantity:+values.qty,minimum_quantity:+values.min||0,unit_cost:+values.cost||0,sale_price:+values.price||0,serial_number:values.serialNumber||null,notes:values.notes||null});
  if(activeForm==='inventory-edit') operation=client.from('inventory').update({name:values.name,category:values.category,quantity:+values.qty,minimum_quantity:+values.min||0,unit_cost:+values.cost||0,sale_price:+values.price||0,serial_number:values.serialNumber||null,notes:values.notes||null}).eq('id',activeRecordId);
  if(activeForm==='device') operation=client.from('devices').insert({...devicePayload,created_by:currentUserId});
  if(activeForm==='device-edit') operation=client.from('devices').update(devicePayload).eq('id',activeRecordId);
  if(activeForm==='supplier') operation=client.from('suppliers').insert({name:values.name,document:values.document||null,contact_name:values.contact||null,phone:values.phone||null,email:values.email||null,notes:values.notes||null});
  if(activeForm==='financeEntry') operation=client.from('financial_entries').insert({entry_type:values.type,description:values.description,category:values.category,amount:+values.value,due_date:values.dueDate,status:values.status,payment_date:values.status==='pago'?today():null,payment_method:values.payment||null,notes:values.notes||null,created_by:currentUserId});
  if(activeForm==='followup') operation=client.from('customer_followups').insert({client_id:linkedClient?.id||null,client_name:values.client,channel:values.channel,scheduled_for:values.date,message:values.message,created_by:currentUserId});
  if(activeForm==='expense') operation=client.from('expenses').insert({expense_date:values.date,description:values.description,category:values.category,payment_method:values.payment,amount:+values.value,recurring:values.recurring==='on',notes:values.notes||null,created_by:currentUserId});
  if(activeForm==='task') operation=client.from('tasks').insert({title:values.title,due_date:values.date,category:values.category,priority:values.priority,assigned_to:values.assignedTo||null,notes:values.notes||null,created_by:currentUserId});
  if(activeForm==='catalog') operation=client.from('catalog_products').insert({name:values.name,condition:values.condition,image_path:values.imagePath,description:values.description,available:values.available==='on',sort_order:+values.sortOrder||0});
  if(!operation) return;
  const {error}=await operation;
  if(error) throw error;
  await loadOperationalData();
  renderAll();
  showToast('Registro salvo','Dados sincronizados para toda a equipe.');
}

function bindEvents(){
  $$('[data-close-record]').forEach(button=>button.addEventListener('click',()=>$('#record-dialog').close()));
  $$('.nav-item[data-page],.mobile-nav-item[data-page]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.page)));
  $$('[data-page-link]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.pageLink)));
  const toggleMobileMenu=force=>{const open=force??!$('.sidebar').classList.contains('open');$('.sidebar').classList.toggle('open',open);$('#sidebar-overlay').classList.toggle('show',open)};
  $('#mobile-menu').addEventListener('click',()=>toggleMobileMenu());
  $('#mobile-more').addEventListener('click',()=>toggleMobileMenu(true));
  $('#sidebar-overlay').addEventListener('click',()=>toggleMobileMenu(false));
  $('#theme-button').addEventListener('click',()=>{document.body.classList.toggle('light-mode');state.settings.theme=document.body.classList.contains('light-mode')?'light':'dark';if(hasRole('admin'))save();else localStorage.setItem('gw-team-theme',state.settings.theme)});
  $('#logout').addEventListener('click',async()=>{await client.auth.signOut();location.replace('/PainelIMG')});
  $('#chart-period').addEventListener('change',event=>renderChart(+event.target.value));
  $('[data-search="sales"]').addEventListener('input',filterSales);$('#sales-filter').addEventListener('change',filterSales);
  $('[data-search="estimates"]').addEventListener('input',filterEstimates);$('#estimates-filter').addEventListener('change',filterEstimates);
  $('[data-search="clients"]').addEventListener('input',filterClients);
  $('[data-search="crm"]').addEventListener('input',filterCrm);$('#crm-filter').addEventListener('change',filterCrm);
  $('[data-search="inventory"]').addEventListener('input',filterInventory);$('#inventory-filter').addEventListener('change',filterInventory);
  $('[data-search="devices"]').addEventListener('input',filterDevices);$('#devices-filter').addEventListener('change',filterDevices);
  $('[data-search="suppliers"]').addEventListener('input',filterSuppliers);
  $('#order-search').addEventListener('input',renderOrders);$('#orders-filter').addEventListener('change',renderOrders);
  $('#portfolio-form').addEventListener('submit',async event=>{
    event.preventDefault(); if(!event.target.checkValidity())return event.target.reportValidity();
    if(!state.portfolioReady)return showToast('Galeria ainda não ativada','Execute a migração 012 no Supabase.');
    const button=event.target.querySelector('button[type="submit"]'); const values=Object.fromEntries(new FormData(event.target).entries()); const file=event.target.elements.image.files[0];
    if(!['image/jpeg','image/png','image/webp'].includes(file?.type))return showToast('Formato não aceito','Use JPG, PNG ou WebP.');
    if(file.size>8*1024*1024)return showToast('Imagem muito grande','Envie um arquivo de até 8 MB.');
    const extension=file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'; const path=`${currentUserId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    button.disabled=true;button.textContent='Enviando imagem…';
    try{
      const upload=await client.storage.from('repair-portfolio').upload(path,file,{cacheControl:'3600',upsert:false});if(upload.error)throw upload.error;
      const insert=await client.from('repair_portfolio').insert({title:values.title.trim(),device_model:values.deviceModel.trim(),repair_type:values.repairType.trim(),description:values.description?.trim()||null,image_path:path,published:values.published==='on',sort_order:+values.sortOrder||100,created_by:currentUserId});
      if(insert.error){await client.storage.from('repair-portfolio').remove([path]);throw insert.error;}
      event.target.reset();event.target.elements.sortOrder.value=100;event.target.elements.published.checked=true;await loadOperationalData();renderAll();showToast('Resultado salvo','A galeria pública foi atualizada.');
    }catch(error){showToast('Falha ao publicar',error.message);}finally{button.disabled=false;button.textContent='Enviar e publicar';}
  });
  $('#record-form').addEventListener('submit',async event=>{if(event.submitter?.value==='cancel')return;event.preventDefault();if(!event.target.checkValidity())return event.target.reportValidity();const button=$('#dialog-save');button.disabled=true;try{await saveRecord();$('#record-dialog').close()}catch(error){showToast('Não foi possível salvar',error.message)}finally{button.disabled=false}});
  document.addEventListener('click',async event=>{
    const orderViewButton=event.target.closest('[data-order-view]');if(orderViewButton){orderView=orderViewButton.dataset.orderView;renderOrders();}
    const dynamicOpen=event.target.closest('[data-open]'); if(dynamicOpen) openDialog(dynamicOpen.dataset.open);
    const inventoryEdit=event.target.closest('[data-edit-inventory]');if(inventoryEdit)openInventoryEdit(inventoryEdit.dataset.editInventory);
    const deviceEdit=event.target.closest('[data-edit-device]');if(deviceEdit)openDeviceEdit(deviceEdit.dataset.editDevice);
    const printDeviceButton=event.target.closest('[data-print-device]');if(printDeviceButton)printDeviceLabel(state.devices.find(item=>item.id===printDeviceButton.dataset.printDevice));
    const printEstimateButton=event.target.closest('[data-print-estimate]');if(printEstimateButton)printEstimate(state.estimates.find(item=>String(item.id)===printEstimateButton.dataset.printEstimate));
    const printSaleButton=event.target.closest('[data-print-sale]');if(printSaleButton)printSaleReceipt(state.sales.find(item=>String(item.id)===printSaleButton.dataset.printSale));
    const followupDone=event.target.closest('[data-followup-done]');if(followupDone){const {error}=await client.from('customer_followups').update({status:'concluido'}).eq('id',followupDone.dataset.followupDone);if(error)return showToast('Falha ao concluir',error.message);await loadOperationalData();renderAll();showToast('Pós-venda concluído')}
    const settleFinance=event.target.closest('[data-settle-finance]');if(settleFinance){const {error}=await client.from('financial_entries').update({status:'pago',payment_date:today()}).eq('id',settleFinance.dataset.settleFinance);if(error)return showToast('Falha ao liquidar',error.message);await loadOperationalData();renderAll();showToast('Conta liquidada')}
    const advance=event.target.closest('[data-advance]');if(advance){const order=state.orders.find(o=>String(o.id)===advance.dataset.advance);if(order.status==='diagnostico'&&order.approvalStatus!=='aprovado')return showToast('Aprovação obrigatória','Registre a aprovação do cliente antes de iniciar o reparo.');let deliveryPayload={};if(order.status==='pronto'){const informed=(prompt('Informe o código de retirada apresentado pelo cliente:')||'').trim().toUpperCase();if(informed!==order.pickupCode.toUpperCase())return showToast('Código não confere','Não entregue o aparelho. Confira a identificação e tente novamente.');if(!confirm('Confirma que o aparelho e os itens foram conferidos com o cliente no momento da retirada?'))return;deliveryPayload={delivery_acknowledged:true,delivery_notes:'Aparelho e itens conferidos na retirada com código válido.',delivered_at:new Date().toISOString(),delivered_by:currentUserId}}const flow=['recebido','diagnostico','reparo','pronto','entregue'];const nextStatus=flow[Math.min(flow.length-1,flow.indexOf(order.status)+1)];const {error}=await client.from('service_orders').update({status:nextStatus,...deliveryPayload}).eq('id',order.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast('Ordem atualizada',`OS #${order.id}: ${statusName(nextStatus)}.`)}
    const taskButton=event.target.closest('[data-task-done]');if(taskButton){const task=state.tasks.find(t=>String(t.id)===taskButton.dataset.taskDone);if(task){const {error}=await client.from('tasks').update({done:!task.done}).eq('id',task.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast(!task.done?'Tarefa concluída':'Tarefa reaberta')}}
    const productToggle=event.target.closest('[data-toggle-product]');if(productToggle){const product=state.catalog.find(item=>String(item.id)===productToggle.dataset.toggleProduct);const {error}=await client.from('catalog_products').update({available:!product.available}).eq('id',product.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast(product.available?'Aparelho ocultado':'Aparelho publicado')}
    const portfolioToggle=event.target.closest('[data-portfolio-toggle]');if(portfolioToggle){const item=state.portfolio.find(entry=>entry.id===portfolioToggle.dataset.portfolioToggle);if(!item)return;const {error}=await client.from('repair_portfolio').update({published:!item.published,updated_at:new Date().toISOString()}).eq('id',item.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast(item.published?'Resultado ocultado':'Resultado publicado');}
    const portfolioDelete=event.target.closest('[data-portfolio-delete]');if(portfolioDelete){const item=state.portfolio.find(entry=>entry.id===portfolioDelete.dataset.portfolioDelete);if(!item||!confirm('Excluir permanentemente esta imagem e o resultado publicado?'))return;const removal=await client.storage.from('repair-portfolio').remove([item.imagePath]);if(removal.error)return showToast('Falha ao excluir imagem',removal.error.message);const {error}=await client.from('repair_portfolio').delete().eq('id',item.id);if(error)return showToast('Falha ao excluir registro',error.message);await loadOperationalData();renderAll();showToast('Resultado removido');}
    const memberRole=event.target.closest('[data-member-role]');if(memberRole){const member=state.members.find(item=>item.id===memberRole.dataset.userId);if(!member||!hasRole('admin'))return;const role=memberRole.dataset.memberRole;if(member.id===currentUserId&&role==='admin')return showToast('Proteção do ADM Geral','Você não pode remover seu próprio acesso administrativo.');const roles=member.roles.includes(role)?member.roles.filter(item=>item!==role):[...member.roles,role];if(!roles.length)return showToast('Selecione uma função','Todo integrante precisa ter pelo menos uma função.');const {error}=await client.from('team_members').update({roles}).eq('user_id',member.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast('Funções atualizadas',`${member.name}: ${roles.map(roleName).join(' + ')}`)}
    const memberActive=event.target.closest('[data-member-active]');if(memberActive){const member=state.members.find(item=>item.id===memberActive.dataset.memberActive);if(!member||!hasRole('admin')||member.id===currentUserId)return;const {error}=await client.from('team_members').update({active:!member.active}).eq('user_id',member.id);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast(member.active?'Acesso desativado':'Acesso reativado',member.name)}
    const printOrder=event.target.closest('[data-print-order]');if(printOrder){const order=state.orders.find(item=>String(item.id)===printOrder.dataset.printOrder);printServiceOrder(order)}
    const del=event.target.closest('[data-delete]');if(del&&confirm('Deseja remover este registro permanentemente?')){const tables={inventory:'inventory',device:'devices',expense:'expenses',task:'tasks',catalog:'catalog_products',estimate:'estimates',supplier:'suppliers',financeEntry:'financial_entries',followup:'customer_followups'};const operation=del.dataset.delete==='sale'?client.rpc('delete_sale_and_restore_stock',{p_sale_id:del.dataset.id}):tables[del.dataset.delete]?client.from(tables[del.dataset.delete]).delete().eq('id',del.dataset.id):null;if(operation){const {error}=await operation;if(error)return showToast('Falha ao remover',error.message);await loadOperationalData();renderAll();showToast('Registro removido',del.dataset.delete==='sale'?'O item voltou automaticamente ao estoque.':'Dados atualizados.')}}
  });
  document.addEventListener('change',async event=>{const statusSelect=event.target.closest('[data-estimate-status]');if(statusSelect){const {error}=await client.from('estimates').update({status:statusSelect.value}).eq('id',statusSelect.dataset.estimateStatus);if(error)return showToast('Falha ao atualizar',error.message);await loadOperationalData();renderAll();showToast('Orçamento atualizado',estimateStatusName(statusSelect.value));return}const orderApproval=event.target.closest('[data-order-approval]');if(orderApproval){let approvalReference=null,approvedAmount=null;if(orderApproval.value==='aprovado'){approvalReference=(prompt('Registre como e quando o cliente aprovou (ex.: WhatsApp em 17/08 às 14h):')||'').replace(/[<>]/g,'').trim();if(!approvalReference){renderOrders();return showToast('Referência obrigatória','A aprovação não foi alterada. Informe a origem do aceite.')}const amountText=prompt('Valor total aprovado pelo cliente:',String(state.orders.find(item=>String(item.id)===orderApproval.dataset.orderApproval)?.value||0));if(amountText===null){renderOrders();return}approvedAmount=Math.max(0,Number(String(amountText).replace(',','.'))||0)}const {error}=await client.from('service_orders').update({approval_status:orderApproval.value,approval_reference:approvalReference,approved_amount:approvedAmount}).eq('id',orderApproval.dataset.orderApproval);if(error)return showToast('Falha ao registrar aprovação',error.message);await loadOperationalData();renderAll();showToast('Autorização registrada',orderApproval.value==='aprovado'?'O reparo poderá avançar.':'A OS não avançará para reparo.')}});
  $('#site-form').addEventListener('submit',async event=>{event.preventDefault();state.public=Object.fromEntries(new FormData(event.target).entries());Object.keys(state.public).forEach(key=>state.public[key]=state.public[key].replace(/[<>]/g,'').trim());try{await Promise.all([save(),savePublicSettings()]);$('#site-feedback').textContent='Alterações publicadas para todos os visitantes.';showToast('Site atualizado','As informações foram sincronizadas com o Supabase.')}catch(error){$('#site-feedback').textContent='Não foi possível publicar. Tente novamente.';showToast('Falha na publicação')}});
  $('#settings-form').addEventListener('submit',async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());state.settings={...state.settings,...values,monthlyGoal:+values.monthlyGoal,marginGoal:+values.marginGoal,salesGoal:+values.salesGoal,sound:event.target.elements.sound.checked};await Promise.all([save(),client.from('team_members').update({name:values.managerName.replace(/[<>]/g,'').trim()}).eq('user_id',currentUserId)]);currentMember.name=values.managerName;renderAll();openApp();showToast('Configurações salvas')});
  $('#reset-data').textContent='Apagar dados operacionais';
  $('#export-data').addEventListener('click',exportOperationalBackup);
  $('#reset-data').addEventListener('click',async()=>{if(confirm('Apagar permanentemente vendas, ordens, clientes, dispositivos, estoque, despesas e tarefas? O catálogo será preservado.')){for(const table of ['sales','service_orders','devices','inventory','expenses','tasks','clients']){const {error}=await client.from(table).delete().not('id','is',null);if(error)return showToast('Falha ao apagar',error.message)}await loadOperationalData();renderAll();showToast('Dados operacionais apagados')}});
  $('#command-button').addEventListener('click',()=>{$('#command-dialog').showModal();setTimeout(()=>$('#command-search').focus(),50)});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#command-dialog').showModal();setTimeout(()=>$('#command-search').focus(),50)}if(event.key==='Escape'&&$('#command-dialog').open)$('#command-dialog').close()});
  $$('[data-command]').forEach(button=>button.addEventListener('click',()=>{$('#command-dialog').close();openDialog(button.dataset.command)}));
  $('#command-search').addEventListener('input',event=>{$$('[data-command]').forEach(button=>button.hidden=!button.textContent.toLowerCase().includes(event.target.value.toLowerCase()))});
  $('#copy-closing').addEventListener('click',async()=>{const daily=getSales(s=>s.date===today());const expenses=(state.expenses||[]).filter(e=>e.date===today());const text=`Fechamento IMG TECH — ${new Date().toLocaleDateString('pt-BR')}\nVendas: ${money(revenue(daily))}\nDespesas: ${money(sum(expenses.map(e=>+e.value)))}\nSaldo: ${money(revenue(daily)-sum(expenses.map(e=>+e.value)))}`;await navigator.clipboard.writeText(text);showToast('Resumo copiado','Pronto para enviar à equipe.')});
  $('#upgrade-form').addEventListener('submit',event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target).entries());const market=+values.usedMarket||0;const margin=Math.min(100,Math.max(0,+values.safetyMargin||0));const repairs=+values.repairCost||0;const offer=Math.max(0,market*(1-margin/100)-repairs);const difference=Math.max(0,(+values.newPrice||0)-offer);$('#upgrade-result').innerHTML=`<span>PROPOSTA CALCULADA</span><h2>${money(offer)} no usado</h2><p>Diferença sugerida para o cliente: <b>${money(difference)}</b>.</p><div class="upgrade-breakdown"><div><small>Mercado</small><b>${money(market)}</b></div><div><small>Margem + custos</small><b>${money(market-offer)}</b></div></div><button class="secondary" type="button" id="copy-upgrade">Copiar proposta</button>`;$('#copy-upgrade').addEventListener('click',async()=>{await navigator.clipboard.writeText(`Proposta IMG TECH: avaliamos seu aparelho em ${money(offer)}. Diferença para o novo: ${money(difference)}.`);showToast('Proposta copiada')})});
}

$('#today-label').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});

async function bootstrap() {
  const { data: sessionData } = await client.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    location.replace('/PainelIMG');
    return;
  }
  currentUserId = session.user.id;
  const { data: memberData, error: memberError } = await client.from('team_members').select('*').eq('user_id', currentUserId).single();
  if (memberError || !memberData?.active) {
    await client.auth.signOut();
    document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#080808;color:#fff;font-family:sans-serif;text-align:center;padding:24px"><div><h1>Acesso não autorizado</h1><p>Seu usuário não pertence à equipe ativa da IMG TECH. Fale com o ADM Geral.</p><a href="/PainelIMG" style="color:#ef4038">Voltar ao login</a></div></main>';
    return;
  }
  currentMember = { id:memberData.user_id, name:memberData.name, email:memberData.email, roles:memberData.roles||[], active:memberData.active };
  if (hasRole('admin')) {
    const { data, error } = await client.from('manager_state').select('data').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') {
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#080808;color:#fff;font-family:sans-serif;text-align:center;padding:24px"><div><h1>Não foi possível carregar o painel</h1><p>Atualize a página ou verifique a conexão com a internet.</p><a href="/PainelIMG" style="color:#ef4038">Voltar ao login</a></div></main>';
      return;
    }
    if (data?.data) state = { ...structuredClone(seed), ...data.data, settings: { ...seed.settings, ...(data.data.settings || {}) }, public: { ...seed.public, ...(data.data.public || {}) } };
  }
  try {
    await loadOperationalData();
  } catch (operationalError) {
    document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;background:#080808;color:#fff;font-family:sans-serif;text-align:center;padding:24px"><div><h1>Atualização do banco pendente</h1><p>${operationalError.message}</p><p>Execute a migração operacional antes de usar o painel.</p></div></main>`;
    return;
  }
  state.settings.managerName = currentMember.name;
  if (!hasRole('admin')) state.settings.theme = localStorage.getItem('gw-team-theme') || 'dark';
  document.body.classList.toggle('light-mode',state.settings.theme==='light');
  bindEvents();
  setupLiveSync();
  openApp();
}

if ((location.hostname === '127.0.0.1' || location.hostname === 'localhost') && new URLSearchParams(location.search).has('preview')) {
  currentUserId='00000000-0000-0000-0000-000000000000';currentMember={id:currentUserId,name:'Gestor IMG TECH',email:'preview@local',roles:['admin','tecnico'],active:true};state.settings={...state.settings,businessName:'IMG TECH',managerName:'Gestor IMG TECH'};state.portfolioReady=true;bindEvents();openApp();
} else bootstrap();
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
