const enemySystem = {
    enemies: [],

    ENEMY_TYPES: {
        STANDARD: { id: 'standard', weight: 100, hpMult: 1, speedMult: 1, xp: 10 },
        BASTION:  { id: 'bastion',  weight: 25,  hpMult: 3, speedMult: 0.4, xp: 30 },
        DART:     { id: 'dart',     weight: 20,  hpMult: 0.8, speedMult: 0.75, xp: 20 },
        FRAGMENT: { id: 'fragment', weight: 40,  hpMult: 0.3, speedMult: 1.6, xp: 8 },
        WEAVER:   { id: 'weaver',   weight: 15,  hpMult: 1.5, speedMult: 0.7, xp: 25 },
        NOVA:     { id: 'nova',     weight: 15,  hpMult: 1.2, speedMult: 0.85, xp: 25 }
    },

    spawnController: function(difficulty, playerRef, canvas) {
        if (typeof bossSystem !== 'undefined' && (bossSystem.active || bossSystem.introActive)) return;
        
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
            speed: ((1 + Math.random()) * Math.min(2.5, difficulty * 0.65)) * selectedType.speedMult, 
            maxHp: hp, 
            hp: hp, 
            color: difficulty > 3.5 ? '#9b59b6' : '#e74c3c', 
            xpVal: selectedType.xp + Math.floor(difficulty), 
            flashTimer: 0,
            angle: 0,
            timer: 0, 
            state: 0 
        };

        if (enemy.type === 'bastion') { enemy.size = 28; enemy.color = '#3498db'; }
        if (enemy.type === 'dart')    { enemy.size = 20; enemy.color = '#f1c40f'; }
        if (enemy.type === 'fragment'){ enemy.size = 10; enemy.color = '#00ffff'; }
        if (enemy.type === 'weaver')  { enemy.size = 22; enemy.color = '#2ecc71'; }
        if (enemy.type === 'nova')    { enemy.size = 24; enemy.color = '#ff0055'; }

        this.enemies.push(enemy);
    },

    update: function(playerRef) {
        for(let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            
            this.moveEnemy(e, playerRef);

            if(e.flashTimer > 0) e.flashTimer--;
            
            // Otimização de colisão: Verifica primeiro se está perto antes de calcular Math.hypot
            // Box check rápido
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
                    if (playerRef.invulnTimer === 0) {
                        if (typeof takeDamage === 'function') takeDamage(10);
                    }
                }
            }
        }
    },

    moveEnemy: function(e, p) {
        let moveDir = (typeof window.fearMode !== 'undefined' && window.fearMode) ? -1 : 1;
        const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x); 
        
        switch (e.type) {
            case 'standard':
                e.x += Math.cos(angleToPlayer) * e.speed * moveDir;
                e.y += Math.sin(angleToPlayer) * e.speed * moveDir;
                e.angle = angleToPlayer;
                break;

            case 'bastion':
                e.x += Math.cos(angleToPlayer) * e.speed;
                e.y += Math.sin(angleToPlayer) * e.speed;
                e.angle = angleToPlayer;
                break;

            case 'dart':
                e.timer++;
                if (e.state === 0) {
                    const dist = Math.hypot(p.x - e.x, p.y - e.y);
                    if (dist > 300) {
                        e.x += Math.cos(angleToPlayer) * e.speed * 1.5 * moveDir;
                        e.y += Math.sin(angleToPlayer) * e.speed * 1.5 * moveDir;
                        e.angle = angleToPlayer;
                    } else {
                        e.state = 1; 
                        e.timer = 0;
                    }
                } 
                else if (e.state === 1) {
                    e.angle = angleToPlayer; 
                    if (e.timer > 60) { 
                        if (typeof bullets !== 'undefined') {
                            bullets.push({ 
                                x: e.x, y: e.y, 
                                vx: Math.cos(angleToPlayer) * 8, 
                                vy: Math.sin(angleToPlayer) * 8, 
                                life: 100, damage: 15, isEnemy: true, size: 6, color: e.color 
                            });
                        }
                        e.state = 2; 
                        e.timer = 0;
                    }
                }
                else if (e.state === 2) {
                    e.x -= Math.cos(angleToPlayer) * e.speed * moveDir; 
                    e.y -= Math.sin(angleToPlayer) * e.speed * moveDir;
                    if (e.timer > 60) e.state = 0;
                }
                break;

            case 'fragment':
                e.timer++;
                const wave = Math.sin(e.timer * 0.1) * 2;
                e.x += (Math.cos(angleToPlayer) * e.speed) - (Math.sin(angleToPlayer) * wave);
                e.y += (Math.sin(angleToPlayer) * e.speed) + (Math.cos(angleToPlayer) * wave);
                e.angle = angleToPlayer;
                break;

            case 'weaver':
                e.timer++;
                e.x += Math.cos(angleToPlayer + Math.sin(e.timer * 0.05)) * e.speed * moveDir;
                e.y += Math.sin(angleToPlayer + Math.cos(e.timer * 0.05)) * e.speed * moveDir;
                e.angle = angleToPlayer;
                
                if (e.timer % 60 === 0) {
                    if (typeof bullets !== 'undefined') {
                        bullets.push({ 
                            x: e.x, y: e.y, 
                            vx: 0, vy: 0, 
                            life: 180, damage: 10, isEnemy: true, size: 8, color: '#2ecc71' 
                        });
                    }
                }
                break;

            case 'nova':
                e.timer++;
                const pulse = 1 + Math.sin(e.timer * 0.2) * 0.2;
                e.currentSize = e.size * pulse;
                e.x += Math.cos(angleToPlayer) * e.speed * moveDir;
                e.y += Math.sin(angleToPlayer) * e.speed * moveDir;
                e.angle = angleToPlayer;
                break;
        }
    },

    handleDeath: function(e, index) {
        if (e.type === 'nova') {
            if (typeof bullets !== 'undefined') {
                for(let k=0; k<8; k++) {
                    const ang = (Math.PI * 2 / 8) * k;
                    bullets.push({ 
                        x: e.x, y: e.y, 
                        vx: Math.cos(ang) * 5, 
                        vy: Math.sin(ang) * 5, 
                        life: 60, damage: 15, isEnemy: true, size: 6, color: e.color 
                    });
                }
            }
        }

        if (typeof killEnemy === 'function') killEnemy(e, index);
    },

    getClosest: function(position) {
        let closest = null;
        let minDist = Infinity;
        // Otimização: Não checar inimigos muito longe
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
        // Culling: define a área visível da câmera (com margem)
        const camX = typeof camera !== 'undefined' ? camera.x : 0;
        const camY = typeof camera !== 'undefined' ? camera.y : 0;
        const viewW = ctx.canvas.width;
        const viewH = ctx.canvas.height;
        const margin = 100;

        this.enemies.forEach(e => {
            // OTIMIZAÇÃO: Não desenhar se estiver fora da tela
            if (e.x < camX - margin || e.x > camX + viewW + margin ||
                e.y < camY - margin || e.y > camY + viewH + margin) {
                return;
            }

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle); 
            
            // ShadowBlur é MUITO pesado. Removemos para inimigos normais para ganhar FPS.
            // Apenas ligamos se ele estiver levando dano (flash)
            if (e.flashTimer > 0) {
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 15; 
                ctx.shadowColor = '#fff';
            } else {
                ctx.fillStyle = e.color;
                ctx.shadowBlur = 0; // Desativa glow padrão
                ctx.strokeStyle = e.color;
            }

            ctx.beginPath();

            if (e.type === 'standard') {
                ctx.arc(0, 0, e.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Detalhe simples sem stroke pesado
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(6, -5, 2.5, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.arc(6, 5, 2.5, 0, Math.PI*2); ctx.fill();
            } 
            else if (e.type === 'bastion') {
                ctx.rect(-e.size, -e.size, e.size*2, e.size*2);
                ctx.fill();
                
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
                ctx.strokeRect(-e.size + 4, -e.size + 4, e.size*2 - 8, e.size*2 - 8);
            } 
            else if (e.type === 'dart') {
                ctx.moveTo(e.size + 5, 0); 
                ctx.lineTo(-e.size, -e.size + 2);
                ctx.lineTo(-e.size + 5, 0);
                ctx.lineTo(-e.size, e.size - 2);
                ctx.closePath();
                ctx.fill();
                
                if (e.state === 1) ctx.fillStyle = '#fff';
                else ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(5, 0, 4, 0, Math.PI*2); ctx.fill();
            }
            else if (e.type === 'fragment') {
                ctx.moveTo(e.size, 0);
                ctx.lineTo(-e.size * 0.5, -e.size * 0.6);
                ctx.lineTo(-e.size, 0);
                ctx.lineTo(-e.size * 0.5, e.size * 0.6);
                ctx.closePath();
                ctx.fill();
            }
            else if (e.type === 'weaver') {
                // Desenho simplificado para performance
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const ang = k * Math.PI / 3;
                    ctx.lineTo(Math.cos(ang) * e.size, Math.sin(ang) * e.size);
                }
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
            }
            else if (e.type === 'nova') {
                const r = e.currentSize || e.size;
                ctx.moveTo(r, 0);
                ctx.lineTo(0, 5); ctx.lineTo(-r, 0); ctx.lineTo(0, -5);
                ctx.fill();
                ctx.moveTo(0, r); ctx.lineTo(5, 0); ctx.lineTo(0, -r); ctx.lineTo(-5, 0);
                ctx.fill();
            }

            ctx.restore();
        });
    },
    
    reset: function() {
        this.enemies.length = 0;
    }
};