/* ============ 期货数据看板 ============ */
const DATA_SOURCES = [
  'https://cdn.jsdelivr.net/gh/chend1581-pixel/fun-site@data/market.json',
  'https://raw.githubusercontent.com/chend1581-pixel/fun-site/data/market.json',
  'market.json', // 本地同源（本地验证用；Vercel 上不存在，404 后无害）
];
const CACHE_KEY = 'futures_market_cache';
const REFRESH_MS = 5 * 60 * 1000;

let market = null;

/* ============ 工具函数 ============ */
function fmtPrice(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1000) return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (a >= 100) return v.toFixed(1);
  return v.toFixed(2);
}
function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%';
}
function chgClass(v) {
  if (v === null || v === undefined || isNaN(v)) return 'flat';
  return v > 0 ? 'up' : (v < 0 ? 'down' : 'flat');
}
function fmtRatio(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toFixed(2) + 'x';
}
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ============ 数据获取 ============ */
async function fetchOne(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    clearTimeout(t);
    return data;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function fetchMarket() {
  for (const url of DATA_SOURCES) {
    try {
      const data = await fetchOne(url);
      if (data && data.updated) {
        market = data;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        return data;
      }
    } catch (e) { /* 尝试下一个源 */ }
  }
  throw new Error('数据源均不可用');
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function showError(el) {
  el.innerHTML = '<div class="empty-tip">数据加载失败，请检查网络后重试<br><button class="retry-btn" onclick="bootstrap()">🔄 重新加载</button></div>';
}

/* ============ 各页渲染 ============ */
function renderStats(bull, bear, neutral) {
  return `
    <div class="stat-row">
      <div class="stat-box bull"><div class="num">${bull}</div><div class="lbl">偏多</div></div>
      <div class="stat-box neutral"><div class="num">${neutral}</div><div class="lbl">中性</div></div>
      <div class="stat-box bear"><div class="num">${bear}</div><div class="lbl">偏空</div></div>
    </div>`;
}

function initHome() {
  const el = document.getElementById('content');
  if (!market) { showError(el); return; }

  const fund = market.fundamental || [];
  const bull = fund.filter(r => r.bias === '偏多').length;
  const bear = fund.filter(r => r.bias === '偏空').length;
  const neutral = fund.length - bull - bear;

  let html = renderStats(bull, bear, neutral);

  // BTC 卡片
  const b = market.btc;
  if (b) {
    const bchg = chgClass(b.change_pct);
    html += `
    <div class="btc-card">
      <div class="btc-head">
        <span class="btc-title">₿ BTC/USDT 永续</span>
        <span class="btc-chg ${bchg}">${fmtPct(b.change_pct)}</span>
      </div>
      <div class="btc-price">$${fmtPrice(b.price)}</div>
      <div class="btc-grid">
        <div class="cell"><div class="k">支撑</div><div class="v">${fmtPrice(b.support)}</div></div>
        <div class="cell"><div class="k">压力</div><div class="v">${fmtPrice(b.resistance)}</div></div>
        <div class="cell"><div class="k">机构</div><div class="v">${esc(b.inst_view || '—')}</div></div>
        <div class="cell"><div class="k">趋势</div><div class="v">${esc(b.trend || '—')}</div></div>
      </div>
      ${b.range_advice ? `<div class="btc-advice"><span class="k">区间操作建议</span>${esc(b.range_advice)}</div>` : ''}
    </div>`;
  }

  // 异动 Top 榜
  const rank = (market.volume_ranking || []).filter(r => r.strength > 0).slice(0, 8);
  if (rank.length) {
    html += `<div class="section-title">🔥 量能异动 TOP</div>`;
    rank.forEach(r => {
      const rc = chgClass(r.change_pct);
      html += `
      <div class="item-card">
        <div class="row1">
          <span class="name">${esc(r.name)}<span class="code">${esc(r.symbol || '')}</span></span>
          <span class="price ${rc}">${fmtPrice(r.price)}</span>
        </div>
        <div class="row2">
          <span class="kv"><span class="strength-dots">${'●'.repeat(r.strength || 0)}</span> ${esc(r.signal || '')}</span>
          <span class="kv ${rc}"><b>${fmtPct(r.change_pct)}</b></span>
          <span class="kv">量比 <b>${fmtRatio(r.vol_ratio)}</b></span>
          <span class="kv">持仓 <b class="${chgClass(r.oi_change_pct)}">${fmtPct(r.oi_change_pct)}</b></span>
        </div>
      </div>`;
    });
  }

  // 新闻
  const pnews = market.product_news || [];
  const gnews = market.global_news || [];
  if (pnews.length || gnews.length) {
    html += `<div class="section-title">📰 重要新闻</div>`;
    const topNews = [...pnews.slice(0, 8), ...gnews.slice(0, 5)];
    topNews.forEach(n => {
      const star = '★'.repeat(Math.min(n.level || 1, 3));
      const tag = n.product ? esc(n.product) : '宏观';
      html += `
      <div class="news-item">
        <div class="n-title"><span class="star">${star}</span> ${esc(n.title)}</div>
        <div class="n-meta"><span class="tag">${tag}</span>${esc(n.sentiment || '')} · ${fmtTime(n.time)}</div>
      </div>`;
    });
  }

  el.innerHTML = html;
}

function initVolume() {
  const el = document.getElementById('content');
  if (!market) { showError(el); return; }

  const rank = market.volume_ranking || [];
  if (!rank.length) { el.innerHTML = '<div class="empty-tip">暂无数据</div>'; return; }

  let html = `<div class="section-title">📊 量能异动榜 <span class="count">${rank.length} 品种 · 按信号强度排序</span></div>`;
  rank.forEach(r => {
    const rc = chgClass(r.change_pct);
    html += `
    <div class="item-card">
      <div class="row1">
        <span class="name">${esc(r.name)}<span class="code">${esc(r.main_contract || r.symbol || '')}</span></span>
        <span class="price ${rc}">${fmtPrice(r.price)}</span>
      </div>
      <div class="row2">
        <span class="pill pill-blue">${esc(r.signal || '—')}</span>
        <span class="kv">强度 <span class="strength-dots">${'●'.repeat(r.strength || 0)}</span></span>
        <span class="kv ${rc}">涨跌 <b>${fmtPct(r.change_pct)}</b></span>
        <span class="kv">量比 <b>${fmtRatio(r.vol_ratio)}</b></span>
        <span class="kv">持仓 <b class="${chgClass(r.oi_change_pct)}">${fmtPct(r.oi_change_pct)}</b></span>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function trendPill(t) {
  if (t === '震荡偏强') return '<span class="pill pill-trend-up">震荡偏强</span>';
  if (t === '震荡偏弱') return '<span class="pill pill-trend-down">震荡偏弱</span>';
  if (t === '中性') return '<span class="pill pill-trend-mid">中性</span>';
  return '<span class="pill pill-trend-mid">' + esc(t || '—') + '</span>';
}
function instPill(i) {
  if (i === '多头集中') return '<span class="pill pill-bull">多头集中</span>';
  if (i === '空头集中') return '<span class="pill pill-bear">空头集中</span>';
  return '<span class="pill pill-neutral">' + esc(i || '—') + '</span>';
}

function initSupport() {
  const el = document.getElementById('content');
  if (!market) { showError(el); return; }

  const rows = market.support_resistance || [];
  if (!rows.length) { el.innerHTML = '<div class="empty-tip">暂无数据</div>'; return; }

  let html = `<div class="section-title">📐 支撑 / 压力位 <span class="count">${rows.length} 品种</span></div>`;
  rows.forEach(r => {
    const pos = (r.support != null && r.resistance != null && r.resistance > r.support)
      ? Math.max(0, Math.min(100, (r.price - r.support) / (r.resistance - r.support) * 100)) : null;
    html += `
    <div class="item-card">
      <div class="row1">
        <span class="name">${esc(r.name)}</span>
        <span class="price">${fmtPrice(r.price)}</span>
      </div>
      <div class="sr-bar">${pos != null ? `<div class="dot" style="left:${pos.toFixed(1)}%"></div>` : ''}</div>
      <div class="row2">
        <span class="kv">支撑 <b class="down">${fmtPrice(r.support)}</b></span>
        <span class="kv">压力 <b class="up">${fmtPrice(r.resistance)}</b></span>
        <span class="kv">${instPill(r.institution)}</span>
        <span class="kv">${trendPill(r.trend)}</span>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function biasPill(b) {
  if (b === '偏多') return '<span class="pill pill-bull">偏多</span>';
  if (b === '偏空') return '<span class="pill pill-bear">偏空</span>';
  return '<span class="pill pill-neutral">中性</span>';
}

let activeBias = '全部';

function initFundamental() {
  const el = document.getElementById('content');
  if (!market) { showError(el); return; }

  const rows = market.fundamental || [];
  if (!rows.length) { el.innerHTML = '<div class="empty-tip">暂无数据</div>'; return; }

  const filterBar = document.getElementById('filterBar');
  if (filterBar && filterBar.dataset.ready !== '1') {
    filterBar.dataset.ready = '1';
    ['全部', '偏多', '中性', '偏空'].forEach(b => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (b === activeBias ? ' active' : '');
      chip.textContent = b;
      chip.addEventListener('click', () => {
        activeBias = b;
        filterBar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderFundamental();
      });
      filterBar.appendChild(chip);
    });
  }
  renderFundamental();
}

function renderFundamental() {
  const el = document.getElementById('content');
  if (!market) return;
  const rows = market.fundamental || [];
  const list = activeBias === '全部' ? rows : rows.filter(r => r.bias === activeBias);
  let html = `<div class="section-title">🧭 基本面五维 <span class="count">${list.length} / ${rows.length} 品种</span></div>`;
  list.forEach(r => {
    const rc = chgClass(r.change_pct);
    html += `
    <div class="item-card">
      <div class="row1">
        <span class="name">${esc(r.name)}</span>
        <span class="price ${rc}">${fmtPrice(r.price)} <small style="font-size:12px">${fmtPct(r.change_pct)}</small></span>
      </div>
      <div class="row2">
        <span class="kv">①基差 <b>${esc(r.basis_desc || '—')}</b></span>
        <span class="kv">②库存 <b>${esc(r.inventory_desc || '—')}</b></span>
        <span class="kv">③供需 <b>${esc(r.supply_desc || '—')}</b></span>
        <span class="kv">④政策 <b>${esc(r.policy_desc || '—')}</b></span>
        <span class="kv">⑤资金 <b>${esc(r.funds_desc || '—')}</b></span>
        <span class="kv">${biasPill(r.bias)}</span>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

/* ============ 顶部时间 + 高亮 ============ */
function renderHeader() {
  const t = document.getElementById('updatedTime');
  if (t && market) t.textContent = '更新 ' + fmtTime(market.updated);
}
function highlightTab() {
  const map = { 'page-home': 0, 'page-volume': 1, 'page-support': 2, 'page-fundamental': 3 };
  const links = document.querySelectorAll('.tabbar a');
  const idx = map[document.body.id];
  if (idx !== undefined) links[idx].classList.add('active');
}

/* ============ 启动 ============ */
function render() {
  renderHeader();
  const page = document.body.id;
  if (page === 'page-home') initHome();
  else if (page === 'page-volume') initVolume();
  else if (page === 'page-support') initSupport();
  else if (page === 'page-fundamental') initFundamental();
}

async function bootstrap() {
  highlightTab();
  const cached = loadFromCache();
  if (cached) { market = cached; render(); }
  try {
    await fetchMarket();
    render();
  } catch (e) {
    if (!market) {
      const el = document.getElementById('content');
      if (el) showError(el);
    }
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
setInterval(async () => { try { await fetchMarket(); render(); } catch (e) {} }, REFRESH_MS);
