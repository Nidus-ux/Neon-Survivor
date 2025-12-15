/* 
  upgrades.js - RARITY SYSTEM UPDATE
  - Common (Cinza): Basic stats
  - Uncommon (Verde): Better stats
  - Epic (Roxo): Mechanics & Multi-stats
  - Legendary (Dourado): Game Changers & High Risk
*/

const upgradePool = [
    // =========================================================================
    // ⚪ COMUM (TIER 1) - O "arroz com feijão" para sobreviver
    // =========================================================================
    { 
        title: "Munição Oca", 
        desc: "+10% Dano", 
        type: "atk", rarity: "common",
        apply: (p) => p.damage *= 1.10 
    },
    { 
        title: "Gatilho Leve", 
        desc: "+10% Velocidade de Ataque", 
        type: "atk", rarity: "common",
        apply: (p) => p.atkSpeed *= 0.90 
    },
    { 
        title: "Tênis Velhos", 
        desc: "+10% Velocidade Movimento", 
        type: "util", rarity: "common",
        apply: (p) => p.speed *= 1.1 
    },
    { 
        title: "Lanche Rápido", 
        desc: "Cura 30 HP (Instantâneo)", 
        type: "def", rarity: "common",
        apply: (p) => p.hp = Math.min(p.maxHp, p.hp + 30) 
    },
    { 
        title: "Kevlar Sujo", 
        desc: "+15 HP Máximo", 
        type: "def", rarity: "common",
        apply: (p) => { p.maxHp += 15; p.hp += 15; } 
    },
    { 
        title: "Estudioso", 
        desc: "+10% Ganho de XP", 
        type: "util", rarity: "common",
        apply: (p) => p.xpMultiplier += 0.10 
    },
    { 
        title: "Ímã Fraco", 
        desc: "+20% Raio de Coleta", 
        type: "util", rarity: "common",
        apply: (p) => p.magnetRadius *= 1.2 
    },
    { 
        title: "Olho Digital", 
        desc: "+10% Chance Crítica", 
        type: "atk", rarity: "common",
        apply: (p) => p.critChance += 0.10 
    },
    { 
        title: "Pele Grossa", 
        desc: "+0.2 Regeneração HP/seg", 
        type: "def", rarity: "common",
        apply: (p) => p.regenRate += 0.04 
    },
    { 
        title: "Mira Laser", 
        desc: "+15% Velocidade do Projétil", 
        type: "atk", rarity: "common",
        apply: (p) => p.bulletSpeed *= 1.15 
    },

    // =========================================================================
    // 🟢 INCOMUM (TIER 2) - Upgrades sólidos
    // =========================================================================
    { 
        title: "Núcleo de Plasma", 
        desc: "+20% Dano", 
        type: "atk", rarity: "uncommon",
        apply: (p) => p.damage *= 1.20 
    },
    { 
        title: "Overclock Seguro", 
        desc: "+20% Vel. Ataque", 
        type: "atk", rarity: "uncommon",
        apply: (p) => p.atkSpeed *= 0.80 
    },
    { 
        title: "Propulsores Ion", 
        desc: "+20% Velocidade Movimento", 
        type: "util", rarity: "uncommon",
        apply: (p) => p.speed *= 1.2 
    },
    { 
        title: "Blindagem de Aço", 
        desc: "+40 HP Máximo", 
        type: "def", rarity: "uncommon",
        apply: (p) => { p.maxHp += 40; p.hp += 40; } 
    },
    { 
        title: "Nanobots V1", 
        desc: "+0.5 Regeneração HP/seg", 
        type: "def", rarity: "uncommon",
        apply: (p) => p.regenRate += 0.1 
    },
    { 
        title: "Sabedoria", 
        desc: "+25% Ganho de XP", 
        type: "util", rarity: "uncommon",
        apply: (p) => p.xpMultiplier += 0.25 
    },
    { 
        title: "Super Condutor", 
        desc: "+50% Raio de Coleta", 
        type: "util", rarity: "uncommon",
        apply: (p) => p.magnetRadius *= 1.5 
    },
    { 
        title: "Cano Duplo", 
        desc: "+1 Projétil, -20% Dano", 
        type: "atk", rarity: "uncommon",
        apply: (p) => { p.projectiles += 1; p.damage *= 0.80; } 
    },
    { 
        title: "Crítico Letal", 
        desc: "+50% Dano Crítico", 
        type: "atk", rarity: "uncommon",
        apply: (p) => p.critMult += 0.5 
    },
    { 
        title: "Calibre Pesado", 
        desc: "+40% Tamanho Bala e +20% Knockback", 
        type: "atk", rarity: "uncommon",
        apply: (p) => { p.bulletSize *= 1.4; p.knockback *= 1.2; } 
    },

    // =========================================================================
    // 🟣 ÉPICO (TIER 3) - Define a sua Build
    // =========================================================================
    { 
        title: "Reator Ark", 
        desc: "+40% Dano Base", 
        type: "atk", rarity: "epic",
        apply: (p) => p.damage *= 1.40 
    },
    { 
        title: "Metralhadora", 
        desc: "+50% Vel. Ataque, -25% Dano", 
        type: "atk", rarity: "epic",
        apply: (p) => { p.atkSpeed *= 0.5; p.damage *= 0.75; } 
    },
    { 
        title: "Tiro em Leque", 
        desc: "+2 Projéteis, -30% Dano", 
        type: "atk", rarity: "epic",
        apply: (p) => { p.projectiles += 2; p.damage *= 0.70; } 
    },
    { 
        title: "Sniper Rifle", 
        desc: "+60% Dano, +60% Vel. Projétil, -30% Fire Rate", 
        type: "atk", rarity: "epic",
        apply: (p) => { p.damage *= 1.6; p.bulletSpeed *= 1.6; p.atkSpeed *= 1.3; } 
    },
    { 
        title: "Vampirismo", 
        desc: "15% de Chance de roubar vida ao matar", 
        type: "def", rarity: "epic",
        apply: (p) => { if(!p.lifestealChance) p.lifestealChance=0; p.lifestealChance += 0.15; } 
    },
    { 
        title: "Campo Estático", 
        desc: "Inimigos tomam 10 de dano ao te tocar (Thorns)", 
        type: "def", rarity: "epic",
        apply: (p) => { if(!p.thorns) p.thorns=0; p.thorns += 10; } 
    },
    { 
        title: "Protocolo Fantasma", 
        desc: "+20% Chance de Evasão (Ignora dano)", 
        type: "def", rarity: "epic",
        apply: (p) => { if(!p.dodge) p.dodge=0; p.dodge += 0.20; } 
    },
    { 
        title: "Titanium Hull", 
        desc: "+100 HP Máximo, -10% Velocidade", 
        type: "def", rarity: "epic",
        apply: (p) => { p.maxHp += 100; p.hp += 100; p.speed *= 0.90; } 
    },
    { 
        title: "Aerodinâmica", 
        desc: "Ganha +3 Dano a cada 1 ponto de Velocidade", 
        type: "util", rarity: "epic",
        apply: (p) => p.damage += (p.speed * 3) 
    },
    { 
        title: "Kit Médico Militar", 
        desc: "Cura 100% da Vida e ganha +10% Max HP", 
        type: "def", rarity: "epic",
        apply: (p) => { p.maxHp *= 1.1; p.hp = p.maxHp; } 
    },

    // =========================================================================
    // 🟡 LENDÁRIO (TIER 4) - Quebra o jogo (Raros e Fortes)
    // =========================================================================
    { 
        title: "O EXECUTADOR", 
        desc: "Aumenta Dano baseado no seu Nível atual (Lvl * 2)", 
        type: "atk", rarity: "legendary",
        apply: (p) => p.damage += (p.level * 2) 
    },
    { 
        title: "CANHÃO DE VIDRO", 
        desc: "+150% Dano, mas seu HP Máximo cai pela metade", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.damage *= 2.5; p.maxHp = Math.floor(p.maxHp * 0.5); if(p.hp > p.maxHp) p.hp = p.maxHp; } 
    },
    { 
        title: "MATRIX INSTÁVEL", 
        desc: "+4 Projéteis, mas Balas -50% Tamanho e Velocidade", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.projectiles += 4; p.bulletSpeed *= 0.5; p.bulletSize *= 0.5; } 
    },
    { 
        title: "BERSERKER", 
        desc: "+50% Dano e +50% Vel. Ataque, mas toma +20% Dano", 
        type: "atk", rarity: "legendary",
        apply: (p) => { p.damage *= 1.5; p.atkSpeed *= 0.5; p.maxHp *= 0.8; if(p.hp > p.maxHp) p.hp = p.maxHp; } 
    },
    { 
        title: "IMUNIDADE DIVINA", 
        desc: "Tempo de invencibilidade dobrado após tomar dano", 
        type: "def", rarity: "legendary",
        apply: (p) => p.invulnDuration *= 2 
    },
    { 
        title: "GLITCH DO SISTEMA", 
        desc: "Randomiza todos status drasticamente (Sorte ou Azar?)", 
        type: "util", rarity: "legendary",
        apply: (p) => { 
            p.damage *= (0.5 + Math.random() * 2); // 0.5x a 2.5x
            p.atkSpeed *= (0.5 + Math.random() * 1.5);
            p.speed *= (0.8 + Math.random() * 0.5);
        } 
    },
    { 
        title: "DATA MINER GOD", 
        desc: "XP em Dobro (200%), mas perde 20% Dano", 
        type: "util", rarity: "legendary",
        apply: (p) => { p.xpMultiplier *= 2; p.damage *= 0.8; } 
    }
];