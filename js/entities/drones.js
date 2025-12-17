const droneSystem = {
    activeDrones: [],

    reset: function() {
        this.activeDrones = [];
    },

    sync: function(player) {
        if (player.weaponId !== 'orbital_matrix') {
            this.activeDrones.length = 0;
            return;
        }

        const targetCount = Math.min(24, 1 + player.level);
        
        if (this.activeDrones.length > targetCount) {
            this.activeDrones.splice(targetCount);
        }

        while (this.activeDrones.length < targetCount) {
            this.activeDrones.push({ 
                x: player.x + (Math.random()-0.5)*50,
                y: player.y + (Math.random()-0.5)*50,
                vx: 0,
                vy: 0,
                angle: Math.random() * Math.PI * 2,
                cooldown: Math.random() * 30,
                contactCooldown: 0,
                id: Math.random()
            });
        }
    },

    update: function(timeScale, player, enemySystem, bulletSystem) {
        if (this.activeDrones.length === 0) return;

        const leashRadius = Math.max(160, player.magnetRadius * 1.2); 
        
        let bossTarget = null;
        let panicTarget = null; 
        let closestPanicDist = 180; 

        if (typeof bossSystem !== 'undefined' && bossSystem.active && bossSystem.hp > 0 && bossSystem.invulnTimer <= 0) {
            bossTarget = bossSystem;
        }

        for (const e of enemySystem.enemies) {
            const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
            
            if (distToPlayer < closestPanicDist) {
                closestPanicDist = distToPlayer;
                panicTarget = e;
            }
        }

        this.activeDrones.forEach((drone, index) => {
            let myTarget = null;
            let engagementMode = "IDLE"; 
            
            if (panicTarget) {
                myTarget = panicTarget;
                engagementMode = "PANIC";
            }
            else if (bossTarget && index % 5 !== 0) {
                myTarget = bossTarget;
                engagementMode = "BOSS";
            }
            else {
                let minDist = Infinity;
                for (const e of enemySystem.enemies) {
                    const distSq = (e.x - drone.x)**2 + (e.y - drone.y)**2;
                    if (distSq < 500*500 && distSq < minDist) {
                        minDist = distSq;
                        myTarget = e;
                    }
                }
                if (myTarget) engagementMode = "HUNT";
            }

            let destX, destY;

            if (myTarget) {
                const angleToTarget = Math.atan2(myTarget.y - drone.y, myTarget.x - drone.x);
                let attackDist = 120; 
                
                if (engagementMode === "PANIC") attackDist = 0; 
                if (player.thorns > 0) attackDist = 20; 
                
                const flankAngle = angleToTarget + (index % 2 === 0 ? 0.4 : -0.4); 
                
                destX = myTarget.x - Math.cos(flankAngle) * attackDist;
                destY = myTarget.y - Math.sin(flankAngle) * attackDist;
            } else {
                const patrolAng = (Date.now() * 0.001) + (index * 0.5);
                const patrolR = leashRadius * 0.4;
                destX = player.x + Math.cos(patrolAng) * patrolR;
                destY = player.y + Math.sin(patrolAng) * patrolR;
            }

            const distDestToPlayer = Math.hypot(destX - player.x, destY - player.y);
            
            if (distDestToPlayer > leashRadius) {
                const anglePlayerToDest = Math.atan2(destY - player.y, destX - player.x);
                destX = player.x + Math.cos(anglePlayerToDest) * leashRadius;
                destY = player.y + Math.sin(anglePlayerToDest) * leashRadius;
            }

            const dx = destX - drone.x;
            const dy = destY - drone.y;
            
            drone.vx += dx * 0.006 * timeScale;
            drone.vy += dy * 0.006 * timeScale;

            this.activeDrones.forEach((other, otherIdx) => {
                if (index === otherIdx) return;
                const ddx = drone.x - other.x;
                const ddy = drone.y - other.y;
                const dDist = Math.hypot(ddx, ddy);
                const space = 25; 
                
                if (dDist < space && dDist > 0) {
                    const force = (space - dDist) / space; 
                    drone.vx += (ddx/dDist) * force * 1.2 * timeScale;
                    drone.vy += (ddy/dDist) * force * 1.2 * timeScale;
                }
            });

            drone.vx *= 0.88; 
            drone.vy *= 0.88;

            drone.x += drone.vx * timeScale;
            drone.y += drone.vy * timeScale;

            if (myTarget) {
                const distToEnemy = Math.hypot(myTarget.x - drone.x, myTarget.y - drone.y);
                const bulletTravelTime = distToEnemy / (player.bulletSpeed * 1.3);
                
                let predictX = myTarget.x;
                let predictY = myTarget.y;

                if (myTarget.angle !== undefined && myTarget.speed !== undefined) {
                    predictX += Math.cos(myTarget.angle) * myTarget.speed * bulletTravelTime;
                    predictY += Math.sin(myTarget.angle) * myTarget.speed * bulletTravelTime;
                }

                const aimAngle = Math.atan2(predictY - drone.y, predictX - drone.x);
                
                let diff = aimAngle - drone.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                drone.angle += diff * 0.25 * timeScale; 

                if (drone.cooldown > 0) drone.cooldown -= 1 * timeScale;

                if (drone.cooldown <= 0 && Math.abs(diff) < 0.6) {
                    const tipX = drone.x + Math.cos(drone.angle) * 12;
                    const tipY = drone.y + Math.sin(drone.angle) * 12;

                    if (typeof bulletSystem !== 'undefined') {
                        const projCount = Math.max(1, Math.floor(player.projectiles));
                        const spread = player.spread || 0.1;

                        for(let k = 0; k < projCount; k++) {
                            const angleOffset = (projCount > 1) ? (k - (projCount - 1) / 2) * spread : 0;
                            const finalAngle = drone.angle + angleOffset + (Math.random() * 0.05 - 0.025);

                            bulletSystem.spawn(
                                tipX, tipY,
                                Math.cos(finalAngle) * player.bulletSpeed * 1.3,
                                Math.sin(finalAngle) * player.bulletSpeed * 1.3,
                                500,
                                player.damage * 0.7,
                                false,
                                player.bulletSize * 0.7,
                                '#00f3ff',
                                Math.random() < player.critChance,
                                player.knockback * 0.2,
                                player.piercingBullets,
                                player.bounces
                            );
                        }
                    }
                    drone.cooldown = player.atkSpeed * 0.9 + Math.random()*5;
                }
            } else {
                const moveAng = Math.atan2(drone.vy, drone.vx);
                if (Math.hypot(drone.vx, drone.vy) > 0.5) {
                    let diff = moveAng - drone.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    drone.angle += diff * 0.1 * timeScale;
                }
            }

            if (drone.contactCooldown > 0) drone.contactCooldown -= 1 * timeScale;

            if (myTarget && player.thorns > 0 && drone.contactCooldown <= 0) {
                const distContact = Math.hypot(myTarget.x - drone.x, myTarget.y - drone.y);
                const hitRad = (myTarget === bossTarget) ? 100 : (myTarget.size + 15);

                if (distContact < hitRad) {
                    myTarget.hp -= player.thorns;
                    if(myTarget.flashTimer !== undefined) myTarget.flashTimer = 5;
                    else if(myTarget.flash !== undefined) myTarget.flash = 5;
                    
                    spawnPopText(myTarget.x, myTarget.y, Math.floor(player.thorns), false);
                    spawnParticles(myTarget.x, myTarget.y, '#00f3ff', 2);
                    
                    drone.contactCooldown = 15;
                    
                    if (myTarget !== bossSystem && myTarget.hp <= 0) {
                        const idx = enemySystem.enemies.indexOf(myTarget);
                        if(idx > -1) enemySystem.handleDeath(myTarget, idx);
                    }
                }
            }
        });
    },

    draw: function(ctx) {
        if (this.activeDrones.length === 0) return;
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;

        this.activeDrones.forEach(orb => {
            ctx.save();
            ctx.translate(orb.x, orb.y);
            ctx.rotate(orb.angle);
            
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            ctx.moveTo(10, 0);   
            ctx.lineTo(-5, -6);  
            ctx.lineTo(-2, 0);   
            ctx.lineTo(-5, 6);   
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ffff';
            ctx.globalAlpha = 0.5 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.arc(-4, 0, 2, 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.shadowBlur = 0;
    }
};