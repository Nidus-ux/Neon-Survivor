window.joystickInput = { x: 0, y: 0, active: false };
window.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

(function() {
    if (!window.isMobileDevice) return;

    const mobileStyle = document.createElement('style');
    mobileStyle.innerHTML = `
        @media (max-width: 1024px) {
            
            #game-container, body, html {
                overflow: hidden !important;
                position: fixed;
                width: 100%;
                height: 100%;
            }

            .start-content, .title-neon {
                transform: none !important;
            }
            .title-neon { font-size: 30px !important; margin-bottom: 20px !important; }
            .start-content { width: 85% !important; padding: 20px !important; }
            
            .btn-patch, .btn-rank {
                width: 45px !important; height: 45px !important;
                font-size: 20px !important;
                border-width: 2px !important;
            }

            #hub-screen {
                padding: 10px !important;
                height: 100vh !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }

            .hub-header {
                transform: none !important;
                margin: 0 0 10px 0 !important;
                padding: 5px !important;
                flex-shrink: 0 !important;
            }
            .hub-title { font-size: 18px !important; padding: 5px 10px !important; }
            .hub-currency { font-size: 12px !important; padding: 5px 10px !important; }

            .hub-nav {
                transform: none !important;
                gap: 5px !important;
                margin-bottom: 10px !important;
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow-x: auto !important;
                padding-bottom: 5px !important;
                flex-shrink: 0 !important;
            }
            .hub-nav button {
                font-size: 9px !important;
                padding: 10px 5px !important;
                flex: 1 !important;
                white-space: nowrap !important;
                min-width: 80px !important;
            }

            .hub-content {
                transform: none !important;
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important;
                grid-auto-rows: 160px !important; 
                gap: 10px !important;
                padding: 5px !important;
                padding-bottom: 80px !important;
                overflow-y: auto !important;
                flex-grow: 1 !important;
            }

            .hub-card {
                transform: none !important;
                opacity: 1 !important;
                animation: none !important;
                padding: 10px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: space-between !important;
                text-align: center !important;
                height: 100% !important;
                box-sizing: border-box !important;
                background: rgba(10, 10, 15, 0.95) !important;
            }

            .hc-icon { 
                font-size: 32px !important; 
                margin-bottom: 10px !important;
                filter: drop-shadow(0 0 5px rgba(255,255,255,0.8));
            }
            
            .hc-info h3 { 
                font-size: 10px !important; 
                line-height: 1.4 !important;
                height: 30px !important;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0 !important;
            }
            
            .hc-info p { 
                display: none !important; 
            }

            .hc-buy {
                position: relative !important;
                transform: none !important;
                top: auto !important; left: auto !important;
                width: 100% !important;
                height: auto !important;
                opacity: 1 !important;
                background: transparent !important;
                border: 1px solid #333 !important;
                padding: 8px !important;
                margin-top: auto !important;
                display: flex !important;
                flex-direction: column !important;
                pointer-events: auto !important;
            }

            .hub-card.mobile-active {
                border-color: #00f3ff !important;
                box-shadow: 0 0 15px rgba(0, 243, 255, 0.3) !important;
            }
            .hub-card.mobile-active .hc-buy {
                background: #00f3ff !important;
                border-color: #fff !important;
            }
            .hub-card.mobile-active .buy-price { color: #000 !important; text-shadow: none !important; }
            .hub-card.mobile-active .buy-lvl { color: #000 !important; text-shadow: none !important; }

            .buy-price { font-size: 11px !important; margin-bottom: 2px !important; }
            .buy-lvl { font-size: 8px !important; color: #888 !important; }

            .btn-back-hub {
                transform: none !important;
                width: 90% !important;
                left: 5% !important;
                bottom: 10px !important;
                text-align: center !important;
                padding: 15px !important;
                background: #000 !important;
                z-index: 100 !important;
            }

            .lore-entry {
                transform: none !important;
                opacity: 1 !important;
                margin-bottom: 10px !important;
            }
        }

        #joystick-zone {
            position: fixed; bottom: 30px; left: 30px;
            width: 120px; height: 120px; z-index: 999;
            display: none; touch-action: none;
        }
        .joystick-base {
            width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%; position: relative;
            backdrop-filter: blur(2px);
        }
        .joystick-stick {
            width: 45px; height: 45px;
            background: rgba(0, 243, 255, 0.6);
            border-radius: 50%; position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px #00f3ff;
            pointer-events: none;
        }
        #rotate-screen {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #050011; z-index: 10000;
            flex-direction: column; justify-content: center; align-items: center;
            color: #00f3ff; text-align: center; font-family: 'Press Start 2P';
        }
    `;
    document.head.appendChild(mobileStyle);

    const rotateMsg = document.createElement('div');
    rotateMsg.id = 'rotate-screen';
    rotateMsg.innerHTML = `<h1 style="font-size:40px; margin-bottom:20px">↻</h1><p style="line-height:1.5; font-size:12px;">DETECTADO MODO RETRATO<br><br>VIRE O DISPOSITIVO<br>PARA INICIAR O SISTEMA</p>`;
    document.body.appendChild(rotateMsg);

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
    window.addEventListener('resize', checkOrientation);
    checkOrientation();

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.hub-card')) return;
        
        const card = e.target.closest('.hub-card');
        const buyBtn = e.target.closest('.hc-buy');
        
        document.querySelectorAll('.hub-card.mobile-active').forEach(c => {
            if (c !== card) c.classList.remove('mobile-active');
        });

        if (!card.classList.contains('mobile-active')) {
            card.classList.add('mobile-active');
            if (typeof hubSfx !== 'undefined') hubSfx.hover();
        }
    }, { capture: true });

    const zone = document.createElement('div');
    zone.id = 'joystick-zone';
    zone.innerHTML = `<div class="joystick-base"><div class="joystick-stick"></div></div>`;
    document.body.appendChild(zone);

    const stick = zone.querySelector('.joystick-stick');
    let startX = 0, startY = 0;
    const maxDist = 35;

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

    setInterval(() => {
        if (typeof gameState !== 'undefined') {
            if (gameState === 'PLAYING') zone.style.display = 'block';
            else zone.style.display = 'none';
        }
    }, 500);

    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.hub-content') || e.target.closest('.leaderboard-container') || e.target.closest('.patch-container') || e.target.closest('#detailsGrid')) return; 
        if (e.touches.length > 1) e.preventDefault(); 
    }, { passive: false });

})();