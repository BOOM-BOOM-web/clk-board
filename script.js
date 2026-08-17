// script.js — keyboard game logic
'use strict';

const LAYOUT = [
  [
    { label: '~' }, { label: '1' }, { label: '2' }, { label: '3' }, { label: '4' },
    { label: '5' }, { label: '6' }, { label: '7' }, { label: '8' }, { label: '9' },
    { label: '0' }, { label: '-' }, { label: '=' }, { label: 'Bksp', w: 2, special: 'back' }
  ],
  [
    { label: 'Tab', w: 1.5, special: 'tab' }, { label: 'Q' }, { label: 'W' }, { label: 'E' },
    { label: 'R' }, { label: 'T' }, { label: 'Y' }, { label: 'U' }, { label: 'I' },
    { label: 'O' }, { label: 'P' }, { label: '[' }, { label: ']' }, { label: '\\', w: 1.5 }
  ],
  [
    { label: 'Caps', w: 1.75, special: 'caps' }, { label: 'A' }, { label: 'S' }, { label: 'D' },
    { label: 'F' }, { label: 'G' }, { label: 'H' }, { label: 'J' }, { label: 'K' },
    { label: 'L' }, { label: ';' }, { label: "'" }, { label: 'Enter', w: 2.25, special: 'enter' }
  ],
  [
    { label: 'Shift', w: 2.25, special: 'shift' }, { label: 'Z' }, { label: 'X' }, { label: 'C' },
    { label: 'V' }, { label: 'B' }, { label: 'N' }, { label: 'M' }, { label: ',' },
    { label: '.' }, { label: '/' }, { label: 'Shift', w: 2.75, special: 'shift' }
  ],
  [
    { label: 'Ctrl', w: 1.25, special: 'ctrl' }, { label: 'Alt', w: 1.25, special: 'alt' },
    { label: 'Space', w: 6.25, special: 'space' },
    { label: 'Alt', w: 1.25, special: 'alt' }, { label: 'Ctrl', w: 1.25, special: 'ctrl' },
    { label: '◀' }, { label: '▼' }, { label: '▲' }, { label: '▶' }
  ]
];

const keyboardEl = document.getElementById('keyboard');
const cooldownTimers = new WeakMap();

LAYOUT.forEach(rowData => {
  const row = document.createElement('div');
  row.className = 'keyboard-row';
  rowData.forEach(keyData => {
    const key = document.createElement('button');
    key.className = 'key';
    key.type = 'button';
    if (keyData.w) key.dataset.w = keyData.w;
    if (keyData.special) key.dataset.special = keyData.special;
    key.setAttribute('aria-label', keyData.label);
    key.dataset.label = keyData.label;
    if (keyData.special) key.dataset.specialType = keyData.special;

    const lbl = document.createElement('span');
    lbl.className = 'key-label';
    lbl.textContent = keyData.label;
    key.appendChild(lbl);

    key.addEventListener('mouseenter', () => onKeyActivate(key));
    key.addEventListener('click', () => onKeyActivate(key));

    row.appendChild(key);
  });
  keyboardEl.appendChild(row);
});

let lastKey = null;
let comboCount = 0;
let comboTimeout = null;

function onKeyActivate(keyEl) {
  if (cooldownTimers.has(keyEl)) return;

  const isDifferentKey = lastKey !== keyEl;
  if (isDifferentKey) {
    comboCount += 1;
  }
  lastKey = keyEl;

  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => {
    comboCount = 0;
    updateStats();
  }, 1800);

  const base = getPerHover();
  const comboMult = 1 + (Math.max(0, comboCount - 1) * 0.1 * getComboGrowth());
  const isCrit = Math.random() < getCritChance();
  const isSpace = keyEl.dataset.specialType === 'space';
  let amount = base * comboMult;
  if (isSpace) amount += getMegaSpaceBonus();
  if (isCrit) amount *= 10;
  amount = Math.floor(amount);

  state.clks += amount;
  state.totalEarned += amount;
  state.stats.totalHovers++;
  if (comboCount > state.stats.bestCombo) {
    state.stats.bestCombo = comboCount;
  }
  saveState();

  showFloatup(keyEl, amount, isCrit);
  spawnParticles(keyEl, isCrit ? 'var(--gold)' : (isSpace ? 'var(--gold)' : 'var(--accent)'));
  pulseKey(keyEl);
  pulseStat('clkCount');
  if (comboCount > 1 && comboCount % 5 === 0) {
    showComboMilestone(keyEl, comboCount);
    pulseStat('comboValue');
  }

  const cdMs = getCooldownMs();
  keyEl.classList.add('cooldown');
  const timer = setTimeout(() => {
    keyEl.classList.remove('cooldown');
    cooldownTimers.delete(keyEl);
  }, cdMs);
  cooldownTimers.set(keyEl, timer);

  updateStats();
}

function pulseKey(keyEl) {
  keyEl.classList.remove('tapped');
  void keyEl.offsetWidth;
  keyEl.classList.add('tapped');
  setTimeout(() => keyEl.classList.remove('tapped'), 300);
}

function pulseStat(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 400);
}

function showFloatup(keyEl, amount, isCrit) {
  const rect = keyEl.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'floatup' + (isCrit ? ' crit' : '');
  float.textContent = (isCrit ? 'CRIT +' : '+') + fmt(amount);
  float.style.left = (rect.left + rect.width / 2) + 'px';
  float.style.top = (rect.top - 8) + 'px';
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1200);
}

function showComboMilestone(keyEl, combo) {
  const rect = keyEl.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'floatup combo';
  float.textContent = `COMBO ×${combo}`;
  float.style.left = (rect.left + rect.width / 2) + 'px';
  float.style.top = (rect.top - 36) + 'px';
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1200);
}

function spawnParticles(keyEl, color) {
  const rect = keyEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i / count) + (Math.random() * 0.6 - 0.3);
    const dist = 25 + Math.random() * 25;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.style.color = color;
    p.style.background = color;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function updateStats() {
  const clkEl = document.getElementById('clkCount');
  if (clkEl) clkEl.textContent = fmt(state.clks);
  const perHoverEl = document.getElementById('perHover');
  if (perHoverEl) perHoverEl.textContent = fmt(getPerHover());
  const comboEl = document.getElementById('comboValue');
  if (comboEl) {
    const mult = 1 + (Math.max(0, comboCount - 1) * 0.1 * getComboGrowth());
    comboEl.textContent = '×' + mult.toFixed(1);
    if (comboCount >= 15) comboEl.style.color = 'var(--gold)';
    else if (comboCount >= 10) comboEl.style.color = 'var(--accent-2)';
    else if (comboCount >= 5) comboEl.style.color = 'var(--accent)';
    else comboEl.style.color = '';
  }
  const autoEl = document.getElementById('autoRate');
  if (autoEl) autoEl.textContent = getAutoRate() + '/s';
}

updateStats();
