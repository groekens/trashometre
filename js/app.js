// ─────────────────────────────────────────────────────────────────────────────
// Trashomètre — App principale (UI + orchestration)
// ─────────────────────────────────────────────────────────────────────────────

import { calcCost, getQuotas, projectYear, getYearStats, getMonthlyCumulative, validateEntry, FORFAITS } from './tarifs.js';
import { T, MONTHS, t, setLang, getLang, monthName, firebaseErrorKey } from './i18n.js';
import * as Data from './firebase-data.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = { persons: 2, year: 2026, lang: 'fr', configured: false };

const state = {
  user: null,
  config: { ...DEFAULT_CONFIG },
  entries: [],
  activeFilter: 'all',
  unsubEntries: null,
  chart: null,
  pendingEntry: null,  // for pre-render before Firebase sync echoes back
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = n => n.toFixed(2).replace('.', ',');
const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
const setHTML = (id, val) => { const el = $(id); if (el) el.innerHTML = val; };

// ── TOAST ─────────────────────────────────────────────────────────────────────
function toast(msg, kind = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'vis ' + (kind ? `toast-${kind}` : '');
  clearTimeout(toast._tmo);
  toast._tmo = setTimeout(() => el.classList.remove('vis'), 2800);
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
function confirmDialog(message, yesLabel = 'OK', cancelLabel = null) {
  return new Promise(resolve => {
    const overlay = $('confirm-overlay');
    $('confirm-msg').textContent = message;
    $('confirm-yes').textContent = yesLabel;
    $('confirm-no').textContent  = cancelLabel || t('btn_cancel');
    overlay.classList.add('active');
    const cleanup = (result) => {
      overlay.classList.remove('active');
      $('confirm-yes').onclick = null;
      $('confirm-no').onclick  = null;
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = e => {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter')  cleanup(true);
    };
    $('confirm-yes').onclick = () => cleanup(true);
    $('confirm-no').onclick  = () => cleanup(false);
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
    document.addEventListener('keydown', onKey);
  });
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function hideAll() {
  ['login-screen', 'setup-screen', 'dashboard', 'info-screen']
    .forEach(id => $(id).classList.remove('active'));
}
function show(screen) {
  hideAll();
  $(screen).classList.add('active');
  $('loader').classList.add('hidden');
}

// ── AUTH UI ───────────────────────────────────────────────────────────────────
function updateAuthUI() {
  const lbl = $('auth-label');
  const av  = $('user-avatar');
  if (state.user) {
    if (state.user.photoURL) {
      av.src = state.user.photoURL;
      av.classList.add('visible');
      lbl.textContent = state.user.displayName?.split(' ')[0] || '';
    } else {
      const initial = state.user.displayName
        ? state.user.displayName.split(' ')[0]
        : (state.user.email ? state.user.email[0].toUpperCase() : '?');
      lbl.textContent = initial;
      av.classList.remove('visible');
    }
  } else {
    lbl.textContent = t('login');
    av.classList.remove('visible');
  }
}

// ── ENTRIES SUBSCRIPTION ──────────────────────────────────────────────────────
function subscribeToEntries() {
  if (state.unsubEntries) state.unsubEntries();
  if (!state.user) return;
  state.unsubEntries = Data.listenEntries(state.user.uid, (entries) => {
    state.entries = entries;
    state.pendingEntry = null;  // server caught up
    renderDashboard();
    renderEntries();
  });
}

function unsubscribeFromEntries() {
  if (state.unsubEntries) {
    state.unsubEntries();
    state.unsubEntries = null;
  }
}

function resetState() {
  // Called on logout — wipe everything
  unsubscribeFromEntries();
  state.user = null;
  state.config = { ...DEFAULT_CONFIG };
  state.entries = [];
  state.activeFilter = 'all';
  state.pendingEntry = null;
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
}

// ── AUTH HANDLERS ─────────────────────────────────────────────────────────────
Data.onAuthChange(async user => {
  if (!user) {
    resetState();
    updateAuthUI();
    applyLang();
    show('login-screen');
    return;
  }

  state.user = user;
  updateAuthUI();

  // Load config from Firestore
  try {
    const cfg = await Data.loadUserConfig(user.uid);
    if (cfg) state.config = { ...DEFAULT_CONFIG, ...cfg };
  } catch (e) {
    console.warn('Could not load config:', e);
  }

  // Apply language now that config is loaded
  setLang(state.config.lang || 'fr');
  applyLang();

  // Start listening to entries
  subscribeToEntries();

  if (state.config.configured) show('dashboard');
  else show('setup-screen');
});

// ── LOGIN/REGISTER ────────────────────────────────────────────────────────────
window.switchTab = function(tab) {
  const isLogin = tab === 'login';
  $('form-login').style.display    = isLogin ? 'flex' : 'none';
  $('form-register').style.display = isLogin ? 'none' : 'flex';
  $('tab-signin').classList.toggle('tab-active', isLogin);
  $('tab-register').classList.toggle('tab-active', !isLogin);
  hideAuthErrors();
};

function hideAuthErrors() {
  $('auth-error').style.display = 'none';
  $('register-error').style.display = 'none';
}
function showAuthError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.style.display = 'block';
}

window.signInGoogle = async () => {
  try { await Data.signInGoogle(); }
  catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      toast(t('cancel_toast'), 'error');
    }
  }
};

window.doSignIn = async () => {
  const email = $('auth-email').value.trim();
  const pwd   = $('auth-password').value;
  hideAuthErrors();
  if (!email || !pwd) { showAuthError('auth-error', t('err_fields_required')); return; }
  const btn = $('btn-signin');
  btn.disabled = true; btn.textContent = '…';
  try {
    await Data.signInEmail(email, pwd);
  } catch (e) {
    showAuthError('auth-error', t(firebaseErrorKey(e.code)));
  } finally {
    btn.disabled = false; btn.textContent = t('btn_signin');
  }
};

window.doRegister = async () => {
  const email = $('auth-email-r').value.trim();
  const pwd   = $('auth-password-r').value;
  const pwd2  = $('auth-password-r2').value;
  hideAuthErrors();
  if (!email || !pwd || !pwd2) { showAuthError('register-error', t('err_fields_required')); return; }
  if (pwd !== pwd2) { showAuthError('register-error', t('err_pwd_mismatch')); return; }
  if (pwd.length < 6) { showAuthError('register-error', t('err_pwd_short')); return; }
  const btn = $('btn-register');
  btn.disabled = true; btn.textContent = '…';
  try {
    await Data.registerEmail(email, pwd);
  } catch (e) {
    showAuthError('register-error', t(firebaseErrorKey(e.code)));
  } finally {
    btn.disabled = false; btn.textContent = t('btn_register');
  }
};

window.doResetPassword = async () => {
  const email = $('auth-email').value.trim();
  hideAuthErrors();
  if (!email) { showAuthError('auth-error', t('err_email_for_reset')); return; }
  try {
    await Data.resetPassword(email);
    toast(t('reset_email_toast'), 'success');
  } catch (e) {
    showAuthError('auth-error', t(firebaseErrorKey(e.code)));
  }
};

window.toggleAuth = async () => {
  if (state.user) {
    await openSettings();
  } else {
    show('login-screen');
  }
};

// ── SETUP ─────────────────────────────────────────────────────────────────────
window.saveConfig = async () => {
  const persons = parseInt($('cfg-persons').value);
  state.config.persons = persons;
  state.config.configured = true;
  try {
    await Data.saveUserConfig(state.user.uid, state.config);
    show('dashboard');
  } catch (e) {
    toast(t('error_generic'), 'error');
  }
};

// ── ENTRIES ───────────────────────────────────────────────────────────────────
window.addEntry = async () => {
  if (!state.user) return;

  const date = $('log-date').value || new Date().toISOString().slice(0, 10);
  const type = document.querySelector('input[name="log-type"]:checked').value;
  const kgInput = $('log-kg').value;
  const kg = kgInput ? parseFloat(kgInput) : 0;

  // Validate
  const err = validateEntry({ date, type, kg });
  if (err) {
    showLogError(t('err_' + err));
    return;
  }
  hideLogError();

  const entry = { id: Date.now().toString(), date, type, kg };
  const btn = $('btn-add');
  btn.disabled = true;

  // Optimistic UI: insert locally, render, then sync
  state.pendingEntry = entry;
  state.entries = [entry, ...state.entries];
  renderDashboard();
  renderEntries();
  $('log-kg').value = '';

  try {
    await Data.addEntry(state.user.uid, entry);
    toast(t('added_toast'), 'success');
  } catch (e) {
    // Rollback on failure
    state.entries = state.entries.filter(x => x.id !== entry.id);
    state.pendingEntry = null;
    renderDashboard();
    renderEntries();
    toast(t(navigator.onLine ? 'error_generic' : 'error_offline'), 'error');
  } finally {
    btn.disabled = false;
  }
};

window.deleteEntry = async (id) => {
  if (!state.user) return;
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  const ok = await confirmDialog(t('confirm_delete_entry'), t('confirm_delete_entry_yes'));
  if (!ok) return;

  try {
    await Data.removeEntry(state.user.uid, id);
    toast(t('deleted_toast'), 'success');
  } catch (e) {
    toast(t(navigator.onLine ? 'error_generic' : 'error_offline'), 'error');
  }
};

function showLogError(msg) {
  const el = $('log-error');
  el.textContent = msg;
  el.classList.add('visible');
  $('log-kg').classList.add('fi-error');
  $('log-date').classList.add('fi-error');
}
function hideLogError() {
  $('log-error').classList.remove('visible');
  $('log-kg').classList.remove('fi-error');
  $('log-date').classList.remove('fi-error');
}

// ── FILTER ────────────────────────────────────────────────────────────────────
window.setFilter = (f) => {
  state.activeFilter = f;
  ['all', 'noir', 'vert'].forEach(x => {
    $('filt-' + x).className = 'filt-btn' + (x === f ? ` active-${x}` : '');
  });
  renderEntries();
};

// ── RENDER : DASHBOARD ────────────────────────────────────────────────────────
function renderDashboard() {
  const persons = state.config.persons;
  const q = getQuotas(persons);
  const s = getYearStats(state.entries, state.config.year);
  const r = calcCost(s.noirLevees, s.noirKg, s.vertLevees, s.vertKg, persons);

  setText('dash-persons', persons);
  setHTML('yr-lbl', t('yr_lbl', persons));

  // Surplus card (top)
  const surplusFmt = r.surcharge > 0 ? `+${fmt(r.surcharge)} €` : '0 €';
  setText('surplus-amount', surplusFmt);
  $('surplus-amount').className = 'tot-surplus ' + (r.surcharge > 0 ? 'has-surplus' : 'no-surplus');
  setText('forfait-line-text', t('forfait_line', r.forfait, `${fmt(r.cost)} €`));

  // Per-container surcharge chips
  setSurplusChip('noir', r.noirSurcharge);
  setSurplusChip('vert', r.vertSurcharge);

  // Metrics
  setMet('nl', s.noirLevees, q.noirLevees, true);
  setMet('nk', s.noirKg,     q.noirKg,     false);
  setMet('vl', s.vertLevees, q.vertLevees, true);
  setMet('vk', s.vertKg,     q.vertKg,     false);

  setHTML('nlt', `${s.noirLevees} <span class="q">/ ${q.noirLevees}</span>`);
  setHTML('nkt', `${s.noirKg.toFixed(1)} <span class="q">/ ${q.noirKg} kg</span>`);
  setHTML('vlt', `${s.vertLevees} <span class="q">/ ${q.vertLevees}</span>`);
  setHTML('vkt', `${s.vertKg.toFixed(1)} <span class="q">/ ${q.vertKg} kg</span>`);

  renderForecast();
  renderChart();
}

function setSurplusChip(prefix, amount) {
  const el = $(`${prefix}-surplus-chip`);
  if (amount > 0) {
    el.textContent = `+${fmt(amount)} €`;
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
  }
}

function setMet(id, val, quota, isLevee) {
  const pct = Math.min((val / quota) * 100, 100);
  const bar = $(id + 'b');
  bar.style.width = pct + '%';
  // Neutral (color of container) until 90%, warning 90-100%, over above 100%
  bar.className = `pfill ${val > quota ? 'povr' : pct >= 90 ? 'pwrn' : 'pok'}`;
  const sb = $(id + 's');
  if (val > quota) {
    const extra = val - quota;
    sb.style.display = 'inline-block';
    sb.textContent = isLevee
      ? `+${extra} ${t('lbl_levees').toLowerCase()}`
      : `+${extra.toFixed(1)} kg`;
  } else {
    sb.style.display = 'none';
  }
}

function renderForecast() {
  const proj = projectYear(state.entries, state.config.year, state.config.persons);
  const fcastCard = $('forecast-card');

  if (!proj) {
    // Not enough data
    fcastCard.classList.add('fcast-empty');
    setText('proj-cost', '—');
    setText('proj-over', '—');
    setText('proj-nl', '—');
    setText('proj-vl', '—');
    setText('fnote', t('fnote_unreliable'));
    return;
  }

  fcastCard.classList.remove('fcast-empty');
  const r = state.config;
  const forfait = FORFAITS[Math.min(r.persons, 5)];
  const q = getQuotas(r.persons);
  const s = getYearStats(state.entries, r.year);

  const pce = $('proj-cost');
  pce.textContent = `${fmt(proj.cost)} €`;
  pce.className = `fival ${proj.cost > forfait * 1.3 ? 'fiwrn' : 'fiok'}`;

  const poe = $('proj-over');
  poe.textContent = proj.surcharge > 0 ? `+${fmt(proj.surcharge)} €` : '0 €';
  poe.className = `fival ${proj.surcharge > 0 ? 'fiwrn' : 'fiok'}`;

  const nl = Math.max(q.noirLevees - s.noirLevees, 0);
  const vl = Math.max(q.vertLevees - s.vertLevees, 0);
  setText('proj-nl', nl > 0 ? nl : `✓ ${t('epuisees')}`);
  setText('proj-vl', vl > 0 ? vl : `✓ ${t('epuisees')}`);

  setText('fnote', t('fnote_ok', proj.daysObserved, forfait));
}

// ── CHART ─────────────────────────────────────────────────────────────────────
async function renderChart() {
  const canvas = $('chart-canvas');
  if (!canvas) return;

  // Lazy-load Chart.js
  if (!window.Chart) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js');
    } catch (e) {
      console.warn('Could not load Chart.js', e);
      return;
    }
  }

  const persons = state.config.persons;
  const q = getQuotas(persons);
  const noirCum = getMonthlyCumulative(state.entries, state.config.year, 'noir', 'kg');
  const vertCum = getMonthlyCumulative(state.entries, state.config.year, 'vert', 'kg');

  // Show only months up to current month + 1 for projection visibility
  const now = new Date();
  const isCurrentYear = state.config.year === now.getFullYear();
  const lastVisibleMonth = isCurrentYear ? Math.min(now.getMonth() + 1, 11) : 11;

  const labels = MONTHS[getLang()].slice(0, lastVisibleMonth + 1).map(m => m.slice(0, 3));
  const noirData = noirCum.slice(0, lastVisibleMonth + 1);
  const vertData = vertCum.slice(0, lastVisibleMonth + 1);

  // Quotas as horizontal lines (constant arrays for chart)
  const quotaN = labels.map(() => q.noirKg);
  const quotaV = labels.map(() => q.vertKg);

  if (state.chart) state.chart.destroy();

  const css = getComputedStyle(document.documentElement);
  const colorNoir   = css.getPropertyValue('--grey-cont').trim() || '#3a3830';
  const colorVert   = css.getPropertyValue('--green-dark').trim() || '#1e8f38';
  const colorBorder = css.getPropertyValue('--border').trim() || '#dedcd4';
  const colorText   = css.getPropertyValue('--text-3').trim() || '#8a8880';

  state.chart = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('chart_residuel'),
          data: noirData,
          borderColor: colorNoir,
          backgroundColor: colorNoir + '20',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
        },
        {
          label: t('chart_organique'),
          data: vertData,
          borderColor: colorVert,
          backgroundColor: colorVert + '20',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
        },
        {
          label: t('chart_quota_n'),
          data: quotaN,
          borderColor: colorNoir,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        },
        {
          label: t('chart_quota_v'),
          data: quotaV,
          borderColor: colorVert,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colorText,
            font: { family: 'Barlow', size: 11 },
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kg`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: colorBorder, display: false },
          ticks: { color: colorText, font: { family: 'Barlow', size: 11 } },
        },
        y: {
          grid: { color: colorBorder },
          ticks: { color: colorText, font: { family: 'Barlow', size: 11 } },
          beginAtZero: true,
        },
      },
    },
  });
}

const _scriptCache = {};
function loadScript(url) {
  if (_scriptCache[url]) return _scriptCache[url];
  _scriptCache[url] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _scriptCache[url];
}

// ── RENDER : ENTRIES LIST ─────────────────────────────────────────────────────
function renderEntries() {
  const list = $('elist');
  const yr = String(state.config.year);
  let filtered = state.entries.filter(e => e.date && e.date.startsWith(yr));
  if (state.activeFilter !== 'all') filtered = filtered.filter(e => e.type === state.activeFilter);
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><span class="ico">🗑️</span><span>${t('lbl_empty')}</span></div>`;
    return;
  }

  // Group by month
  const groups = new Map();
  for (const e of filtered) {
    const ym = e.date.slice(0, 7);
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym).push(e);
  }

  const monthsSorted = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  const html = monthsSorted.map(ym => {
    const [year, mo] = ym.split('-');
    const mname = monthName(parseInt(mo) - 1);
    const grp = groups.get(ym);
    const items = grp.map((e, i) => renderEntryItem(e, i, grp.length)).join('');
    return `<div class="month-sep">${mname} ${year}</div>${items}`;
  }).join('');

  list.innerHTML = html;
}

function renderEntryItem(e, i, total) {
  const [, mo, dy] = e.date.split('-');
  const first = i === 0;
  const last  = i === total - 1;
  let rs = '';
  if (first && last) rs = 'border-radius:var(--r)';
  else if (first) rs = 'border-radius:var(--r) var(--r) 0 0';
  else if (last)  rs = 'border-radius:0 0 var(--r) var(--r);margin-bottom:4px';

  const lbl = e.type === 'noir' ? t('lbl_residuel') : t('lbl_organique');
  const kg  = e.kg > 0 ? `${e.kg} kg` : '—';

  // Sanitize ID for HTML attribute
  const safeId = String(e.id).replace(/[^a-zA-Z0-9_-]/g, '');

  return `<div class="eitem ${e.type === 'noir' ? 'en' : 'ev'}" style="${rs}">
    <span class="edate">${dy}/${mo}</span>
    <span class="etype">${lbl}</span>
    <span class="ekg">${kg}</span>
    <span class="elev">${t('levee')}</span>
    <button class="bdel" onclick="deleteEntry('${safeId}')" aria-label="Delete">✕</button>
  </div>`;
}

// ── RENDER : INFO PAGE ────────────────────────────────────────────────────────
function renderInfoPage() {
  const persons = state.config.persons;
  const q = getQuotas(persons);
  const forfait = FORFAITS[Math.min(persons, 5)];

  // Personalized header
  setHTML('info-personal-text', t('info_personal', persons));

  // Forfait table
  const forfaitRows = [
    [1, 70, persons === 1],
    [2, 105, persons === 2],
    [3, 140, persons === 3],
    [4, 181, persons >= 4],
  ];
  $('info-forfait-tbody').innerHTML = forfaitRows.map(([n, val, isYou]) =>
    `<tr ${isYou ? 'style="background:var(--green-bg);"' : ''}>
      <td>${n === 4 ? t('lbl_modal_persons').toLowerCase() + ' 4+' : n + ' ' + (n === 1 ? 'personne' : 'personnes')}${isYou ? ' ←' : ''}</td>
      <td><strong>${val} €/an</strong></td>
    </tr>`
  ).join('');

  // Included service: show quotas adapted to user
  $('info-included-tbody').innerHTML = `
    <tr><td>⬛ ${t('lbl_residuel')}</td><td>${q.noirLevees} ${t('lbl_levees').toLowerCase()}</td><td>${q.noirKg} kg/an</td></tr>
    <tr><td>🟩 ${t('lbl_organique')}</td><td>${q.vertLevees} ${t('lbl_levees').toLowerCase()}</td><td>${q.vertKg} kg/an</td></tr>
  `;
}

// ── i18n APPLY ────────────────────────────────────────────────────────────────
function applyLang() {
  const L = getLang();
  document.documentElement.lang = L;
  setText('loader-txt',       t('loading'));
  setText('login-sub',        t('login_sub'));
  setText('login-note',       t('login_note'));
  setText('ln-title',          t('ln_title'));
  setText('ln-text',           t('ln_text'));
  const lnCta = $('ln-cta'); if (lnCta) lnCta.querySelector('span').textContent = t('ln_cta');
  setText('btn-google-login', t('btn_google'));
  setText('btn-signin',       t('btn_signin'));
  setText('btn-register',     t('btn_register'));
  setText('btn-forgot',       t('btn_forgot'));
  setText('tab-signin',       t('tab_login'));
  setText('tab-register',     t('tab_register'));
  setText('lbl-email',        t('lbl_email'));
  setText('lbl-password',     t('lbl_password'));
  setText('lbl-email-r',      t('lbl_email'));
  setText('lbl-password-r',   t('lbl_password'));
  setText('lbl-password-r2',  t('lbl_password_confirm'));
  $('auth-password-r').placeholder = t('placeholder_pwd_new');
  $('auth-password').placeholder   = t('placeholder_pwd');
  $('auth-password-r2').placeholder = t('placeholder_pwd');
  setHTML('s-title',          t('setup_title'));
  setText('s-sub',            t('setup_sub'));
  setText('l-persons',        t('l_persons'));
  setText('btn-start',        t('btn_start'));
  setText('lbl-settings',     t('lbl_settings'));
  setText('lbl-current-cost', t('lbl_current_cost'));
  setText('lbl-residuel',     t('lbl_residuel'));
  setText('lbl-organique',    t('lbl_organique'));
  ['n', 'v'].forEach(x => {
    setText('lbl-levees-' + x, t('lbl_levees'));
    setText('lbl-poids-'  + x, t('lbl_poids'));
  });
  setText('lbl-projection',   t('lbl_projection'));
  setText('lbl-proj-cost',    t('lbl_proj_cost'));
  setText('lbl-proj-over',    t('lbl_proj_over'));
  setText('lbl-proj-nl',      t('lbl_proj_nl'));
  setText('lbl-proj-vl',      t('lbl_proj_vl'));
  setText('lbl-chart',        t('lbl_chart'));
  setText('lbl-info',         t('lbl_info'));
  setText('lbl-prime-title',  t('prime_title'));
  setText('lbl-prime-sub',    t('prime_sub'));
  setText('lbl-taxe-title',   t('taxe_title'));
  setText('lbl-taxe-sub',     t('taxe_sub'));
  setText('lbl-recycle-title',t('recycle_title'));
  setText('lbl-recycle-sub',  t('recycle_sub'));
  setText('lbl-inbw-title',   t('inbw_title'));
  setHTML('lbl-inbw-sub',     t('inbw_sub_html'));
  setText('lbl-compost-title',t('compost_title'));
  setText('lbl-compost-sub',  t('compost_sub'));
  setText('lbl-feedback',     t('feedback_label'));

  // Feedback modal
  setText('lbl-fb-title',     t('fb_title'));
  setText('lbl-fb-intro',     t('fb_intro'));
  setText('lbl-fb-type',      t('lbl_fb_type'));
  setText('lbl-fb-message',   t('lbl_fb_message'));
  setText('lbl-fb-email',     t('lbl_fb_email'));
  setText('lbl-fb-email-opt', t('lbl_fb_email_opt'));
  setText('opt-fb-bug',        t('opt_fb_bug'));
  setText('opt-fb-suggestion', t('opt_fb_suggestion'));
  setText('opt-fb-question',   t('opt_fb_question'));
  setText('opt-fb-other',      t('opt_fb_other'));
  setText('btn-fb-cancel',     t('btn_fb_cancel'));
  setText('btn-fb-send',       t('btn_fb_send'));
  const fbMsg = $('fb-message'); if (fbMsg) fbMsg.placeholder = t('placeholder_fb_message');
  const fbEm  = $('fb-email');   if (fbEm)  fbEm.placeholder  = t('placeholder_fb_email');

  // Install banner & modal
  setText('install-banner-title', t('install_banner_title'));
  setText('install-banner-cta',   t('install_banner_cta'));
  setText('install-title',        t('install_title'));
  setText('install-sub',          t('install_sub'));
  setText('ios-step1-title',      t('ios_step1_title'));
  setText('ios-step1-text',       t('ios_step1_text'));
  setText('ios-step2-title',      t('ios_step2_title'));
  setText('ios-step2-text',       t('ios_step2_text'));
  setText('ios-step3-title',      t('ios_step3_title'));
  setText('ios-step3-text',       t('ios_step3_text'));
  setText('and-step1-title',      t('and_step1_title'));
  setText('and-step1-text',       t('and_step1_text'));
  setText('and-step2-title',      t('and_step2_title'));
  setText('and-step2-text',       t('and_step2_text'));
  setText('and-step3-title',      t('and_step3_title'));
  setText('and-step3-text',       t('and_step3_text'));
  setText('install-why-title',    t('install_why_title'));
  setText('iw-1', t('iw_1'));
  setText('iw-2', t('iw_2'));
  setText('iw-3', t('iw_3'));
  setText('lbl-native-install',   t('lbl_native_install'));
  setText('lbl-add-title',    t('lbl_add'));
  setText('lbl-date',         t('lbl_date'));
  setText('lbl-kg',           t('lbl_kg'));
  setText('lbl-type',         t('lbl_type'));
  setText('rlbl-noir',        t('rlbl_noir'));
  setText('rlbl-vert',        t('rlbl_vert'));
  setText('lbl-hint',         t('lbl_hint'));
  setText('btn-add',          t('btn_add'));
  setText('lbl-history',      t('lbl_history'));
  setText('filt-all',         t('filt_all'));
  setText('filt-noir',        t('filt_noir'));
  setText('filt-vert',        t('filt_vert'));
  setText('lbl-back',         t('lbl_back'));
  setText('info-title',       t('info_title'));
  setText('info-sub',         t('info_sub'));
  setText('lbl-modal-title',  t('lbl_modal_title'));
  setText('lbl-modal-persons',t('lbl_modal_persons'));
  setText('btn-cancel',       t('btn_cancel'));
  setText('btn-save',         t('btn_save'));
  setText('lbl-danger',       t('lbl_danger'));
  setText('btn-logout',       t('btn_logout'));
  setText('btn-reset',        t('btn_reset'));
  setText('offline-text',     t('offline'));

  // Lang buttons
  ['fr', 'nl', 'en'].forEach(l => $('lb-' + l)?.classList.toggle('active', l === L));

  // Update chart labels by re-rendering
  if (state.chart) renderChart();

  updateAuthUI();
}

window.setLang = (l) => {
  setLang(l);
  state.config.lang = l;
  applyLang();
  renderEntries();
  // Save to Firestore (debounced via timeout)
  clearTimeout(window.setLang._t);
  window.setLang._t = setTimeout(() => {
    if (state.user) Data.saveUserConfig(state.user.uid, state.config).catch(() => {});
  }, 500);
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────
async function openSettings() {
  $('modal-persons').value = state.config.persons;
  ['fr','nl','en'].forEach(l => $('lb-' + l).classList.toggle('active', l === getLang()));
  $('moverlay').classList.add('active');
}
window.openSettings = openSettings;

window.closeModal = () => $('moverlay').classList.remove('active');

window.saveSettings = async () => {
  const newPersons = parseInt($('modal-persons').value);
  state.config.persons = newPersons;
  try {
    await Data.saveUserConfig(state.user.uid, state.config);
    closeModal();
    applyLang();
    renderDashboard();
    toast(t('saved_toast'), 'success');
  } catch (e) {
    toast(t('error_generic'), 'error');
  }
};

window.doLogout = async () => {
  closeModal();
  await Data.logout();
  toast(t('logout_toast'));
};

window.resetData = async () => {
  const ok = await confirmDialog(t('confirm_reset'), t('confirm_reset_yes'));
  if (!ok) return;
  try {
    await Data.deleteAllEntries(state.user.uid);
    toast(t('reset_toast'));
    closeModal();
  } catch (e) {
    toast(t('error_generic'), 'error');
  }
};

// ── INFO PAGE NAV ─────────────────────────────────────────────────────────────
window.showInfo = () => {
  renderInfoPage();
  show('info-screen');
};
window.hideInfo = () => show('dashboard');

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
window.openFeedback = () => {
  $('fb-message').value = '';
  $('fb-email').value = state.user?.email || '';
  $('fb-type').value = 'question';
  $('fb-counter-current').textContent = '0';
  $('fb-counter-current').parentElement.classList.remove('warn');
  hideFeedbackError();
  $('feedback-overlay').classList.add('active');
  setTimeout(() => $('fb-message').focus(), 50);
};
window.closeFeedback = () => {
  $('feedback-overlay').classList.remove('active');
};

function showFeedbackError(msg) {
  const el = $('fb-error');
  el.textContent = msg;
  el.classList.add('visible');
}
function hideFeedbackError() {
  $('fb-error').classList.remove('visible');
}

// Web3Forms endpoint (sends emails to info@trashometre.be)
const WEB3FORMS_ACCESS_KEY = '0ae4a30d-d721-46c1-bc3b-1420c6587521';

async function sendViaWeb3Forms({ type, message, email, userEmail, lang }) {
  const typeLabels = {
    bug: '🐛 Bug / Problème',
    suggestion: '💡 Suggestion',
    question: '❓ Question',
    other: '✉️ Autre',
  };

  // Reply-to logic: prefer the email field entered by the user, then their account email
  const replyTo = email || userEmail || '';

  const body = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `[Trashomètre] ${typeLabels[type] || type} — nouveau message`,
    from_name: 'Trashomètre',
    message,
    // Custom fields shown in the email body
    Type: typeLabels[type] || type,
    Compte: userEmail || '(non connecté)',
    'E-mail de réponse': email || '(non fourni)',
    Langue: lang,
    Date: new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }),
    // Reply-to: clicking "reply" in Gmail goes directly to the user
    ...(replyTo ? { replyto: replyTo } : {}),
    // Honeypot anti-bot field (must stay empty)
    botcheck: '',
  };

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Web3Forms HTTP ${res.status}`);
  }
}

window.sendFeedback = async () => {
  const type    = $('fb-type').value;
  const message = $('fb-message').value.trim();
  const email   = $('fb-email').value.trim();

  hideFeedbackError();
  if (!message) {
    showFeedbackError(t('err_fb_empty'));
    $('fb-message').focus();
    return;
  }
  if (message.length < 10) {
    showFeedbackError(t('err_fb_short'));
    $('fb-message').focus();
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFeedbackError(t('err_fb_email'));
    $('fb-email').focus();
    return;
  }

  const btn = $('btn-fb-send');
  btn.disabled = true;
  btn.textContent = '…';

  const payload = {
    type,
    message,
    email: email || null,
    userId: state.user?.uid || null,
    userEmail: state.user?.email || null,
    lang: getLang(),
    userAgent: navigator.userAgent.slice(0, 200),
  };

  let emailOk = false;
  let firestoreOk = false;

  // Primary: send by email via Web3Forms
  try {
    await sendViaWeb3Forms(payload);
    emailOk = true;
  } catch (e) {
    console.warn('Web3Forms failed, will rely on Firestore:', e);
  }

  // Backup: write to Firestore (best-effort, doesn't block UX if email worked)
  try {
    await Data.submitFeedback(payload);
    firestoreOk = true;
  } catch (e) {
    console.warn('Firestore feedback write failed:', e);
  }

  btn.disabled = false;
  btn.textContent = t('btn_fb_send');

  if (emailOk || firestoreOk) {
    closeFeedback();
    toast(t('fb_sent_toast'), 'success');
  } else {
    showFeedbackError(t(navigator.onLine ? 'error_generic' : 'error_offline'));
  }
};

// Character counter on textarea
$('fb-message').addEventListener('input', e => {
  const len = e.target.value.length;
  $('fb-counter-current').textContent = len;
  $('fb-counter-current').parentElement.classList.toggle('warn', len > 1800);
});

// Click outside / Escape to close feedback modal
$('feedback-overlay').addEventListener('click', e => {
  if (e.target === $('feedback-overlay')) closeFeedback();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('feedback-overlay').classList.contains('active')) closeFeedback();
});

// ── MODAL: click-outside, escape ──────────────────────────────────────────────
$('moverlay').addEventListener('click', (e) => {
  if (e.target === $('moverlay')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('moverlay').classList.contains('active')) closeModal();
});

// ── ENTER KEY in auth forms ───────────────────────────────────────────────────
$('auth-password').addEventListener('keydown', e => { if (e.key === 'Enter') doSignIn(); });
$('auth-password-r2').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

// ── OFFLINE STATUS ────────────────────────────────────────────────────────────
function updateOnlineStatus() {
  document.body.classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ── INIT ──────────────────────────────────────────────────────────────────────
$('log-date').max = new Date().toISOString().slice(0, 10); // prevent future dates in picker
$('log-date').valueAsDate = new Date();
applyLang();

// Loader safety: hide after 6s if Firebase hangs
setTimeout(() => $('loader').classList.add('hidden'), 6000);

// ── SERVICE WORKER UPDATE NOTIFICATION ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          $('update-banner').classList.add('visible');
          $('update-apply').onclick = () => {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          };
        }
      });
    });
  }).catch(() => {});
}

// ── PWA INSTALL PROMPT ────────────────────────────────────────────────────────
// Shows a discreet banner on iOS Safari and Android Chrome when the app
// isn't installed yet. Dismissible, remembered for 30 days.
const INSTALL_DISMISS_KEY = 'trashometre.install.dismissedUntil';
let deferredInstallPrompt = null;  // populated by `beforeinstallprompt` (Android)

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isStandalone() {
  // iOS uses navigator.standalone, others use display-mode media query
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}
function isBannerDismissed() {
  const ts = parseInt(localStorage.getItem(INSTALL_DISMISS_KEY) || '0', 10);
  return Date.now() < ts;
}

function maybeShowInstallBanner() {
  // Hide if app is already installed, or user has dismissed recently
  if (isStandalone() || isBannerDismissed()) return;
  // Only show on mobile-ish devices (don't bother desktop users)
  const isMobile = isIOS() || /Android/i.test(navigator.userAgent);
  if (!isMobile) return;
  // Show after a tiny delay so it doesn't fight with the loader
  setTimeout(() => {
    document.body.classList.add('show-install-banner');
  }, 1200);
}

window.dismissInstallBanner = () => {
  document.body.classList.remove('show-install-banner');
  // Remember dismissal for 30 days
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + thirtyDays));
};

window.openInstallGuide = () => {
  // Show iOS or Android steps depending on platform
  const ios = isIOS();
  $('install-ios').style.display     = ios ? 'block' : 'none';
  $('install-android').style.display = ios ? 'none' : 'block';
  // Native install button only on Android Chrome (when beforeinstallprompt has fired)
  $('native-install-btn').style.display = (!ios && deferredInstallPrompt) ? 'block' : 'none';
  $('install-overlay').classList.add('active');
  // Hide the floating banner while modal is open
  document.body.classList.remove('show-install-banner');
};

window.closeInstallGuide = () => {
  $('install-overlay').classList.remove('active');
};

window.triggerNativeInstall = async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  try {
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      closeInstallGuide();
      // Permanently dismiss banner
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000));
    }
  } catch (e) { /* ignore */ }
  deferredInstallPrompt = null;
};

// Click outside / Escape to close install modal
$('install-overlay').addEventListener('click', (e) => {
  if (e.target === $('install-overlay')) closeInstallGuide();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('install-overlay').classList.contains('active')) closeInstallGuide();
});

// Chrome/Edge/Android: capture the prompt event for one-tap install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// Hide banner if app gets installed during the session
window.addEventListener('appinstalled', () => {
  document.body.classList.remove('show-install-banner');
  deferredInstallPrompt = null;
});

maybeShowInstallBanner();
