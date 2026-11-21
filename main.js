import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIGURATION & DATA ---
const PLANET_DATA = [
    { name: 'Merkurius', tagline: 'Planet Terkecil', desc: 'Planet yang paling dekat dengan Matahari, tidak memiliki atmosfer signifikan.', diameter: '4.879 km', distance: '57,9 jt km', orbit: '88 hari', fact: 'Satu hari di Merkurius setara 59 hari di Bumi.', color: '#A5A5A5', size: 0.8, orbitRadius: 20, speed: 0.047, texture: 'rocky' },
    { name: 'Venus', tagline: 'Planet Terpanas', desc: 'Sering disebut bintang fajar, memiliki atmosfer tebal yang memerangkap panas.', diameter: '12.104 km', distance: '108,2 jt km', orbit: '225 hari', fact: 'Venus berputar searah jarum jam (retrograde).', color: '#E3BB76', size: 1.2, orbitRadius: 30, speed: 0.035, texture: 'cloudy' },
    { name: 'Bumi', tagline: 'Rumah Kita', desc: 'Satu-satunya planet yang diketahui memiliki kehidupan dan air cair di permukaannya.', diameter: '12.742 km', distance: '149,6 jt km', orbit: '365 hari', fact: '70% permukaan Bumi ditutupi oleh air.', color: '#2271B3', size: 1.3, orbitRadius: 42, speed: 0.029, texture: 'earth' },
    { name: 'Mars', tagline: 'Planet Merah', desc: 'Memiliki gunung berapi terbesar dan lembah terdalam di tata surya.', diameter: '6.779 km', distance: '227,9 jt km', orbit: '687 hari', fact: 'Mars memiliki gravitasi 37% dari gravitasi Bumi.', color: '#E27B58', size: 1.0, orbitRadius: 55, speed: 0.024, texture: 'rocky' },
    { name: 'Jupiter', tagline: 'Raksasa Gas', desc: 'Planet terbesar dengan badai raksasa yang sudah berlangsung ratusan tahun.', diameter: '139.820 km', distance: '778,6 jt km', orbit: '11,9 tahun', fact: 'Jupiter memiliki lebih dari 75 bulan (satelit alami).', color: '#D39C7E', size: 3.5, orbitRadius: 80, speed: 0.013, texture: 'banded' },
    { name: 'Saturnus', tagline: 'Permata Tata Surya', desc: 'Dikenal karena sistem cincinnya yang megah dan spektakuler.', diameter: '116.460 km', distance: '1,43 milyar km', orbit: '29,5 tahun', fact: 'Cincin Saturnus sebagian besar terbuat dari es dan debu.', color: '#C5AB6E', size: 3.0, orbitRadius: 105, speed: 0.009, texture: 'saturn', hasRings: true },
    { name: 'Uranus', tagline: 'Raksasa Es', desc: 'Planet yang berputar menyamping (porosnya miring ekstrim).', diameter: '50.724 km', distance: '2,87 milyar km', orbit: '84 tahun', fact: 'Uranus adalah planet terdingin di Tata Surya.', color: '#B5E3E3', size: 2.0, orbitRadius: 130, speed: 0.006, texture: 'smooth' },
    { name: 'Neptunus', tagline: 'Planet Berangin', desc: 'Planet terjauh dari Matahari, memiliki angin tercepat di tata surya.', diameter: '49.244 km', distance: '4,5 milyar km', orbit: '165 tahun', fact: 'Satu tahun di Neptunus setara 165 tahun di Bumi.', color: '#4B70DD', size: 1.9, orbitRadius: 150, speed: 0.005, texture: 'smooth' }
];

// --- SETUP SCENE ---
const canvas = document.querySelector('#solarCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 150, 300);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 1000;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2.8, 0); 
sunLight.decay = 0; 
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- PROCEDURAL TEXTURES ---
function createPlanetTexture(color, type) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    if (type === 'banded' || type === 'saturn') {
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.fillRect(0, Math.random() * size, size, Math.random() * 20 + 5);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
            ctx.fillRect(0, Math.random() * size, size, Math.random() * 10);
        }
    } else if (type === 'rocky') {
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'earth') {
        // Oceans already filled by base color
        // Continents
        ctx.fillStyle = '#2d5a27';
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.arc(x, y, Math.random() * 80 + 20, 0, Math.PI * 2);
            ctx.fill();
            for(let j=0; j<5; j++) {
                ctx.arc(x + (Math.random()-0.5)*100, y + (Math.random()-0.5)*100, Math.random()*50, 0, Math.PI*2);
                ctx.fill();
            }
        }
        // Poles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, 40);
        ctx.fillRect(0, size - 40, size, 40);
        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 50 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'cloudy') {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 80; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, 'rgba(197, 171, 110, 0)');
    grad.addColorStop(0.1, 'rgba(197, 171, 110, 0.6)');
    grad.addColorStop(0.3, 'rgba(150, 130, 80, 0.8)');
    grad.addColorStop(0.5, 'rgba(197, 171, 110, 0.2)');
    grad.addColorStop(0.7, 'rgba(180, 160, 100, 0.7)');
    grad.addColorStop(0.9, 'rgba(197, 171, 110, 0.5)');
    grad.addColorStop(1, 'rgba(197, 171, 110, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// --- OBJECTS ---

// Starfield (Hollow sphere)
const starGeometry = new THREE.BufferGeometry();
const starCoords = [];
for (let i = 0; i < 12000; i++) {
    const r = 500 + Math.random() * 700;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starCoords.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true }));
scene.add(stars);

const clickableObjects = [];

// Sun
const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
sun.userData = { name: 'Matahari', tagline: 'Pusat Tata Surya', desc: 'Bintang di pusat Tata Surya kita yang memberikan energi bagi kehidupan di Bumi.', diameter: '1.392.700 km', distance: '0 km', orbit: '-', fact: 'Massa Matahari mencakup 99,8% massa seluruh Tata Surya.' };
scene.add(sun);
clickableObjects.push(sun);

const createGlow = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 220, 100, 1)');
    grad.addColorStop(0.4, 'rgba(255, 150, 0, 0.3)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, blending: THREE.AdditiveBlending }));
    sprite.scale.set(45, 45, 1);
    return sprite;
};
sun.add(createGlow());

// Planets
const planetItems = [];
PLANET_DATA.forEach(data => {
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Orbit path
    const orbitCurve = new THREE.EllipseCurve(0, 0, data.orbitRadius, data.orbitRadius);
    const orbitPoints = orbitCurve.getPoints(128);
    const orbitLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    // Visual Group for tilt
    const visualGroup = new THREE.Group();
    if (data.name === 'Saturnus') visualGroup.rotation.z = THREE.MathUtils.degToRad(26.7);
    orbitGroup.add(visualGroup);

    // Planet Mesh
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 32, 32), new THREE.MeshStandardMaterial({ 
        map: createPlanetTexture(data.color, data.texture),
        roughness: 0.7, metalness: 0.1
    }));
    mesh.userData = data;
    mesh.position.x = data.orbitRadius;
    visualGroup.add(mesh);
    clickableObjects.push(mesh);

    // Hitbox
    if (data.size < 1.5) {
        const hitbox = new THREE.Mesh(new THREE.SphereGeometry(data.size * 2, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
        hitbox.userData = data;
        mesh.add(hitbox);
        clickableObjects.push(hitbox);
    }

    // Rings
    if (data.hasRings) {
        const ringGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.5, 64);
        const ringMat = new THREE.MeshStandardMaterial({ map: createRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }

    planetItems.push({ orbitGroup, mesh, data, angle: Math.random() * Math.PI * 2 });
});

// --- INTERACTION ---
let timeScale = 1;
let isPaused = false;
let pointerDownPos = { x: 0, y: 0 };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function showInfo(data) {
    document.getElementById('planetName').innerText = data.name;
    document.getElementById('planetTagline').innerText = data.tagline;
    document.getElementById('planetDesc').innerText = data.desc;
    document.getElementById('dataDiameter').innerText = data.diameter;
    document.getElementById('dataDistance').innerText = data.distance;
    document.getElementById('dataOrbit').innerText = data.orbit;
    document.getElementById('planetFact').innerText = data.fact;
    document.getElementById('infoPanel').classList.remove('hidden');
}

canvas.addEventListener('pointerdown', (e) => pointerDownPos = { x: e.clientX, y: e.clientY });
canvas.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) < 6) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, false);
        if (intersects.length > 0) {
            showInfo(intersects[0].object.userData);
        } else {
            document.getElementById('infoPanel').classList.add('hidden');
        }
    }
});

document.getElementById('closeBtn').addEventListener('click', () => document.getElementById('infoPanel').classList.add('hidden'));
document.getElementById('speedSlider').addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    document.getElementById('speedDisplay').innerText = `${timeScale.toFixed(1)}x`;
});
document.getElementById('playPauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('playPauseBtn').innerText = isPaused ? '▶' : '⏸';
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05) * timeScale;
    
    if (!isPaused) {
        planetItems.forEach(p => {
            p.angle += p.data.speed * delta * 5; // scaled for visibility
            p.mesh.position.x = Math.cos(p.angle) * p.data.orbitRadius;
            p.mesh.position.z = Math.sin(p.angle) * p.data.orbitRadius;
            p.mesh.rotation.y += delta * 2;
        });
        sun.rotation.y += delta * 0.2;
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate();
