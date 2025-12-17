const PERM_UPGRADES = {
    HEALTH: {
        id: 'HEALTH',
        name: 'HARD LIGHT SHIELD',
        desc: 'Aumenta HP Máximo inicial.',
        baseCost: 100,
        costMult: 1.5,
        maxLevel: 10,
        valPerLevel: 10, 
        icon: '🛡️'
    },
    DAMAGE: {
        id: 'DAMAGE',
        name: 'COMPILER OPTIMIZATION',
        desc: 'Aumenta Dano Base inicial.',
        baseCost: 150,
        costMult: 1.6,
        maxLevel: 10,
        valPerLevel: 2, 
        icon: '⚔️'
    },
    SPEED: {
        id: 'SPEED',
        name: 'OVERCLOCK THREADS',
        desc: 'Aumenta Velocidade de Movimento.',
        baseCost: 120,
        costMult: 1.4,
        maxLevel: 5,
        valPerLevel: 0.5, 
        icon: '⚡'
    },
    GREED: {
        id: 'GREED',
        name: 'DATA MINING ALGO',
        desc: 'Aumenta ganho de Data Chips ao fim da run.',
        baseCost: 200,
        costMult: 1.8,
        maxLevel: 5,
        valPerLevel: 0.1, 
        icon: '💎'
    },
    REROLL: {
        id: 'REROLL',
        name: 'CACHE FLUSH',
        desc: 'Permite trocar as cartas de upgrade (Reroll).',
        baseCost: 500,
        costMult: 2.0,
        maxLevel: 3,
        valPerLevel: 1, 
        icon: '🎲'
    }
};

const DEFAULT_SAVE = {
    version: 1,
    currency: 0,
    equippedWeapon: 'default',
    unlockedWeapons: ['default'],
    upgrades: {
        HEALTH: 0,
        DAMAGE: 0,
        SPEED: 0,
        GREED: 0,
        REROLL: 0
    },
    bestiary: {}, 
    stats: {
        totalRuns: 0,
        totalTime: 0,
        totalKills: 0,
        angelKills: 0,
        highestLevel: 1
    },
    unlocks: {
        angelDefeated: false,
        hardMode: false
    }
};

const saveSystem = {
    currentData: null,
    currentNick: null,

    load: function(nickname) {
        this.currentNick = nickname.trim().toUpperCase();
        const key = `neon_rogue_${this.currentNick}`;
        const raw = localStorage.getItem(key);

        if (raw) {
            const data = JSON.parse(raw);
            this.currentData = { ...DEFAULT_SAVE, ...data };
            
            if (!this.currentData.upgrades) this.currentData.upgrades = { ...DEFAULT_SAVE.upgrades };
            if (!this.currentData.stats) this.currentData.stats = { ...DEFAULT_SAVE.stats };
            if (!this.currentData.unlockedWeapons) this.currentData.unlockedWeapons = ['default'];
        } else {
            this.currentData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        }
        
        return this.currentData;
    },

    save: function() {
        if (!this.currentNick || !this.currentData) return;
        const key = `neon_rogue_${this.currentNick}`;
        localStorage.setItem(key, JSON.stringify(this.currentData));
    },

    processRunEnd: function(result) {
        if (!this.currentData) return null;

        const timeInSeconds = Math.floor(result.time);
        let earnedChips = Math.floor(timeInSeconds / 10);
        
        if (result.won) earnedChips += 100;
        if (result.bossKill) earnedChips += 50;

        const greedLevel = this.currentData.upgrades.GREED || 0;
        const greedBonus = 1 + (greedLevel * PERM_UPGRADES.GREED.valPerLevel);
        earnedChips = Math.floor(earnedChips * greedBonus);

        this.currentData.currency += earnedChips;
        this.currentData.stats.totalRuns++;
        this.currentData.stats.totalTime += timeInSeconds;
        this.currentData.stats.totalKills += result.kills;
        if (result.level > this.currentData.stats.highestLevel) {
            this.currentData.stats.highestLevel = result.level;
        }
        if (result.bossKill) {
            this.currentData.stats.angelKills++;
            this.currentData.unlocks.angelDefeated = true;
        }

        if (result.bestiaryUpdates) {
            for (const [enemyId, count] of Object.entries(result.bestiaryUpdates)) {
                if (!this.currentData.bestiary[enemyId]) {
                    this.currentData.bestiary[enemyId] = 0;
                }
                this.currentData.bestiary[enemyId] += count;
            }
        }
        
        const combinedStats = {
            ...this.currentData.stats,
            bestiary: this.currentData.bestiary
        };

        for (const weaponId in WEAPONS_DATABASE) {
            if (!this.currentData.unlockedWeapons.includes(weaponId)) {
                const weapon = WEAPONS_DATABASE[weaponId];
                if (weapon.unlockReq && weapon.unlockReq(combinedStats)) {
                    this.currentData.unlockedWeapons.push(weaponId);
                }
            }
        }

        this.save();
        return earnedChips;
    },

    buyUpgrade: function(upgradeId) {
        if (!this.currentData) return false;
        
        const upgDef = PERM_UPGRADES[upgradeId];
        const currentLvl = this.currentData.upgrades[upgradeId] || 0;

        if (currentLvl >= upgDef.maxLevel) return false;

        const cost = Math.floor(upgDef.baseCost * Math.pow(upgDef.costMult, currentLvl));

        if (this.currentData.currency >= cost) {
            this.currentData.currency -= cost;
            this.currentData.upgrades[upgradeId]++;
            this.save();
            return true;
        }
        return false;
    },

    getCost: function(upgradeId) {
        if (!this.currentData) return 0;
        const upgDef = PERM_UPGRADES[upgradeId];
        const currentLvl = this.currentData.upgrades[upgradeId] || 0;
        if (currentLvl >= upgDef.maxLevel) return "MAX";
        return Math.floor(upgDef.baseCost * Math.pow(upgDef.costMult, currentLvl));
    },

    applyToPlayer: function(player) {
        if (!this.currentData) return;

        const u = this.currentData.upgrades;
        
        player.maxHp += u.HEALTH * PERM_UPGRADES.HEALTH.valPerLevel;
        player.hp = player.maxHp;
        
        player.damage += u.DAMAGE * PERM_UPGRADES.DAMAGE.valPerLevel;
        
        player.speed += u.SPEED * PERM_UPGRADES.SPEED.valPerLevel;
        
        player.rerolls = u.REROLL * PERM_UPGRADES.REROLL.valPerLevel;
    },

    resetData: function() {
        this.currentData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.save();
    }
};