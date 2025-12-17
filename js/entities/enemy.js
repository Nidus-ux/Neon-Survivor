const enemySystem = {
    enemies: [],

    ENEMY_TYPES: {
        STANDARD: { id: 'standard', weight: 100, hpMult: 1, speedMult: 0.9, xp: 10 },
        BASTION:  { id: 'bastion',  weight: 25,  hpMult: 3, speedMult: 0.4, xp: 30 },
        DART:     { id: 'dart',     weight: 20,  hpMult: 0.8, speedMult: 0.75, xp: 20 },
        FRAGMENT: { id: 'fragment', weight: 40,  hpMult: 0.3, speedMult: 1.6, xp: 8 },
        WEAVER:   { id: 'weaver',   weight: 15,  hpMult: 1.3, speedMult: 0.7, xp: 25 },
        NOVA:     { id: 'nova',     weight: 15,  hpMult: 1.2, speedMult: 0.85, xp: 25 }
    },

    spawnController: function(difficulty, playerRef, canvas) {
        if (typeof bossSystem !== 'undefined' && (bossSystem.active || bossSystem.introActive || bossSystem.deathSequenceActive)) return;
        
        let rate = Math.floor(60 / (difficulty * 0.6));
        if (rate < 8) rate = 8;

        if (frames % rate === 0) {
            this.spawnNew(playerRef, canvas, difficulty);
        }
    },

    spawnNew: function(playerRef, canvas, difficulty) {
        let selectedType = this.ENEMY_TYPES.STANDARD;

        if (typeof seconds !== 'undefined' && seconds >= 120) {
            const totalWeight = Object.values(this.ENEMY_TYPES).reduce((a, b) => a + b.weight, 0);
            let r = Math.random() * totalWeight;
            for (const type of Object.values(this.ENEMY_TYPES)) {
                if (r < type.weight) {
                    selectedType = type;
                    break;
                }
                r -= type.weight;
            }
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(canvas.width, canvas.height) / 2 + 100;
        let ex = playerRef.x + Math.cos(angle) * radius;
        let ey = playerRef.y + Math.sin(angle) * radius;
        
        ex = Math.max(10, Math.min(4000 - 10, ex));
        ey = Math.max(10, Math.min(4000 - 10, ey));
        
        const baseHp = 20 + (difficulty * 8);
        const hp = baseHp * selectedType.hpMult;
        
        const enemy = { 
            type: selectedType.id,
            x: ex, y: ey, 
            size: 15, 
            speed: (((1 + Math.random()) * Math.min(2.5, difficulty * 0.65)) + 1.5) * selectedType.speedMult, 
            maxHp: hp, 
            hp: hp, 
            color: difficulty > 3.5 ? '#9b59b6' : '#e74c3c', 
            xpVal: selectedType.xp + Math.floor(difficulty), 
            flashTimer: 0,
            angle: 0,
            timer: 0, 
            state: 0,
            randomOffset: Math.random() * 1000 
        };

        if (enemy.type === 'bastion') { enemy.size = 28; enemy.color = '#3498db'; }
        if (enemy.type === 'dart')    { enemy.size = 20; enemy.color = '#f1c40f'; }
        if (enemy.type === 'fragment'){ enemy.size = 10; enemy.color = '#00ffaa'; }
        if (enemy.type === 'weaver')  { enemy.size = 22; enemy.color = '#b03df8'; }
        if (enemy.type === 'nova')    { enemy.size = 24; enemy.color = '#ff0055'; }

        this.enemies.push(enemy);
    },

    update: function(playerRef, timeScale = 1) {
        for(let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            
            this.moveEnemy(e, playerRef, timeScale);

            if(e.flashTimer > 0) e.flashTimer -= 1 * timeScale;
            
            if (Math.abs(playerRef.x - e.x) < 50 && Math.abs(playerRef.y - e.y) < 50) {
                if (Math.hypot(playerRef.x - e.x, playerRef.y - e.y) < playerRef.size + e.size) {
                    if (playerRef.thorns > 0) { 
                        e.hp -= playerRef.thorns; 
                        e.flashTimer = 5; 
                        if (e.hp <= 0) { 
                            this.handleDeath(e, i); 
                            continue; 
                        }
                    }
                    if (playerRef.invulnTimer <= 0) {
                        if (typeof takeDamage === 'function') takeDamage(10);
                    }
                }
            }
        }
    },

    moveEnemy: function(e, p, timeScale) {
        let moveDir = (typeof window.fearMode !== 'undefined' && window.fearMode) ? -1 : 1;
        const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x); 
        
        switch (e.type) {
            case 'standard':
                e.x += Math.cos(angleToPlayer) * e.speed * moveDir * timeScale;
                e.y += Math.sin(angleToPlayer) * e.speed * moveDir * timeScale;
                e.angle = angleToPlayer;
                break;

            case 'bastion':
                e.x += Math.cos(angleToPlayer) * e.speed * timeScale;
                e.y += Math.sin(angleToPlayer) * e.speed * timeScale;
                e.angle = angleToPlayer;
                break;

            case 'dart':
                e.timer += 1 * timeScale;
                if (e.state === 0) {
                    const dist = Math.hypot(p.x - e.x, p.y - e.y);
                    if (dist > 300) {
                        e.x += Math.cos(angleToPlayer) * e.speed * 1.5 * moveDir * timeScale;
                        e.y += Math.sin(angleToPlayer) * e.speed * 1.5 * moveDir * timeScale;
                        e.angle = angleToPlayer;
                    } else {
                        e.state = 1; 
                        e.timer = 0;
                    }
                } 
                else if (e.state === 1) {
                    e.angle = angleToPlayer; 
                    if (e.timer > 60) { 
                        if (typeof bulletSystem !== 'undefined') {
                            bulletSystem.spawn(
                                e.x, e.y,
                                Math.cos(angleToPlayer) * 8,
                                Math.sin(angleToPlayer) * 8,
                                100, 15 + 6, true, 6, e.color
                            );
                        }
                        e.state = 2; 
                        e.timer = 0;
                    }
                }
                else if (e.state === 2) {
                    e.x -= Math.cos(angleToPlayer) * e.speed * moveDir * timeScale; 
                    e.y -= Math.sin(angleToPlayer) * e.speed * moveDir * timeScale;
                    if (e.timer > 60) e.state = 0;
                }
                break;

            case 'fragment':
                e.timer += 1 * timeScale;
                const wave = Math.sin(e.timer * 0.1) * 2;
                const forward = e.speed * timeScale;
                e.x += (Math.cos(angleToPlayer) * forward) - (Math.sin(angleToPlayer) * wave * timeScale);
                e.y += (Math.sin(angleToPlayer) * forward) + (Math.cos(angleToPlayer) * wave * timeScale);
                e.angle = angleToPlayer;
                break;

            case 'weaver':
                e.timer += 1 * timeScale;
                e.x += Math.cos(angleToPlayer + Math.sin(e.timer * 0.05)) * e.speed * moveDir * timeScale;
                e.y += Math.sin(angleToPlayer + Math.cos(e.timer * 0.05)) * e.speed * moveDir * timeScale;
                e.angle = angleToPlayer;
                
                if (Math.floor(e.timer) % 60 === 0) {
                    if (typeof bulletSystem !== 'undefined') {
                        bulletSystem.spawn(e.x, e.y, 0, 0, 180, 10, true, 8, '#2ecc71');
                    }
                }
                break;

            case 'nova':
                e.timer += 1 * timeScale;
                const pulse = 1 + Math.sin(e.timer * 0.2) * 0.2;
                e.currentSize = e.size * pulse;
                e.x += Math.cos(angleToPlayer) * e.speed * moveDir * timeScale;
                e.y += Math.sin(angleToPlayer) * e.speed * moveDir * timeScale;
                e.angle = angleToPlayer;
                break;
        }
    },

    handleDeath: function(e, index) {
        if (e.type === 'nova') {
            if (typeof bulletSystem !== 'undefined') {
                for(let k=0; k<8; k++) {
                    const ang = (Math.PI * 2 / 8) * k;
                    bulletSystem.spawn(
                        e.x, e.y,
                        Math.cos(ang) * 5,
                        Math.sin(ang) * 5,
                        60, 15, true, 6, e.color
                    );
                }
            }
        }

        if (typeof killEnemy === 'function') killEnemy(e, index);
    },

    getClosest: function(position) {
        let closest = null;
        let minDist = Infinity;
        this.enemies.forEach(e => { 
            if (Math.abs(position.x - e.x) < 600 && Math.abs(position.y - e.y) < 600) {
                const dist = Math.hypot(position.x - e.x, position.y - e.y); 
                if (dist < minDist) {
                    minDist = dist; 
                    closest = e;
                }
            }
        });
        return closest;
    },

    draw: function(ctx, playerRef) {
        const camX = typeof camera !== 'undefined' ? camera.x : 0;
        const camY = typeof camera !== 'undefined' ? camera.y : 0;
        const viewW = ctx.canvas.width;
        const viewH = ctx.canvas.height;
        const margin = 100;
        const time = Date.now() * 0.005;

        this.enemies.forEach(e => {
            if (e.x < camX - margin || e.x > camX + viewW + margin ||
                e.y < camY - margin || e.y > camY + viewH + margin) {
                return;
            }

            ctx.save();
            
            if (e.type === 'fragment') {
                ctx.translate(e.x + (Math.random()-0.5)*2, e.y + (Math.random()-0.5)*2);
            } else {
                ctx.translate(e.x, e.y);
            }
            
            ctx.rotate(e.angle); 
            
            if (e.flashTimer > 0) {
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 20; 
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                if(e.type === 'bastion') ctx.rect(-e.size, -e.size, e.size*2, e.size*2);
                else ctx.arc(0,0, e.size, 0, Math.PI*2);
                ctx.fill();
            } else {
                ctx.shadowBlur = 12;
                ctx.shadowColor = e.color;
                
                if (e.type === 'standard') {
                    ctx.fillStyle = e.color;
                    ctx.beginPath(); ctx.arc(0, 0, e.size * 0.8, 0, Math.PI * 2); ctx.fill();

                    const safeOffset = e.randomOffset || 0;
                    const rot = (time * 3) + safeOffset;
                    
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0; 
                    
                    ctx.save();
                    ctx.rotate(rot); 
                    ctx.beginPath(); ctx.arc(0, 0, e.size + 4, 0, 1.5); ctx.stroke();
                    ctx.beginPath(); ctx.arc(0, 0, e.size + 4, Math.PI, Math.PI + 1.5); ctx.stroke();
                    ctx.restore();

                    const eyeOffX = 6;
                    const eyeOffY = 5;
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(eyeOffX, -eyeOffY, 3.5, 0, Math.PI*2); ctx.fill(); 
                    ctx.beginPath(); ctx.arc(eyeOffX, eyeOffY, 3.5, 0, Math.PI*2); ctx.fill();

                    ctx.shadowColor = '#fff'; ctx.shadowBlur = 5;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(eyeOffX + 1, -eyeOffY, 1.2, 0, Math.PI*2); ctx.fill(); 
                    ctx.beginPath(); ctx.arc(eyeOffX + 1, eyeOffY, 1.2, 0, Math.PI*2); ctx.fill();
                } 
                else if (e.type === 'bastion') {
                    ctx.fillStyle = '#050a1a'; 
                    ctx.strokeStyle = e.color;
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 15;
                    
                    ctx.beginPath();
                    ctx.rect(-e.size, -e.size, e.size*2, e.size*2);
                    ctx.fill();
                    ctx.stroke();

                    const breathe = Math.sin(time * 3) * 2;
                    ctx.fillStyle = e.color;
                    ctx.shadowBlur = 0;
                    
                    const plateSize = e.size * 0.4;
                    const offset = e.size - 4 + breathe;

                    ctx.fillRect(-offset - plateSize, -offset - plateSize, plateSize*2, plateSize*2); 
                    ctx.fillRect(offset - plateSize, -offset - plateSize, plateSize*2, plateSize*2); 
                    ctx.fillRect(-offset - plateSize, offset - plateSize, plateSize*2, plateSize*2); 
                    ctx.fillRect(offset - plateSize, offset - plateSize, plateSize*2, plateSize*2); 

                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.rect(-5, -5, 10, 10);
                    ctx.fill();
                } 
                else if (e.type === 'dart') {
                    const shake = (e.state === 1) ? (Math.random() - 0.5) * 3 : 0;
                    
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.moveTo(e.size + 12, 0); 
                    ctx.lineTo(-e.size + shake, -e.size + 4);
                    ctx.lineTo(-e.size + 6, 0);
                    ctx.lineTo(-e.size + shake, e.size - 4);
                    ctx.closePath();
                    ctx.fill();

                    const thrust = 5 + Math.sin(time * 20) * 3;
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#ffff00';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(-e.size + 4, 0);
                    ctx.lineTo(-e.size - thrust, -3);
                    ctx.lineTo(-e.size - thrust * 1.5, 0);
                    ctx.lineTo(-e.size - thrust, 3);
                    ctx.fill();

                    if (e.state === 1) { 
                        ctx.shadowBlur = 30;
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.arc(0, 0, 5 + Math.random()*2, 0, Math.PI*2); ctx.fill();
                    }
                }
                else if (e.type === 'fragment') {
                    ctx.globalAlpha = 0.5;
                    const jitter = 3;
                    
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(e.size + (Math.random()-0.5)*jitter, 0);
                    ctx.lineTo(-e.size, -e.size * 0.6);
                    ctx.lineTo(-e.size * 0.5, e.size * 0.6);
                    ctx.fill();

                    ctx.fillStyle = '#0000ff';
                    ctx.beginPath();
                    ctx.moveTo(e.size + (Math.random()-0.5)*jitter, 0);
                    ctx.lineTo(-e.size, -e.size * 0.6);
                    ctx.lineTo(-e.size * 0.5, e.size * 0.6);
                    ctx.fill();

                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = e.color;
                    ctx.fillStyle = 'rgba(0, 255, 170, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(e.size, 0);
                    ctx.lineTo(-e.size, -e.size * 0.6);
                    ctx.lineTo(-e.size * 0.2, 0);
                    ctx.lineTo(-e.size * 0.5, e.size * 0.6);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                else if (e.type === 'weaver') {
                    ctx.strokeStyle = e.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const ang = k * Math.PI / 3;
                        ctx.lineTo(Math.cos(ang) * e.size, Math.sin(ang) * e.size);
                    }
                    ctx.closePath();
                    ctx.stroke();

                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 5;
                    const orbitSpeed = (time * 3) + (e.randomOffset || 0);
                    
                    for(let i=0; i<3; i++) {
                        const bitAng = orbitSpeed + (i * (Math.PI*2/3));
                        const bx = Math.cos(bitAng) * (e.size + 8);
                        const by = Math.sin(bitAng) * (e.size + 8);
                        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI*2); ctx.fill();
                        
                        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(bx, by); ctx.stroke();
                    }

                    ctx.fillStyle = e.color;
                    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
                }
                else if (e.type === 'nova') {
                    const coreRadius = (e.size * 0.5) + Math.sin(time * 30) * (e.size * 0.1);
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = e.color;
                    ctx.shadowBlur = 30 + Math.sin(time * 50) * 15;
                    ctx.beginPath();
                    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.save();
                    ctx.rotate(time * 6);

                    const spikeLength = e.size + Math.sin(time * 4 + (e.randomOffset || 0)) * (e.size * 0.2);
                    const spikeWidth = e.size * 0.3;

                    ctx.fillStyle = e.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    
                    for (let k = 0; k < 4; k++) {
                        ctx.rotate(Math.PI / 2);
                        ctx.moveTo(0, spikeLength);
                        ctx.lineTo(spikeWidth, 0);
                        ctx.lineTo(-spikeWidth, 0);
                        ctx.closePath();
                    }
                    ctx.fill();
                    ctx.restore();
                }
            }

            ctx.restore();
        });
    },
    
    reset: function() {
        this.enemies.length = 0;
    }
};