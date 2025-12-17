const upgradePool = [
    { 
        title: "ADMINISTRADORA GLOWLY", 
        desc: "PROTOCOLO FINAL: Dobra Dano, Crítico e Dano Crítico. O sistema não te reconhece mais.", 
        type: "atk", rarity: "mythic", unique: true,
        apply: (p) => { 
            p.damage *= 2;
            p.critChance *= 2;
            p.critMult *= 2;
            p.size *= 1.25;
            p.color = '#ff003c'; 
            p.glowlyActive = true; 
        } 
    },
    { title: "Munição Oca", desc: "+5% Dano", type: "atk", rarity: "common", apply: (p) => p.damage *= 1.05 },
    { title: "Gatilho Leve", desc: "+5% Vel. Ataque", type: "atk", rarity: "common", apply: (p) => p.atkSpeed *= 0.95 },
    { title: "Tênis Velhos", desc: "+5% Velocidade", type: "util", rarity: "common", apply: (p) => p.speed *= 1.05 },
    { title: "Lanche Rápido", desc: "Cura 15 HP", type: "def", rarity: "common", apply: (p) => p.hp = Math.min(p.maxHp, p.hp + 15) },
    { title: "Kevlar Sujo", desc: "+10 HP Máximo", type: "def", rarity: "common", apply: (p) => { p.maxHp += 10; p.hp += 10; } },
    { title: "Estudioso", desc: "+5% Ganho XP", type: "util", rarity: "common", apply: (p) => p.xpMultiplier += 0.05 },
    { title: "Ímã Fraco", desc: "+10% Coleta", type: "util", rarity: "common", apply: (p) => p.magnetRadius *= 1.1 },
    { title: "Olho Digital", desc: "+5% Crítico", type: "atk", rarity: "common", apply: (p) => p.critChance += 0.05 },
    { title: "Pele Grossa", desc: "+0.1 Regen/s", type: "def", rarity: "common", apply: (p) => p.regenRate += 0.02 },
    { title: "Mira Laser", desc: "+10% Vel. Projétil", type: "atk", rarity: "common", apply: (p) => p.bulletSpeed *= 1.1 },
    
    { title: "Cache Limpo", desc: "+3% Vel. Ataque", type: "atk", rarity: "common", apply: (p) => p.atkSpeed *= 0.97 },
    { title: "Desfragmentar", desc: "+3% Dano", type: "atk", rarity: "common", apply: (p) => p.damage *= 1.03 },
    { title: "Bateria Extra", desc: "+5% Duração Invuln.", type: "def", rarity: "common", apply: (p) => p.invulnDuration *= 1.05 },
    { title: "Lubrificante", desc: "+3% Velocidade", type: "util", rarity: "common", apply: (p) => p.speed *= 1.03 },
    { title: "Antena Curta", desc: "+5% Coleta", type: "util", rarity: "common", apply: (p) => p.magnetRadius *= 1.05 },
    { title: "Backup Leve", desc: "Cura 10 HP", type: "def", rarity: "common", apply: (p) => p.hp = Math.min(p.maxHp, p.hp + 10) },
    { title: "Pedra de Afiar", desc: "+10% Dano Crítico", type: "atk", rarity: "common", apply: (p) => p.critMult += 0.1 },
    { title: "Mola de Recuo", desc: "+10% Knockback", type: "atk", rarity: "common", apply: (p) => p.knockback *= 1.1 },
    { title: "Casco de Lata", desc: "+5 HP Máximo", type: "def", rarity: "common", apply: (p) => { p.maxHp += 5; p.hp += 5; } },
    { title: "Download", desc: "+2% Ganho XP", type: "util", rarity: "common", apply: (p) => p.xpMultiplier += 0.02 },

    { title: "Núcleo Plasma", desc: "+12% Dano", type: "atk", rarity: "uncommon", apply: (p) => p.damage *= 1.12 },
    { title: "Overclock V1", desc: "+12% Vel. Ataque", type: "atk", rarity: "uncommon", apply: (p) => p.atkSpeed *= 0.88 },
    { title: "Propulsores Ion", desc: "+12% Velocidade", type: "util", rarity: "uncommon", apply: (p) => p.speed *= 1.12 },
    { title: "Blindagem Aço", desc: "+25 HP Máximo", type: "def", rarity: "uncommon", apply: (p) => { p.maxHp += 25; p.hp += 25; } },
    { title: "Nanobots V1", desc: "+0.3 Regen/s", type: "def", rarity: "uncommon", apply: (p) => p.regenRate += 0.06 },
    { title: "Sabedoria", desc: "+15% Ganho XP", type: "util", rarity: "uncommon", apply: (p) => p.xpMultiplier += 0.15 },
    { title: "Super Condutor", desc: "+30% Coleta", type: "util", rarity: "uncommon", apply: (p) => p.magnetRadius *= 1.3 },
    { title: "Cano Duplo", desc: "+1 Projétil, -25% Dano", type: "atk", rarity: "uncommon", apply: (p) => { p.projectiles += 1; p.damage *= 0.75; p.spread += 0.1; } },
    { title: "Crítico Letal", desc: "+30% Dano Crítico", type: "atk", rarity: "uncommon", apply: (p) => p.critMult += 0.3 },
    { title: "Calibre Pesado", desc: "+25% Tamanho, +15% Knockback", type: "atk", rarity: "uncommon", apply: (p) => { p.bulletSize *= 1.25; p.knockback *= 1.15; } },

    { title: "Foco Tático", desc: "+10% Crítico, -5% Vel. Ataque", type: "atk", rarity: "uncommon", apply: (p) => { p.critChance += 0.10; p.atkSpeed *= 1.05; } },
    { title: "Blindagem Reativa", desc: "Toma -10% Dano (Simulado por +HP)", type: "def", rarity: "uncommon", apply: (p) => { p.maxHp += 15; p.hp += 15; } },
    { title: "Botas Grav", desc: "+10% Vel, +5% Dodge", type: "util", rarity: "uncommon", apply: (p) => { p.speed *= 1.1; p.dodge = (p.dodge || 0) + 0.05; } },
    { title: "Reciclador", desc: "Cura 2 HP ao subir nível", type: "def", rarity: "uncommon", apply: (p) => p.healOnLevelUp = (p.healOnLevelUp || 0) + 2 },
    { title: "Bala Perfurante", desc: "+15% Dano, -10% Cooldown", type: "atk", rarity: "uncommon", apply: (p) => { p.damage *= 1.15; p.atkSpeed *= 0.9; } },
    { title: "Campo de Força", desc: "Invencível por +0.5s após hit", type: "def", rarity: "uncommon", apply: (p) => p.invulnDuration += 30 },
    { title: "Mineração de Dados", desc: "+20% XP, -10% Coleta", type: "util", rarity: "uncommon", apply: (p) => { p.xpMultiplier += 0.20; p.magnetRadius *= 0.9; } },
    { title: "Torreta", desc: "+30% Dano, -20% Velocidade", type: "atk", rarity: "uncommon", apply: (p) => { p.damage *= 1.3; p.speed *= 0.8; } },
    { title: "Médico de Campo", desc: "Cura 50% HP Atual", type: "def", rarity: "uncommon", apply: (p) => p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.5)) },
    { title: "Stabilizer", desc: "+15% Precisão (Crítico) e +5 Dano", type: "atk", rarity: "uncommon", apply: (p) => { p.critChance += 0.05; p.damage += 5; } },

    { title: "Reator Ark", desc: "+25% Dano Base", type: "atk", rarity: "epic", apply: (p) => p.damage *= 1.25 },
    { title: "Metralhadora", desc: "+35% Vel. Ataque, -30% Dano", type: "atk", rarity: "epic", apply: (p) => { p.atkSpeed *= 0.65; p.damage *= 0.70; } },
    { title: "Tiro em Leque", desc: "+2 Projéteis, -40% Dano", type: "atk", rarity: "epic", apply: (p) => { p.projectiles += 2; p.damage *= 0.60; p.spread += 0.2; } },
    { title: "Sniper Rifle", desc: "+40% Dano, +40% Vel. Bala, -40% Fire Rate", type: "atk", rarity: "epic", apply: (p) => { p.damage *= 1.4; p.bulletSpeed *= 1.4; p.atkSpeed *= 1.4; } },
    { title: "Vampirismo", desc: "5% Chance de roubar 1 HP", type: "def", rarity: "epic", apply: (p) => { p.lifestealChance = (p.lifestealChance || 0) + 0.05; } },
    { title: "Campo Estático", desc: "Thorns +5 Dano", type: "def", rarity: "epic", apply: (p) => { p.thorns = (p.thorns || 0) + 5; } },
    { title: "Protocolo Fantasma", desc: "+15% Dodge", type: "def", rarity: "epic", apply: (p) => { p.dodge = (p.dodge || 0) + 0.15; } },
    { title: "Titanium Hull", desc: "+60 HP Máximo, -15% Speed", type: "def", rarity: "epic", apply: (p) => { p.maxHp += 60; p.hp += 60; p.speed *= 0.85; } },
    { title: "Aerodinâmica", desc: "+1.5 Dano por ponto de Speed", type: "util", rarity: "epic", apply: (p) => p.damage += (p.speed * 1.5) },
    { title: "Kit Militar", desc: "Cura 100% HP e +5% Max HP", type: "def", rarity: "epic", apply: (p) => { p.maxHp *= 1.05; p.hp = p.maxHp; } },
    { title: "Canhão Gauss", desc: "Balas gigantes (+100% Tamanho) e atravessam inimigos.", type: "atk", rarity: "epic", apply: (p) => { p.bulletSize *= 2; p.knockback *= 1.5; p.piercingBullets = true; } },
    { title: "Motor de Dobra", desc: "+40% Velocidade, -20 HP", type: "util", rarity: "epic", apply: (p) => { p.speed *= 1.4; p.maxHp -= 20; if(p.hp > p.maxHp) p.hp = p.maxHp; } },
    { title: "Matriz Defensiva", desc: "+1.0 Regen/s, -20% Dano", type: "def", rarity: "epic", apply: (p) => { p.regenRate += 0.2; p.damage *= 0.8; } },
    { title: "Assassino Digital", desc: "+100% Dano Crítico, -10% Chance Crítica", type: "atk", rarity: "epic", apply: (p) => { p.critMult += 1.0; p.critChance -= 0.1; } },
    { title: "Proxy Reverso", desc: "Converte 50% da Coleta em Dano", type: "util", rarity: "epic", apply: (p) => { let gain = p.magnetRadius * 0.1; p.magnetRadius *= 0.5; p.damage += gain; } },
    { title: "Backup na Nuvem", desc: "Ao morrer, revive uma vez com 50% do HP Máximo.", type: "def", rarity: "epic", unique: true, apply: (p) => { p.reviveCount = (p.reviveCount || 0) + 1; } },
    { title: "Overflow", desc: "+5 Projéteis, mas espalham muito e -60% Dano", type: "atk", rarity: "epic", apply: (p) => { p.projectiles += 5; p.damage *= 0.4; p.spread += 0.35; } },
    { title: "Daemon de Fogo", desc: "+20% Dano e +20% Vel. Ataque", type: "atk", rarity: "epic", apply: (p) => { p.damage *= 1.2; p.atkSpeed *= 0.8; } },
    { title: "Overload", desc: "Reseta Cooldowns e ganha +10 Dano Base", type: "atk", rarity: "epic", apply: (p) => { p.cooldown = 0; p.damage += 10; } },

    { 
        title: "O EXECUTADOR", 
        desc: "Aumenta Dano baseado no Nível (Lvl * 1.5)", 
        type: "atk", rarity: "legendary",
        apply: (p) => p.damage += (p.level * 1.5) 
    },
    { 
        title: "CANHÃO DE VIDRO", 
        desc: "+80% Dano, HP Máximo cai 40%", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.damage *= 1.8; p.maxHp = Math.floor(p.maxHp * 0.6); if(p.hp > p.maxHp) p.hp = p.maxHp; } 
    },
    { 
        title: "MATRIX INSTÁVEL", 
        desc: "+3 Projéteis, Balas -30% Tamanho e Vel", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.projectiles += 3; p.bulletSpeed *= 0.7; p.bulletSize *= 0.7; p.spread += 0.15; } 
    },
    { 
        title: "BERSERKER", 
        desc: "+40% Dano e +30% Vel. Ataque, toma +10% Dano (Simulado -HP)", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.damage *= 1.4; p.atkSpeed *= 0.7; p.maxHp *= 0.9; if(p.hp > p.maxHp) p.hp = p.maxHp; } 
    },
    { 
        title: "IMUNIDADE DIVINA", 
        desc: "Tempo de invencibilidade +50%", 
        type: "def", rarity: "legendary",
        apply: (p) => p.invulnDuration *= 1.5 
    },
    { 
        title: "DATA MINER GOD", 
        desc: "XP +80%, Perde 15% Dano", 
        type: "util", rarity: "legendary",
        apply: (p) => { p.xpMultiplier += 0.8; p.damage *= 0.85; } 
    }
];