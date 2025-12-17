const LORE_DATABASE = {
    standard: {
        name: "DRONE OPERÁRIO",
        desc: "Unidades básicas de manutenção. Foram os primeiros a serem corrompidos pelo pulso.",
        req: 50
    },
    bastion: {
        name: "BASTION-09",
        desc: "Paredes de fogo móveis. Sua blindagem é feita de dados comprimidos impossíveis de deletar.",
        req: 100
    },
    dart: {
        name: "PROJETO V-JET",
        desc: "Velozes e instáveis. Eles não atiram para matar, eles colidem para deletar.",
        req: 150
    },
    fragment: {
        name: "FRAGMENTO",
        desc: "Restos de código que ganharam consciência. Frágeis, mas numerosos.",
        req: 200
    },
    weaver: {
        name: "ARQUITETO DE REDE",
        desc: "Criam zonas de perigo estáticas. Originalmente desenhados para construir firewalls.",
        req: 250
    },
    nova: {
        name: "PROTOCOLO SUPERNOVA",
        desc: "Unidades suicidas. Se chegarem perto, a explosão de dados corrompe tudo ao redor.",
        req: 300
    },
    boss: {
        name: "NEON ANGEL",
        desc: "A Antiga Administradora. Ela não está atacando por maldade, mas tentando purgar o sistema do que ela acredita ser um vírus: VOCÊ.",
        req: 1
    }
};

const hubSystem = {
    isActive: false,

    init: function() {
        if (document.getElementById('hub-screen')) return;

        const hubHTML = `
            <div id="hub-screen" style="display:none;">
                <div class="hub-header">
                    <div class="hub-title">NEON // HUB</div>
                    <div class="hub-currency">DATA CHIPS: <span id="hub-chips">0</span> 💎</div>
                </div>
                
                <div class="hub-nav">
                    <button onclick="hubSystem.switchTab('upgrades')">SYSTEM UPGRADES</button>
                    <button onclick="hubSystem.switchTab('weapons')">ARSENAL</button>
                    <button onclick="hubSystem.switchTab('database')">DATABASE</button>
                    <button onclick="hubSystem.launchRun()" class="btn-deploy">DEPLOY RUN</button>
                </div>

                <div id="tab-upgrades" class="hub-content"></div>
                <div id="tab-weapons" class="hub-content" style="display:none;"></div>
                <div id="tab-database" class="hub-content" style="display:none;"></div>
                
                <button class="btn-back-hub" onclick="hubSystem.close()">SAIR PARA MENU</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', hubHTML);
    },

    open: function() {
        const nick = document.getElementById('playerName').value;
        if (!nick) { alert("IDENTIFICAÇÃO NECESSÁRIA"); return; }
        
        saveSystem.load(nick);
        
        const hub = document.getElementById('hub-screen');
        const start = document.getElementById('startScreen');
        
        start.style.display = 'none';
        hub.style.display = 'flex';
        
        hub.classList.remove('hub-anim-out');
        hub.classList.add('hub-anim-in');
        
        if (typeof hubSfx !== 'undefined') hubSfx.playMusic();

        this.isActive = true;
        this.updateUI();
        this.switchTab('upgrades');
    },

    close: function() {
        if (typeof hubSfx !== 'undefined') hubSfx.stopMusic();

        const hub = document.getElementById('hub-screen');
        
        hub.classList.remove('hub-anim-in');
        hub.classList.add('hub-anim-out');
        
        setTimeout(() => {
            hub.style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
            this.isActive = false;
        }, 400);
    },

    launchRun: function() {
        if (typeof hubSfx !== 'undefined') hubSfx.stopMusic();

        const hub = document.getElementById('hub-screen');
        
        hub.classList.remove('hub-anim-in');
        hub.classList.add('hub-anim-out');
        
        setTimeout(() => {
            hub.style.display = 'none';
            document.getElementById('hud').style.display = 'block';
            saveSystem.applyToPlayer(player);
            startGame(); 
        }, 400);
    },

    updateUI: function() {
        document.getElementById('hub-chips').innerText = saveSystem.currentData.currency;
        this.renderUpgrades();
        this.renderWeapons();
    },

    switchTab: function(tabName) {
        document.querySelectorAll('.hub-content').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-${tabName}`).style.display = 'grid';
        
        if (tabName === 'database') this.renderBestiary();
        else if (tabName === 'weapons') this.renderWeapons();
        else this.renderUpgrades();
    },

    renderUpgrades: function() {
        const container = document.getElementById('tab-upgrades');
        container.innerHTML = '';

        for (const key in PERM_UPGRADES) {
            const upg = PERM_UPGRADES[key];
            const currentLvl = saveSystem.currentData.upgrades[key] || 0;
            const cost = saveSystem.getCost(key);
            const isMax = currentLvl >= upg.maxLevel;
            const canBuy = !isMax && saveSystem.currentData.currency >= cost;

            const div = document.createElement('div');
            div.className = 'hub-card';
            div.innerHTML = `
                <div class="hc-icon">${upg.icon}</div>
                <div class="hc-info">
                    <h3>${upg.name}</h3>
                    <p>${upg.desc}</p>
                </div>
                <button class="hc-buy ${canBuy ? '' : 'locked'} ${isMax ? 'maxed' : ''}" 
                    onclick="hubSystem.buy('${key}')">
                    <span class="buy-price">${isMax ? 'MAX' : cost + ' 💎'}</span>
                    <span class="buy-lvl">LVL ${currentLvl} / ${upg.maxLevel}</span>
                </button>
            `;
            container.appendChild(div);
        }
    },
    
    renderWeapons: function() {
        const container = document.getElementById('tab-weapons');
        container.innerHTML = '';
        
        for (const key in WEAPONS_DATABASE) {
            const weapon = WEAPONS_DATABASE[key];
            const isUnlocked = saveSystem.currentData.unlockedWeapons.includes(key);
            const isEquipped = saveSystem.currentData.equippedWeapon === key;

            const div = document.createElement('div');
            div.className = `hub-card weapon-card ${isUnlocked ? '' : 'locked'} ${isEquipped ? 'equipped' : ''}`;
            
            if (isUnlocked) {
                 div.onclick = () => this.equipWeapon(key);
                 div.innerHTML = `
                    <div class="hc-info">
                        <h3>${weapon.name} ${isEquipped ? '<span class="equipped-tag">EQUIPPED</span>' : ''}</h3>
                        <p>${weapon.desc}</p>
                    </div>
                `;
            } else {
                 div.innerHTML = `
                    <div class="hc-info">
                        <h3>LOCKED WEAPON</h3>
                        <p>Requisito de desbloqueio oculto.</p>
                    </div>
                `;
            }
            container.appendChild(div);
        }
    },

    renderBestiary: function() {
        const container = document.getElementById('tab-database');
        container.innerHTML = '';
        
        const stats = saveSystem.currentData.bestiary || {};
        const angelKills = saveSystem.currentData.stats.angelKills || 0;

        for (const type in LORE_DATABASE) {
            const data = LORE_DATABASE[type];
            let killCount = 0;

            if (type === 'boss') killCount = angelKills;
            else killCount = stats[type] || 0;

            const isUnlocked = killCount >= data.req;
            
            const div = document.createElement('div');
            div.className = `lore-entry ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            if (isUnlocked) {
                div.innerHTML = `
                    <h4>${data.name} <span>✔</span></h4>
                    <p>${data.desc}</p>
                    <div class="lore-stat">ELIMINADOS: ${killCount}</div>
                `;
            } else {
                div.innerHTML = `
                    <h4>DADOS CORROMPIDOS <span>🔒</span></h4>
                    <p>Elimine ${data.req} unidades para descriptografar.</p>
                    <div class="lore-stat">PROGRESSO: ${killCount} / ${data.req}</div>
                `;
            }
            container.appendChild(div);
        }
    },

    buy: function(id) {
        if (saveSystem.buyUpgrade(id)) {
            if (typeof hubSfx !== 'undefined') hubSfx.buySuccess();
            this.updateUI();
        } else {
            if (typeof hubSfx !== 'undefined') hubSfx.buyFail();
        }
    },

    equipWeapon: function(id) {
        saveSystem.currentData.equippedWeapon = id;
        saveSystem.save();
        this.renderWeapons();
        if (typeof hubSfx !== 'undefined') hubSfx.click();
    }
};

window.addEventListener('load', () => {
    hubSystem.init();
    const startBtn = document.querySelector('#startScreen .btn-start');
    if(startBtn) {
        startBtn.onclick = () => hubSystem.open();
        startBtn.innerText = "DATA HUB";
    }
});