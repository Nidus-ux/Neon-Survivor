const particleSystem = {
    active: [],
    pool: [],
    spawn: function(x, y, color, size, life, vx, vy, isStatic) {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
            p.x = x; p.y = y; p.color = color; p.size = size;
            p.life = life; p.vx = vx; p.vy = vy; p.isStatic = !!isStatic;
        } else {
            p = { x, y, color, size, life, vx, vy, isStatic: !!isStatic };
        }
        this.active.push(p);
    },
    update: function(timeScale) {
        for(let i = this.active.length - 1; i >= 0; i--) {
            let p = this.active[i];
            if(!p.isStatic) { p.x += p.vx * timeScale; p.y += p.vy * timeScale; }
            p.life -= 1 * timeScale;
            p.size *= 0.92;
            if(p.life <= 0) {
                this.active[i] = this.active[this.active.length - 1];
                this.active.pop();
                if(this.pool.length < 1000) this.pool.push(p);
            }
        }
    },
    draw: function(ctx) {
        this.active.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life/30);
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            ctx.globalAlpha = 1;
        });
    }
};


function spawnParticles(x, y, c, n) { 
    for(let i=0; i<n; i++) {
         particleSystem.spawn(x, y, c, Math.random()*4, 30+Math.random()*20, (Math.random()-.5)*8, (Math.random()-.5)*8, false);
    }
}

function spawnExplosion(x, y, color, count) {
    if (typeof particleSystem !== 'undefined') {
        for(let i=0; i<count; i++) {
             particleSystem.spawn(x, y, color, 3, 40, (Math.random()-0.5)*10, (Math.random()-0.5)*10, false);
        }
    }
}