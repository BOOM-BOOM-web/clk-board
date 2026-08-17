// shop.js — upgrade shop logic
'use strict';

const upgradesContainer = document.getElementById('upgrades');

function renderShop() {
  upgradesContainer.innerHTML = '';

  UPGRADES.forEach(upgrade => {
    const level = state.upgrades[upgrade.id];
    const cost = getUpgradeCost(upgrade, level);
    const isMaxed = level >= upgrade.maxLevel;
    const canAfford = state.clks >= cost && !isMaxed;

    const card = document.createElement('div');
    card.className = 'upgrade-card' + (isMaxed ? ' maxed' : '');
    card.style.setProperty('--card-accent', upgrade.color);
    card.style.setProperty('--card-accent-dim', upgrade.dim);
    card.style.setProperty('--card-glow', upgrade.glow);
    card.dataset.id = upgrade.id;

    const progressPct = (level / upgrade.maxLevel) * 100;

    card.innerHTML = `
      <div class="upgrade-header">
        <div class="upgrade-icon">${upgrade.iconSvg}</div>
        <div>
          <div class="upgrade-name">${upgrade.name}</div>
          <div class="upgrade-level">Level ${level} / ${upgrade.maxLevel}</div>
        </div>
      </div>
      <div class="upgrade-desc">${upgrade.desc}</div>
      <div class="upgrade-effect">${upgrade.effect(level)}</div>
      <div class="upgrade-progress">
        <div class="upgrade-progress-bar" style="width:${progressPct}%"></div>
      </div>
      <div class="upgrade-actions">
        <div class="upgrade-cost">
          <span class="upgrade-cost-label">${isMaxed ? 'Status' : 'Cost'}</span>
          <span class="upgrade-cost-value ${canAfford ? 'affordable' : (isMaxed ? '' : 'expensive')}">
            ${isMaxed ? 'MAX' : fmt(cost) + ' CLK'}
          </span>
        </div>
        <button class="buy-btn${isMaxed ? ' maxed' : ''}" ${(!canAfford || isMaxed) ? 'disabled' : ''} data-id="${upgrade.id}">
          ${isMaxed ? 'Maxed' : (canAfford ? 'Buy' : 'Locked')}
        </button>
      </div>
    `;

    upgradesContainer.appendChild(card);
  });

  upgradesContainer.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => buyUpgrade(btn.dataset.id));
  });
}

function buyUpgrade(id) {
  const upgrade = UPGRADE_MAP[id];
  if (!upgrade) return;
  const level = state.upgrades[id];
  if (level >= upgrade.maxLevel) {
    toast('Already at max level', 'info');
    return;
  }
  const cost = getUpgradeCost(upgrade, level);
  if (state.clks < cost) {
    toast('Not enough CLKs', 'error');
    return;
  }

  state.clks -= cost;
  state.upgrades[id] = level + 1;
  saveState();

  toast(`${upgrade.name} → Lv. ${level + 1}`, 'success');
  renderShop();
  updateBalance();

  // Flash the card that was just upgraded
  const card = upgradesContainer.querySelector(`.upgrade-card[data-id="${id}"]`);
  if (card) {
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 400);
    // Particle burst from the card
    spawnBuyParticles(card, upgrade.color);
  }
}

function spawnBuyParticles(cardEl, color) {
  const rect = cardEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.style.color = color;
    p.style.background = color;
    p.style.width = '6px';
    p.style.height = '6px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function updateBalance() {
  const balEl = document.getElementById('balance');
  if (balEl) balEl.textContent = fmt(state.clks);
}

// Reset modal
const resetBtn = document.getElementById('resetBtn');
const resetModal = document.getElementById('resetModal');
const cancelReset = document.getElementById('cancelReset');
const confirmReset = document.getElementById('confirmReset');

resetBtn.addEventListener('click', () => { resetModal.hidden = false; });
cancelReset.addEventListener('click', () => { resetModal.hidden = true; });
confirmReset.addEventListener('click', () => {
  resetState();
  resetModal.hidden = true;
  toast('All progress reset', 'info');
  renderShop();
  updateBalance();
});
resetModal.addEventListener('click', (e) => {
  if (e.target === resetModal) resetModal.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !resetModal.hidden) resetModal.hidden = true;
});

renderShop();
updateBalance();
