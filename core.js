// core.js — shared state, helpers, upgrade definitions
'use strict';

const STORAGE_KEY = 'clkboard_save_v1';

const UPGRADES = [
  {
    id: 'heavierKeys',
    name: 'Heavier Keycaps',
    desc: 'Each tap of a key grants additional CLKs.',
    baseCost: 15,
    costMult: 1.55,
    maxLevel: 25,
    color: '#ff2d8a',
    glow: 'rgba(255, 45, 138, 0.3)',
    dim: 'rgba(255, 45, 138, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="11" rx="2"/><line x1="7" y1="11" x2="7.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="17" y1="11" x2="17.01" y2="11"/><line x1="7" y1="14" x2="17" y2="14"/></svg>',
    effect: (lvl) => `+${lvl} CLK per hover`,
  },
  {
    id: 'stickySwitches',
    name: 'Sticky Switches',
    desc: 'Keys recover faster, allowing more rapid taps.',
    baseCost: 40,
    costMult: 1.7,
    maxLevel: 10,
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.3)',
    dim: 'rgba(0, 240, 255, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/></svg>',
    effect: (lvl) => lvl === 0 ? 'No bonus' : `-${Math.round(lvl * 8)}% cooldown`,
  },
  {
    id: 'comboSynapse',
    name: 'Combo Synapse',
    desc: 'Combo multiplier grows faster with each chain.',
    baseCost: 60,
    costMult: 1.8,
    maxLevel: 15,
    color: '#ffb800',
    glow: 'rgba(255, 184, 0, 0.3)',
    dim: 'rgba(255, 184, 0, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>',
    effect: (lvl) => `+${lvl * 5}% combo growth`,
  },
  {
    id: 'ghostTyper',
    name: 'Ghost Typer',
    desc: 'An invisible hand types for you, passively earning CLKs.',
    baseCost: 80,
    costMult: 1.85,
    maxLevel: 30,
    color: '#00ff9d',
    glow: 'rgba(0, 255, 157, 0.3)',
    dim: 'rgba(0, 255, 157, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16"/><path d="M6 4v6c0 3.5 2.7 6 6 6s6-2.5 6-6V4"/><path d="M9 20h6"/><line x1="12" y1="16" x2="12" y2="20"/></svg>',
    effect: (lvl) => `${lvl} CLK per second`,
  },
  {
    id: 'luckyCircuit',
    name: 'Lucky Circuit',
    desc: 'A chance for critical bursts worth ten times the CLKs.',
    baseCost: 100,
    costMult: 1.9,
    maxLevel: 12,
    color: '#ff5e3a',
    glow: 'rgba(255, 94, 58, 0.3)',
    dim: 'rgba(255, 94, 58, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 16v6M4.2 6.5l4.5 3M15.3 14.5l4.5 3M4.2 17.5l4.5-3M15.3 9.5l4.5-3"/><circle cx="12" cy="12" r="3"/></svg>',
    effect: (lvl) => `${lvl * 4}% crit chance (×10)`,
  },
  {
    id: 'megaSpace',
    name: 'Mega Space',
    desc: 'The space bar delivers a hefty bonus on every tap.',
    baseCost: 50,
    costMult: 1.65,
    maxLevel: 20,
    color: '#00ffd5',
    glow: 'rgba(0, 255, 213, 0.3)',
    dim: 'rgba(0, 255, 213, 0.12)',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="20" height="6" rx="2"/></svg>',
    effect: (lvl) => `Space +${lvl * 5} CLK`,
  },
];

const UPGRADE_MAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

const DEFAULT_STATE = {
  clks: 0,
  totalEarned: 0,
  upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
  stats: { totalHovers: 0, bestCombo: 0 },
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
    const parsed = JSON.parse(raw);
    const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
    merged.clks = parsed.clks || 0;
    merged.totalEarned = parsed.totalEarned || 0;
    if (parsed.upgrades) {
      for (const id of Object.keys(merged.upgrades)) {
        merged.upgrades[id] = parsed.upgrades[id] || 0;
      }
    }
    if (parsed.stats) {
      merged.stats.totalHovers = parsed.stats.totalHovers || 0;
      merged.stats.bestCombo = parsed.stats.bestCombo || 0;
    }
    return merged;
  } catch (e) {
    console.warn('Failed to load state, starting fresh:', e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

function resetState() {
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState();
}

function fmt(n) {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1000).toFixed(n < 10000 ? 2 : 1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return (n / 1e12).toFixed(2) + 'T';
}

function getUpgradeCost(upgrade, currentLevel) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, currentLevel));
}

function getPerHover() { return 1 + state.upgrades.heavierKeys; }
function getCooldownMs() {
  const reduction = state.upgrades.stickySwitches * 0.08;
  return Math.max(80, 400 * (1 - reduction));
}
function getComboGrowth() { return 1 + state.upgrades.comboSynapse * 0.05; }
function getAutoRate() { return state.upgrades.ghostTyper; }
function getCritChance() { return state.upgrades.luckyCircuit * 0.04; }
function getMegaSpaceBonus() { return state.upgrades.megaSpace * 5; }

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  void el.offsetHeight;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

// Auto-tick: passive income from Ghost Typer, runs on any page
setInterval(() => {
  const rate = getAutoRate();
  if (rate <= 0) return;
  const earned = rate * 0.5;
  state.clks += earned;
  state.totalEarned += earned;
  saveState();

  const clkEl = document.getElementById('clkCount');
  const balEl = document.getElementById('balance');
  if (clkEl) clkEl.textContent = fmt(state.clks);
  if (balEl) balEl.textContent = fmt(state.clks);
  const autoEl = document.getElementById('autoRate');
  if (autoEl) autoEl.textContent = rate + '/s';
}, 500);
