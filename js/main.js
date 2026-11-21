import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANET_DATA, MOON_DATA } from './data.js';
import { createTexture, createRingTexture, createMoonTexture } from './textures.js';

// Scene setup
const canvas = document.querySelector('#solarCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Check WebGL support
if (!renderer.capabilities.isWebGL2) {
    document.body.innerHTML = '<div class="no-webgl">Browser Anda tidak mendukung WebGL. Silakan gunakan browser modern.</div>';
    throw new Error('WebGL not supported');
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.copy(new THREE.Vector3(0, 200, 400));

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.0;
controls.minDistance = 15;
controls.maxDistance = 800;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
sunLight.decay = 0;
scene.add(sunLight);

// Planet geometry cache (shared unit sphere)
const sharedGeometry = new THREE.SphereGeometry(1, 64, 32);
const sharedGeometryMobile = new THREE.SphereGeometry(1, 32, 16);

// Planet data with accurate astronomical constants
const planetConfigs = PLANET_DATA.map(data => ({
    ...data,
    size: data.size,
    orbitRadius: data.orbitRadius,
    speed: data.speed,
    rotationSpeed: data.rotationSpeed,
    texture: data.texture
}));

// Stars with twinkling shader
const starsCount = window.innerWidth < 768 ? 2000 : 4000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const starSizes = [];
const starPhases = [];

for (let i = 0; i < starsCount; i++) {
    const r = 500 + Math.random() * 2000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
    starSizes.push(Math.random() * 1.5 + 0.5);
    starPhases.push(Math.random() * Math.PI * 2);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
starGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(starPhases, 1));

const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float uTime;
        varying float vTwinkle;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            
            // Twinkling effect
            vTwinkle = 0.7 + 0.3 * sin(uTime * 2.0 + phase * 10.0);
        }
    `,
    fragmentShader: `
        precision mediump float;
        uniform vec4 uColor;
        varying float vTwinkle;
        
        void main() {
            float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
            if (distanceFromCenter > 0.5) discard;
            
            float alpha = smoothstep(0.5, 0.0, distanceFromCenter) * vTwinkle;
            gl_FragColor = vec4(uColor.rgb, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Sun
const sunGeometry = new THREE.SphereGeometry(12, 64, 64);
const sunMaterial = new THREE.MeshStandardMaterial({
    map: createTexture('#FFCC00', 'sun'),
    emissive: new THREE.Color('#FF9900'),
    emissiveIntensity: 1.5,
    roughness: 1,
    metalness: 0
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.userData = {
    type: 'sun',
    name: 'Matahari',
    tagline: 'Pusat Tata Surya',
    desc: 'Bintang deret utama tipe G yang mencakup 99,86% dari seluruh massa Tata Surya.',
    diameter: '1.392.700 km',
    distance: '0 km',
    orbitPeriod: '-',
    rotationPeriod: '27 Hari',
    fact: 'Suhu di inti Matahari mencapai 15 juta derajat Celsius.',
    color: '#FFCC00',
    size: 14,
    orbitRadius: 0,
    speed: 0,
    tilt: 7.25,
    rotationSpeed: 0.05
};
scene.add(sun);

// Sun glow layers
const createGlowLayer = (scale, opacity) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(255, 220, 100, ${opacity})`);
    grad.addColorStop(0.5, `rgba(255, 150, 0, ${opacity * 0.5})`);
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
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

sun.add(createGlowLayer(45, 0.8));
sun.add(createGlowLayer(60, 0.4));

// Planets and Moon
const clickableObjects = [];
const planets = [];
clickableObjects.push(sun);

planetConfigs.forEach((config, index) => {
    const pivot = new THREE.Group();
    scene.add(pivot);
    
    // Orbit path visualization
    const orbitCurve = new THREE.EllipseCurve(0, 0, config.orbitRadius, config.orbitRadius);
    const orbitPoints = orbitCurve.getPoints(128);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15
    });
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);
    
    // Tilt group for axial tilt
    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(config.tilt || 0);
    pivot.add(tiltGroup);
    
    // Create planet mesh
    const geometry = window.innerWidth < 768 ? sharedGeometryMobile.clone() : sharedGeometry.clone();
    const material = new THREE.MeshStandardMaterial({
        map: createTexture(config.color, config.texture, index * 100 + 42),
        roughness: 0.8,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(config.orbitRadius, 0, 0);
    tiltGroup.add(mesh);
    
    // Add atmosphere for Earth and Venus
    if (config.hasAtmosphere && config.atmosphereColor) {
        const atmosGeometry = new THREE.SphereGeometry(config.size * 1.02, 32, 16);
        const atmosMaterial = new THREE.MeshBasicMaterial({
            color: config.atmosphereColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
        mesh.add(atmosMesh);
    }
    
    // Cloud layer for Earth
    if (config.hasClouds) {
        const cloudGeometry = new THREE.SphereGeometry(config.size * 1.01, 32, 16);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: createTexture('#FFFFFF', 'cloudy', index * 100 + 100),
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudMesh.position.set(config.orbitRadius, 0, 0);
        pivot.add(cloudMesh);
        
        // Store reference for animation
        config.cloudMesh = cloudMesh;
    }
    
    // Saturn rings (multiple layers)
    if (config.hasRings) {
        const ringData = [
            { inner: config.size * 1.4, outer: config.size * 1.8, opacity: 0.4 },
            { inner: config.size * 1.9, outer: config.size * 2.3, opacity: 0.7 },
            { inner: config.size * 2.4, outer: config.size * 2.8, opacity: 0.5 }
        ];
        
        ringData.forEach(ringConfig => {
            const ringGeometry = new THREE.RingGeometry(ringConfig.inner, ringConfig.outer, 64);
            const ringMaterial = new THREE.MeshStandardMaterial({
                map: createRingTexture(),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: ringConfig.opacity
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        });
    }
    
    // Uranus rings (thin)
    if (config.hasUranusRings) {
        const ringGeometry = new THREE.RingGeometry(config.size * 1.3, config.size * 1.6, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x88AAFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }
    
    // Hitbox for small planets
    if (config.size < 1.5) {
        const hitboxGeometry = new THREE.SphereGeometry(config.size * 2.5, 16, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        mesh.add(hitbox);
        clickableObjects.push(hitbox);
    }
    
    // Make the main mesh clickable
    mesh.userData = { ...config, pivot, isPlanet: true };
    clickableObjects.push(mesh);
    
    pivot.userData = { ...config, mesh };
    planets.push({ pivot, mesh, config, angle: Math.random() * Math.PI * 2 });
});

// Earth's Moon
const earthPlanet = planets.find(p => p.config.id === 'earth');
if (earthPlanet) {
    const moonPivot = new THREE.Group();
    earthPlanet.mesh.add(moonPivot);
    
    const moonGeometry = new THREE.SphereGeometry(MOON_DATA.size, 32, 16);
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: createMoonTexture(),
        roughness: 1,
        metalness: 0
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(MOON_DATA.orbitRadius, 0, 0);
    moon.userData = {
        type: 'moon',
        name: 'Bulan',
        tagline: 'Satelit Alami Bumi',
        desc: 'Satelit alami terbesar kelima di Tata Surya, mengorbit Bumi pada jarak rata-rata 384.400 km.',
        diameter: '3.474 km',
        distance: '384.400 km dari Bumi',
        orbitPeriod: '27,3 Hari',
        rotationPeriod: '27,3 Hari (Tidal Lock)',
        fact: 'Bulan selalu menunjukkan sisi yang sama ke Bumi karena tidal locking.',
        size: MOON_DATA.size,
        hasTidalLock: true
    };
    clickableObjects.push(moon);
    
    // Moon orbit line
    const moonOrbitCurve = new THREE.EllipseCurve(0, 0, MOON_DATA.orbitRadius, MOON_DATA.orbitRadius);
    const moonOrbitPoints = moonOrbitCurve.getPoints(64);
    const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
    const moonOrbitMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    const moonOrbit = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
    moonOrbit.rotation.x = Math.PI / 2 + THREE.MathUtils.degToRad(MOON_DATA.tilt);
    earthPlanet.mesh.add(moonOrbit);
    
    const moonConfig = {
        pivot: moonPivot,
        mesh: moon,
        config: MOON_DATA,
        angle: 0
    };
}

// Interaction state
let focusedTarget = null;
let prevTargetPos = new THREE.Vector3();
let isTransitioning = false;
// Interaction state
let pointerDownPos = { x: 0, y: 0 };
let focusedTarget = null;
let focusedData = null;
let prevTargetPos = new THREE.Vector3();
let isTransitioning = false;
let timeScale = 1;
let isPaused = false;
let activePointers = new Set();
let hadMultiTouch = false;
let showLabels = false;
let showOrbits = true;

// UI elements
const infoPanel = document.getElementById('infoPanel');
const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetCamBtn = document.getElementById('resetCamBtn');
const toggleLabelBtn = document.getElementById('toggleLabelBtn');
const toggleOrbitBtn = document.getElementById('toggleOrbitBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const hud = document.getElementById('hud');

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event handlers
canvas.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1) hadMultiTouch = true;
    
    pointerDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', (e) => {
    if (activePointers.size === 1 && !hadMultiTouch) {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist < 6) {
            handlePlanetClick(e);
        }
    }
    
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) hadMultiTouch = false;
});

canvas.addEventListener('pointercancel', (e) => {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) hadMultiTouch = false;
});

canvas.addEventListener('pointermove', (e) => {
    if (activePointers.size === 0) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, false);
        canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }
});

function handlePlanetClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const data = obj.userData;
        
        if (data.type === 'sun') {
            focusOnSun(data);
        } else if (data.pivot) {
            focusOnPlanet(data.pivot, data);
        }
    } else {
        closeInfoPanel();
    }
}

function focusOnSun(data) {
    focusedTarget = sun;
    focusedData = data;
    isTransitioning = true;
    sun.getWorldPosition(prevTargetPos);
    
    updateInfoPanel(data);
}

function focusOnPlanet(target, data) {
    focusedTarget = target;
    focusedData = data;
    isTransitioning = true;
    target.getWorldPosition(prevTargetPos);
    
    updateInfoPanel(data);
}

function updateInfoPanel(data) {
    document.getElementById('planetName').textContent = data.name;
    document.getElementById('planetTagline').textContent = data.tagline || '';
    document.getElementById('planetDesc').textContent = data.desc;
    document.getElementById('dataDiameter').textContent = data.diameter || '-';
    document.getElementById('dataDistance').textContent = data.distance || '-';
    document.getElementById('dataOrbit').textContent = data.orbitPeriod || '-';
    document.getElementById('planetFact').textContent = data.fact;
    
    infoPanel.classList.remove('hidden');
}

function closeInfoPanel() {
    infoPanel.classList.add('hidden');
    focusedTarget = null;
}

// Button handlers
document.getElementById('closeBtn').addEventListener('click', closeInfoPanel);
resetCamBtn.addEventListener('click', () => {
    closeInfoPanel();
    focusedTarget = null;
    isTransitioning = true;
    controls.minDistance = 15;
});

playPauseBtn.addEventListener('click', () => {
    if (timeScale === 0) {
        timeScale = 1;
        speedSlider.value = 1;
        speedDisplay.textContent = '1.0x';
    }
    isPaused = !isPaused;
    playPauseBtn.textContent = isPaused ? '▶' : '⏸';
});

speedSlider.addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    speedDisplay.textContent = `${timeScale.toFixed(1)}x`;
    
    if (timeScale === 0) {
        isPaused = true;
        playPauseBtn.textContent = '▶';
    } else if (isPaused) {
        isPaused = false;
        playPauseBtn.textContent = '⏸';
    }
});

toggleLabelBtn.addEventListener('click', () => {
    showLabels = !showLabels;
    toggleLabelBtn.style.opacity = showLabels ? '1' : '0.5';
    // Toggle label visibility in scene would require CSS2DRenderer
});

toggleOrbitBtn.addEventListener('click', () => {
    showOrbits = !showOrbits;
    toggleOrbitBtn.style.opacity = showOrbits ? '1' : '0.5';
    // Toggle orbit visibility
});

resetViewBtn.addEventListener('click', () => {
    closeInfoPanel();
    focusedTarget = null;
    isTransitioning = true;
    controls.minDistance = 15;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        playPauseBtn.click();
    } else if (e.code === 'Escape') {
        closeInfoPanel();
    } else if (e.code === 'KeyR') {
        resetViewBtn.click();
    }
});

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust pixel ratio for mobile
    const newPixelRatio = Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2);
    renderer.setPixelRatio(newPixelRatio);
});

// Animation loop
const clock = new THREE.Clock();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _idealPos = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = Math.min(clock.getDelta(), 0.1) * timeScale;
    
    // Update star twinkling
    starMaterial.uniforms.uTime.value += delta;
    
    // Animate planets
    planets.forEach(item => {
        if (!isPaused) {
            item.angle += item.config.speed * delta;
            item.pivot.position.set(
                Math.cos(item.angle) * item.config.orbitRadius,
                0,
                Math.sin(item.angle) * item.config.orbitRadius
            );
            
            // Rotate planet
            item.mesh.rotation.y += delta * item.config.rotationSpeed;
            
            // Rotate clouds faster if exists
            if (item.config.cloudMesh) {
                item.config.cloudMesh.rotation.y += delta * item.config.rotationSpeed * 1.5;
            }
        }
    });
    
    // Sun rotation
    if (!isPaused) {
        sun.rotation.y += delta * 0.05;
    }
    
    // Camera follow logic
    if (focusedTarget) {
        focusedTarget.getWorldPosition(_v1);
        _v2.copy(_v1).sub(prevTargetPos);
        
        camera.position.add(_v2);
        controls.target.add(_v2);
        
        if (isTransitioning) {
            const size = focusedData.size || 14;
            const idealDist = Math.max(size * 5, 20);
            _idealPos.copy(_v1).add(new THREE.Vector3(0, size * 2, idealDist));
            
            // Frame-rate independent lerp
            const alpha = 1 - Math.exp(-delta * 6.0);
            camera.position.lerp(_idealPos, alpha);
            controls.target.lerp(_v1, alpha);
            
            if (camera.position.distanceTo(_idealPos) < 0.5) {
                isTransitioning = false;
            }
        }
        
        prevTargetPos.copy(_v1);
    } else if (isTransitioning) {
        const defaultPos = getDefaultCameraPosition();
        const alpha = 1 - Math.exp(-delta * 6.0);
        camera.position.lerp(defaultPos, alpha);
        controls.target.lerp(new THREE.Vector3(0, 0, 0), alpha);
        
        if (camera.position.distanceTo(defaultPos) < 0.5) {
            isTransitioning = false;
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function getDefaultCameraPosition() {
    if (window.innerWidth < window.innerHeight) {
        return new THREE.Vector3(0, 250, 500);
    }
    return new THREE.Vector3(0, 180, 350);
}

// Visibility change handler for battery saving
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clock.stop();
    } else {
        clock.start();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    renderer.dispose();
    if (window.__SOLAR_SYSTEM__) {
        window.__SOLAR_SYSTEM__ = null;
    }
});

animate();

// Initialize UI
toggleLabelBtn.style.opacity = '0.5';
toggleOrbitBtn.style.opacity = '1';
document.getElementById('hud').classList.remove('hidden');

// Planet chip listeners
document.querySelectorAll('.planet-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const planetId = chip.getAttribute('data-planet');
        if (planetId === 'sun') {
            focusOnSun(sun.userData);
        } else {
            const planet = planets.find(p => p.config.id === planetId);
            if (planet) focusOnPlanet(planet.pivot, planet.mesh.userData);
        }
    });
});
