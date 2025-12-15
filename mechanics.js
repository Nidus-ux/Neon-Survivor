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
    if (e.code === 'Space' && gameState === 'PLAYING') {
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

function updateMechanics(playerRef) {
    if (mechSystem.dash.cooldown > 0) {
        mechSystem.dash.cooldown--;
    }

    if (mechSystem.dash.active) {
        mechSystem.dash.timer--;
        if (mechSystem.dash.timer <= 0) {
            mechSystem.dash.active = false;
        }

        playerRef.x += mechSystem.dash.dashX * playerRef.speed * mechSystem.dash.speedMult;
        playerRef.y += mechSystem.dash.dashY * playerRef.speed * mechSystem.dash.speedMult;

        if (frames % 2 === 0) {
            playerRef.trail.push({ x: playerRef.x, y: playerRef.y, life: 15, color: '#fff' });
        }
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
            const factor = (mag > 1) ? (1 / mag) : 1;
            
            playerRef.x += mx * factor * playerRef.speed;
            playerRef.y += my * factor * playerRef.speed;

            if (frames % 3 === 0) {
                playerRef.trail.push({x: playerRef.x, y: playerRef.y, life: 10});
            }
        }
    }
}