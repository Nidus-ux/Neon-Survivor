window.joystickInput = { x: 0, y: 0, active: false };

(function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return;

    const style = document.createElement('style');
    style.innerHTML = `
        #joystick-zone {
            position: absolute; bottom: 50px; left: 50px;
            width: 150px; height: 150px; z-index: 100;
            display: none;
            touch-action: none;
        }

        .joystick-base {
            width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            position: relative;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .joystick-stick {
            width: 60px; height: 60px;
            background: rgba(46, 204, 113, 0.8);
            border-radius: 50%;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px #2ecc71;
            pointer-events: none;
        }

        #rotate-screen {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 9999;
            flex-direction: column; justify-content: center; align-items: center;
            color: white; text-align: center; font-family: sans-serif;
        }
        #rotate-screen h1 { color: #e74c3c; font-size: 40px; margin-bottom: 20px; }
        #rotate-screen p { font-size: 18px; color: #aaa; }
    `;
    document.head.appendChild(style);

    const rotateMsg = document.createElement('div');
    rotateMsg.id = 'rotate-screen';
    rotateMsg.innerHTML = `<h1>↻</h1><p>VIRE SEU CELULAR<br>PARA JOGAR</p>`;
    document.body.appendChild(rotateMsg);

    const zone = document.createElement('div');
    zone.id = 'joystick-zone';
    zone.innerHTML = `<div class="joystick-base"><div class="joystick-stick"></div></div>`;
    document.body.appendChild(zone);

    const stick = zone.querySelector('.joystick-stick');
    
    let startX = 0, startY = 0;
    const maxDist = 45;

    zone.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        window.joystickInput.active = true;
    }, {passive: false});

    zone.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!window.joystickInput.active) return;

        const touch = e.touches[0];
        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;

        const distance = Math.hypot(dx, dy);
        
        if (distance > maxDist) {
            const ratio = maxDist / distance;
            dx *= ratio;
            dy *= ratio;
        }

        stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        window.joystickInput.x = dx / maxDist;
        window.joystickInput.y = dy / maxDist;
    }, {passive: false});

    const resetJoystick = () => {
        window.joystickInput.active = false;
        window.joystickInput.x = 0;
        window.joystickInput.y = 0;
        stick.style.transform = `translate(-50%, -50%)`;
    };

    zone.addEventListener('touchend', resetJoystick);
    zone.addEventListener('touchcancel', resetJoystick);
    
    function checkOrientation() {
        if (window.innerHeight > window.innerWidth) {
            rotateMsg.style.display = 'flex';
            if (typeof togglePause === 'function' && typeof gameState !== 'undefined' && gameState === 'PLAYING') {
                togglePause(); 
            }
        } else {
            rotateMsg.style.display = 'none';
        }
    }

    setInterval(() => {
        if (typeof gameState !== 'undefined') {
            if (gameState === 'PLAYING') {
                zone.style.display = 'block';
            } else {
                zone.style.display = 'none';
            }
        }
    }, 500);

    window.addEventListener('resize', checkOrientation);
    checkOrientation();
})();