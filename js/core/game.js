if (typeof upgradePool === 'undefined') alert("ERRO: 'upgrades.js' ausente.");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const world = { width: 4000, height: 4000 };
const camera = { x: 0, y: 0 };

let gameState = 'START';
let frames = 0, seconds = 0, difficulty = 1;
let timeAccumulator = 0; 
let currentPlayerName = "Unknown";
let activeLevelUpSound = null;
let screenShake = 0;
let sessionStats = { bestiary: {}, bossKilled: false };

const keys = {};
const gems = [];
const shockwaves = [];
const backgroundParticles = [];

let lastTime = performance.now();
let lastFpsTime = 0;
let frameCount = 0;
const fpsCounter = document.getElementById('fps-counter');
let isFpsVisible = false;

for(let i=0; i<150; i++) {
    let type = 'star';
    let size = Math.random()*2;
    let color = 'rgba(255, 255, 255, 0.5)';
    if(Math.random() < 0.05) {
        type = 'planet';
        size = 10 + Math.random() * 20;
        const r = 50 + Math.random() * 100;
        const g = 50 + Math.random() * 100;
        const b = 150 + Math.random() * 100;
        color = `rgba(${r}, ${g}, ${b}, 0.2)`;
    }
    backgroundParticles.push({
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        size: size,
        speed: Math.random() * 0.5,
        type: type,
        color: color,
        isPlanet: type === 'planet' 
    });
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

const savedName = localStorage.getItem('last_player_name');
if (savedName) document.getElementById('playerName').value = savedName;

window.addEventListener('keydown', e => { 
    keys[e.key] = true; 
    if(e.key === 'Enter' && gameState === 'START') startGame(); 
    if(e.key === 'Escape') togglePause();
    if(e.key === '/' && gameState === 'PLAYING') seconds = 290; 
    if(e.key === '>' && gameState === 'PLAYING' && bossSystem.active) bossSystem.hp = 0;
    if (e.code === 'Numpad1') {
        isFpsVisible = !isFpsVisible;
        fpsCounter.style.display = isFpsVisible ? 'block' : 'none';
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);

function startGame() {
    if (!saveSystem.currentNick) {
        const nick = document.getElementById('playerName').value;
        if (!nick) { alert("IDENTIFICAÇÃO NECESSÁRIA"); return; }
        saveSystem.load(nick);
    }

    const equippedWeaponId = saveSystem.currentData.equippedWeapon || 'default';
    weaponSystem.apply(player, equippedWeaponId);

    try {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
    } catch(e){}

    if (typeof sfx !== 'undefined') sfx.unlockAudio();
    
    currentPlayerName = saveSystem.currentNick;
    localStorage.setItem('last_player_name', currentPlayerName);
    
    sessionStats = { bestiary: {}, bossKilled: false };
    
    player.x = world.width / 2;
    player.y = world.height / 2;
    player.hp = player.maxHp;
    player.xp = 0;
    player.level = 1;
    player.kills = 0;
    player.history = [];
    player.trail = [];
    seconds = 0;
    difficulty = 1;
    gems.length = 0;
    shockwaves.length = 0;
    bulletSystem.active = [];
    bulletSystem.pool = [];
    particleSystem.active = [];
    enemySystem.enemies = [];
    
    droneSystem.sync(player); 
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    gameState = 'PLAYING';
    lastTime = performance.now();
}

function togglePause() {
    if (gameState === 'PLAYING') { 
        gameState = 'PAUSED'; 
        document.getElementById('pause-indicator').style.display = 'block'; 
        canvas.style.filter = 'grayscale(100%) blur(2px)'; 
        sfx.stopMusic(); 
    } 
    else if (gameState === 'PAUSED') { 
        gameState = 'PLAYING'; 
        document.getElementById('pause-indicator').style.display = 'none'; 
        canvas.style.filter = 'none';
        lastTime = performance.now();
        let track = 0;
        if (difficulty >= 4) track = 2;
        else if (difficulty >= 2) track = 1;
        sfx.playTrack(track);
    }
}

function findNextTarget(position, excludeEnemy) {
    let closest = null;
    let minDist = Infinity;
    enemySystem.enemies.forEach(e => { 
        if (e === excludeEnemy) return;
        const dist = Math.hypot(position.x - e.x, position.y - e.y); 
        if (dist < minDist) {
            minDist = dist; 
            closest = e;
        }
    });
    return closest;
}

function checkLevelUp() { 
    if (player.xp >= player.nextLevelXp) { 
        player.level++; 
        player.xp -= player.nextLevelXp; 
        player.nextLevelXp = Math.floor(player.nextLevelXp * 1.3); 

        const hpGain = Math.floor(Math.random() * 20) + 1;
        const dmgGain = Math.floor(Math.random() * 20) + 1;

        player.maxHp += hpGain;
        player.hp += hpGain;
        player.damage += dmgGain;

        spawnPopText(player.x, player.y - 30, `+${hpGain} HP`, true);
        spawnPopText(player.x, player.y - 50, `+${dmgGain} DMG`, true);

        const naturalCap = 20;
        if (player.atkSpeed > naturalCap) {
            player.atkSpeed = Math.max(naturalCap, player.atkSpeed - 0.5);
        }

        if(player.healOnLevelUp > 0) player.hp = Math.min(player.maxHp, player.hp + player.healOnLevelUp); 
        
        document.getElementById('uiLvl').innerText = player.level; 
        
        if(activeLevelUpSound) activeLevelUpSound(); 
        activeLevelUpSound = sfx.levelUp(); 
        toggleUpgradeScreen(true); 
    } 
}

function takeDamage(val) { 
    if (player.dodge && Math.random() < player.dodge) { spawnPopText(player.x, player.y, "DODGE", true); return; }
    
    if (player.invulnTimer > player.invulnDuration) return;

    player.hp -= val; 
    player.invulnTimer = player.invulnDuration; 
    updateHUD(); triggerDamageEffect(); 
    sfx.hit();
    
    if (player.hp <= 0) {
            if (player.reviveCount && player.reviveCount > 0) {
            player.reviveCount--;
            player.hp = player.maxHp * 0.5;
            player.invulnTimer = 180;
            spawnShockwave(player.x, player.y, '#f1c40f');
            createFloatText(player.x, player.y - 40, "REBOOT SEQUENCE", '#f1c40f');
            if (sfx && sfx.levelUp) sfx.levelUp();
        } else {
            triggerGameOver();
        }
    }
}

function triggerDamageEffect() { 
    canvas.classList.add('glitch-canvas'); 
    setTimeout(() => canvas.classList.remove('glitch-canvas'), 200); 
    const o = document.getElementById('damage-overlay'); 
    o.classList.add('hurt-effect'); 
    setTimeout(() => o.classList.remove('hurt-effect'), 200); 
}

function triggerGameOver() { 
    gameState = 'GAMEOVER'; 
    sfx.gameOver();
    saveScore(); 
    
    const earnedChips = saveSystem.processRunEnd({
        won: false,
        time: seconds,
        kills: player.kills,
        level: player.level,
        bossKill: sessionStats.bossKilled,
        bestiaryUpdates: sessionStats.bestiary
    });

    renderLeaderboard('lbListGO'); 
    
    const goScreen = document.getElementById('gameOverScreen');
    const h1 = goScreen.querySelector('h1');
    h1.innerHTML = `SYSTEM FAILURE<br><span style="font-size:16px; color:#00ffff; margin-top:10px; display:block;">+${earnedChips} DATA CHIPS</span>`;
    
    goScreen.style.display = 'flex'; 
}

function saveScore() {
    let lb = JSON.parse(localStorage.getItem('neon_survivor_lb')) || [];
    const existingIndex = lb.findIndex(u => u.name === currentPlayerName);
    const newData = { name: currentPlayerName, seconds: seconds, timeStr: formatTime(seconds), kills: player.kills, level: player.level, history: player.history };
    if (existingIndex !== -1) { if (seconds > lb[existingIndex].seconds) lb[existingIndex] = newData; } else { lb.push(newData); }
    lb.sort((a, b) => b.seconds - a.seconds); if(lb.length > 50) lb = lb.slice(0, 50);
    localStorage.setItem('neon_survivor_lb', JSON.stringify(lb));
}

function update(timeScale) {
    if (gameState !== 'PLAYING') return;
    frames++;

    if (eventSystem.bossEncounter && !bossSystem.active && bossSystem.hp <= 0 && !sessionStats.bossKilled) {
         sessionStats.bossKilled = true;
    }

    if (!eventSystem.isTimerFrozen) {
        timeAccumulator += timeScale;
        if (timeAccumulator >= 60) {
            seconds++;
            difficulty += 0.01;
            timeAccumulator -= 60;
            document.getElementById('uiTime').classList.remove('timer-frozen');
            
            if (player.regenRate > 0) player.hp = Math.min(player.maxHp, player.hp + player.regenRate);
            updateHUD();

            checkEvents(seconds);

            if (!eventSystem.bossEncounter) {
                if (difficulty >= 4 && sfx.currentTrackId !== 2) sfx.playTrack(2);
                else if (difficulty >= 2 && sfx.currentTrackId !== 1) sfx.playTrack(1);
            }
        }
    } else {
        document.getElementById('uiTime').classList.add('timer-frozen');
    }
    
    document.getElementById('uiTime').innerText = formatTime(seconds);
    updateHUD();

    if (eventSystem.bossEncounter) {
        if(eventSystem.lockedCamera) {
            camera.x = eventSystem.lockedCamera.x;
            camera.y = eventSystem.lockedCamera.y;
        }
    } else {
        const tx = player.x - canvas.width / 2; const ty = player.y - canvas.height / 2;
        camera.x += (tx - camera.x) * 0.08 * timeScale; camera.y += (ty - camera.y) * 0.08 * timeScale;
        camera.x = Math.max(0, Math.min(camera.x, world.width - canvas.width));
        camera.y = Math.max(0, Math.min(camera.y, world.height - canvas.height));
    }
    
    if (screenShake > 0) {
        camera.x += (Math.random() - 0.5) * screenShake;
        camera.y += (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    updatePlayer(timeScale); 
    updateMechanics(player, timeScale, camera, canvas, world); 
    updateBoss(timeScale); 
    enemySystem.spawnController(difficulty, player, canvas); 
    enemySystem.update(player, timeScale); 
    bulletSystem.update(timeScale);
    updateGems(timeScale); 
    updateDrops(player, timeScale); 
    particleSystem.update(timeScale); 
    updateShockwaves(timeScale); 
    updateText(timeScale);
    
    droneSystem.sync(player); 
    droneSystem.update(timeScale, player, enemySystem, bulletSystem); 
}

function updatePlayer(timeScale) {
    player.angle += 0.05 * timeScale; 
    for(let i = player.trail.length - 1; i >= 0; i--) { 
        player.trail[i].life -= 1 * timeScale; 
        if (player.trail[i].life <= 0) player.trail.splice(i, 1); 
    }

    if (player.invulnTimer > 0) player.invulnTimer -= 1 * timeScale;

    if (player.cooldown > 0) player.cooldown -= 1 * timeScale;
    else if (enemySystem.enemies.length > 0 || bossSystem.active) {
        let t = enemySystem.getClosest(player);
        if (bossSystem.active && (!t || Math.hypot(player.x - bossSystem.x, player.y - bossSystem.y) < Math.hypot(player.x - t.x, player.y - t.y))) {
            t = { x: bossSystem.x, y: bossSystem.y }; 
        }
        if (t) { shoot(t); player.cooldown = player.atkSpeed; }
    }
}

function shoot(target) {
    if (player.shootOverride) {
        player.shootOverride(player, target);
        return;
    }

    const a = Math.atan2(target.y - player.y, target.x - player.x);
    const count = Math.floor(player.projectiles); 
    const spread = player.spread || 0; 
    for(let i = 0; i < count; i++) {
        const fa = a + (count > 1 ? (i - (count-1)/2) * spread : 0) + (Math.random() - 0.5) * spread;
        const isCrit = Math.random() < player.critChance;
        bulletSystem.spawn(player.x, player.y, Math.cos(fa) * player.bulletSpeed, Math.sin(fa) * player.bulletSpeed, player.range || 200, player.damage, false, player.bulletSize, '#fff', isCrit, player.knockback, player.piercingBullets, player.bounces);
    }
    sfx.shoot();
}

function createGem(x, y, val) { gems.push({ x, y, val, size: 4 }); }
function updateGems(timeScale) {
    for (let i = gems.length - 1; i >= 0; i--) {
        let g = gems[i]; const d = Math.hypot(player.x - g.x, player.y - g.y);
        if (d < player.magnetRadius) { g.x += (player.x - g.x) * 0.15 * timeScale; g.y += (player.y - g.y) * 0.15 * timeScale; }
        if (d < player.size + g.size) { 
            player.xp += g.val * player.xpMultiplier; gems.splice(i, 1); checkLevelUp(); 
            sfx.collect();
        }
    }
    updateHUD();
}

function killEnemy(e, index) {
    createGem(e.x, e.y, e.xpVal); 
    trySpawnDrop(e.x, e.y);
    spawnParticles(e.x, e.y, e.color, 8); 
    player.kills++; 
    
    if (sessionStats && sessionStats.bestiary) {
        if (!sessionStats.bestiary[e.type]) sessionStats.bestiary[e.type] = 0;
        sessionStats.bestiary[e.type]++;
    }

    if (player.lifestealChance && Math.random() < player.lifestealChance) player.hp = Math.min(player.maxHp, player.hp + 1);
    if (player.lifesteal > 0) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
    if (index !== undefined && index > -1) enemySystem.enemies.splice(index, 1);
    updateHUD();
}

function spawnShockwave(x, y, color) { shockwaves.push({x, y, radius: 10, opacity: 1, color: color}); }
function updateShockwaves(timeScale) { for (let i = shockwaves.length-1; i>=0; i--) { let s = shockwaves[i]; s.radius += 2 * timeScale; s.opacity -= 0.05 * timeScale; if(s.opacity <= 0) shockwaves.splice(i, 1); } }

function drawGrid() {
    ctx.lineWidth = 1; 
    ctx.beginPath();
    const gridSize = 60; 
    const sx = Math.floor(camera.x / gridSize) * gridSize; 
    const sy = Math.floor(camera.y / gridSize) * gridSize;
    
    for (let x = sx; x < sx + canvas.width + gridSize; x += gridSize) { 
        ctx.strokeStyle = (x === 0 || x === world.width) ? '#ff0055' : 'rgba(0, 255, 255, 0.1)'; 
        ctx.moveTo(x, sy); ctx.lineTo(x, sy + canvas.height + gridSize); 
    }
    for (let y = sy; y < sy + canvas.height + gridSize; y += gridSize) { 
        ctx.strokeStyle = (y === 0 || y === world.height) ? '#ff0055' : 'rgba(0, 255, 255, 0.1)'; 
        ctx.moveTo(sx, y); ctx.lineTo(sx + canvas.width + gridSize, y); 
    }
    ctx.stroke();
    
    ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 5; ctx.strokeRect(0,0,world.width, world.height);
}

function draw() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    const safeDelta = Math.min(deltaTime, 100);
    const timeScale = safeDelta / (1000 / 60);

    if (gameState === 'PLAYING') {
        update(timeScale);
    }

    const t = eventSystem.transitionProgress;
    const r = Math.floor(5 * (1-t));
    const g = 0;
    const b = Math.floor(17 * (1-t));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    
    drawGrid();

    backgroundParticles.forEach(p => { 
        if (eventSystem.bossEncounter) {
            if (p.isPlanet) {
                p.y += (p.speed * (1 + eventSystem.scrollSpeed)) + eventSystem.scrollSpeed;
                if(p.y > camera.y + canvas.height + 50) p.y = camera.y - 50;
                if(p.x < camera.x) p.x += canvas.width; if(p.x > camera.x + canvas.width) p.x -= canvas.width;
                ctx.fillStyle = p.color; ctx.globalAlpha = eventSystem.transitionProgress; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            } else {
                p.y += (p.speed * (1 + eventSystem.scrollSpeed)) + eventSystem.scrollSpeed;
                if(p.y > world.height + camera.y) p.y = camera.y - 50; 
                if(p.x < camera.x) p.x += canvas.width; if(p.x > camera.x + canvas.width) p.x -= canvas.width;
                ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.fillRect(p.x, p.y, 2, p.size * (eventSystem.scrollSpeed + 2));
            }
        } else {
            if (!p.isPlanet) {
                p.x += Math.cos(frames*0.01 + p.size); 
                ctx.fillStyle = p.color; ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
            }
        }
    });
    ctx.globalAlpha = 1;

    shockwaves.forEach(s => { ctx.lineWidth = 2; ctx.strokeStyle = s.color; ctx.globalAlpha = s.opacity; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1; });
    gems.forEach(g => { ctx.shadowBlur=10; ctx.shadowColor='#3498db'; ctx.fillStyle='#3498db'; ctx.beginPath(); ctx.arc(g.x, g.y, g.size + Math.sin(frames*0.1), 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; });
    
    particleSystem.draw(ctx);
    bulletSystem.draw(ctx);
    
    enemySystem.draw(ctx, player);
    droneSystem.draw(ctx);

    drawDrops(ctx);
    drawBoss(ctx);
    
    ctx.strokeStyle = player.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.3; ctx.beginPath();
    if(player.trail.length > 1) { 
        if(typeof mechSystem !== 'undefined' && mechSystem.dash.active) {
            player.trail.forEach(t => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
                ctx.beginPath(); ctx.arc(t.x, t.y, player.size, 0, Math.PI*2); ctx.fill();
            });
        } else {
            ctx.moveTo(player.trail[0].x, player.trail[0].y); for(let i=1; i<player.trail.length; i++) ctx.lineTo(player.trail[i].x, player.trail[i].y); ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;

    ctx.save(); ctx.translate(player.x, player.y);
    if(typeof mechSystem !== 'undefined' && mechSystem.dash.active) {
        ctx.shadowBlur = 40; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff';
    } else {
        ctx.shadowBlur = 20; ctx.shadowColor = player.color; ctx.fillStyle = player.color;
        if(player.invulnTimer > 0 && Math.floor(frames/5)%2===0) ctx.globalAlpha = 0.5;
    }

    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.rotate(player.angle); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(-10, -10, 20, 20); ctx.stroke();
    
    if (player.drawWeapon) player.drawWeapon(ctx, player);
    
    ctx.restore();

    drawBuffFX(ctx, player);
    ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.setLineDash([5, 15]); ctx.beginPath(); ctx.arc(player.x, player.y, player.magnetRadius, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    floatingTexts.forEach(t => { ctx.fillStyle=t.color; ctx.font=`10px 'Press Start 2P'`; ctx.fillText(t.text, t.x, t.y - (40 - t.life)); });
    ctx.restore();

    frameCount++;
    if (currentTime - lastFpsTime >= 1000) {
        fpsCounter.textContent = `${frameCount} FPS`;
        frameCount = 0;
        lastFpsTime = currentTime;
    }
}

function loop() {
    requestAnimationFrame(loop);
    draw();
}

let glitchInterval = null;
function startBossNameGlitch() {
    const bossNameEl = document.getElementById('glitch-boss-name');
    if (!bossNameEl || glitchInterval) return;
    const originalText = "N̷E̴O̵N̸ ̴A̶N̸G̴E̴L̴";
    glitchInterval = setInterval(() => {
        let glitchText = "";
        for (let i = 0; i < originalText.length; i++) {
            if (originalText[i] === ' ') {
                glitchText += ' ';
            } else {
                glitchText += String.fromCharCode(33 + Math.floor(Math.random() * 94));
            }
        }
        bossNameEl.textContent = glitchText;
    }, 45);
}

function stopBossNameGlitch() {
    if(glitchInterval) {
        clearInterval(glitchInterval);
        glitchInterval = null;
    }
    const bossNameEl = document.getElementById('glitch-boss-name');
    if (bossNameEl) bossNameEl.textContent = "N̷E̴O̵N̸ ̴A̶N̸G̴E̴L̴";
}

function openPatchNotes() { 
    document.getElementById('patchModal').style.display = 'flex';
    startBossNameGlitch();
}
function closePatchNotes() { 
    document.getElementById('patchModal').style.display = 'none';
    stopBossNameGlitch();
}

function rebootGame() {
    sessionStorage.setItem('isRebooting', 'true');
    location.reload();
}

window.addEventListener('load', () => {
    if (sessionStorage.getItem('isRebooting') === 'true') {
        sessionStorage.removeItem('isRebooting');
    } else {
        openPatchNotes();
    }
    loop();
});