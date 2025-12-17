const floatingTexts = [];

function spawnPopText(x, y, t, c) { 
    floatingTexts.push({x, y, text:t, life:40, color:c?'#f1c40f':'#fff', vy:-1.5}); 
}

function createFloatText(x, y, text, color) {
    floatingTexts.push({x, y, text: text, life: 80, color: color, vy: -1.0});
}

function updateText(timeScale) { 
    for(let i = floatingTexts.length-1; i>=0; i--) { 
        let t = floatingTexts[i]; 
        t.y += t.vy * timeScale; 
        t.vy += 0.05 * timeScale; 
        t.life -= 1 * timeScale; 
        if(t.life<=0) floatingTexts.splice(i,1); 
    } 
}

function updateHUD() { 
    const currentHp = Math.max(0, Math.floor(player.hp));
    const maxHp = Math.floor(player.maxHp);
    const currentXp = Math.floor(player.xp);
    const nextXp = Math.floor(player.nextLevelXp);

    document.getElementById('hpBar').style.width = Math.max(0, (currentHp / maxHp) * 100) + '%'; 
    document.getElementById('xpBar').style.width = Math.min(100, (currentXp / nextXp) * 100) + '%'; 
    
    const hpText = document.getElementById('hpText');
    const xpText = document.getElementById('xpText');
    
    if(hpText) hpText.innerText = `${currentHp}/${maxHp}`;
    if(xpText) xpText.innerText = `${currentXp}/${nextXp}`;

    document.getElementById('uiKills').innerText = player.kills; 
}

function formatTime(s) { 
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; 
}

function toggleUpgradeScreen(show) { 
    const el = document.getElementById('upgradeScreen'); 
    if(show) { 
        gameState = 'LEVELUP'; 
        el.style.display = 'flex'; 
        generateCards(); 
    } else { 
        el.style.display = 'none'; 
        gameState = 'PLAYING'; 
    } 
}

function generateCards() {
    const box = document.getElementById('cardsBox'); box.innerHTML = '';
    let pool = upgradePool.filter(u => !u.unique || !player.history.some(h => h.title === u.title));
    let selectedCards = [];

    for(let i=0; i<3; i++) {
        if(pool.length === 0) break;
        let chosenCard = null;
        let safety = 0;
        while(!chosenCard && safety < 50) {
            safety++;
            const r = Math.random() * 100;
            let targetRarity = 'common'; 
            if (r > 99.5) targetRarity = 'mythic'; 
            else if (r > 95) targetRarity = 'legendary'; 
            else if (r > 80) targetRarity = 'epic'; 
            else if (r > 50) targetRarity = 'uncommon'; 
            const rarityPool = pool.filter(u => u.rarity === targetRarity && !selectedCards.includes(u));
            if (rarityPool.length > 0) chosenCard = rarityPool[Math.floor(Math.random() * rarityPool.length)];
            else {
                const remaining = pool.filter(u => !selectedCards.includes(u));
                if(remaining.length > 0) chosenCard = remaining[Math.floor(Math.random() * remaining.length)];
            }
        }
        if(chosenCard) selectedCards.push(chosenCard);
    }

    selectedCards.forEach((opt, i) => {
        const card = document.createElement('div'); 
        let rarityClass = opt.rarity || 'common';
        card.className = `card ${opt.type} ${rarityClass}`;
        card.style.animationDelay = (i * 0.15) + 's';
        let icon = opt.type === 'def' ? '🛡️' : (opt.type === 'util' ? '⚡' : '⚔️');
        card.innerHTML = `<h3>${icon} ${opt.title}</h3><p>${opt.desc}</p>`;
        card.onclick = () => {
            const allCards = box.querySelectorAll('.card');
            allCards.forEach(c => { c.onclick = null; if(c !== card) c.classList.add('dimmed'); });
            if(typeof activeLevelUpSound !== 'undefined' && activeLevelUpSound) { activeLevelUpSound(); activeLevelUpSound = null; }
            sfx.collect(); 
            card.classList.add('selected');
            setTimeout(() => {
                toggleUpgradeScreen(false);
                requestAnimationFrame(() => {
                        opt.apply(player); 
                        player.history.push({ title: opt.title, type: opt.type, desc: opt.desc });
                        triggerUpgradeFX(opt.type);
                        gameState = 'PLAYING'; 
                });
            }, 450); 
        };
        box.appendChild(card);
    });
}

function triggerUpgradeFX(type) {
    screenShake = 15;
    let color = '#fff'; let msg = "UPGRADE!";
    if (type === 'atk') { color = '#e74c3c'; msg = "POWER UP!"; }
    if (type === 'def') { color = '#2ecc71'; msg = "ARMOR UP!"; }
    if (type === 'util') { color = '#f1c40f'; msg = "SYSTEM UP!"; }
    spawnShockwave(player.x, player.y, color);
    if(typeof shockwaves !== 'undefined' && shockwaves.length > 0) shockwaves[shockwaves.length-1].radius = 1; 
    for(let i=0; i<30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particleSystem.spawn(player.x, player.y, color, 3 + Math.random() * 3, 60, Math.cos(angle) * speed, Math.sin(angle) * speed, false);
    }
    spawnPopText(player.x, player.y - 40, msg, true);
}

function renderLeaderboard(elementId) {
    const lb = JSON.parse(localStorage.getItem('neon_survivor_lb')) || [];
    const container = document.getElementById(elementId);
    container.innerHTML = `<div class="lb-row lb-header"><span>#</span><span>AGENT</span><span>STATS</span><span>LOGS</span></div>`;
    lb.forEach((entry, idx) => {
        const row = document.createElement('div'); row.className = 'lb-row';
        if (entry.name === currentPlayerName) row.style.color = '#f1c40f';
        const safeName = document.createElement('span'); safeName.className = 'lb-name'; safeName.innerText = entry.name;
        row.innerHTML = `<span class="lb-rank">${idx+1}</span>`; 
        row.appendChild(safeName); 
        const stats = document.createElement('span'); stats.innerHTML = `${formatTime(entry.seconds)} / ${entry.kills}K`; row.appendChild(stats);
        const btnDiv = document.createElement('div'); const btn = document.createElement('button'); btn.className = 'view-btn'; btn.innerText = 'ACCESS'; btn.onclick = (e) => { e.stopPropagation(); showDetails(entry); };
        btnDiv.appendChild(btn); row.appendChild(btnDiv); container.appendChild(row);
    });
}
function openLeaderboard() { document.getElementById('startScreen').style.display = 'none'; document.getElementById('leaderboardScreen').style.display = 'flex'; renderLeaderboard('lbListMain'); }
function closeLeaderboard() { document.getElementById('leaderboardScreen').style.display = 'none'; document.getElementById('startScreen').style.display = 'flex'; }
function showDetails(entry) { document.getElementById('detailsModal').style.display = 'flex'; document.getElementById('detailName').innerText = entry.name; const grid = document.getElementById('detailsGrid'); grid.innerHTML = ''; if (!entry.history || entry.history.length === 0) { grid.innerHTML = '<p style="color:#666; width:100%; text-align:center;">NO DATA LOGGED.</p>'; return; } entry.history.forEach((upg, i) => { const el = document.createElement('div'); el.className = `history-card ${upg.type}`; el.style.animationDelay = (i * 0.03) + 's'; let icon = upg.type === 'def' ? '🛡️' : (upg.type === 'util' ? '⚡' : '⚔️'); el.innerHTML = `<div class="hc-header"><span class="hc-title">${upg.type.toUpperCase()}</span><span class="hc-icon">${icon}</span></div><strong style="color:white; font-size:11px;">${upg.title}</strong><div class="hc-desc">${upg.desc}</div>`; grid.appendChild(el); }); }
function closeDetails() { document.getElementById('detailsModal').style.display = 'none'; }