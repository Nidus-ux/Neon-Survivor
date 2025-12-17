const WEAPONS_DATABASE = {
    default: {
        id: 'default',
        name: "Neon Repeater",
        desc: "Arma padrão balanceada.",
        baseStats: {},
        draw: (ctx, player) => {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(10, -3);
            ctx.lineTo(10, 3);
            ctx.closePath();
            ctx.fill();
        }
    },
    pulse_repeater: {
        id: 'pulse_repeater',
        name: "Pulse Repeater",
        desc: "Rajadas rápidas, mas imprecisas. Ideal para combate a curta distância.",
        unlockReq: (stats) => stats.totalKills >= 1000,
        baseStats: {
            damage: 8,
            atkSpeed: 10,
            bulletSpeed: 12,
            spread: 0.15
        },
        draw: (ctx, player) => {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(8, -2.5, 10, 5);
            ctx.fillRect(14, -4, 4, 8);
        }
    },
    railgun: {
        id: 'railgun',
        name: "Railgun Desintegrador",
        desc: "Disparo lento e massivo que atravessa todos os inimigos.",
        unlockReq: (stats) => stats.totalKills >= 10000,
        baseStats: {
            damage: 100,
            atkSpeed: 120,
            bulletSpeed: 40,
            bulletSize: 10,
            knockback: 5,
            piercingBullets: true
        },
        draw: (ctx, player) => {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(10, -1.5, 25, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(8, -3, 4, 6);
        }
    },
    data_purge: {
        id: 'data_purge',
        name: "Data Purge Emitter",
        desc: "Emite um cone de dados corrosivos a curta distância.",
        unlockReq: (stats) => stats.bestiary && stats.bestiary.bastion >= 500,
        baseStats: {
            damage: 2,
            atkSpeed: 4,
            projectiles: 15,
            bulletSpeed: 8,
            bulletSize: 6,
            spread: 0.6,
            range: 80
        },
        shootOverride: (player, target) => {
            const a = Math.atan2(target.y - player.y, target.x - player.x);
            const count = Math.floor(player.projectiles);
            const spread = player.spread || 0.6;
            
            for(let i = 0; i < count; i++) {
                const fa = a + (Math.random() - 0.5) * spread;
                bulletSystem.spawn(
                    player.x, player.y,
                    Math.cos(fa) * player.bulletSpeed,
                    Math.sin(fa) * player.bulletSpeed,
                    player.range,
                    player.damage,
                    false,
                    player.bulletSize * (1 + Math.random() * 0.5),
                    '#e74c3c',
                    Math.random() < player.critChance,
                    0,
                    false,
                    0
                );
            }
            if (sfx.shoot) sfx.shoot();
        },
        draw: (ctx, player) => {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(15, -5);
            ctx.lineTo(20, -3);
            ctx.lineTo(20, 3);
            ctx.lineTo(15, 5);
            ctx.closePath();
            ctx.fill();
        }
    },
    ricochet: {
        id: 'ricochet',
        name: "Ricochet Driver",
        desc: "Projéteis que saltam entre múltiplos alvos.",
        unlockReq: (stats) => stats.bestiary && stats.bestiary.dart >= 500,
        baseStats: {
            damage: 25,
            atkSpeed: 45,
            bulletSpeed: 20,
            bounces: 3
        },
        draw: (ctx, player) => {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(15, 0, 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(10, 0); ctx.lineTo(15, -5); ctx.moveTo(10, 0); ctx.lineTo(15, 5);
            ctx.stroke();
        }
    },
    orbital_matrix: {
        id: 'orbital_matrix',
        name: "Orbital Matrix",
        desc: "Frota de Drones que escala com seu Nível. Eles protegem o perímetro e atiram automaticamente.",
        unlockReq: (stats) => stats.angelKills > 0,
        baseStats: {
            damage: 12,
            atkSpeed: 45,
            bulletSpeed: 12,
            projectiles: 1
        },
        shootOverride: (player, target) => {
        },
        draw: (ctx, player) => {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, player.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
};

const weaponSystem = {
    apply: (player, weaponId) => {
        const weapon = WEAPONS_DATABASE[weaponId] || WEAPONS_DATABASE.default;
        
        const base = {
            damage: 20, atkSpeed: 32, bulletSpeed: 15, bulletSize: 8, projectiles: 1, 
            knockback: 1.5, spread: 0, piercingBullets: false, bounces: 0, range: 200, 
            orbitRadius: 0
        };

        const finalStats = { ...base, ...weapon.baseStats };

        for (const key in finalStats) {
            player[key] = finalStats[key];
        }

        player.shootOverride = weapon.shootOverride || null;
        player.drawWeapon = weapon.draw;
        player.weaponId = weapon.id;
    }
};