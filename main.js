import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIGURATION & DATA ---
const PLANET_DATA = [
    { name: 'Merkurius', tagline: 'Planet Terkecil', desc: 'Planet yang paling dekat dengan Matahari, tidak memiliki atmosfer signifikan.', diameter: '4.879 km', distance: '57,9 jt km', orbit: '88 hari', fact: 'Satu hari di Merkurius setara 59 hari di Bumi.', color: '#A5A5A5', size: 0.8, orbitRadius: 20, speed: 0.047, texture: 'rocky' },
    { name: 'Venus', tagline: 'Planet Terpanas', desc: 'Sering disebut bintang fajar, memiliki atmosfer tebal yang memerangkap panas.', diameter: '12.104 km', distance: '108,2 jt km', orbit: '225 hari', fact: 'Venus berputar searah jarum jam (retrograde).', color: '#E3BB76', size: 1.2, orbitRadius: 30, speed: 0.035, texture: 'cloudy' },
    { name: 'Bumi', tagline: 'Rumah Kita', desc: 'Satu-satunya planet yang diketahui memiliki kehidupan dan air cair di permukaannya.', diameter: '12.742 km', distance: '149,6 jt km', orbit: '365 hari', fact: '70% permukaan Bumi ditutupi oleh air.', color: '#2271B3', size: 1.3, orbitRadius: 42, speed: 0.029, texture: 'earth' },
    { name: 'Mars', tagline: 'Planet Merah', desc: 'Memiliki gunung berapi terbesar dan lembah terdalam di tata surya.', diameter: '6.779 km', distance: '227,9 jt km', orbit: '687 hari', fact: 'Mars memiliki gravitasi 37% dari gravitasi Bumi.', color: '#E27B58', size: 1.0, orbitRadius: 55, speed: 0.024, texture: 'rocky' },
    { name: 'Jupiter', tagline: 'Raksasa Gas', desc: 'Planet terbesar dengan badai raksasa yang sudah berlangsung ratusan tahun.', diameter: '139.820 km', distance: '778,6 jt km', orbit: '11,9 tahun', fact: 'Jupiter memiliki lebih dari 75 bulan (satelit alami).', color: '#D39C7E', size: 3.5, orbitRadius: 80, speed: 0.013, texture: 'banded' },
    { name: 'Saturnus', tagline: 'Permata Tata Surya', desc: 'Dikenal karena sistem cincinnya yang megah dan spektakuler.', diameter: '116.460 km', distance: '1,43 milyar km', orbit: '29,5 tahun', fact: 'Cincin Saturnus sebagian besar terbuat dari es dan debu.', color: '#C5AB6E', size: 3.0, orbitRadius: 105, speed: 0.009, texture: 'banded', hasRings: true },
    { name: 'Uranus', tagline: 'Raksasa Es', desc: 'Planet yang berputar menyamping (porosnya miring ekstrim).', diameter: '50.724 km', distance: '2,87 milyar km', orbit: '84 tahun', fact: 'Uranus adalah planet terdingin di Tata Surya.', color: '#B5E3E3', size: 2.0, orbitRadius: 130, speed: 0.006, texture: 'smooth' },
    { name: 'Neptunus', tagline: 'Planet Berangin', desc: 'Planet terjauh dari Matahari, memiliki angin tercepat di tata surya.', diameter: '49.244 km', distance: '4,5 milyar km', orbit: '165 tahun', fact: 'Satu tahun di Neptunus setara 165 tahun di Bumi.', color: '#4B70DD', size: 1.9, orbitRadius: 150, speed: 0.005, texture: 'smooth' }
];

// --- SETUP SCENE ---
const canvas = document.querySelector('#solarCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 150, 300);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 600;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3000, 0); // High intensity, zero decay for long range
sunLight.decay = 0; // Force no decay for far planets
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- PROCEDURAL TEXTURES ---
function createPlanetTexture(color, type) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    if (type === 'banded') {
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.fillRect(0, Math.random() * size, size, Math.random() * 30);
        }
    } else if (type === 'rocky' || type === 'earth') {
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'cloudy') {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return new THREE.CanvasTexture(canvas);
}

// --- OBJECTS ---

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true });
const starCoords = [];
for (let i = 0; i < 10000; i++) {
    starCoords.push((Math.random() - 0.5) * 1500, (Math.random() - 0.5) * 1500, (Math.random() - 0.5) * 1500);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Sun
const sunGeo = new THREE.SphereGeometry(12, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.userData = { isSun: true, name: 'Matahari', tagline: 'Pusat Tata Surya', desc: 'Bintang di pusat Tata Surya kita yang memberikan energi bagi kehidupan di Bumi.', diameter: '1.392.700 km', distance: '0 km', orbit: '-', fact: 'Massa Matahari mencakup 99,8% massa seluruh Tata Surya.' };
scene.add(sun);

// Sun Glow (Radial Sprite)
const createGlow = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 200, 0, 1)');
    grad.addColorStop(0.3, 'rgba(255, 150, 0, 0.4)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(45, 45, 1);
    return sprite;
};
sun.add(createGlow());

// Planets
const planets = [];
PLANET_DATA.forEach(data => {
    // Group for rotation and orbit logic
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    // Orbit path
    const orbitCurve = new THREE.EllipseCurve(0, 0, data.orbitRadius, data.orbitRadius);
    const orbitPoints = orbitCurve.getPoints(128);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    // Planet Mesh
    const geo = new THREE.SphereGeometry(data.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ 
        map: createPlanetTexture(data.color, data.texture),
        roughness: 0.8,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Hitbox for small planets
    if (data.size < 1.1) {
        const hitboxGeo = new THREE.SphereGeometry(data.size * 1.8, 16, 16);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        mesh.add(hitbox);
    }

    mesh.position.x = data.orbitRadius;
    mesh.userData = data;
    planetGroup.add(mesh);

    // Rings for Saturn
    if (data.hasRings) {
        const ringGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.5, 64);
        const ringMat = new THREE.MeshStandardMaterial({ 
            color: 0xccb07e, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.6 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5; // Tilted
        mesh.add(ring);
    }

    planets.push({ group: planetGroup, mesh, data, angle: Math.random() * Math.PI * 2 });
});

// --- INTERACTION ---
let timeScale = 1;
let isPaused = false;
let pointerDownPos = { x: 0, y: 0 };

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById('infoPanel');
const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const playPauseBtn = document.getElementById('playPauseBtn');

function showInfo(data) {
    document.getElementById('planetName').innerText = data.name;
    document.getElementById('planetTagline').innerText = data.tagline;
    document.getElementById('planetDesc').innerText = data.desc;
    document.getElementById('dataDiameter').innerText = data.diameter;
    document.getElementById('dataDistance').innerText = data.distance;
    document.getElementById('dataOrbit').innerText = data.orbit;
    document.getElementById('planetFact').innerText = data.fact;
    infoPanel.classList.remove('hidden');
}

canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (dist < 6) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            let target = intersects[0].object;
            // Handle hitbox or children
            while (target && !target.userData.name) target = target.parent;
            if (target && target.userData.name) {
                showInfo(target.userData);
                return;
            }
        }
        infoPanel.classList.add('hidden');
    }
});

document.getElementById('closeBtn').addEventListener('click', () => infoPanel.classList.add('hidden'));

speedSlider.addEventListener('input', (e) => {
    timeScale = parseFloat(e.target.value);
    speedDisplay.innerText = `${timeScale.toFixed(1)}x`;
});

playPauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playPauseBtn.innerText = isPaused ? '▶' : '⏸';
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    if (!isPaused) {
        const delta = 0.01 * timeScale;
        
        planets.forEach(p => {
            // Orbit
            p.angle += p.data.speed * delta;
            p.mesh.position.x = Math.cos(p.angle) * p.data.orbitRadius;
            p.mesh.position.z = Math.sin(p.angle) * p.data.orbitRadius;
            
            // Self Rotation
            p.mesh.rotation.y += delta * 2;
        });
        
        sun.rotation.y += delta * 0.5;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate();
