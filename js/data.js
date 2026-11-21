// Konstanta astronomi nyata dan fungsi skala visual non-linear
export const SIM_DAYS_PER_SECOND = 18;
export const ROTATION_RAD_PER_SIM_DAY = 0.085;
export const EARTH_DIAMETER_KM = 12742;

// Skala visual non-linear: radius fisik (km) dikompresi agar planet kecil tetap terlihat
export function computeVisualRadius(diameterKm) {
    return Number((Math.pow(diameterKm / EARTH_DIAMETER_KM, 0.4) * 1.42).toFixed(2));
}

// Skala orbit non-linear: jarak AU dikompresi logaritmik agar orbit Neptunus terjangkau layar
export function computeOrbitRadius(au) {
    return Number((1.6 + Math.sqrt(au) * 14.5 + Math.log1p(au * 4.0) * 7.8).toFixed(2));
}

// Konfigurasi benda langit: Matahari dipisah dari daftar planet agar tidak terbuat ganda
export const CELESTIAL_CONFIG = {
    sun: {
        id: 'sun',
        name: 'Matahari',
        orderText: 'Bintang Pusat Tata Surya',
        swatch: '#ffaa00',
        diameterKm: 1392700,
        diameterText: '1.392.700 km (109x Bumi)',
        distanceText: 'Pusat Tata Surya (0 SA)',
        revolutionText: '230 juta tahun (Orbit Galaksi)',
        rotationText: '25,38 Hari (Ekuator)',
        tiltText: '7,25° terhadap ekliptika',
        description: 'Bintang deret utama tipe-G yang memancarkan energi dari fusi termonuklir hidrogen menjadi helium di intinya. Menghimpun 99,86% dari seluruh massa Tata Surya.',
        characteristics: 'Reaktor fusi alami, medan magnet dinamis, angin matahari melindungi heliosfer.',
        visualRadius: 6.4,
        orbitRadius: 0,
        rotationPeriodDays: 25.38,
        axialTiltDeg: 7.25,
        rotationRadPerDay: ROTATION_RAD_PER_SIM_DAY / 25.38
    },
    planets: [
        {
            id: 'mercury',
            name: 'Merkurius',
            orderText: 'Planet ke-1 dari Matahari',
            swatch: '#a8a29e',
            diameterKm: 4879,
            au: 0.387,
            orbitalPeriodDays: 87.97,
            rotationPeriodDays: 58.65,
            axialTiltDeg: 0.03,
            initialAngle: 0.45,
            diameterText: '4.879 km (0,38x Bumi)',
            distanceText: '57,9 juta km (0,39 SA)',
            revolutionText: '88 Hari Bumi',
            rotationText: '58,6 Hari Bumi',
            tiltText: '0,03°',
            description: 'Planet terkecil dan terdekat ke Matahari. Permukaannya dipenuhi kawah tubrukan mirip Bulan dengan variasi suhu siang dan malam paling ekstrem di Tata Surya.',
            characteristics: 'Inti besi masif, tanpa atmosfer penahan panas, resonansi orbit-spin 3:2.',
            atmosphere: null,
            hasClouds: false,
            rings: null
        },
        {
            id: 'venus',
            name: 'Venus',
            orderText: 'Planet ke-2 dari Matahari',
            swatch: '#fbbf24',
            diameterKm: 12104,
            au: 0.723,
            orbitalPeriodDays: 224.7,
            rotationPeriodDays: -243.02,
            axialTiltDeg: 177.4,
            initialAngle: 2.05,
            diameterText: '12.104 km (0,95x Bumi)',
            distanceText: '108,2 juta km (0,72 SA)',
            revolutionText: '224,7 Hari Bumi',
            rotationText: '243 Hari Bumi (Retrograde)',
            tiltText: '177,4° (Terbalik)',
            description: 'Kembaran ukuran Bumi yang terperangkap dalam efek rumah kaca tak terkendali. Diselimuti awan tebal asam sulfat bertekanan 92 kali atmosfer Bumi.',
            characteristics: 'Planet terpanas (465°C stabil), rotasi berlawanan arah jarum jam, tekanan permukaan ekstrem.',
            atmosphere: { color: '#f4dc9c', opacity: 0.28, scale: 1.075 },
            hasClouds: false,
            rings: null
        },
        {
            id: 'earth',
            name: 'Bumi',
            orderText: 'Planet ke-3 dari Matahari',
            swatch: '#38bdf8',
            diameterKm: 12742,
            au: 1.000,
            orbitalPeriodDays: 365.25,
            rotationPeriodDays: 1.0,
            axialTiltDeg: 23.44,
            initialAngle: 3.65,
            diameterText: '12.742 km (Standar 1,00x)',
            distanceText: '149,6 juta km (1,00 SA)',
            revolutionText: '365,25 Hari Bumi',
            rotationText: '23 Jam 56 Menit',
            tiltText: '23,44°',
            description: 'Satu-satunya oasis kehidupan yang diketahui di alam semesta. Memiliki kerak tektonik aktif, biosfer kaya, dan perairan samudera cair seluas 71% permukaan.',
            characteristics: 'Air cair stabil di permukaan, atmosfer kaya nitrogen-oksigen, medan magnet pelindung kuat.',
            atmosphere: { color: '#4dc4ff', opacity: 0.3, scale: 1.07 },
            hasClouds: true,
            rings: null,
            moon: {
                id: 'moon',
                name: 'Bulan',
                orderText: 'Satelit Alami Bumi',
                swatch: '#e2e8f0',
                diameterKm: 3474,
                diameterText: '3.474 km (0,27x Bumi)',
                distanceText: '384.400 km dari Bumi',
                revolutionText: '27,32 Hari Bumi',
                rotationText: '27,32 Hari (Tidal Lock)',
                tiltText: '5,14° terhadap ekliptika',
                description: 'Satelit alami Bumi yang terkunci secara pasang surut (tidal locked), selalu menghadapkan sisi yang sama ke Bumi dan menstabilkan kemiringan sumbu rotasi Bumi.',
                characteristics: 'Terkunci pasang surut, memicu pasang surut air laut Bumi, permukaan kaya kawah mare.',
                radius: 0.36,
                orbitRadius: 2.45,
                orbitalPeriodDays: 27.32,
                inclinationDeg: 5.14
            }
        },
        {
            id: 'mars',
            name: 'Mars',
            orderText: 'Planet ke-4 dari Matahari',
            swatch: '#f87171',
            diameterKm: 6779,
            au: 1.524,
            orbitalPeriodDays: 686.98,
            rotationPeriodDays: 1.026,
            axialTiltDeg: 25.19,
            initialAngle: 5.15,
            diameterText: '6.779 km (0,53x Bumi)',
            distanceText: '227,9 juta km (1,52 SA)',
            revolutionText: '687 Hari Bumi (1,88 Tahun)',
            rotationText: '24 Jam 37 Menit',
            tiltText: '25,19°',
            description: 'Planet merah yang diselimuti debu besi oksida. Rumah bagi Olympus Mons (gunung berapi tertinggi di Tata Surya) dan ngarai raksasa Valles Marineris.',
            characteristics: 'Jejak aliran air purba di lembah kering, tudung es kutub CO2 dan air, dua satelit kecil Phobos & Deimos.',
            atmosphere: { color: '#db7d57', opacity: 0.13, scale: 1.055 },
            hasClouds: false,
            rings: null
        },
        {
            id: 'jupiter',
            name: 'Jupiter',
            orderText: 'Planet ke-5 dari Matahari',
            swatch: '#fb923c',
            diameterKm: 139820,
            au: 5.204,
            orbitalPeriodDays: 4332.59,
            rotationPeriodDays: 0.414,
            axialTiltDeg: 3.13,
            initialAngle: 1.15,
            diameterText: '139.820 km (11,0x Bumi)',
            distanceText: '778,5 juta km (5,20 SA)',
            revolutionText: '11,86 Tahun Bumi',
            rotationText: '9 Jam 55 Menit (Rotasi Tercepat)',
            tiltText: '3,13°',
            description: 'Raksasa gas terbesar dengan massa 2,5 kali gabungan seluruh planet lainnya. Menampilkan pita atmosfer jet-stream badai dinamis dan Bintik Merah Raksasa.',
            characteristics: 'Bintik Merah Raksasa berumur 300+ tahun, magnetosfer raksasa, memiliki lebih dari 95 satelit.',
            atmosphere: null,
            hasClouds: false,
            rings: null
        },
        {
            id: 'saturn',
            name: 'Saturnus',
            orderText: 'Planet ke-6 dari Matahari',
            swatch: '#fde047',
            diameterKm: 116460,
            au: 9.582,
            orbitalPeriodDays: 10759.22,
            rotationPeriodDays: 0.444,
            axialTiltDeg: 26.73,
            initialAngle: 4.3,
            diameterText: '116.460 km (9,14x Bumi)',
            distanceText: '1,43 miliar km (9,58 SA)',
            revolutionText: '29,45 Tahun Bumi',
            rotationText: '10 Jam 33 Menit',
            tiltText: '26,73°',
            description: 'Mahkota Tata Surya dengan sistem cincin es spektakuler yang membentang ratusan ribu kilometer namun hanya setebal puluhan meter. Massa jenisnya lebih ringan dari air.',
            characteristics: 'Cincin partikel es 99% murni, badai heksagonal di kutub utara, 146+ satelit termasuk Titan.',
            atmosphere: null,
            hasClouds: false,
            rings: 'saturn'
        },
        {
            id: 'uranus',
            name: 'Uranus',
            orderText: 'Planet ke-7 dari Matahari',
            swatch: '#67e8f9',
            diameterKm: 50724,
            au: 19.201,
            orbitalPeriodDays: 30685.4,
            rotationPeriodDays: -0.718,
            axialTiltDeg: 97.77,
            initialAngle: 2.75,
            diameterText: '50.724 km (3,98x Bumi)',
            distanceText: '2,87 miliar km (19,2 SA)',
            revolutionText: '84,02 Tahun Bumi',
            rotationText: '17 Jam 14 Menit (Retrograde)',
            tiltText: '97,77° (Menggelinding)',
            description: 'Raksasa es dengan sumbu rotasi yang miring hampir 98 derajat, menggelinding di sepanjang orbitnya akibat tubrukan masif pada masa awal Tata Surya.',
            characteristics: 'Suhu atmosfer terdingin (-224°C), mantel es air, metana, dan amonia, sistem cincin vertikal tipis.',
            atmosphere: null,
            hasClouds: false,
            rings: 'uranus'
        },
        {
            id: 'neptune',
            name: 'Neptunus',
            orderText: 'Planet ke-8 dari Matahari',
            swatch: '#60a5fa',
            diameterKm: 49244,
            au: 30.047,
            orbitalPeriodDays: 60189.0,
            rotationPeriodDays: 0.671,
            axialTiltDeg: 28.32,
            initialAngle: 5.75,
            diameterText: '49.244 km (3,86x Bumi)',
            distanceText: '4,50 miliar km (30,1 SA)',
            revolutionText: '164,8 Tahun Bumi',
            rotationText: '16 Jam 6 Menit',
            tiltText: '28,32°',
            description: 'Planet terluar di Tata Surya dengan warna biru kobalt mendalam dari penyerapan gas metana merah. Memiliki angin supersonik tercepat mencapai 2.100 km/jam.',
            characteristics: 'Angin atmosfer terkencang di Tata Surya, badai siklon Great Dark Spot, Triton satelit retrograde beku.',
            atmosphere: { color: '#3b82f6', opacity: 0.2, scale: 1.06 },
            hasClouds: false,
            rings: null
        }
    ]
};

// Turunkan ukuran visual dan kecepatan orbit/rotasi untuk setiap planet
CELESTIAL_CONFIG.planets.forEach(p => {
    p.visualRadius = computeVisualRadius(p.diameterKm);
    p.orbitRadius = computeOrbitRadius(p.au);
    p.orbitalRadPerDay = (Math.PI * 2) / p.orbitalPeriodDays;
    
    // Perbaikan: Hapus double-negative retrograde. rotationRadPerDay selalu positif karena tiltGroup menangani arah.
    p.rotationRadPerDay = ROTATION_RAD_PER_SIM_DAY / Math.abs(p.rotationPeriodDays);

    if (p.moon) {
        p.moon.orbitalRadPerDay = (Math.PI * 2) / p.moon.orbitalPeriodDays;
    }
});
