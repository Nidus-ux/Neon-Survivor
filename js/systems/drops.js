const dropSystem = {
    activeDrops: [],
    activeBuffs: [],
    globalDropRate: 0.020 
};

const DROP_TYPES = [
    { 
        id: 'HP_PACK', name: 'NANO HEAL', color: '#2ecc71', weight: 40, duration: null,
        effect: (p) => { 
            const heal = Math.floor(p.maxHp * 0.35); 
            p.hp = Math.min(p.maxHp, p.hp + heal);
            createFloatText(p.x, p.y, `+${heal} HP`, '#2ecc71');
            spawnExplosion(p.x, p.y, '#2ecc71', 15);
        },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(0, 5);
            ctx.bezierCurveTo(0, 5, -8, -5, -8, -10);
            ctx.bezierCurveTo(-8, -15, -4, -15, 0, -10);
            ctx.bezierCurveTo(4, -15, 8, -15, 8, -10);
            ctx.bezierCurveTo(8, -5, 0, 5, 0, 5); ctx.fill();
        }
    },
    { 
        id: 'MAGNET', name: 'VACUUM', color: '#3498db', weight: 35, duration: null,
        effect: (p) => {
            if (typeof gems !== 'undefined') {
                gems.forEach(g => { g.x = p.x + (Math.random()-0.5)*10; g.y = p.y + (Math.random()-0.5)*10; });
                createFloatText(p.x, p.y, `MAGNET`, '#3498db');
                spawnShockwave(p.x, p.y, '#3498db');
            }
        },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.lineTo(8, 8); ctx.lineTo(4, 8); ctx.lineTo(4, -2); ctx.arc(0, -2, 4, 0, Math.PI, true); ctx.lineTo(-4, 8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
        }
    },
    { 
        id: 'RAPID', name: 'OVERCLOCK', color: '#f1c40f', weight: 20, duration: 900, 
        onStart: (p) => { p.atkSpeed = Math.max(4, p.atkSpeed * 0.25); },
        onEnd: (p) => { p.atkSpeed /= 0.25; },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(-4, 0); ctx.lineTo(0, 0); ctx.lineTo(-2, 10); ctx.lineTo(4, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        }
    },
    { 
        id: 'SPEED', name: 'NITRO', color: '#00ffff', weight: 20, duration: 1200, 
        onStart: (p) => { p.speed *= 1.8; },
        onEnd: (p) => { p.speed /= 1.8; },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(0, 0); ctx.lineTo(-6, 8); ctx.lineTo(-2, 8); ctx.lineTo(4, 0); ctx.lineTo(-2, -8); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(4, 8); ctx.lineTo(10, 0); ctx.lineTo(4, -8); ctx.fill();
        }
    },
    { 
        id: 'SHIELD', name: 'AEGIS', color: '#9b59b6', weight: 15, duration: 600, 
        onStart: (p) => { p.invulnTimer = 600; }, 
        onEnd: (p) => { },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(8, 5, 8, -5); ctx.lineTo(-8, -5); ctx.quadraticCurveTo(-8, 5, 0, 10); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        }
    },
    {
        id: 'FREEZE', name: 'ZERO K', color: '#ecf0f1', weight: 10, duration: 600, 
        onStart: () => { enemySystem.enemies.forEach(e => { e.savedSpeed = e.speed; e.speed = 0; }); },
        onEnd: () => { enemySystem.enemies.forEach(e => { if(e.savedSpeed) e.speed = e.savedSpeed; }); },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.moveTo(-8, -4); ctx.lineTo(8, 4); ctx.moveTo(8, -4); ctx.lineTo(-8, 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        }
    },
    { 
        id: 'NUKE', name: 'NUKE', color: '#e74c3c', weight: 5, duration: null,
        effect: (p) => {
            for (let i = enemySystem.enemies.length - 1; i >= 0; i--) {
                const e = enemySystem.enemies[i];
                e.hp = 0;
                createFloatText(e.x, e.y, "XXX", '#e74c3c');
                enemySystem.handleDeath(e, i);
            }
            const ov = document.getElementById('damage-overlay');
            if(ov) { ov.style.background = 'rgba(255, 200, 200, 0.6)'; setTimeout(() => ov.style.background = 'transparent', 500); }
            if(typeof sfx !== 'undefined' && sfx.explosion) sfx.explosion();
        },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.arc(0, -2, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-2.5, -3, 2, 0, Math.PI * 2); ctx.arc(2.5, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.rect(-1.5, 1, 3, 3); ctx.fill();
        }
    },
    {
        id: 'XP_CACHE', name: 'DATA PACK', color: '#8e44ad', weight: 8, duration: null,
        effect: (p) => {
            p.xp += 1000; createFloatText(p.x, p.y, `+1000 DATA`, '#8e44ad');
            spawnExplosion(p.x, p.y, '#8e44ad', 10);
            if(typeof checkLevelUp === 'function') checkLevelUp(); 
        },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        }
    },
    {
        id: 'MULTI', name: 'VOLLEY', color: '#ff00ff', weight: 5, duration: 900, 
        onStart: (p) => { p.projectiles += 24; p.bulletSize *= 0.5; },
        onEnd: (p) => { p.projectiles -= 24; p.bulletSize /= 0.5; },
        drawIcon: (ctx) => {
            for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.lineWidth = 2; ctx.strokeStyle = '#ff00ff'; ctx.stroke(); }
        }
    },
    {
        id: 'FEAR', name: 'GHOST', color: '#95a5a6', weight: 4, duration: 900, 
        onStart: () => { window.fearMode = true; }, 
        onEnd: () => { window.fearMode = false; },
        drawIcon: (ctx) => {
            ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.lineTo(8, 8); ctx.quadraticCurveTo(4, 4, 0, 8); ctx.quadraticCurveTo(-4, 4, -8, 8); ctx.lineTo(-8, -2); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-3, -2, 2, 0, Math.PI * 2); ctx.arc(3, -2, 2, 0, Math.PI * 2); ctx.fill();
        }
    }
];

function trySpawnDrop(x, y) {
    if (Math.random() > dropSystem.globalDropRate) return;
    
    let totalWeight = DROP_TYPES.reduce((acc, i) => acc + i.weight, 0);
    let r = Math.random() * totalWeight;
    let selected = DROP_TYPES[0];
    
    for (const item of DROP_TYPES) {
        if (r < item.weight) { selected = item; break; }
        r -= item.weight;
    }
    
    dropSystem.activeDrops.push({ x: x, y: y, type: selected, life: 2500, bobOffset: Math.random() * Math.PI * 2 });
}

function updateDrops(playerRef, timeScale = 1) {
    for (let i = dropSystem.activeDrops.length - 1; i >= 0; i--) {
        const d = dropSystem.activeDrops[i];
        d.life -= 1 * timeScale;
        const dist = Math.hypot(playerRef.x - d.x, playerRef.y - d.y);
        
        if (dist < playerRef.size * 2.5) { 
            applyDropEffect(d.type, playerRef);
            if(typeof sfx !== 'undefined' && sfx.collect) sfx.collect(); 
            dropSystem.activeDrops.splice(i, 1);
            continue;
        }

        if (dist < 150) { 
            d.x += (playerRef.x - d.x) * 0.12 * timeScale; 
            d.y += (playerRef.y - d.y) * 0.12 * timeScale; 
        }
        if (d.life <= 0) dropSystem.activeDrops.splice(i, 1);
    }

    for (let i = dropSystem.activeBuffs.length - 1; i >= 0; i--) {
        const buff = dropSystem.activeBuffs[i];
        buff.timer -= 1 * timeScale;
        if (buff.timer <= 0) {
            if (buff.def.onEnd) buff.def.onEnd(playerRef);
            createFloatText(playerRef.x, playerRef.y, `${buff.def.name} END`, '#fff');
            dropSystem.activeBuffs.splice(i, 1);
        }
    }
}

function applyDropEffect(itemDef, p) {
    createFloatText(p.x, p.y - 30, itemDef.name, itemDef.color);
    if (itemDef.effect) itemDef.effect(p);
    if (itemDef.duration) {
        const idx = dropSystem.activeBuffs.findIndex(b => b.def.id === itemDef.id);
        if (idx !== -1) {
            if (dropSystem.activeBuffs[idx].def.onEnd) dropSystem.activeBuffs[idx].def.onEnd(p);
            dropSystem.activeBuffs.splice(idx, 1);
        }
        if (itemDef.onStart) itemDef.onStart(p);
        dropSystem.activeBuffs.push({ def: itemDef, timer: itemDef.duration });
    }
}

function drawDrops(ctx) {
    const time = Date.now() * 0.005;
    
    dropSystem.activeDrops.forEach(d => {
        const floatY = Math.sin(time + d.bobOffset) * 6;
        ctx.save();
        ctx.translate(d.x, d.y + floatY);
        
        const grad = ctx.createLinearGradient(0, 0, 0, -60);
        grad.addColorStop(0, d.type.color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = grad;
        ctx.fillRect(-8, -60, 16, 60);

        const pulse = 10 + Math.sin(time * 2) * 5;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = d.type.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 20 - floatY, pulse, 0, Math.PI*2);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 15; ctx.shadowColor = d.type.color;
        ctx.fillStyle = '#000'; 
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = d.type.color;
        if (d.type.drawIcon) d.type.drawIcon(ctx);
        
        ctx.restore();
    });
}

function drawBuffFX(ctx, p) {
    const time = Date.now() * 0.01;

    dropSystem.activeBuffs.forEach(buff => {
        ctx.save();
        ctx.translate(p.x, p.y);
        const c = buff.def.color;
        const id = buff.def.id;

        if (id === 'SHIELD') {
            ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
            ctx.rotate(time);
            ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*1.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 34, Math.PI, Math.PI*2); ctx.stroke();
        }
        else if (id === 'RAPID') {
            ctx.fillStyle = c;
            if(Math.random() < 0.3) {
                const ax = (Math.random()-0.5)*30;
                const ay = (Math.random()-0.5)*30;
                ctx.fillRect(ax, ay, 4, 4); 
            }
        }
        else if (id === 'SPEED') {
            ctx.fillStyle = c; ctx.globalAlpha = 0.3;
            ctx.fillRect(-20, 10, 40, 2);
            ctx.fillRect(-25, -10, 50, 2);
        }
        else if (id === 'MULTI') {
            ctx.shadowBlur = 10; ctx.shadowColor = c; ctx.fillStyle = c;
            const orbitX = Math.cos(time*2) * 25;
            const orbitY = Math.sin(time*2) * 25;
            ctx.beginPath(); ctx.arc(orbitX, orbitY, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-orbitX, -orbitY, 4, 0, Math.PI*2); ctx.fill();
        }
        else if (id === 'FEAR') {
             ctx.fillStyle = '#555'; ctx.globalAlpha = 0.4;
             ctx.beginPath(); ctx.arc(0, -30 + Math.sin(time*3)*5, 10, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    });
}