import * as THREE from 'three';

// Cache tekstur internal untuk manajemen memori WebGL
const textureRegistry = [];

// Seeded PRNG (Linear Congruential Generator / Mulberry32) untuk determinisme tekstur
function createRng(seed) {
    let s = Math.floor(seed) >>> 0;
    return function() {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Konfigurasi umum CanvasTexture equirectangular 2:1
function finalizeEquirectangularTexture(canvas, isMobile) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = isMobile ? 2 : 4;
    tex.needsUpdate = true;
    textureRegistry.push(tex);
    return tex;
}

// 1. Tekstur Permukaan Matahari: Gradien vertikal + 600 bintik granulasi plasma radial
export function buildSunTexture(isMobile) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rng = createRng(1001);

    // Gradien dasar vertikal matahari
    const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
    baseGrad.addColorStop(0, '#ff7700');
    baseGrad.addColorStop(0.3, '#ffaa00');
    baseGrad.addColorStop(0.7, '#ffcc22');
    baseGrad.addColorStop(1, '#ff6600');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // 600 bintik granulasi konveksi plasma
    const spotCount = isMobile ? 350 : 600;
    for (let i = 0; i < spotCount; i++) {
        const x = rng() * width;
        const y = rng() * height;
        const r = rng() * 8 + 2;
        const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        const isBright = rng() > 0.4;
        if (isBright) {
            spotGrad.addColorStop(0, 'rgba(255, 255, 200, 0.45)');
            spotGrad.addColorStop(0.7, 'rgba(255, 180, 40, 0.25)');
            spotGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        } else {
            spotGrad.addColorStop(0, 'rgba(180, 40, 0, 0.5)');
            spotGrad.addColorStop(0.8, 'rgba(230, 90, 0, 0.2)');
            spotGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
        }
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return finalizeEquirectangularTexture(canvas, isMobile);
}

// 2. Tekstur Sprite Glow Korona Matahari: Gradien radial 256x256
export function buildGlowTexture(c0, c1, c2, isMobile) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, c0);
    grad.addColorStop(0.4, c1);
    grad.addColorStop(1, c2);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    textureRegistry.push(tex);
    return tex;
}

// 3. Tekstur Planet Equirectangular (512x256)
export function buildPlanetTexture(id, isMobile) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (id === 'mercury' || id === 'moon') {
        const rng = createRng(id === 'moon' ? 4421 : 2021);
        ctx.fillStyle = id === 'moon' ? '#787878' : '#8c8880';
        ctx.fillRect(0, 0, width, height);

        // Variasi bercak medan kawah (Mare & Dataran Tinggi)
        for (let i = 0; i < 40; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const rx = rng() * 60 + 20;
            const ry = rng() * 35 + 15;
            ctx.fillStyle = rng() > 0.5 ? 'rgba(40, 40, 40, 0.22)' : 'rgba(180, 180, 180, 0.18)';
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Kawah benturan dengan rim terang
        const craterCount = isMobile ? 120 : 220;
        for (let i = 0; i < craterCount; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const r = rng() * 9 + 2;

            ctx.fillStyle = 'rgba(25, 25, 25, 0.45)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(235, 235, 235, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (id === 'venus') {
        const rng = createRng(3031);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#e8be78');
        grad.addColorStop(0.35, '#f5d99b');
        grad.addColorStop(0.65, '#ebd18e');
        grad.addColorStop(1, '#c99e56');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sapuan awan asam sulfat elips horizontal
        for (let i = 0; i < 70; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const rx = rng() * 140 + 40;
            const ry = rng() * 16 + 6;
            ctx.fillStyle = rng() > 0.5 ? 'rgba(255, 245, 220, 0.18)' : 'rgba(160, 120, 50, 0.12)';
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, (rng() - 0.5) * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (id === 'earth') {
        const rng = createRng(4041);
        // Samudera biru tua - sedang (dominan 70%)
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
        oceanGrad.addColorStop(0, '#102e58');
        oceanGrad.addColorStop(0.5, '#195aa8');
        oceanGrad.addColorStop(1, '#102e58');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, width, height);

        // 6 Gugus massa benua organik (Eurasia, Afrika, Amerika Utara, Amerika Selatan, Australia, Asia Timur)
        const continentClusters = [
            { cx: 0.28, cy: 0.38, count: 18, rx: 75, ry: 45 },
            { cx: 0.33, cy: 0.60, count: 14, rx: 50, ry: 55 },
            { cx: 0.72, cy: 0.35, count: 16, rx: 65, ry: 50 },
            { cx: 0.82, cy: 0.65, count: 14, rx: 45, ry: 60 },
            { cx: 0.46, cy: 0.70, count: 10, rx: 40, ry: 30 },
            { cx: 0.50, cy: 0.40, count: 15, rx: 60, ry: 40 }
        ];

        continentClusters.forEach(c => {
            const baseX = c.cx * width;
            const baseY = c.cy * height;
            for (let j = 0; j < c.count; j++) {
                const ox = (rng() - 0.5) * c.rx;
                const oy = (rng() - 0.5) * c.ry;
                const rad = rng() * 32 + 14;

                // Variasi daratan: hijau vegetasi dan gurun kecokelatan
                ctx.fillStyle = rng() > 0.35 ? '#2b7d50' : '#8d8350';
                ctx.beginPath();
                ctx.arc(baseX + ox, baseY + oy, rad, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Lapisan es kutub tipis (Arktik & Antartika)
        const iceGradTop = ctx.createLinearGradient(0, 0, 0, 26);
        iceGradTop.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
        iceGradTop.addColorStop(1, 'rgba(240, 248, 255, 0)');
        ctx.fillStyle = iceGradTop;
        ctx.fillRect(0, 0, width, 26);

        const iceGradBottom = ctx.createLinearGradient(0, height - 32, 0, height);
        iceGradBottom.addColorStop(0, 'rgba(240, 248, 255, 0)');
        iceGradBottom.addColorStop(1, 'rgba(240, 248, 255, 0.95)');
        ctx.fillStyle = iceGradBottom;
        ctx.fillRect(0, height - 32, width, 32);
    } else if (id === 'mars') {
        const rng = createRng(5051);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#a8432a');
        grad.addColorStop(0.5, '#c85a36');
        grad.addColorStop(1, '#943820');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Pola batuan gelap & ngarai merah
        for (let i = 0; i < 65; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const rx = rng() * 75 + 20;
            const ry = rng() * 25 + 8;
            ctx.fillStyle = rng() > 0.5 ? 'rgba(80, 25, 12, 0.28)' : 'rgba(240, 130, 80, 0.18)';
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, (rng() - 0.5) * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tudung es kutub tipis
        ctx.fillStyle = 'rgba(250, 245, 245, 0.85)';
        ctx.beginPath();
        ctx.arc(width * 0.5, 0, 24, 0, Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(width * 0.5, height, 18, Math.PI, 0);
        ctx.fill();
    } else if (id === 'jupiter') {
        const rng = createRng(6061);
        // Pita horizontal atmosfer tebal berlapis
        const bandColors = [
            '#4a2916', '#a36d42', '#d9b68b', '#7e4726',
            '#e8ceaa', '#9c5b32', '#3e2010', '#cfa374',
            '#8f532f', '#eed7ba', '#5b321a', '#b88556'
        ];
        const numBands = 36;
        for (let i = 0; i < numBands; i++) {
            const y = (i / numBands) * height;
            const h = (height / numBands) + 1;
            ctx.fillStyle = bandColors[i % bandColors.length];
            ctx.fillRect(0, y, width, h);
        }

        // Turbulensi sabuk awan
        for (let i = 0; i < 90; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const rx = rng() * 50 + 15;
            const ry = rng() * 8 + 3;
            ctx.fillStyle = rng() > 0.5 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tepat 1 Bintik Merah Besar (Great Red Spot) di belahan selatan
        const grsX = width * 0.62;
        const grsY = height * 0.65;
        const grsGrad = ctx.createRadialGradient(grsX, grsY, 3, grsX, grsY, 32);
        grsGrad.addColorStop(0, '#c2381e');
        grsGrad.addColorStop(0.65, '#992612');
        grsGrad.addColorStop(1, 'rgba(120, 45, 20, 0)');
        ctx.fillStyle = grsGrad;
        ctx.beginPath();
        ctx.ellipse(grsX, grsY, 36, 20, -0.05, 0, Math.PI * 2);
        ctx.fill();
    } else if (id === 'saturn') {
        const rng = createRng(7071);
        // Pita emas-krem lembut horizontal
        const bandColors = ['#d8bc88', '#ebd19d', '#cfaf75', '#f3ddb3', '#be9f65', '#e2c591'];
        const numBands = 32;
        for (let i = 0; i < numBands; i++) {
            const y = (i / numBands) * height;
            const h = (height / numBands) + 1;
            ctx.fillStyle = bandColors[i % bandColors.length];
            ctx.fillRect(0, y, width, h);
        }

        // Halus tanpa badai tajam
        for (let i = 0; i < 40; i++) {
            const y = rng() * height;
            ctx.fillStyle = rng() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(120, 90, 40, 0.08)';
            ctx.fillRect(0, y, width, rng() * 6 + 2);
        }
    } else if (id === 'uranus') {
        const rng = createRng(8081);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#5eead4');
        grad.addColorStop(0.5, '#7dd3fc');
        grad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Garis atmosfer amat tipis
        for (let i = 0; i < 25; i++) {
            const y = rng() * height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.fillRect(0, y, width, rng() * 8 + 2);
        }
    } else if (id === 'neptune') {
        const rng = createRng(9091);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.5, '#2563eb');
        grad.addColorStop(1, '#1e40af');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sapuan awan metana putih-biru muda supersonik
        for (let i = 0; i < 35; i++) {
            const x = rng() * width;
            const y = rng() * height;
            const rx = rng() * 60 + 20;
            const ry = rng() * 4 + 1.5;
            ctx.fillStyle = 'rgba(219, 234, 254, 0.35)';
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 1 Badai Great Dark Spot
        const dsX = width * 0.42;
        const dsY = height * 0.48;
        const dsGrad = ctx.createRadialGradient(dsX, dsY, 2, dsX, dsY, 22);
        dsGrad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
        dsGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');
        ctx.fillStyle = dsGrad;
        ctx.beginPath();
        ctx.ellipse(dsX, dsY, 24, 13, 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    return finalizeEquirectangularTexture(canvas, isMobile);
}

// 4. Tekstur Awan Bumi Transparan (512x256)
export function buildEarthCloudsTexture(isMobile) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rng = createRng(4488);

    // Latar belakang wajib 100% transparan agar daratan/laut Bumi terlihat
    ctx.clearRect(0, 0, width, height);

    const cloudCount = isMobile ? 120 : 200;
    for (let i = 0; i < cloudCount; i++) {
        const x = rng() * width;
        const y = rng() * height;
        const rx = rng() * 45 + 15;
        const ry = rng() * 14 + 5;
        const tilt = (rng() - 0.5) * 0.4;
        const opacity = rng() * 0.35 + 0.15;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
        ctx.fill();
    }

    return finalizeEquirectangularTexture(canvas, isMobile);
}

// 5. Tekstur Cincin Saturnus Strip Horizontal (256x8) untuk Radial UV Mapping
export function buildRingStripTexture(stops, noiseSeed, isMobile) {
    const width = 256;
    const height = 8;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rng = createRng(noiseSeed);

    const grad = ctx.createLinearGradient(0, 0, width, 0);
    stops.forEach(s => {
        grad.addColorStop(s.pos, s.color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Garis noise partikel es vertikal tipis
    const noiseCount = isMobile ? 35 : 70;
    for (let i = 0; i < noiseCount; i++) {
        const x = rng() * width;
        const alpha = (rng() * 0.25 + 0.05).toFixed(3);
        ctx.fillStyle = rng() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, 0, 1, height);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    textureRegistry.push(tex);
    return tex;
}

// 6. Tekstur Latar Galaksi Bima Sakti 360° Prosedural (Equirectangular)
export function buildGalaxyBackdropTexture(isMobile) {
    const width = isMobile ? 512 : 1024;
    const height = isMobile ? 256 : 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rng = createRng(9911);

    // Dasar ruang angkasa gelap dengan gradasi lembut di ekuator
    const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
    baseGrad.addColorStop(0, '#02040b');
    baseGrad.addColorStop(0.35, '#060d1f');
    baseGrad.addColorStop(0.65, '#060d1f');
    baseGrad.addColorStop(1, '#02040b');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // Pita galaksi Bima Sakti (Milky Way) bergelombang di tengah
    const bandY = (x) => height * 0.5 + Math.sin((x / width) * Math.PI * 2) * height * 0.06 + Math.cos((x / width) * Math.PI * 4) * height * 0.03;

    // Awan nebula radial beropasitas rendah
    const nebulaColors = ['#1d4ed8', '#312e81', '#581c87', '#0ea5e9'];
    const cloudCount = isMobile ? 120 : 240;
    for (let i = 0; i < cloudCount; i++) {
        const x = rng() * width;
        const y = bandY(x) + (rng() - 0.5) * height * 0.22;
        const rx = rng() * (isMobile ? 60 : 120) + 30;
        const ry = rng() * (isMobile ? 18 : 36) + 10;
        const color = nebulaColors[Math.floor(rng() * nebulaColors.length)];
        const opacity = (rng() * 0.06 + 0.03).toFixed(3);
        ctx.fillStyle = color;
        ctx.globalAlpha = parseFloat(opacity);
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, (rng() - 0.5) * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Guratan debu gelap tipis di inti pita
    ctx.globalAlpha = 1;
    const dustCount = isMobile ? 30 : 60;
    for (let i = 0; i < dustCount; i++) {
        const x = rng() * width;
        const y = bandY(x) + (rng() - 0.5) * height * 0.08;
        const rx = rng() * (isMobile ? 30 : 60) + 15;
        const ry = rng() * (isMobile ? 4 : 8) + 2;
        ctx.fillStyle = 'rgba(2, 4, 11, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, (rng() - 0.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Taburkan ~900 titik micro-stars latar belakang tipis
    const starCount = isMobile ? 450 : 900;
    for (let i = 0; i < starCount; i++) {
        const x = rng() * width;
        const y = rng() * height;
        // Lebih padat di sekitar pita galaksi
        const distToBand = Math.abs(y - bandY(x));
        const inBand = distToBand < height * 0.18;
        if (!inBand && rng() > 0.35) continue;

        const size = rng() > 0.9 ? 1.5 : 0.8;
        const opacity = (rng() * 0.5 + 0.2).toFixed(3);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = isMobile ? 2 : 4;
    tex.needsUpdate = true;
    textureRegistry.push(tex);
    return tex;
}

// Lepas semua tekstur WebGL saat unload untuk mencegah kebocoran memori
export function disposeAllTextures() {
    while (textureRegistry.length > 0) {
        const tex = textureRegistry.pop();
        if (tex && typeof tex.dispose === 'function') {
            tex.dispose();
        }
    }
}
