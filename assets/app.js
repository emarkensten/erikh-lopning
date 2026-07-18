// Allt om min löpning — Erik Hammarström
// Tabs, plan/compliance toggle, charts, and small UI polish.

const tabs = ['start', 'plan', 'vo2max', 'zoner', 'analys', 'om'];
const navEl = document.getElementById('nav');
const navIndicator = document.getElementById('navIndicator');
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const topbarTitle = document.getElementById('topbarTitle');

const tabLabels = {
  start: 'Start',
  plan: 'Träningsplanering',
  vo2max: 'VO2max-utveckling',
  zoner: 'Pulszoner',
  analys: 'Analys & avstämningar',
  om: 'Om Erik',
};

function moveIndicatorTo(btn) {
  if (!btn || !navIndicator) return;
  const navRect = navEl.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  navIndicator.style.transform = `translateY(${r.top - navRect.top}px)`;
  navIndicator.style.height = r.height + 'px';
}

function showTab(name, { skipScroll } = {}) {
  tabs.forEach(t => {
    const active = t === name;
    document.getElementById('tab-' + t).classList.toggle('active', active);
    const btn = document.getElementById('navtab-' + t);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const activeBtn = document.getElementById('navtab-' + name);
  moveIndicatorTo(activeBtn);
  topbarTitle.textContent = tabLabels[name] || '';
  closeDrawer();
  if (name === 'vo2max' && window.vo2ChartInstance) window.vo2ChartInstance.resize();
  if (name === 'zoner' && window.zoneChartInstance) window.zoneChartInstance.resize();
  refreshTableOverflow();
  if (!skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

navEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (b) showTab(b.dataset.tab);
});
document.querySelectorAll('a.navlink[data-tab]').forEach(a =>
  a.addEventListener('click', () => showTab(a.dataset.tab))
);

// Keyboard support for the tablist (Up/Down arrows)
navEl.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const current = tabs.indexOf(document.querySelector('#nav button.active').dataset.tab);
  const dir = e.key === 'ArrowDown' ? 1 : -1;
  const next = tabs[(current + dir + tabs.length) % tabs.length];
  showTab(next);
  document.getElementById('navtab-' + next).focus();
  e.preventDefault();
});

// Mobile drawer
function openDrawer() {
  sidebar.classList.add('open');
  scrim.classList.add('open');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
}
function closeDrawer() {
  sidebar.classList.remove('open');
  scrim.classList.remove('open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}
hamburgerBtn.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeDrawer() : openDrawer();
});
scrim.addEventListener('click', closeDrawer);

window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('#nav button.active');
  moveIndicatorTo(activeBtn);
});

// ------------------------------------------------------------------------
// Plan vs Genomförda pass segmented toggle
// ------------------------------------------------------------------------
const planViewBtn = document.getElementById('planViewBtn');
const complianceViewBtn = document.getElementById('complianceViewBtn');
const planTableEl = document.getElementById('planTable');
const complianceTableEl = document.getElementById('complianceTable');
const legendRow = document.getElementById('legendRow');
const segIndicator = document.getElementById('segIndicator');

function moveSegIndicator(btn) {
  if (!btn || !segIndicator) return;
  segIndicator.style.width = btn.offsetWidth + 'px';
  segIndicator.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
}

function switchView(v) {
  planTableEl.classList.toggle('active', v === 'plan');
  complianceTableEl.classList.toggle('active', v === 'compliance');
  planViewBtn.classList.toggle('active', v === 'plan');
  complianceViewBtn.classList.toggle('active', v === 'compliance');
  legendRow.style.display = v === 'compliance' ? 'flex' : 'none';
  moveSegIndicator(v === 'plan' ? planViewBtn : complianceViewBtn);
  refreshTableOverflow();
}
planViewBtn.addEventListener('click', () => switchView('plan'));
complianceViewBtn.addEventListener('click', () => switchView('compliance'));

// ------------------------------------------------------------------------
// Data — 13-week block
// ------------------------------------------------------------------------
const planWeeks = [
  { n: 1, start: '2026-07-06', dates: '6–12 jul', vol: '52', focus: 'Återstart – bara lugnt + stridar (ingen tröskel än)',
    d: ['Lugnt 6 km + Styrka A', 'Lugnt 8 km + 8 stridar', 'Lugn distans 8 km + 6 stridar', 'Lugnt 8 km m. 8×1 min lätta pickups (ej tröskel)', 'Vila + Styrka B (lätt)', 'Lugnt 8 km', 'Långpass 14 km lugnt (5:00–5:15)'] },
  { n: 2, start: '2026-07-13', dates: '13–19 jul', vol: '57', focus: 'Lugn bas + stridar. OBS: behåll dagordningen, pickups strikt 4:20–4:40/km, hälsena+höft under uppsikt',
    d: ['Lugnt 7 km + Styrka A', 'Lugnt 9 km + 8 stridar', 'Lugn distans 9 km + 6 stridar', 'Lugnt 8 km m. 8×1 min pickups (håll 4:20–4:40/km – INTE snabbare)', 'Vila + Styrka B (lätt)', 'Lugnt 8 km', 'Långpass 16 km lugnt'] },
  { n: 3, start: '2026-07-20', dates: '20–26 jul', vol: '65', focus: 'Sub-threshold introduceras – sista basveckan före avlastning',
    d: ['Lugnt 8 km + Styrka A', 'Tröskel: 6×6 min @4:05, 75s vila (puls ≤162)', 'Lugn distans 10 km + 6 stridar', 'Tröskel: 4×8 min @4:05, 90s vila', 'Vila + Styrka B (lätt)', 'Lugnt 8 km + 6 stridar', 'Långpass 17 km lugnt'] },
  { n: 4, start: '2026-07-27', dates: '27 jul–2 aug', vol: '52', focus: 'AVLASTNING – smält in, kolla markörer',
    d: ['Lugnt 6 km + Styrka A', 'Tröskel: 4×6 min @4:05, 90s vila', 'Lugn distans 8 km', 'Lätt fartlek 8×1 min', 'Vila', 'Lugnt 7 km + 6 stridar', 'Långpass 14 km lugnt'] },
  { n: 5, start: '2026-08-03', dates: '3–9 aug', vol: '71', focus: 'Tröskelblocket startar',
    d: ['Lugnt 8 km + Styrka A', 'Tröskel: 5×6 min @4:03, 60–75s vila (puls ≤163)', 'Lugn distans 10 km + 6 stridar', 'Tröskel: 3×10 min @4:05, 2 min vila', 'Vila + Styrka B', 'Lugnt 9 km', 'Långpass 18 km, sista 3 km @4:10'] },
  { n: 6, start: '2026-08-10', dates: '10–16 aug', vol: '76', focus: 'Öka tröskelvolymen',
    d: ['Lugnt 8 km + Styrka A', 'Tröskel: 6×6 min @4:02, 60s vila', 'Lugn distans 10 km + 6 stridar', 'Tröskel: 4×10 min @4:03, 90s vila', 'Vila + Styrka B', 'Lugnt 9 km + 6 stridar', 'Långpass 20 km, sista 4 km @4:05'] },
  { n: 7, start: '2026-08-17', dates: '17–23 aug', vol: '76', focus: 'Toppvolym – norsk kort + lång tröskel',
    d: ['Lugnt 9 km + Styrka A', 'Norsk kort: 20×400 m @3:45, 30–40s jogg (puls ≤163)', 'Lugn distans 10 km + 6 stridar', 'Tröskel: 4×8 min @4:00, 90s vila', 'Vila + Styrka B', 'Lugnt 10 km', 'Långpass 22 km lugnt'] },
  { n: 8, start: '2026-08-24', dates: '24–30 aug', vol: '60', focus: 'AVLASTNING – ladda för skärpning',
    d: ['Lugnt 7 km + Styrka A', 'Tröskel: 5×6 min @4:02, 75s vila', 'Lugn distans 8 km', 'Lätt: 2×(6×400 m) @3:50', 'Vila', 'Lugnt 8 km + 6 stridar', 'Långpass 16 km lugnt'] },
  { n: 9, start: '2026-08-31', dates: '31 aug–6 sep', vol: '76', focus: 'VO2max kopplas på',
    d: ['Lugnt 8 km + Styrka A', 'VO2max: 5×1000 m @3:42, 2–2:30 jogg', 'Lugn distans 10 km + 6 stridar', 'Tröskel: 3×10 min @4:00, 2 min vila', 'Vila + Styrka B', 'Lugnt 9 km', 'Långpass 22 km m. 3×3 km @HM-fart'] },
  { n: 10, start: '2026-09-07', dates: '7–13 sep', vol: '77', focus: 'HM-specifik fart',
    d: ['Lugnt 8 km + Styrka A', 'VO2max: 6×1000 m @3:40, 2 min jogg', 'Lugn distans 9 km + 6 stridar', 'HM-specifikt: 4×3 km @3:58–4:00', 'Vila + Styrka B', 'Lugnt 8 km', 'Långpass 20 km lugnt'] },
  { n: 11, start: '2026-09-14', dates: '14–20 sep', vol: '54', focus: '10k-TEST – formkontroll',
    d: ['Lugnt 7 km + 6 stridar + Styrka A (lätt)', 'Skärpa: 6×400 m @3:35, 90s jogg', 'Lugnt 7 km', 'Lugnt 6 km + 4 förloppstridar', 'Vila', 'LOPP: 10 km-test, mål sub 39:00', 'Lugnt 8–10 km mycket lätt'] },
  { n: 12, start: '2026-09-21', dates: '21–27 sep', vol: '57', focus: 'Tapering börjar – håll skärpan',
    d: ['Lugnt 7 km + Styrka A (lätt)', 'Tröskel: 3×8 min @4:00, 90s vila', 'Lugn distans 8 km + 6 stridar', 'HM-fart: 5×3 min @3:58, 90s vila + 4 stridar', 'Vila', 'Lugnt 7 km', 'Långpass 16 km lugnt'] },
  { n: 13, start: '2026-09-28', dates: '28 sep–3 okt', vol: 'lopp', focus: 'LOPPVECKA – Malmö halvmara 3/10',
    d: ['Lugnt 6 km + 6 stridar', 'Skärpa: 4×4 min @4:00, 90s vila', 'Lugnt 5 km', 'Lugnt 4 km + 4 stridar', 'Vila (10 min lätt benröris)', '🏁 MALMÖ HALVMARA – mål 1:24 (3:58/km)', 'Vila / lätt 20 min'] },
];

const weekStatus = {
  1: [
    { s: 'ok', t: '6,07 km @4:53/km – enligt plan' },
    { s: 'warn', t: '8,21 km @5:07/km – stridar ej gjorda' },
    { s: 'warn', t: '12,07 km @4:59/km – dubbelpass, längre än planerat' },
    { s: 'stop', t: '6,01 km lätt jogg – pickups ej gjorda denna dag' },
    { s: 'ok', t: 'Styrka B genomförd' },
    { s: 'warn', t: '14,02 km @4:59/km – långpass flyttat hit' },
    { s: 'stop', t: '8,39 km, pickups ~4:00/km – för snabbt, flyttat hit' },
  ],
  2: [
    { s: 'ok', t: '7,27 km @4:59/km – enligt plan' },
    { s: 'ok', t: '10,01 km @4:56/km + 8 stridar' },
    { s: 'ok', t: '9,39 km @4:59/km + 6 stridar' },
    { s: 'warn', t: '8,01 km – pickups snabbare än 4:20–4:40 (upprepad avvikelse)' },
    { s: 'ok', t: 'Styrka B genomförd' },
    { s: 'pending', t: 'Kommande' },
    { s: 'pending', t: 'Kommande' },
  ],
};
function getDayStatus(weekNum, dayIdx) {
  const w = weekStatus[weekNum];
  if (w && w[dayIdx]) return w[dayIdx];
  return { s: 'pending', t: 'Kommande' };
}

const vo2History = [
  ['2025-04', 55.7], ['2025-05', 58.4], ['2025-06', 58.2], ['2025-07', 59.2], ['2025-08', 59.1],
  ['2025-09', 59.0], ['2025-10', 59.7], ['2025-11', 61.0], ['2025-12', 60.6], ['2026-01', 59.7],
  ['2026-02', 58.0], ['2026-03', 56.9], ['2026-04', 56.0], ['2026-05', 56.1], ['2026-06', 56.2], ['2026-07', 56.2],
];

const zoneHistory = [
  { m: '2025-04', z: [11, 148, 254, 418, 40] }, { m: '2025-05', z: [26, 165, 388, 352, 128] }, { m: '2025-06', z: [4, 42, 78, 36, 7] },
  { m: '2025-07', z: [7, 150, 343, 71, 14] }, { m: '2025-08', z: [16, 110, 242, 240, 92] }, { m: '2025-09', z: [15, 169, 324, 251, 46] },
  { m: '2025-10', z: [15, 227, 413, 247, 4] }, { m: '2025-11', z: [26, 439, 622, 279, 49] }, { m: '2025-12', z: [17, 254, 433, 326, 59] },
  { m: '2026-01', z: [7, 117, 487, 446, 145] }, { m: '2026-02', z: [6, 49, 393, 711, 190] }, { m: '2026-03', z: [9, 71, 537, 496, 193] },
  { m: '2026-04', z: [9, 41, 384, 527, 169] }, { m: '2026-05', z: [16, 77, 333, 674, 298] }, { m: '2026-06', z: [5, 30, 183, 237, 39] },
  { m: '2026-07', z: [3, 20, 108, 181, 20] },
];

const BUILD_DATE = new Date('2026-07-17T00:00:00');
function daysBetween(a, b) { return Math.ceil((b - a) / 86400000); }

// Count-up animation for the countdown numbers (delight, used sparingly)
function animateCount(el, to, duration = 700) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = to;
  }
  requestAnimationFrame(tick);
}

(function renderCountdown() {
  const today = BUILD_DATE;
  const race = new Date('2026-10-03T00:00:00');
  const test10k = new Date('2026-09-19T00:00:00');
  const daysToRace = daysBetween(today, race);
  const daysToTest = daysBetween(today, test10k);
  const cur = planWeeks.find(w => {
    const s = new Date(w.start + 'T00:00:00');
    const e = new Date(s); e.setDate(e.getDate() + 7);
    return today >= s && today < e;
  });
  document.getElementById('countdownCards').innerHTML = `
    <div class="card"><div class="label"><svg><use href="#i-flag"/></svg>Dagar till Malmö halvmara</div><div class="value" data-count="${daysToRace}">0</div><div class="note">3 okt 2026 · sub 1:24</div></div>
    <div class="card"><div class="label"><svg><use href="#i-target"/></svg>Dagar till 10k-test</div><div class="value" data-count="${daysToTest}">0</div><div class="note">~19 sep · sub 39:00</div></div>
    <div class="card"><div class="label"><svg><use href="#i-calendar"/></svg>Aktuell vecka (17 jul)</div><div class="value text">${cur ? 'v.' + cur.n + ' / 13' : '–'}</div><div class="note">${cur ? cur.dates : ''}</div></div>
  `;
  document.querySelectorAll('#countdownCards [data-count]').forEach(el => animateCount(el, Number(el.dataset.count)));
})();

(function renderPlan() {
  const today = BUILD_DATE;
  const tbody = document.getElementById('planTbody');
  let curFocus = '';
  tbody.innerHTML = planWeeks.map(w => {
    const s = new Date(w.start + 'T00:00:00');
    const e = new Date(s); e.setDate(e.getDate() + 7);
    const isCurrent = today >= s && today < e;
    if (isCurrent) curFocus = `Vecka ${w.n} (${w.dates}): ${w.focus}`;
    return `<tr class="${isCurrent ? 'current-week' : ''}">
      <td>v.${w.n}<br><span class="muted">${w.dates}</span></td>
      ${w.d.map(x => `<td>${x}</td>`).join('')}
      <td>${w.vol}</td>
    </tr>`;
  }).join('');
  document.getElementById('planFocusNote').textContent = curFocus ? ('Fokus denna vecka: ' + curFocus) : '';
})();

(function renderCompliance() {
  const today = BUILD_DATE;
  const tbody = document.getElementById('complianceTbody');
  tbody.innerHTML = planWeeks.map(w => {
    const s = new Date(w.start + 'T00:00:00');
    const e = new Date(s); e.setDate(e.getDate() + 7);
    const isCurrent = today >= s && today < e;
    const cells = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const st = getDayStatus(w.n, i);
      return `<td class="cell-${st.s}">${st.t}</td>`;
    }).join('');
    return `<tr class="${isCurrent ? 'current-week' : ''}">
      <td>v.${w.n}<br><span class="muted">${w.dates}</span></td>
      ${cells}
      <td>${w.vol}</td>
    </tr>`;
  }).join('');
})();

// ------------------------------------------------------------------------
// Charts
// ------------------------------------------------------------------------
window.addEventListener('load', function () {
  const rootStyle = getComputedStyle(document.documentElement);
  const green800 = rootStyle.getPropertyValue('--green-800').trim() || '#0F3D28';
  const gold500 = rootStyle.getPropertyValue('--gold-500').trim() || '#C6982B';
  const ink = rootStyle.getPropertyValue('--ink').trim() || '#16211A';
  const border = rootStyle.getPropertyValue('--border').trim() || '#E2DFD3';

  Chart.defaults.font.family = "'Public Sans', sans-serif";
  Chart.defaults.color = ink;

  const vctx = document.getElementById('vo2Chart');
  window.vo2ChartInstance = new Chart(vctx, {
    type: 'line',
    data: {
      labels: vo2History.map(x => x[0]),
      datasets: [{
        label: 'VO2max', data: vo2History.map(x => x[1]),
        borderColor: green800, backgroundColor: 'rgba(15, 61, 40, 0.09)',
        fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: gold500, borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { min: 50, max: 65, title: { display: true, text: 'VO2max' }, grid: { color: border } },
        x: { grid: { display: false } },
      },
      plugins: { legend: { display: false } },
      animation: { duration: 900, easing: 'easeOutCubic' },
    },
  });

  const zctx = document.getElementById('zoneChart');
  const colors = ['#B7C8BC', green800, gold500, '#8A5A2F', '#8A2F1F'];
  const labels = ['Zon 1', 'Zon 2', 'Zon 3', 'Zon 4', 'Zon 5'];
  window.zoneChartInstance = new Chart(zctx, {
    type: 'bar',
    data: {
      labels: zoneHistory.map(x => x.m),
      datasets: labels.map((lab, i) => ({
        label: lab, data: zoneHistory.map(x => x.z[i]), backgroundColor: colors[i], borderRadius: 2,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, title: { display: true, text: 'Minuter' }, grid: { color: border } },
      },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded' } } },
      animation: { duration: 900, easing: 'easeOutCubic' },
    },
  });
});

// ------------------------------------------------------------------------
// Table horizontal-scroll affordance
// ------------------------------------------------------------------------
function refreshTableOverflow() {
  document.querySelectorAll('.table-wrap').forEach(wrap => {
    const overflows = wrap.scrollWidth > wrap.clientWidth + 2;
    wrap.classList.toggle('has-overflow', overflows);
    if (!wrap.dataset.scrollBound) {
      wrap.dataset.scrollBound = '1';
      wrap.addEventListener('scroll', () => {
        const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
        wrap.classList.toggle('at-end', atEnd);
      });
    }
  });
}
window.addEventListener('resize', refreshTableOverflow);
window.addEventListener('load', refreshTableOverflow);
setTimeout(refreshTableOverflow, 50);

// Initial nav indicator placement
moveIndicatorTo(document.querySelector('#nav button.active'));
moveSegIndicator(planViewBtn);
