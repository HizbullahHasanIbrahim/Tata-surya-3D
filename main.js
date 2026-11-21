import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- DATA ---
const PLANET_DATA = [
    { name: 'Merkurius', tagline: 'Planet Terkecil', desc: 'Planet yang paling dekat dengan Matahari, tidak memiliki atmosfer signifikan.', diameter: '4.879 km', distance: '57,9 jt km', orbit: '88 hari', fact: 'Satu hari di Merkurius setara 59 hari di Bumi.', color: '#A5A5A5', size: 0.8, orbitRadius: 25, speed: 0.047, texture: 'rocky', tilt: 0.03 },
    { name: 'Venus', tagline: 'Planet Terpanas', desc: 'Sering disebut bintang fajar, memiliki atmosfer tebal yang memerangkap panas.', diameter: '12.104 km', distance: '108,2 jt km', orbit: '225 hari', fact: 'Venus berputar searah jarum jam (retrograde).', color: '#E3BB76', size: 1.2, orbitRadius: 40, speed: 0.035, texture: 'cloudy', tilt: 177.3 },
    { name: 'Bumi', tagline: 'Rumah Kita', desc: 'Satu-satunya planet yang diketahui memiliki kehidupan dan air cair di permukaannya.', diameter: '12.742 km', distance: '149,6 jt km', orbit: '365 hari', fact: '70% permukaan Bumi ditutupi oleh air.', color: '#2271B3', size: 1.3, orbitRadius: 55, speed: 0.029, texture: 'earth', tilt: 23.5 },
    { name: 'Mars', tagline: 'Planet Merah', desc: 'Memiliki gunung berapi terbesar dan lembah terdalam di tata surya.', diameter: '6.779 km', distance: '227,9 jt km', orbit: '687 hari', fact: 'Mars memiliki gravitasi 37% dari gravitasi Bumi.', color: '#E27B58', size: 1.0, orbitRadius: 75, speed: 0.024, texture: 'rocky', tilt: 25.2 },
    { name: 'Jupiter', tagline: 'Raksasa Gas', desc: 'Planet terbesar dengan badai raksasa yang sudah berlangsung ratusan tahun.', diameter: '139.820 km', distance: '778,6 jt km', orbit: '11,9 tahun', fact: 'Jupiter memiliki lebih dari 75 bulan (satelit alami).', color: '#D39C7E', size: 3.5, orbitRadius: 110, speed: 0.013, texture: 'banded', tilt: 3.1 },
    { name: 'Saturnus', tagline: 'Permata Tata Surya', desc: 'Dikenal karena sistem cincinnya yang megah dan spektakuler.', diameter: '116.460 km', distance: '1,43 milyar km', orbit: '29,5 tahun', fact: 'Cincin Saturnus sebagian besar terbuat dari es dan debu.', color: '#C5AB6E', size: 3.0, orbitRadius: 150, speed: 0.009, texture: 'banded', tilt: 26.7, hasRings: true },
    { name: 'Uranus', tagline: 'Raksasa Es', desc: 'Planet yang berputar menyamping (porosnya miring ekstrim).', diameter: '50.724 km', distance: '2,87 milyar km', orbit: '84 tahun', fact: 'Uranus adalah planet terdingin di Tata Surya.', color: '#B5E3E3', size: 2.0, orbitRadius: 190, speed: 0.006, texture: 'smooth', tilt: 97.8 },
    { name: 'Neptunus', tagline: 'Planet Berangin', desc: 'Planet terjauh dari Matahari, memiliki angin tercepat di tata surya.', diameter: '49.244 km', distance: '4,5 milyar km', orbit: '165 tahun', fact: 'Satu tahun di Neptunus setara 165 tahun di Bumi.', color: '#4B70DD', size: 1.9, orbitRadius: 220, speed: 0.005, texture: 'smooth', tilt: 28.3 }
];

// --- SETUP ---
const canvas = document.querySelector('#solarCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const clock = new THREE.Clock();

const getDefaultCameraPos = () => window.innerWidth < window.innerHeight ? new THREE.Vector3(0, 250, 500) : new THREE.Vector3(0, 180, 350);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.copy(getDefaultCameraPos());

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 1200;

scene.add(new THREE.AmbientLight(0xffffff, 0.1));
const sunLight = new THREE.PointLight(0xffffff, 3.5, 0);
sunLight.decay = 0;
scene.add(sunLight);

// --- PROCEDURAL TEXTURES ---
function createTexture(color, type) {
    const size = 512;
    const canv = document.createElement('canvas');
    canv.width = size; canv.height = size;
    const ctx = canv.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    if (type === 'sun') {
        for (let i = 0; i < 2000; i++) {
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 0, ${Math.random() * 0.4})`;
            ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 4, Math.random() * 4);
        }
    } else if (type === 'banded') {
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.fillRect(0, Math.random() * size, size, Math.random() * 25 + 5);
        }
        if (color === '#D39C7E') { // Jupiter Great Red Spot
            ctx.fillStyle = 'rgba(180, 60, 20, 0.4)';
            ctx.beginPath(); ctx.ellipse(Math.random() * size, size * 0.65, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
        }
    } else if (type === 'earth') {
        ctx.fillStyle = '#2d5a27';
        for (let i = 0; i < 6; i++) {
            const cx = Math.random() * size, cy = Math.random() * size;
            for (let j = 0; j < 8; j++) {
                ctx.beginPath();
                ctx.arc(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80, Math.random() * 16 + 12, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, 35); ctx.fillRect(0, size - 35, size, 35);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 35; i++) {
            ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 30 + 10, 0, Math.PI * 2); ctx.fill();
        }
    } else if (type === 'rocky') {
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
            ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 3, 0, Math.PI * 2); ctx.fill();
        }
    } else if (type === 'cloudy') {
        ctx.fillStyle = 'rgba(255,250,220,0.2)';
        for (let i = 0; i < 60; i++) {
            ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 50 + 20, 0, Math.PI * 2); ctx.fill();
        }
    } else if (type === 'smooth') {
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
            ctx.fillRect(0, Math.random() * size, size, Math.random() * 3 + 1);
        }
    }

    const tex = new THREE.CanvasTexture(canv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function createRingTexture() {
    const canv = document.createElement('canvas');
    canv.width = 256; canv.height = 1;
    const ctx = canv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.1, 'rgba(197, 171, 110, 0.4)');
    grad.addColorStop(0.48, 'rgba(150, 130, 80, 0.8)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.05)'); // Cassini
    grad.addColorStop(0.52, 'rgba(180, 160, 100, 0.7)');
    grad.addColorStop(0.9, 'rgba(197, 171, 110, 0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 1);
    const tex = new THREE.CanvasTexture(canv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// --- OBJECTS ---
const starsGeo = new THREE.BufferGeometry();
const starsPos = [];
for (let i = 0; i < 15000; i++) {
    const r = 600 + Math.random() * 900;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    starsPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true })));

const clickable = [];

// Sun
const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 64), new THREE.MeshBasicMaterial({ map: createTexture('#ffcc00', 'sun') }));
sun.userData = { name: 'Matahari', size: 12, tagline: 'Pusat Tata Surya', desc: 'Bintang di pusat Tata Surya.', diameter: '1.392.700 km', distance: '0 km', orbit: '-', fact: 'Massa Matahari mencakup 99,8% seluruh Tata Surya.' };
scene.add(sun);
clickable.push(sun);

const sunGlow = () => {
    const canv = document.createElement('canvas'); canv.width = 64; canv.height = 64;
    const ctx = canv.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 230, 150, 1)'); grad.addColorStop(0.4, 'rgba(255, 150, 0, 0.3)'); grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(48, 48, 1); return s;
};
sun.add(sunGlow());

// Planets
const planetItems = [];
PLANET_DATA.forEach(data => {
    const pivot = new THREE.Group();
    pivot.userData = data;
    scene.add(pivot);

    const orbitLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, data.orbitRadius, data.orbitRadius).getPoints(128)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
    );
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.tilt);
    pivot.add(tiltGroup);

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 32, 32), new THREE.MeshStandardMaterial({ map: createTexture(data.color, data.texture), roughness: 0.75, metalness: 0.1 }));
    mesh.userData = { ...data, pivot };
    tiltGroup.add(mesh);
    clickable.push(mesh);

    if (data.size < 1.5) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(data.size * 2, 16, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        h.userData = { ...data, pivot }; mesh.add(h); clickable.push(h);
    }

    if (data.hasRings) {
        const rGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.5, 128);
        const posArr = rGeo.attributes.position.array;
        const uvArr = rGeo.attributes.uv.array;
        for (let i = 0; i < posArr.length; i += 3) {
            const dist = Math.sqrt(posArr[i]**2 + posArr[i+1]**2);
            const u = (dist - data.size * 1.4) / (data.size * 1.1);
            uvArr[(i/3)*2] = u; uvArr[(i/3)*2+1] = 0.5;
        }
        const r = new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({ map: createRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
        r.rotation.x = Math.PI / 2;
        r.userData = { ...data, pivot };
        tiltGroup.add(r);
        clickable.push(r);
    }

    planetItems.push({ pivot, mesh, data, angle: Math.random() * Math.PI * 2 });
});

// --- INTERACTION ---
let timeScale = 1, isPaused = false;
let focused = null, focusedData = null, isTransitioning = false, prevFPos = new THREE.Vector3();
let pointerDownPos = { x: 0, y: 0 }, activePointers = new Set(), hadMultiTouch = false;

const info = document.getElementById('infoPanel');
const sSlider = document.getElementById('speedSlider');
const sDisp = document.getElementById('speedDisplay');
const ppBtn = document.getElementById('playPauseBtn');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Helper vectors to avoid GC
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

function focusOn(target, data) {
    focused = target;
    focusedData = data;
    isTransitioning = true;
    focused.getWorldPosition(prevFPos);
    controls.minDistance = Math.max(data.size * 2.2, 5);
    
    document.getElementById('planetName').innerText = data.name;
    document.getElementById('planetTagline').innerText = data.tagline;
    document.getElementById('planetDesc').innerText = data.desc;
    document.getElementById('dataDiameter').innerText = data.diameter;
    document.getElementById('dataDistance').innerText = data.distance;
    document.getElementById('dataOrbit').innerText = data.orbit;
    document.getElementById('planetFact').innerText = data.fact;
    info.classList.remove('hidden');
}

canvas.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1) hadMultiTouch = true;
    pointerDownPos = { x: e.clientX, y: e.clientY };
});

const resetTouch = () => { activePointers.clear(); hadMultiTouch = false; };
canvas.addEventListener('pointerup', (e) => {
    if (activePointers.size === 1 && !hadMultiTouch) {
        if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) < 6) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const its = raycaster.intersectObjects(clickable, false);
            if (its.length > 0) {
                const d = its[0].object.userData;
                focusOn(d.pivot || sun, d);
            } else {
                info.classList.add('hidden');
                focused = null;
            }
        }
    }
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) hadMultiTouch = false;
});
canvas.addEventListener('pointercancel', resetTouch);

canvas.addEventListener('pointermove', (e) => {
    if (activePointers.size === 0) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        canvas.style.cursor = raycaster.intersectObjects(clickable, false).length > 0 ? 'pointer' : 'default';
    }
});

controls.addEventListener('start', () => { isTransitioning = false; });
document.getElementById('closeBtn').addEventListener('click', () => { info.classList.add('hidden'); focused = null; });
document.getElementById('resetCamBtn').addEventListener('click', () => {
    focused = null; info.classList.add('hidden'); isTransitioning = true;
    controls.minDistance = 20;
});

sSlider.addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    sDisp.innerText = `${timeScale.toFixed(1)}x`;
    if (timeScale === 0) { isPaused = true; ppBtn.innerText = '▶'; }
    else if (isPaused) { isPaused = false; ppBtn.innerText = '⏸'; }
});

ppBtn.addEventListener('click', () => {
    if (timeScale === 0) { timeScale = 1; sSlider.value = 1; sDisp.innerText = '1.0x'; }
    isPaused = !isPaused;
    ppBtn.innerText = isPaused ? '▶' : '⏸';
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05) * timeScale;
    
    planetItems.forEach(p => {
        if (!isPaused) p.angle += p.data.speed * dt * 5;
        p.pivot.position.set(Math.cos(p.angle) * p.data.orbitRadius, 0, Math.sin(p.angle) * p.data.orbitRadius);
        if (!isPaused) p.mesh.rotation.y += dt * 1.5;
    });
    if (!isPaused) sun.rotation.y += dt * 0.2;

    if (focused) {
        focused.getWorldPosition(_v1);
        _v2.copy(_v1).sub(prevFPos);
        camera.position.add(_v2);
        controls.target.add(_v2);
        
        if (isTransitioning) {
            const dist = focusedData.name === 'Matahari' ? 60 : Math.max(focusedData.size * 6, 15);
            const ideal = _v1.clone().add(new THREE.Vector3(0, focusedData.size * 2, dist));
            camera.position.lerp(ideal, 0.08);
            controls.target.lerp(_v1, 0.08);
            if (camera.position.distanceTo(ideal) < 0.5) isTransitioning = false;
        }
        prevFPos.copy(_v1);
    } else if (isTransitioning) {
        const dPos = getDefaultCameraPos();
        camera.position.lerp(dPos, 0.08);
        controls.target.lerp(_v1.set(0,0,0), 0.08);
        if (camera.position.distanceTo(dPos) < 0.5) isTransitioning = false;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();
