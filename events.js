const eventSystem = {
    activeEvent: null,
    backgroundMode: 'NORMAL', 
    transitionProgress: 0, 
    isTimerFrozen: false,
    scrollSpeed: 0,
    bossEncounter: false,
    lockedCamera: { x: 0, y: 0 } 
};

const bossSystem = {
    active: false,
    introActive: false,
    introTimer: 0,
    introPhase: 0, 
    deathSequenceActive: false,
    deathTimer: 0,
    x: 0,
    y: 0,
    width: 320, 
    height: 220, 
    hp: 0,
    maxHp: 0,
    hands: { left: {x:0, y:0}, right: {x:0, y:0}, offset: 0, angle: 0 },
    attackTimer: 0,
    genericTimer: 0, 
    currentAttack: 0,
    flash: 0,
    color: '#ffffff',
    spawnAnim: 0,
    invulnTimer: 0
};

const RANDOM_EVENTS = [
    { 
        id: 'SWARM', duration: 600, 
        onStart: () => { spawnFloatingText(player.x, player.y, "WARNING: SWARM", "#ff0000"); difficulty += 3; },
        onEnd: () => { difficulty -= 3; }
    },
    { 
        id: 'METEOR', duration: 400, 
        onStart: () => { spawnFloatingText(player.x, player.y, "METEOR SHOWER", "#f1c40f"); },
        tick: () => {
            if(frames % 8 === 0) {
                const rx = camera.x + Math.random() * canvas.width;
                bullets.push({ x: rx, y: camera.y - 100, vx: (Math.random()-0.5)*3, vy: 12, life: 250, damage: 10, isEnemy: true, size: 8, color: '#f1c40f' });
            }
        },
        onEnd: () => {}
    },
    {
        id: 'ELITE', duration: 1, 
        onStart: () => { 
            spawnFloatingText(player.x, player.y, "ELITE ENEMY", "#9b59b6");
            const ang = Math.random() * Math.PI * 2;
            enemySystem.enemies.push({ x: player.x + Math.cos(ang)*500, y: player.y + Math.sin(ang)*500, size: 50, baseSize: 50, speed: 2.5, maxHp: 8000, hp: 8000, color: '#9b59b6', xpVal: 500, flashTimer: 0, isElite: true });
        },
        onEnd: () => {}
    },
    {
        id: 'BLACKOUT', duration: 900,
        onStart: () => { spawnFloatingText(player.x, player.y, "SENSORS OFFLINE", "#555"); document.getElementById('game-container').style.filter = "brightness(0.3) contrast(1.8) grayscale(1)"; },
        onEnd: () => { document.getElementById('game-container').style.filter = "contrast(1.1) saturate(1.2)"; }
    },
    {
        id: 'HELLFIRE', duration: 300,
        onStart: () => { spawnFloatingText(player.x, player.y, "SURGE DETECTED", "#e74c3c"); },
        tick: () => {
            if(frames % 25 === 0) {
                enemySystem.enemies.forEach(e => {
                    bullets.push({ x: e.x, y: e.y, vx: (player.x - e.x)*0.015, vy: (player.y - e.y)*0.015, life: 120, damage: 8, isEnemy: true, size: 5, color: '#e74c3c' });
                });
            }
        },
        onEnd: () => {}
    }
];

function checkEvents(secs) {
    if (bossSystem.active || bossSystem.introActive || bossSystem.deathSequenceActive) return;

    if (secs === 300 || secs === 900 || secs === 1500 || secs === 2100) {
        let hp = 50000;
        if(secs === 900) hp = 100000;
        if(secs === 1500) hp = 200000;
        if(secs === 2100) hp = 500000;
        startBossSequence(hp);
        return;
    }

    if (eventSystem.activeEvent) {
        eventSystem.activeEvent.duration--;
        if (eventSystem.activeEvent.tick) eventSystem.activeEvent.tick();
        if (eventSystem.activeEvent.duration <= 0) {
            if (eventSystem.activeEvent.onEnd) eventSystem.activeEvent.onEnd();
            eventSystem.activeEvent = null;
        }
    } else {
        if (Math.random() < 0.001) { 
            const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
            eventSystem.activeEvent = { ...evt }; 
            if(eventSystem.activeEvent.onStart) eventSystem.activeEvent.onStart();
        }
    }
}

function startBossSequence(hp) {
    if(typeof sfx !== 'undefined' && sfx.cutToSilence) sfx.cutToSilence();

    eventSystem.isTimerFrozen = true;
    eventSystem.bossEncounter = true;
    eventSystem.transitionProgress = 0;
    eventSystem.scrollSpeed = 0;
    eventSystem.bgAlpha = 0;
    
    eventSystem.lockedCamera.x = camera.x;
    eventSystem.lockedCamera.y = camera.y;

    enemySystem.enemies.forEach(e => spawnParticles(e.x, e.y, e.color, 15));
    enemySystem.reset(); 
    
    bossSystem.introActive = true;
    bossSystem.introTimer = 0;
    bossSystem.introPhase = 0; 
    bossSystem.maxHp = hp;
    bossSystem.hp = hp;
    bossSystem.active = false;
    
    bossSystem.x = player.x; 
    bossSystem.y = camera.y - 600;
    
    if(typeof sfx !== 'undefined' && sfx.bossIntro) sfx.bossIntro(); 
}

function updateBoss() {
    if (bossSystem.introActive) {
        bossSystem.introTimer++;
        
        eventSystem.transitionProgress = Math.min(1, bossSystem.introTimer / 500);

        if (eventSystem.scrollSpeed < 2 && bossSystem.introTimer > 100) {
            eventSystem.scrollSpeed += 0.005;
        }

        bossSystem.x = player.x;
        bossSystem.y = camera.y - 350; 

        if (bossSystem.introTimer > 600 && bossSystem.introPhase === 0) {
            bossSystem.introPhase = 1;
            bossSystem.spawnAnim = 120;
            if(typeof sfx !== 'undefined' && sfx.bossCharging) sfx.bossCharging(2.0);
        }

        if (bossSystem.introPhase === 1) {
            bossSystem.spawnAnim--;
            eventSystem.scrollSpeed = Math.min(5, eventSystem.scrollSpeed + 0.05);

            const centerX = player.x;
            const centerY = camera.y + 120;

            if(frames % 2 === 0) {
                for(let k=0; k<2; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 300 + Math.random() * 100;
                    const color = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
                    particles.push({ x: centerX + Math.cos(angle) * dist, y: centerY + Math.sin(angle) * dist, vx: -Math.cos(angle) * 12, vy: -Math.sin(angle) * 12, life: 30, size: 3 + Math.random() * 3, color: color });
                }
            }

            if (bossSystem.spawnAnim <= 0) {
                bossSystem.introActive = false;
                bossSystem.active = true;
                bossSystem.y = centerY; 
                eventSystem.backgroundMode = 'SPACE'; 
                
                bossSystem.invulnTimer = 120;
                screenShake = 30;
                bossSystem.flash = 15;

                spawnShockwave(bossSystem.x, bossSystem.y, '#fff');
                spawnShockwave(bossSystem.x, bossSystem.y, '#00ffff');
                for(let k=0; k<100; k++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 5 + Math.random() * 10;
                    particles.push({ x: bossSystem.x, y: bossSystem.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, color: '#fff', life: 60, size: 3 });
                }
                
                if(typeof sfx !== 'undefined' && sfx.bossSpawn) sfx.bossSpawn();
                if(typeof sfx !== 'undefined' && sfx.playTrack) sfx.playTrack(3, 'cut'); 
            }
        }
        return;
    }

    if (bossSystem.deathSequenceActive) {
        bossSystem.deathTimer++;
        const deathDuration = 300; 

        eventSystem.transitionProgress = Math.max(0, 1 - (bossSystem.deathTimer / deathDuration));
        eventSystem.scrollSpeed *= 0.98;

        if (bossSystem.deathTimer % 5 === 0) {
            const rx = bossSystem.x + (Math.random() - 0.5) * bossSystem.width;
            const ry = bossSystem.y + (Math.random() - 0.5) * bossSystem.height;
            const color = Math.random() > 0.5 ? '#ff00ff' : '#00ffff';
            spawnExplosion(rx, ry, color, 3);
        }

        screenShake = 15 - (bossSystem.deathTimer / (deathDuration / 15));

        if (bossSystem.deathTimer > deathDuration) {
            finalizeBossDefeat();
        }
        return;
    }

    if (!bossSystem.active) return;

    if (bossSystem.invulnTimer > 0) bossSystem.invulnTimer--;

    eventSystem.scrollSpeed = Math.min(25, eventSystem.scrollSpeed + 0.2);

    if (bossSystem.flash > 0) bossSystem.flash--;

    bossSystem.hands.angle += 0.04;
    bossSystem.hands.offset = Math.sin(bossSystem.hands.angle) * 50;
    
    bossSystem.x += (player.x - bossSystem.x) * 0.015; 
    
    const targetY = camera.y + 120; 
    bossSystem.y += (targetY - bossSystem.y) * 0.1;

    bossSystem.genericTimer++;
    if (bossSystem.genericTimer > 30) { 
        const angleToPlayer = Math.atan2(player.y - bossSystem.y, player.x - bossSystem.x);
        const speed = 4;
        spawnBossBullet(bossSystem.x, bossSystem.y, Math.cos(angleToPlayer) * speed, Math.sin(angleToPlayer) * speed, 12, '#fff', 250);
        if(typeof sfx !== 'undefined' && sfx.bossShoot) sfx.bossShoot();
        bossSystem.genericTimer = 0;
    }

    bossSystem.attackTimer++;
    if (bossSystem.attackTimer > 240) { 
        performBossAttack();
        bossSystem.attackTimer = 0;
        bossSystem.currentAttack = (bossSystem.currentAttack + 1) % 5;
    }

    if (bossSystem.hp <= 0 && bossSystem.active) {
        startBossDeathSequence();
    }
}

function performBossAttack() {
    const cx = bossSystem.x;
    const cy = bossSystem.y + 80;
    
    switch(bossSystem.currentAttack) {
        case 0: 
            for(let i=-6; i<=6; i++) spawnBossBullet(cx + i*40, cy, i * 0.6, 5, 18, '#ff00ff');
            break;
        case 1: 
            for(let i=0; i<15; i++) spawnBossBullet(camera.x + (canvas.width/15)*i + Math.random()*20, camera.y - 50, 0, 7, 12, '#00ffff');
            break;
        case 2: 
            for(let i=0; i<20; i++) {
                const angle = (Math.PI / 10) * i;
                spawnBossBullet(cx, cy, Math.cos(angle)*6, Math.sin(angle)*6, 14, '#e74c3c');
            }
            break;
        case 3: 
            for(let i=0; i<3; i++) {
                setTimeout(() => spawnBossBullet(cx, cy, (player.x - cx)*0.06, (player.y - cy)*0.06, 45, '#fff', 300), i * 300);
            }
            break;
        case 4: 
            for(let i=0; i<30; i++) spawnBossBullet(cx, cy, (Math.random()-0.5)*18, (Math.random()*0.5 + 0.5)*10, 10, '#ffff00');
            break;
    }
    if(typeof sfx !== 'undefined' && sfx.bossSpecial) sfx.bossSpecial();
}

function spawnBossBullet(x, y, vx, vy, size, color, life=300) {
    bullets.push({ x: x, y: y, vx: vx, vy: vy, life: life, damage: 15, isEnemy: true, size: size, color: color });
}

function startBossDeathSequence() {
    bossSystem.active = false;
    bossSystem.deathSequenceActive = true;
    bossSystem.deathTimer = 0;
    if(typeof sfx !== 'undefined' && sfx.bossDisintegrate) sfx.bossDisintegrate(5.0);
}

function finalizeBossDefeat() {
    bossSystem.deathSequenceActive = false;
    eventSystem.isTimerFrozen = false;
    eventSystem.bossEncounter = false;
    eventSystem.backgroundMode = 'NORMAL';
    eventSystem.transitionProgress = 0;
    eventSystem.scrollSpeed = 0;
    
    spawnExplosion(bossSystem.x, bossSystem.y, '#fff', 200);
    spawnShockwave(bossSystem.x, bossSystem.y, '#fff');
    spawnShockwave(bossSystem.x, bossSystem.y, '#ff00ff');
    
    if(typeof dropSystem !== 'undefined') {
        for(let i=0; i<5; i++) {
            setTimeout(() => {
                const opt = upgradePool[Math.floor(Math.random() * upgradePool.length)];
                opt.apply(player);
                player.history.push({ title: opt.title, type: opt.type, desc: opt.desc });
                triggerUpgradeFX(opt.type);
                createFloatText(player.x, player.y - 50 * i, "BOSS REWARD", "#f1c40f");
            }, i * 400);
        }
    }
    
    if(typeof sfx !== 'undefined' && sfx.playTrack) sfx.playTrack(0, 'cut'); 
}

function drawBoss(ctx) {
    if (bossSystem.introActive) {
        if (bossSystem.introPhase === 0) {
            const time = bossSystem.introTimer;
            const camCx = camera.x + canvas.width/2;
            const camCy = camera.y + canvas.height/2;

            ctx.save();
            ctx.translate(camCx, camCy - 150); 
            
            const alpha = Math.min(1, time / 200); 
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = "50px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.shadowBlur = 40; ctx.shadowColor = '#ff00ff';
            
            const text = "NEON ANGEL";
            const charsToShow = Math.floor((time / 450) * text.length); 
            
            let displayT = text.substring(0, charsToShow);
            for(let i=charsToShow; i<text.length; i++) {
                displayT += String.fromCharCode(33 + Math.random()*94);
            }
            
            ctx.fillText(displayT, 0, 0);
            ctx.restore();

            if (charsToShow < text.length && frames % 5 === 0 && typeof sfx !== 'undefined' && sfx.textGlitch) {
                sfx.textGlitch();
            }

        } else {
            ctx.save();
            ctx.translate(bossSystem.x, bossSystem.y);
            const scale = (120 - bossSystem.spawnAnim) / 120; 
            ctx.scale(scale, scale);
            ctx.globalAlpha = scale;
            ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.shadowBlur = 100; ctx.shadowColor = '#fff'; ctx.fill();
            ctx.restore();
        }
        return;
    }

    if (!bossSystem.active && !bossSystem.deathSequenceActive) return;

    const x = bossSystem.x;
    const y = bossSystem.y;
    const time = Date.now() * 0.003;

    ctx.save();
    
    if (bossSystem.deathSequenceActive) {
        const deathProgress = bossSystem.deathTimer / 300;
        ctx.globalAlpha = Math.max(0, 1 - deathProgress);
        ctx.translate(x + (Math.random() - 0.5) * deathProgress * 30, y + (Math.random() - 0.5) * deathProgress * 30);
    } else {
        ctx.translate(x, y);
    }
    
    if(bossSystem.flash > 0) {
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 100; ctx.shadowColor = '#fff';
    } else {
        ctx.fillStyle = '#0a0a0a'; ctx.strokeStyle = '#fff'; ctx.shadowBlur = 50; ctx.shadowColor = '#ff00ff'; ctx.lineWidth = 5;
    }

    ctx.beginPath();
    ctx.moveTo(0, 100); ctx.lineTo(-80, 20); ctx.lineTo(-140, -40); ctx.lineTo(-40, -100); ctx.lineTo(0, -60); ctx.lineTo(40, -100); ctx.lineTo(140, -40); ctx.lineTo(80, 20); ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#00ffff'; ctx.shadowColor='#00ffff';
    ctx.beginPath(); ctx.arc(0, -20, 30 + Math.sin(time*10)*5, 0, Math.PI*2); ctx.fill();

    const hOff = bossSystem.hands.offset;
    const drawHand = (hx, hy) => {
        ctx.fillStyle = '#000'; ctx.strokeStyle = '#e74c3c'; ctx.shadowColor = '#e74c3c';
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(time * 0.5);
        ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(40, 20); ctx.lineTo(-40, 20); ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.restore();
    };

    drawHand(-200, 40 + hOff);
    drawHand(200, 40 - hOff);

    ctx.restore();
}

function spawnFloatingText(x, y, text, color) {
    if(typeof floatingTexts !== 'undefined') floatingTexts.push({x,y,text,color,life:100,vy:-0.5});
}