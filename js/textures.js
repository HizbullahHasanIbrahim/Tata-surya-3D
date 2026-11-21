import * as THREE from 'three';

export function createTexture(color, type, seed = 42) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    let s = seed;
    const rand = () => {
        let x = Math.sin(s++) * 10000;
        return x - Math.floor(x);
    };

    if (type === 'sun') {
        const grad = ctx.createRadialGradient(size/2, size/2, size/10, size/2, size/2, size/2);
        grad.addColorStop(0, '#FFF5CC');
        grad.addColorStop(0.5, '#FFCC00');
        grad.addColorStop(1, '#FF6600');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 3000; i++) {
            ctx.fillStyle = `rgba(255, ${Math.floor(rand() * 180 + 70)}, 0, ${rand() * 0.35})`;
            ctx.beginPath();
            ctx.arc(rand() * size, rand() * size, rand() * 6 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'rocky') {
        for (let i = 0; i < 1500; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const r = rand() * 8 + 2;
            
            ctx.fillStyle = `rgba(0, 0, 0, ${rand() * 0.25})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, ${rand() * 0.15})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r + 1, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (type === 'cloudy') {
        for (let i = 0; i < 120; i++) {
            ctx.fillStyle = `rgba(255, 240, 180, ${rand() * 0.18})`;
            ctx.beginPath();
            const y = rand() * size;
            ctx.ellipse(rand() * size, y, rand() * 400 + 100, rand() * 30 + 10, rand() * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'earth') {
        ctx.fillStyle = '#285C28';
        for (let c = 0; c < 7; c++) {
            let cx = rand() * size;
            let cy = rand() * (size * 0.7) + (size * 0.15);
            for (let j = 0; j < 12; j++) {
                ctx.beginPath();
                ctx.arc(cx + (rand() - 0.5) * 220, cy + (rand() - 0.5) * 160, rand() * 80 + 35, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#F8F8FF';
        ctx.fillRect(0, 0, size, 70);
        ctx.fillRect(0, size - 70, size, 70);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.ellipse(rand() * size, rand() * size, rand() * 120 + 40, rand() * 30 + 10, rand() * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'banded') {
        const bandCount = 35;
        for (let i = 0; i < bandCount; i++) {
            const y = (i / bandCount) * size;
            const h = size / bandCount + (rand() * 15);
            const alpha = rand() * 0.3 + 0.05;
            ctx.fillStyle = rand() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, y, size, h);
        }
        if (color === '#D39C7E') {
            ctx.fillStyle = 'rgba(180, 50, 20, 0.65)';
            ctx.beginPath();
            ctx.ellipse(size * 0.65, size * 0.62, 55, 30, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(220, 100, 50, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    } else if (type === 'saturn') {
        for (let i = 0; i < 30; i++) {
            const y = (i / 30) * size;
            const alpha = rand() * 0.25 + 0.05;
            ctx.fillStyle = rand() > 0.5 ? `rgba(255, 240, 200, ${alpha})` : `rgba(100, 80, 50, ${alpha})`;
            ctx.fillRect(0, y, size, size / 30);
        }
    } else if (type === 'smooth') {
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${rand() * 0.08})`;
            ctx.fillRect(0, rand() * size, size, rand() * 15 + 5);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

export function createRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0.00, 'rgba(0,0,0,0)');
    grad.addColorStop(0.15, 'rgba(180, 160, 130, 0.3)');
    grad.addColorStop(0.35, 'rgba(210, 190, 150, 0.75)');
    grad.addColorStop(0.50, 'rgba(140, 120, 90, 0.85)');
    grad.addColorStop(0.53, 'rgba(10, 10, 10, 0.08)');
    grad.addColorStop(0.56, 'rgba(220, 200, 160, 0.9)');
    grad.addColorStop(0.85, 'rgba(190, 170, 130, 0.6)');
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function createMoonTexture() {
    return createTexture('#C0C0C0', 'rocky', 1337);
}

export function createCloudsTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 40 + 20;
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
