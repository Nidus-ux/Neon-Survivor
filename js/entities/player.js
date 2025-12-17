// Definição global do jogador
const player = {
    x: 0, 
    y: 0,
    size: 15,
    color: '#0ff',
    
     
    speed: 7,
    maxHp: 100,
    hp: 100,
    regenRate: 0,
    
    
    invulnDuration: 30,
    invulnTimer: 0,
    lifesteal: 0,
    lifestealChance: 0,
    healOnLevelUp: 0,
    
    
    damage: 20,
    atkSpeed: 32,
    cooldown: 0,
    projectiles: 1,
    bulletSpeed: 15,
    bulletSize: 8,
    knockback: 1.5,
    spread: 0,
    piercingBullets: false,
    bounces: 0,
    range: 200,
    
    
    critChance: 0.05,
    critMult: 2,
    magnetRadius: 150,
    xpMultiplier: 1,
    dodge: 0,
    thorns: 0,
    reviveCount: 0,
    
    
    xp: 0,
    nextLevelXp: 15,
    level: 1,
    kills: 0,
    history: [],
    
    
    angle: 0,
    trail: [],
    glowlyActive: false,
    
    
    shootOverride: null,
    drawWeapon: null,
    weaponId: 'default'
};