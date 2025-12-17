const bulletSystem = {
    active: [],
    pool: [],
    spawn: function(x, y, vx, vy, life, damage, isEnemy, size, color, isCrit, knockback, isPiercing, bounces = 0) {
        let b;
        if (this.pool.length > 0) {
            b = this.pool.pop();
            b.x = x; b.y = y; b.vx = vx; b.vy = vy;
            b.life = life; b.damage = damage;
            b.isEnemy = !!isEnemy;
            b.size = size; b.color = color;
            b.isCrit = !!isCrit;
            b.knockback = knockback || 0;
            b.piercing = !!isPiercing;
            b.bounces = bounces || 0;
            b.hitEnemies = [];
        } else {
            b = { x, y, vx, vy, life, damage, isEnemy: !!isEnemy, size, color, isCrit: !!isCrit, knockback: knockback || 0, piercing: !!isPiercing, bounces: bounces || 0, hitEnemies: [] };
        }
        this.active.push(b);
    },
    update: function(timeScale) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            let b = this.active[i]; 
            b.x += b.vx * timeScale; 
            b.y += b.vy * timeScale; 
            b.life -= 1 * timeScale;
            
            if (b.isEnemy) {
                if (Math.hypot(player.x - b.x, player.y - b.y) < player.size + b.size) {
                    if (typeof takeDamage === 'function') takeDamage(b.damage); 
                    this.recycle(i);
                } else if (b.life <= 0) {
                    this.recycle(i);
                }
                continue;
            }

            if(typeof frames !== 'undefined' && frames % 5 === 0) { 
                particleSystem.spawn(b.x, b.y, '#f1c40f', 2, 10, 0, 0, true);
            }
            if (b.life <= 0) { this.recycle(i); continue; }
            
            let hit = false;
            
            if (typeof bossSystem !== 'undefined' && bossSystem.active && bossSystem.invulnTimer <= 0 && Math.hypot(b.x - bossSystem.x, b.y - bossSystem.y) < bossSystem.width * 0.5) {
                let dmg = b.isCrit ? b.damage * player.critMult : b.damage; 
                bossSystem.hp -= dmg; bossSystem.flash = 5;
                spawnPopText(bossSystem.x, bossSystem.y + 50, Math.floor(dmg), b.isCrit);
                spawnParticles(b.x, b.y, '#fff', 3);
                hit = true;
            } else {
                for (let j = enemySystem.enemies.length - 1; j >= 0; j--) {
                    let e = enemySystem.enemies[j];
                    if (b.hitEnemies.includes(e)) continue;

                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                        let dmg = b.isCrit ? b.damage * player.critMult : b.damage; e.hp -= dmg; e.flashTimer = 5;
                        if (e.type !== 'bastion') {
                            e.x += b.vx * (b.knockback * 0.5); 
                            e.y += b.vy * (b.knockback * 0.5);
                        }
                        spawnPopText(e.x, e.y, Math.floor(dmg), b.isCrit); 
                        spawnParticles(e.x, e.y, e.color, 3);
                        if (e.hp <= 0) { enemySystem.handleDeath(e, j); if(typeof sfx !== 'undefined') sfx.explosion(); } else { if(typeof sfx !== 'undefined') sfx.hit(); }
                        hit = true; 
                        
                        if (b.bounces > 0) {
                            b.bounces--;
                            b.hitEnemies.push(e);
                            const nextTarget = findNextTarget({x: b.x, y: b.y}, e);
                            if (nextTarget) {
                                const angle = Math.atan2(nextTarget.y - b.y, nextTarget.x - b.x);
                                b.vx = Math.cos(angle) * player.bulletSpeed;
                                b.vy = Math.sin(angle) * player.bulletSpeed;
                            } else {
                                this.recycle(i);
                            }
                        }
                        
                        break; 
                    }
                }
            }
            if (hit && !b.piercing && b.bounces <= 0) this.recycle(i);
        }
    },
    recycle: function(index) {
        const b = this.active[index];
        if (!b) return;
        this.active[index] = this.active[this.active.length - 1];
        this.active.pop();
        if(this.pool.length < 500) this.pool.push(b);
    },
    draw: function(ctx) {
        this.active.forEach(b => {
            ctx.fillStyle = b.color || '#fff'; 
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
        });
    }
};

const bullets = bulletSystem.active;