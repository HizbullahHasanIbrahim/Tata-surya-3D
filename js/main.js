/*
 * Tata Surya 3D Interaktif
 * Engine Three.js r160 - WebGL 2 dengan render 8 planet + Matahari
 * Komentar berbahasa Indonesia untuk logika 3D, matematika, dan kontrol kamera
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
    SIM_DAYS_PER_SECOND,
    ROTATION_RAD_PER_SIM_DAY,
    CELESTIAL_CONFIG
} from './data.js';
import {
    buildSunTexture,
    buildGlowTexture,
    buildPlanetTexture,
    buildEarthCloudsTexture,
    buildRingStripTexture,
    buildGalaxyBackdropTexture,
    disposeAllTextures
} from './textures.js';

// ============== WebGL Detection & Renderer Setup ==============
const canvas = document.querySelector('#solarCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

// PixelRatio adaptif: maks 1.5 pada mobile, 2 pada desktop
const isMobile = window.innerWidth < 768;
const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

// Check WebGL2 support
if (!renderer.capabilities.isWebGL2) {
    document.body.innerHTML = `
        <div class="status-overlay">
            <div class="status-content">
                <h2>Browser Anda tidak mendukung WebGL 2</h2>
                <p>Silakan gunakan browser modern seperti Chrome, Firefox, Edge, atau Safari terbaru.</p>
            </div>
        </div>
    `;
    throw new Error('WebGL not supported');
}

// ============== Scene Setup ==============
const scene = new THREE.Scene();

// ============== SkyDome Galaksi Bima Sakti 360° ==============
const galaxySkyDome = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 32, 20),
    new THREE.MeshBasicMaterial({
        map: buildGalaxyBackdropTexture(isMobile),
        side: THREE.BackSide,
        depthWrite: false
    })
);
galaxySkyDome.rotation.z = THREE.MathUtils.degToRad(28);
scene.add(galaxySkyDome);

// ============== Camera Setup ==============
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);

// Posisi kamera default di atas dan sedikit ke samping agar melihat seluruh sistem
// Neptunus orbitRadius ~118.5, jadi kamera harus agak jauh untuk melihat semuanya
const cameraDefaultDesktop = new THREE.Vector3(0, 68, 148);
const cameraDefaultMobile = new THREE.Vector3(0, 96, 198);
camera.position.copy(isMobile ? cameraDefaultMobile : cameraDefaultDesktop);

// ============== Orbit Controls ==============
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.0;
let minDist = isMobile ? 4.5 : 15;
controls.minDistance = minDist;
controls.maxDistance = 1200;

// Matikan damping otomatis saat pengguna memulai drag
let cameraAnimMode = null; // 'focus' | 'reset' | null
const _animToTarget = new THREE.Vector3();
const _animToCam = new THREE.Vector3();
let prevTargetPos = new THREE.Vector3();
controls.addEventListener('start', () => {
    cameraAnimMode = null;
});

// ============== CSS2D Renderer untuk Labels ==============
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-renderer';
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('app').appendChild(labelRenderer.domElement);

// ============== Lighting ==============
const ambientLight = new THREE.AmbientLight(0x415b86, 0.28);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xfff4e0, 2.8, 0, 0);
sunLight.decay = 0;
scene.add(sunLight);

// ============== Shared Geometry (Tanpa .clone()) ==============
const sharedGeometry = new THREE.SphereGeometry(1, 48, 32);
const sharedGeometryMobile = new THREE.SphereGeometry(1, 32, 16);

// ============== Starfield (GPU Shader) ==============
const starsCount = isMobile ? 2000 : 4000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starsCount * 3);
const starColors = new Float32Array(starsCount * 3);
const starSizes = new Float32Array(starsCount);
const starPhases = new Float32Array(starsCount);

const tiltRad = THREE.MathUtils.degToRad(28);
const cosTilt = Math.cos(tiltRad);
const sinTilt = Math.sin(tiltRad);

for (let i = 0; i < starsCount; i++) {
    const isBand = i >= Math.floor(starsCount * 0.65);
    let x, y, z;

    if (!isBand) {
        // 65% tersebar acak di bola radius 420-1050
        const r = 420 + Math.random() * 630;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi);
        z = r * Math.sin(phi) * Math.sin(theta);
    } else {
        // 35% terkonsentrasi di sepanjang pita galaksi yang sama (dimiringkan 28°)
        const r = 420 + Math.random() * 630;
        const theta = Math.random() * Math.PI * 2;
        const thickness = (Math.random() - 0.5) * (isMobile ? 80 : 140);
        const lx = r * Math.cos(theta);
        const ly = thickness;
        const lz = r * Math.sin(theta);
        // Rotasi 28° terhadap sumbu Z
        x = lx * cosTilt - ly * sinTilt;
        y = lx * sinTilt + ly * cosTilt;
        z = lz;
    }

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    // Variasi warna bintang
    const colorChoice = Math.random();
    if (colorChoice < 0.4) starColors.set([0.8, 0.85, 1.0], i * 3);      // Biru muda
    else if (colorChoice < 0.75) starColors.set([1.0, 0.95, 0.8], i * 3); // Krem hangat
    else starColors.set([0.9, 0.9, 0.95], i * 3);                       // Putih

    // Variasi ukuran: 3% bintang terang, sisanya tajam
    if (Math.random() < 0.03) {
        starSizes[i] = 4.5 + Math.random() * 3.5;
    } else {
        starSizes[i] = 1.4 + Math.random() * 1.8;
    }
    starPhases[i] = Math.random() * Math.PI * 2;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTwinkle;
        varying vec3 vColor;
        
        void main() {
            vColor = aColor;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(aSize * uPixelRatio * (420.0 / -mvPos.z), 1.4, 12.0);
            gl_Position = projectionMatrix * mvPos;
            vTwinkle = 0.7 + 0.3 * sin(uTime * 2.0 + aPhase * 10.0);
        }
    `,
    fragmentShader: `
        precision mediump float;
        varying float vTwinkle;
        varying vec3 vColor;
        
        void main() {
            float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
            if (distanceFromCenter > 0.5) discard;
            
            float alpha = smoothstep(0.5, 0.0, distanceFromCenter) * vTwinkle;
            gl_FragColor = vec4(vColor, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Daftar global untuk label dan hitbox (dibutuhkan sebelum sun dibuat)
const hitMeshes = [];
const labelObjects = [];
const clickableObjects = [];
const orbitLines = [];
const planets = [];

// ============== Sun Setup ==============
const sunConfig = CELESTIAL_CONFIG.sun;
const geomSun = new THREE.SphereGeometry(sunConfig.visualRadius, 64, 64);

const sunTexture = buildSunTexture(isMobile);
const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: new THREE.Color(sunConfig.swatch),
    emissiveMap: sunTexture,
    emissiveIntensity: 1.45,
    roughness: 1,
    metalness: 0
});

const sun = new THREE.Mesh(geomSun, sunMaterial);
sun.userData = {
    type: 'sun',
    ...sunConfig
};
scene.add(sun);

// Label 3D untuk Matahari (ditempelkan setelah sun dibuat)
const sunLabelDiv = document.createElement('div');
sunLabelDiv.className = 'planet-label';
sunLabelDiv.textContent = sunConfig.name;
sunLabelDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    focusOnObject(sun, sun.userData);
});
const sunLabel = new CSS2DObject(sunLabelDiv);
sunLabel.position.set(0, sunConfig.visualRadius + 1.35, 0);
sun.add(sunLabel);
labelObjects.push(sunLabel);

// 2 lapisan corona pulsing sprite
const createGlowLayer = (scale, opacity, c0, c1, c2) => {
    const texture = buildGlowTexture(c0, c1, c2, isMobile);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: opacity
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scale, scale, 1);
    return sprite;
};

sun.add(createGlowLayer(22, 0.8, 'rgba(255, 220, 100, 0.8)', 'rgba(255, 150, 0, 0.4)', 'rgba(255, 50, 0, 0)'));
sun.add(createGlowLayer(38, 0.34, 'rgba(255, 240, 180, 0.4)', 'rgba(255, 180, 50, 0.2)', 'rgba(130, 0, 0, 0)'));

// ============== Planet & Object Management ==============
let selectionHighlight = null;
const highlightGeom = new THREE.RingGeometry(1.2, 1.35, 32);
const highlightMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
});
selectionHighlight = new THREE.Mesh(highlightGeom, highlightMat);
selectionHighlight.visible = false;
scene.add(selectionHighlight);

// Tambahkan Matahari ke clickable
clickableObjects.push(sun);

// ============== Planet Creation Loop (filter sun) ==============
const planetConfigs = CELESTIAL_CONFIG.planets;

planetConfigs.forEach((config, index) => {
    // Orbit group: ditempatkan di koordinat orbit (sin/cos)
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Tilt group: kemiringan sumbu (axial tilt)
    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(config.axialTiltDeg || 0);
    orbitGroup.add(tiltGroup);

    // Pilih geometry berdasarkan device
    const geometry = window.innerWidth < 768 ? sharedGeometryMobile : sharedGeometry;
    
    // Buat tekstur planet
    const planetTexture = buildPlanetTexture(config.id, isMobile);
    
    // Materia planet utama
    const material = new THREE.MeshStandardMaterial({
        map: planetTexture,
        roughness: 0.8,
        metalness: 0.1
    });

    // Mesh planet di lokal (0,0,0) - pivot akan menangani posisi orbit
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(config.visualRadius);
    tiltGroup.add(mesh);

    // Atmosphere (BackSide + Additive blending untuk efek cahaya)
    if (config.atmosphere) {
        const atmoMat = new THREE.MeshBasicMaterial({
            color: config.atmosphere.color,
            transparent: true,
            opacity: config.atmosphere.opacity,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const atmoMesh = new THREE.Mesh(sharedGeometry, atmoMat);
        atmoMesh.scale.setScalar(config.visualRadius * config.atmosphere.scale);
        tiltGroup.add(atmoMesh);
    }

    // Cloud layer untuk Bumi
    let cloudMesh = null;
    if (config.hasClouds) {
        const cloudTex = buildEarthCloudsTexture(isMobile);
        const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        cloudMesh = new THREE.Mesh(sharedGeometry, cloudMat);
        cloudMesh.scale.setScalar(config.visualRadius * 1.01);
        tiltGroup.add(cloudMesh);
    }

    // Hitbox untuk objek yang bisa diklik (ukuran adaptif) - TAMBAHKAN KE ORBIT GROUP
    const hitRadius = Math.max(config.visualRadius * 1.6, 2.3);
    const hitGeom = new THREE.SphereGeometry(hitRadius, 16, 8);
    const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false
    });
    const hitMesh = new THREE.Mesh(hitGeom, hitMat);
    hitMesh.userData = { bodyData: config };
    hitMesh.position.set(0, 0, 0);
    orbitGroup.add(hitMesh); // PERBAIKAN: tambahkan ke orbitGroup
    clickableObjects.push(hitMesh);
    hitMeshes.push(hitMesh);

    // Label 3D CSS2D - TEMPELKAN KE ORBIT GROUP (bukan mesh)
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = config.name;
    // Tambahkan event listener click pada label
    labelDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        focusOnPlanet(config);
    });
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, config.visualRadius + 1.35, 0);
    orbitGroup.add(label); // PERBAIKAN: tambahkan ke orbitGroup
    labelObjects.push(label);

    // Orbit line
    const orbitCurve = new THREE.EllipseCurve(0, 0, config.orbitRadius, config.orbitRadius);
    const orbitPts = orbitCurve.getPoints(128);
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15
    });
    const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    orbitLine.rotation.x = Math.PI / 2;
    orbitLine.userData = { planet: config.id };
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    // Simpan referensi untuk animasi
    mesh.userData = { ...config, pivot: orbitGroup, mesh, tiltGroup, label, hitMesh };
    config.label = label;

    planets.push({
        config,
        orbitGroup,
        tiltGroup,
        mesh,
        cloudMesh,
        angle: config.initialAngle ?? (Math.random() * Math.PI * 2)
    });
});

// ============== Saturn Rings (3 lapis C/B/A dengan UV radial remap) ==============
const saturn = planets.find(p => p.config.id === 'saturn');
if (saturn) {
    const s = saturn.config.visualRadius;
    // Setiap cincin punya stops unik
    const ringLayers = [
        { 
            inner: s * 1.24, outer: s * 1.49, opacity: 0.4, name: 'C',
            stops: [
                { pos: 0.00, color: 'rgba(0,0,0,0)' },
                { pos: 0.10, color: 'rgba(160, 140, 100, 0.3)' },
                { pos: 0.30, color: 'rgba(200, 180, 140, 0.6)' },
                { pos: 0.50, color: 'rgba(120, 100, 70, 0.7)' },
                { pos: 0.52, color: 'rgba(10, 10, 10, 0.05)' },
                { pos: 0.55, color: 'rgba(180, 160, 120, 0.6)' },
                { pos: 0.80, color: 'rgba(150, 130, 90, 0.4)' },
                { pos: 1.00, color: 'rgba(0,0,0,0)' }
            ]
        },
        { 
            inner: s * 1.52, outer: s * 1.98, opacity: 0.75, name: 'B',
            stops: [
                { pos: 0.00, color: 'rgba(0,0,0,0)' },
                { pos: 0.05, color: 'rgba(220, 200, 160, 0.5)' },
                { pos: 0.25, color: 'rgba(240, 220, 180, 0.9)' },
                { pos: 0.50, color: 'rgba(180, 160, 120, 0.95)' },
                { pos: 0.52, color: 'rgba(5, 5, 5, 0.02)' }, // Cassini division
                { pos: 0.55, color: 'rgba(200, 180, 140, 0.9)' },
                { pos: 0.80, color: 'rgba(200, 180, 140, 0.7)' },
                { pos: 1.00, color: 'rgba(0,0,0,0)' }
            ]
        },
        { 
            inner: s * 2.08, outer: s * 2.42, opacity: 0.55, name: 'A',
            stops: [
                { pos: 0.00, color: 'rgba(0,0,0,0)' },
                { pos: 0.10, color: 'rgba(180, 160, 120, 0.5)' },
                { pos: 0.35, color: 'rgba(200, 180, 140, 0.8)' },
                { pos: 0.50, color: 'rgba(150, 130, 90, 0.85)' },
                { pos: 0.60, color: 'rgba(10, 10, 10, 0.08)' },
                { pos: 0.70, color: 'rgba(170, 150, 110, 0.6)' },
                { pos: 0.90, color: 'rgba(130, 110, 70, 0.4)' },
                { pos: 1.00, color: 'rgba(0,0,0,0)' }
            ]
        }
    ];

    ringLayers.forEach(layer => {
        const ringGeom = new THREE.RingGeometry(layer.inner, layer.outer, 64);
        
        // Radial UV remapping: jarak dari pusat ke sudut = u
        const posAttr = ringGeom.attributes.position;
        const uvAttr = ringGeom.attributes.uv;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const r = Math.sqrt(x * x + y * y);
            const u = (r - layer.inner) / (layer.outer - layer.inner);
            uvAttr.setXY(i, u, 0.5);
        }

        const ringTex = buildRingStripTexture(layer.stops, 7701 + layer.name.charCodeAt(0), isMobile);

        const ringMat = new THREE.MeshBasicMaterial({
            map: ringTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: layer.opacity,
            depthWrite: false
        });

        const saturnRing = new THREE.Mesh(ringGeom, ringMat);
        saturnRing.rotation.x = Math.PI / 2;
        saturn.tiltGroup.add(saturnRing); // PERBAIKAN: tambahkan ke tiltGroup
    });
}

// ============== Uranus Rings (2 lapis tipis) ==============
const uranus = planets.find(p => p.config.id === 'uranus');
if (uranus) {
    const u = uranus.config.visualRadius;
    const uranusRings = [
        { inner: u * 1.42, outer: u * 1.52, opacity: 0.3 },
        { inner: u * 1.58, outer: u * 1.66, opacity: 0.25 }
    ];

    uranusRings.forEach((r, idx) => {
        const ringGeom = new THREE.RingGeometry(r.inner, r.outer, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: r.opacity,
            depthWrite: false
        });
        const uRing = new THREE.Mesh(ringGeom, ringMat);
        uRing.rotation.x = Math.PI / 2;
        uranus.tiltGroup.add(uRing); // PERBAIKAN: tambahkan ke tiltGroup
    });
}

// ============== Earth Moon Setup ==============
const earth = planets.find(p => p.config.id === 'earth');
let moonPivot = null;
let moon = null;
let moonAngle = 0;

if (earth) {
    // moonOrbitPlane miring 5.14° di dalam Earth's orbitGroup
    const m = earth.config.moon;
    
    moonPivot = new THREE.Group();
    moonPivot.rotation.z = THREE.MathUtils.degToRad(m.inclinationDeg);
    earth.orbitGroup.add(moonPivot);

    // Moon mesh
    const moonGeom = new THREE.SphereGeometry(m.radius, 32, 16);
    const moonMat = new THREE.MeshStandardMaterial({
        map: buildPlanetTexture('moon', isMobile),
        roughness: 1,
        metalness: 0
    });
    moon = new THREE.Mesh(moonGeom, moonMat);
    moon.scale.setScalar(1);
    
    moon.userData = {
        type: 'moon',
        ...earth.config.moon,
        visualRadius: m.radius,
        orbitRadius: m.orbitRadius,
        orbitalPeriodDays: m.orbitalPeriodDays
    };
    moonPivot.add(moon);
    clickableObjects.push(moon);

    // Moon orbit line - PASANG KE MOON PIVOT DENGAN ROTASI DATAR
    const moonOrbitCurve = new THREE.EllipseCurve(0, 0, m.orbitRadius, m.orbitRadius);
    const moonOrbitPts = moonOrbitCurve.getPoints(64);
    const moonOrbitGeom = new THREE.BufferGeometry().setFromPoints(moonOrbitPts);
    const moonOrbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    const moonOrbitLine = new THREE.Line(moonOrbitGeom, moonOrbitMat);
    moonOrbitLine.rotation.x = Math.PI / 2; // PERBAIKAN: hanya rotasi datar, TAMBAH TILT LAGI
    moonPivot.add(moonOrbitLine); // PERBAIKAN: tambahkan ke moonPivot
    orbitLines.push(moonOrbitLine);
}

// ============== SET POSISI AWAL PLANET DAN BULAN ==============
planets.forEach(item => {
    const ax = Math.cos(item.angle) * item.config.orbitRadius;
    const az = Math.sin(item.angle) * item.config.orbitRadius;
    item.orbitGroup.position.set(ax, 0, az);
});

if (moon && moonPivot) {
    const mConfig = earth.config.moon;
    const mx = Math.cos(moonAngle) * mConfig.orbitRadius;
    const mz = Math.sin(moonAngle) * mConfig.orbitRadius;
    moon.position.set(mx, 0, mz);
}

// ============== Interaksi & State Management ==============
let focusedTarget = null;
let timeScale = 1;
let isPaused = false;
let activePointers = new Set();
let hadMultiTouch = false;
let pointerDownPos = { x: 0, y: 0 };
let showLabels = true;
let showOrbits = true;
let dockCollapsed = false;
let simDays = 0;

const infoPanel = document.getElementById('info-panel');
const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-value');
const speedDisplayMobile = document.getElementById('speed-value-mobile');
const simClock = document.getElementById('sim-clock');
const simClockMobile = document.getElementById('sim-clock-mobile');
const playPauseBtn = document.getElementById('btn-play');
const pauseBtn = document.getElementById('btn-pause');
const resetTimeBtn = document.getElementById('btn-reset-time');
const toggleLabelBtn = document.getElementById('btn-toggle-labels');
const toggleOrbitBtn = document.getElementById('btn-toggle-orbits');
const resetViewBtn = document.getElementById('btn-reset-view');
const dockToggleBtn = document.getElementById('btn-dock-toggle');
const closePanelBtn = document.getElementById('btn-close-panel');
const interactionHint = document.getElementById('interaction-hint');

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Simulation clock
const clock = new THREE.Clock();

// Vektor kerja untuk hindari alokasi di animate()
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _idealPos = new THREE.Vector3();
const _delta = new THREE.Vector3();

// ============== Event Handlers ==============

canvas.addEventListener('pointerdown', e => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1) hadMultiTouch = true;
    pointerDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', e => {
    if (activePointers.size === 1 && !hadMultiTouch) {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist < 6) handlePlanetClick(e);
    }
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) hadMultiTouch = false;
});

canvas.addEventListener('pointercancel', e => {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) hadMultiTouch = false;
});

canvas.addEventListener('pointermove', e => {
    if (activePointers.size === 0) {
        mouse.x = (e.clientX / canvas.clientWidth) * 2 - 1;
        mouse.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, false);
        
        if (intersects.length > 0) {
            canvas.style.cursor = 'pointer';
            // Sorot garis orbit saat hover
            const hoveredObj = intersects[0].object;
            const hoveredData = hoveredObj.userData;
            const hoveredPlanetId = hoveredData.bodyData?.id || (hoveredData.type === 'sun' ? 'sun' : null);
            orbitLines.forEach(line => {
                const isFocused = focusedTarget && (focusedTarget.userData?.id === line.userData?.planet);
                if (isFocused) {
                    line.material.color.setHex(0x38bdf8);
                    line.material.opacity = 0.6;
                } else if (hoveredPlanetId && line.userData?.planet === hoveredPlanetId) {
                    line.material.color.setHex(0x7dd3fc);
                    line.material.opacity = 0.4;
                } else {
                    line.material.color.setHex(0xffffff);
                    line.material.opacity = 0.15;
                }
            });
        } else {
            canvas.style.cursor = 'default';
            // Reset orbit warna jika tidak hover pada apapun
            orbitLines.forEach(line => {
                const isFocused = focusedTarget && (focusedTarget.userData?.id === line.userData?.planet);
                line.material.color.setHex(isFocused ? 0x38bdf8 : 0xffffff);
                line.material.opacity = isFocused ? 0.6 : 0.15;
            });
        }
    }
});

// ============== Click & Focus Handlers ==============
function handlePlanetClick(event) {
    mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const data = obj.userData;
        
        if (data.type === 'sun') {
            focusOnObject(sun, sun.userData);
        } else if (data.id === 'moon') {
            focusOnObject(moon, moon.userData);
        } else if (data.bodyData) {
            focusOnPlanet(data.bodyData);
        }
    } else {
        closeInfoPanel();
    }
}

function focusOnObject(target, data) {
    focusedTarget = target;
    prevTargetPos.setFromMatrixPosition(target.matrixWorld);
    cameraAnimMode = 'focus';
    minDist = Math.max((data.visualRadius || data.size) * 2.2, 4.5);
    controls.minDistance = minDist;
    
    // Extent & Highlight 3D ring di posisi objek
    const extent = data.id === 'saturn' ? (data.visualRadius * 2.42) : (data.id === 'uranus' ? (data.visualRadius * 1.66) : (data.visualRadius || data.size || 5));
    if (selectionHighlight) {
        selectionHighlight.scale.setScalar(extent);
        selectionHighlight.position.copy(prevTargetPos);
        selectionHighlight.visible = true;
    }
    
    // Sorot warna garis orbit
    orbitLines.forEach(line => {
        if (line.userData && line.userData.planet === data.id) {
            line.material.color.setHex(0x38bdf8);
            line.material.opacity = 0.6;
        } else {
            line.material.color.setHex(0xffffff);
            line.material.opacity = 0.15;
        }
    });

    // Hitung arah kamera saat ini
    _v2.subVectors(camera.position, prevTargetPos).normalize();
    _v2.y = Math.max(_v2.y, 0.28);
    _v2.normalize();

    _animToTarget.copy(prevTargetPos);
    _animToCam.copy(prevTargetPos).addScaledVector(_v2, Math.max(extent * 4.5, 13.5));

    showPlanetChip(data.id);
    updateInfoPanel(data);
}

function focusOnPlanet(planetConfig) {
    const planet = planets.find(p => p.config.id === planetConfig.id);
    if (planet) {
        focusOnObject(planet.mesh, planet.config);
    }
}

// ============== Info Panel ==============
function updateInfoPanel(data) {
    document.getElementById('panel-order').textContent = data.orderText || '';
    document.getElementById('panel-name').textContent = data.name;
    document.getElementById('panel-desc').textContent = data.description || '';
    document.getElementById('spec-diameter').textContent = data.diameterText || '-';
    document.getElementById('spec-distance').textContent = data.distanceText || '-';
    document.getElementById('spec-revolution').textContent = data.revolutionText || '-';
    document.getElementById('spec-rotation').textContent = data.rotationText || '-';
    document.getElementById('spec-tilt').textContent = data.tiltText || '-';
    
    // Features list
    const featuresList = document.getElementById('features-list');
    featuresList.innerHTML = '';
    if (data.characteristics) {
        const features = data.characteristics.split(/[.,]|\s+dan\s+/).filter(f => f.trim());
        features.forEach(f => {
            if (f.trim()) {
                const li = document.createElement('li');
                li.textContent = f.trim();
                featuresList.appendChild(li);
            }
        });
    }
    
    // Swatch color
    document.getElementById('panel-swatch').style.background = data.swatch + 'ff';
    
    infoPanel.classList.remove('hidden');
}

function closeInfoPanel() {
    infoPanel.classList.add('hidden');
    focusedTarget = null;
    cameraAnimMode = null;
    
    // Reset highlight dan orbit colors
    if (selectionHighlight) {
        selectionHighlight.visible = false;
    }
    orbitLines.forEach(line => {
        line.material.color.setHex(0xffffff);
        line.material.opacity = 0.15;
    });

    // Hapus is-selected dari chip & label
    document.querySelectorAll('.planet-chip').forEach(c => c.classList.remove('is-selected'));
    document.querySelectorAll('.planet-label').forEach(l => l.classList.remove('is-selected'));
}

// ============== Button Handler ==============
closePanelBtn.addEventListener('click', closeInfoPanel);

resetViewBtn.addEventListener('click', () => {
    closeInfoPanel();
    focusedTarget = null;
    minDist = isMobile ? 4.5 : 15;
    controls.minDistance = minDist;
    _animToTarget.set(0, 0, 0);
    _animToCam.copy(window.innerWidth < window.innerHeight ? cameraDefaultMobile : cameraDefaultDesktop);
    cameraAnimMode = 'reset';
});

playPauseBtn.addEventListener('click', () => {
    if (timeScale === 0) {
        timeScale = 1;
        speedSlider.value = 1;
        updateSpeedDisplay(1);
    }
    isPaused = !isPaused;
    playPauseBtn.classList.toggle('is-active', !isPaused);
    pauseBtn.classList.toggle('is-active', isPaused);
});

pauseBtn.addEventListener('click', () => {
    isPaused = true;
    playPauseBtn.classList.remove('is-active');
    pauseBtn.classList.add('is-active');
});

speedSlider.addEventListener('input', e => {
    timeScale = parseFloat(e.target.value);
    updateSpeedDisplay(timeScale);
    
    if (timeScale === 0 && !isPaused) {
        isPaused = true;
        playPauseBtn.style.opacity = 0.5;
        pauseBtn.style.opacity = 1;
    } else if (timeScale > 0 && isPaused) {
        isPaused = false;
        playPauseBtn.style.opacity = 1;
        pauseBtn.style.opacity = 0.5;
    }
});

resetTimeBtn.addEventListener('click', () => {
    clock.elapsedTime = 0;
    clock.start();
    simDays = 0;
    updateSimClock(0, 0);

    // Reset posisi sudut orbit ke awal
    planets.forEach(item => {
        item.angle = item.config.initialAngle ?? 0;
        const ax = Math.cos(item.angle) * item.config.orbitRadius;
        const az = Math.sin(item.angle) * item.config.orbitRadius;
        item.orbitGroup.position.set(ax, 0, az);
        item.mesh.rotation.y = 0;
        if (item.cloudMesh) item.cloudMesh.rotation.y = 0;
    });

    if (moon && moonPivot) {
        moonAngle = 0;
        const mConfig = earth.config.moon;
        const mx = Math.cos(moonAngle) * mConfig.orbitRadius;
        const mz = Math.sin(moonAngle) * mConfig.orbitRadius;
        moon.position.set(mx, 0, mz);
    }

    sun.rotation.y = 0;
    isPaused = false;
    timeScale = parseFloat(speedSlider.value) || 1;
    playPauseBtn.style.opacity = 1;
    pauseBtn.style.opacity = 0.5;
});

toggleLabelBtn.addEventListener('click', () => {
    showLabels = !showLabels;
    labelObjects.forEach(obj => { obj.visible = showLabels; });
    toggleLabelBtn.style.opacity = showLabels ? 1 : 0.5;
    toggleLabelBtn.classList.toggle('is-active', showLabels);
});

toggleOrbitBtn.addEventListener('click', () => {
    showOrbits = !showOrbits;
    orbitLines.forEach(line => {
        line.visible = showOrbits;
    });
    toggleOrbitBtn.style.opacity = showOrbits ? 1 : 0.5;
    toggleOrbitBtn.classList.toggle('is-active', showOrbits);
});

dockToggleBtn.addEventListener('click', () => {
    dockCollapsed = !dockCollapsed;
    document.getElementById('time-dock').classList.toggle('is-collapsed', dockCollapsed);
    dockToggleBtn.style.opacity = dockCollapsed ? 0.5 : 1;
});

// ============== Keyboard Shortcuts ==============
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        playPauseBtn.click();
    } else if (e.code === 'Escape') {
        closeInfoPanel();
    } else if (e.code === 'KeyR') {
        resetViewBtn.click();
    }
});

// ============== UI Initialization (Tanpa DOMContentLoaded) ==============
toggleLabelBtn.style.opacity = '1';
toggleOrbitBtn.style.opacity = '1';
pauseBtn.style.opacity = '0.5';
updateSpeedDisplay(1);

// Build planet strip
const planetStrip = document.getElementById('planet-strip');
const colors = {
    sun: '#ffaa00', mercury: '#a8a29e', venus: '#fbbf24', earth: '#38bdf8',
    mars: '#f87171', jupiter: '#fb923c', saturn: '#fde047',
    uranus: '#67e8f9', neptune: '#60a5fa'
};
const names = {
    sun: 'Matahari', mercury: 'Merkurius', venus: 'Venus', earth: 'Bumi',
    mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturnus',
    uranus: 'Uranus', neptune: 'Neptunus'
};

['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].forEach(id => {
    const chip = document.createElement('div');
    chip.className = 'planet-chip';
    chip.setAttribute('data-planet', id);
    
    const dot = document.createElement('div');
    dot.className = 'chip-dot';
    dot.style.background = colors[id];
    
    const span = document.createElement('span');
    span.textContent = names[id];
    
    chip.appendChild(dot);
    chip.appendChild(span);
    planetStrip.appendChild(chip);
    
    chip.addEventListener('click', () => {
        if (id === 'sun') {
            focusOnObject(sun, sun.userData);
        } else {
            const planet = planets.find(p => p.config.id === id);
            if (planet) focusOnObject(planet.mesh, planet.config);
        }
    });
});

function showPlanetChip(id) {
    document.querySelectorAll('.planet-chip').forEach(c => {
        c.classList.toggle('is-selected', c.getAttribute('data-planet') === id);
    });
    document.querySelectorAll('.planet-label').forEach(l => {
        const isMatch = l.textContent.toLowerCase() === (id === 'sun' ? 'matahari' : id.toLowerCase());
        l.classList.toggle('is-selected', isMatch);
    });
}

function updateSpeedDisplay(val) {
    speedDisplay.textContent = val === 0 ? '0.0x' : val.toFixed(1) + 'x';
    speedDisplayMobile.textContent = val === 0 ? '0.0x' : val.toFixed(1) + 'x';
    speedSlider.value = val;
    // Update CSS variable for slider gradient
    const pct = (val / 10) * 100;
    speedSlider.style.setProperty('--slider-pct', `${pct}%`);
}

function updateSimClock(day, year) {
    simClock.textContent = `Hari ke-${day} (Tahun ke-${year.toFixed(2)})`;
    simClockMobile.textContent = `Hari ke-${day}`;
}

// ============== Animation Loop ==============
let animFrameId = null;
let firstFrameRendered = false;

function animate() {
    animFrameId = requestAnimationFrame(animate);
    
    // rawDelta untuk kamera & twinkle bintang (frame-rate independen)
    const rawDelta = Math.min(clock.getDelta(), 0.1);
    
    // deltaSimDays untuk simulasi orbit & rotasi
    const deltaSimDays = isPaused ? 0 : rawDelta * SIM_DAYS_PER_SECOND * timeScale;
    
    // Update sim clock
    if (!isPaused) {
        simDays += deltaSimDays;
        const year = simDays / 365.25;
        const day = Math.floor(simDays % 365.25);
        updateSimClock(day, year);
    }
    
    // Update star twinkling
    starMaterial.uniforms.uTime.value += rawDelta;
    
    // Sembunyikan hint setelah interaksi pertama (hanya sekali)
    if (interactionHint && !interactionHint.classList.contains('hidden') && activePointers.size > 0) {
        interactionHint.classList.add('fade-out');
        setTimeout(() => interactionHint.classList.add('hidden'), 350);
    }
    
    // Animate planets (orbit & rotation)
    planets.forEach(item => {
        if (!isPaused && timeScale > 0) {
            item.angle += item.config.orbitalRadPerDay * deltaSimDays;
            
            // Posisi orbit: trigonometri dasar
            const ax = Math.cos(item.angle) * item.config.orbitRadius;
            const az = Math.sin(item.angle) * item.config.orbitRadius;
            item.orbitGroup.position.set(ax, 0, az);
            
            // Rotasi planet (model space lokal)
            item.mesh.rotation.y += item.config.rotationRadPerDay * deltaSimDays;
            
            // Rotasi cloud layer (lebih cepat dari planet)
            if (item.cloudMesh) {
                item.cloudMesh.rotation.y += item.config.rotationRadPerDay * deltaSimDays * 1.5;
            }
        }
    });
    
    // Animate Moon orbit di dalam Earth's orbitGroup
    if (moon && moonPivot && !isPaused && timeScale > 0) {
        const mConfig = earth.config.moon;
        moonAngle += mConfig.orbitalRadPerDay * deltaSimDays;
        
        // Moon position relative to moonPivot (5.14° inclination)
        const mx = Math.cos(moonAngle) * mConfig.orbitRadius;
        const mz = Math.sin(moonAngle) * mConfig.orbitRadius;
        moon.position.set(mx, 0, mz);
    }
    
    // Sun rotation (slow)
    if (!isPaused && timeScale > 0) {
        sun.rotation.y += sunConfig.rotationRadPerDay * deltaSimDays;
    }
    
    // Camera follow & transition logic
    if (focusedTarget) {
        focusedTarget.getWorldPosition(_v1);

        // PERBAIKAN: Hitung delta posisi target dan tambahkan ke kamera
        _delta.subVectors(_v1, prevTargetPos);
        camera.position.add(_delta);
        controls.target.add(_delta);
        if (cameraAnimMode === 'focus') {
            _animToTarget.add(_delta);
            _animToCam.add(_delta);
        }
        prevTargetPos.copy(_v1);

        // Update highlight mengikuti objek
        if (selectionHighlight && selectionHighlight.visible) {
            selectionHighlight.position.copy(_v1);
            selectionHighlight.quaternion.copy(camera.quaternion);
        }

        if (cameraAnimMode !== null) {
            const alpha = 1 - Math.exp(-rawDelta * 6.0);
            camera.position.lerp(_animToCam, alpha);
            controls.target.lerp(_animToTarget, alpha);

            if (camera.position.distanceTo(_animToCam) < 0.15 && controls.target.distanceTo(_animToTarget) < 0.15) {
                cameraAnimMode = null;
            }
        }
    } else if (cameraAnimMode === 'reset') {
        const alpha = 1 - Math.exp(-rawDelta * 6.0);
        camera.position.lerp(_animToCam, alpha);
        controls.target.lerp(_animToTarget, alpha);

        if (camera.position.distanceTo(_animToCam) < 0.15 && controls.target.distanceTo(_animToTarget) < 0.15) {
            cameraAnimMode = null;
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    // Hide loading overlay after first frame
    if (!firstFrameRendered) {
        firstFrameRendered = true;
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

// ============== Window Handlers ==============
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
    
    // Update pixelRatio
    const newMobile = width < 768;
    const newRatio = Math.min(window.devicePixelRatio, newMobile ? 1.5 : 2);
    renderer.setPixelRatio(newRatio);

    // Perbarui uPixelRatio shader bintang
    if (starMaterial && starMaterial.uniforms && starMaterial.uniforms.uPixelRatio) {
        starMaterial.uniforms.uPixelRatio.value = newRatio;
    }
});

// Visibility change untuk hemat baterai
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clock.stop();
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    } else {
        clock.start();
        if (!animFrameId) {
            animate();
        }
    }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    renderer.dispose();
    labelRenderer.domElement.remove();
    disposeAllTextures();
});

// ============== Start Animation ==============
animate();