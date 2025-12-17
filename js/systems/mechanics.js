const mechSystem = {
    dash: {
        active: false,
        cooldown: 0,
        maxCooldown: 120, 
        duration: 12,     
        timer: 0,
        speedMult: 3.5,
        dashX: 0,
        dashY: 0
    }
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && typeof gameState !== 'undefined' && gameState === 'PLAYING') {
        tryDash();
    }
});

function tryDash() {
    if (mechSystem.dash.cooldown > 0 || mechSystem.dash.active) return;
    
    let mx = 0, my = 0;
    
    if (keys['w'] || keys['ArrowUp']) my = -1;
    if (keys['s'] || keys['ArrowDown']) my = 1;
    if (keys['a'] || keys['ArrowLeft']) mx = -1;
    if (keys['d'] || keys['ArrowRight']) mx = 1;

    if (window.joystickInput && (window.joystickInput.x !== 0 || window.joystickInput.y !== 0)) {
        mx = window.joystickInput.x;
        my = window.joystickInput.y;
    }

    if (mx === 0 && my === 0) {
        mx = 1; 
    }

    const mag = Math.hypot(mx, my);
    
    if (mag > 0) {
        mechSystem.dash.dashX = mx / mag;
        mechSystem.dash.dashY = my / mag;
    } else {
        mechSystem.dash.dashX = 1;
        mechSystem.dash.dashY = 0;
    }

    mechSystem.dash.active = true;
    mechSystem.dash.timer = mechSystem.dash.duration;
    mechSystem.dash.cooldown = mechSystem.dash.maxCooldown;

    if (typeof sfx !== 'undefined' && sfx.shoot) sfx.shoot(); 
    if (typeof createFloatText === 'function') createFloatText(player.x, player.y, "DASH", "#00ffff");
}

function updateMechanics(playerRef, timeScale = 1, camRef, canvasRef, worldRef) {
    if (mechSystem.dash.cooldown > 0) {
        mechSystem.dash.cooldown -= 1 * timeScale;
    }

    let moveX = 0;
    let moveY = 0;
    let currentSpeed = playerRef.speed;

    if (mechSystem.dash.active) {
        mechSystem.dash.timer -= 1 * timeScale;
        if (mechSystem.dash.timer <= 0) {
            mechSystem.dash.active = false;
        }
        
        moveX = mechSystem.dash.dashX;
        moveY = mechSystem.dash.dashY;
        currentSpeed *= mechSystem.dash.speedMult;
        playerRef.invulnTimer = 2;

    } else {
        let mx = 0, my = 0;
        
        if (keys['w'] || keys['ArrowUp']) my = -1;
        if (keys['s'] || keys['ArrowDown']) my = 1;
        if (keys['a'] || keys['ArrowLeft']) mx = -1;
        if (keys['d'] || keys['ArrowRight']) mx = 1;

        if (window.joystickInput && (window.joystickInput.x !== 0 || window.joystickInput.y !== 0)) {
            mx = window.joystickInput.x;
            my = window.joystickInput.y;
        }

        if (mx !== 0 || my !== 0) {
            const mag = Math.hypot(mx, my);
            moveX = mx / mag;
            moveY = my / mag;
        }
    }

    if (moveX !== 0 || moveY !== 0) {
        playerRef.x += moveX * currentSpeed * timeScale;
        playerRef.y += moveY * currentSpeed * timeScale;

        if (mechSystem.dash.active) {
            if (frames % 2 === 0) {
                playerRef.trail.push({ x: playerRef.x, y: playerRef.y, life: 15, color: '#fff' });
            }
        } else {
            for(let i = playerRef.trail.length - 1; i >= 0; i--) { 
                playerRef.trail[i].life -= 1 * timeScale; 
                if (playerRef.trail[i].life <= 0) playerRef.trail.splice(i, 1); 
            }
            if (frames % 3 === 0) {
                playerRef.trail.push({x: playerRef.x, y: playerRef.y, life: 10});
            }
        }
    } else {
        for(let i = playerRef.trail.length - 1; i >= 0; i--) { 
            playerRef.trail[i].life -= 1 * timeScale; 
            if (playerRef.trail[i].life <= 0) playerRef.trail.splice(i, 1); 
        }
    }

    if (typeof eventSystem !== 'undefined' && eventSystem.bossEncounter) {
        playerRef.x = Math.max(camRef.x + playerRef.size, Math.min(camRef.x + canvasRef.width - playerRef.size, playerRef.x));
        playerRef.y = Math.max(camRef.y + playerRef.size, Math.min(camRef.y + canvasRef.height - playerRef.size, playerRef.y));
    } else {
        playerRef.x = Math.max(playerRef.size, Math.min(worldRef.width - playerRef.size, playerRef.x));
        playerRef.y = Math.max(playerRef.size, Math.min(worldRef.height - playerRef.size, playerRef.y));
    }
}