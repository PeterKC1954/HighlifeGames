import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== BOARD CONFIGURATION =====
const BOARD_SIZE = 11; // 11x11 grid (40 tiles around the edge like Monopoly)
const TILE_SIZE = 1;
const TILE_HEIGHT = 0.3;
const BOARD_WIDTH = BOARD_SIZE * TILE_SIZE;

// Square types and their colors
const SQUARE_TYPES = {
  start:            { color: 0xabd40a, label: 'Training Grant',    icon: '🎓' },
  company:          { color: 0x1e5799, label: 'Company Square',     icon: '🏢' },
  disaster:         { color: 0xfc6b6b, label: 'Disaster',           icon: '💥' },
  building_soc:     { color: 0x4ecdc4, label: 'Building Society',   icon: '🏦' },
  news_feed:        { color: 0xf9a825, label: 'News Feed',          icon: '📰' },
  buy_now:          { color: 0xd02f7c, label: 'Buy Now',            icon: '🛒' },
  account_report:   { color: 0x9b59b6, label: 'Account Report',     icon: '📋' },
  insurance_broker: { color: 0x2d6e3e, label: 'Insurance Broker',   icon: '🛡️' },
  tax_demand:       { color: 0xe67e22, label: 'Tax Demand',         icon: '💰' },
  credit_card:      { color: 0x8e44ad, label: 'Credit Card',        icon: '💳' },
  blank_company:    { color: 0x34495e, label: 'Blank Company Slot', icon: '📐' },
};

// ===== 20 COMPANY SPONSORS (from PPTX card images) =====
const COMPANIES = [
  { id: 1,  name: 'American Airlines',  colour: 0xe74c3c, cardImg: 'assets/companies/image1.jpg',  baseReward: 5000 },
  { id: 2,  name: 'Asda',               colour: 0x2ecc71, cardImg: 'assets/companies/image2.jpg',  baseReward: 4000 },
  { id: 3,  name: 'Bakery',             colour: 0xf39c12, cardImg: 'assets/companies/image3.jpg',  baseReward: 3500 },
  { id: 4,  name: 'Black & Decker',     colour: 0x3498db, cardImg: 'assets/companies/image4.jpg',  baseReward: 4500 },
  { id: 5,  name: 'British Airways',    colour: 0xe91e63, cardImg: 'assets/companies/image5.jpg',  baseReward: 3000 },
  { id: 6,  name: 'Banking Group',      colour: 0x8e44ad, cardImg: 'assets/companies/image6.jpg',  baseReward: 5500 },
  { id: 7,  name: 'Bicycling',          colour: 0x16a085, cardImg: 'assets/companies/image7.jpg',  baseReward: 4200 },
  { id: 8,  name: 'Cornerstone',        colour: 0xd35400, cardImg: 'assets/companies/image8.jpg',  baseReward: 3800 },
  { id: 9,  name: 'Enterprise',         colour: 0x2980b9, cardImg: 'assets/companies/image9.jpg',  baseReward: 4800 },
  { id: 10, name: 'Food Co',            colour: 0x27ae60, cardImg: 'assets/companies/image10.jpg', baseReward: 6000 },
  { id: 11, name: 'Horizon',            colour: 0xc0392b, cardImg: 'assets/companies/image11.jpg', baseReward: 3200 },
  { id: 12, name: 'Media Group',        colour: 0x2c3e50, cardImg: 'assets/companies/image12.jpg', baseReward: 3600 },
  { id: 13, name: 'Kleeneze',           colour: 0xe84393, cardImg: 'assets/companies/image13.jpg', baseReward: 2800 },
  { id: 14, name: 'Kwik Fit',           colour: 0x00cec9, cardImg: 'assets/companies/image14.jpg', baseReward: 5200 },
  { id: 15, name: 'Ferries',            colour: 0x6ab04c, cardImg: 'assets/companies/image15.jpg', baseReward: 3400 },
  { id: 16, name: 'Retail Co',          colour: 0xfd79a8, cardImg: 'assets/companies/image16.jpg', baseReward: 4600 },
  { id: 17, name: 'Pizza Hut',          colour: 0x0984e3, cardImg: 'assets/companies/image17.jpg', baseReward: 5000 },
  { id: 18, name: 'Rolex',              colour: 0x00b894, cardImg: 'assets/companies/image18.jpg', baseReward: 3900 },
  { id: 19, name: 'S&S Carpets',        colour: 0xa29bfe, cardImg: 'assets/companies/image19.jpg', baseReward: 4400 },
  { id: 20, name: 'Photographic',       colour: 0xffeaa7, cardImg: 'assets/companies/image20.jpg', baseReward: 2600 },
  { id: 21, name: 'Pepsi',              colour: 0x0043a4, cardImg: 'assets/pepsi.png',            baseReward: 4200 },
];

// Board layout (40 tiles around the edge, clockwise from bottom-left = Start)
// 20 company tiles + 1 blank_company + 1 start + 3 disaster + 4 building_soc
// + 2 news_feed + 3 buy_now + 2 account_report + 2 insurance_broker
// + 1 tax_demand + 1 credit_card = 40
const BOARD_LAYOUT = [
  'start',            'company',          'company',          'disaster',         'insurance_broker',
  'building_soc',     'company',          'company',          'news_feed',        'company',
  'buy_now',          'company',          'company',          'disaster',         'tax_demand',
  'building_soc',     'company',          'company',          'account_report',   'company',
  'buy_now',          'company',          'company',          'company',          'credit_card',
  'building_soc',     'company',          'company',          'news_feed',        'company',
  'buy_now',          'company',          'company',          'disaster',         'insurance_broker',
  'building_soc',     'company',          'company',          'account_report',   'company',
];

// Map company tiles in the board layout to specific companies
const COMPANY_TILE_INDICES = [];
BOARD_LAYOUT.forEach((type, i) => {
  if (type === 'company' || type === 'blank_company') {
    COMPANY_TILE_INDICES.push(i);
  }
});

// Assign companies to tiles
const tileCompanyMap = {};
COMPANY_TILE_INDICES.forEach((tileIdx, i) => {
  tileCompanyMap[tileIdx] = COMPANIES[i % COMPANIES.length];
});

// ===== THREE.JS SETUP =====
const canvas = document.getElementById('game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0xb0d8f0, 30, 70);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
// Start outside the club on the street, looking at the entrance
camera.position.set(0, 3, 16);
camera.lookAt(0, 1, 7.5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 8;
controls.maxDistance = 45;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);

// ===== LIGHTING =====
const ambientLight = new THREE.AmbientLight(0x4a6a8a, 1.2);
scene.add(ambientLight);

// Hemisphere light for natural sky/ground gradient
const hemiLight = new THREE.HemisphereLight(0x3a5a7a, 0x1a1a2e, 0.9);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(8, 16, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// Second directional light from opposite angle for fill
const dirLight2 = new THREE.DirectionalLight(0x6a8aaa, 0.3);
dirLight2.position.set(-6, 10, -6);
scene.add(dirLight2);

const fillLight = new THREE.PointLight(0xabd40a, 0.5, 30);
fillLight.position.set(0, 6, 0);
scene.add(fillLight);

// Accent lights for atmosphere
const accentLight1 = new THREE.PointLight(0x4ecdc4, 0.4, 20);
accentLight1.position.set(-6, 3, -6);
scene.add(accentLight1);

const accentLight2 = new THREE.PointLight(0xe74c3c, 0.3, 20);
accentLight2.position.set(6, 3, 6);
scene.add(accentLight2);

const accentLight3 = new THREE.PointLight(0xf9a825, 0.25, 15);
accentLight3.position.set(0, 4, -8);
scene.add(accentLight3);

// ===== BOARD BASE =====
const baseGeo = new THREE.BoxGeometry(BOARD_WIDTH + 0.5, 0.2, BOARD_WIDTH + 0.5);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x152535, roughness: 0.8, metalness: 0.2 });
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
baseMesh.position.y = -0.15;
baseMesh.receiveShadow = true;
scene.add(baseMesh);

// ===== OUTSIDE AREA (street beyond the club) =====
const OUTSIDE_SIZE = 80;
const groundGeo = new THREE.PlaneGeometry(OUTSIDE_SIZE, OUTSIDE_SIZE);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.95, metalness: 0.05 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.35;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Club floor — dark polished floor extending slightly beyond the board
const clubFloorGeo = new THREE.BoxGeometry(BOARD_WIDTH + 4, 0.08, BOARD_WIDTH + 4);
const clubFloorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.3, metalness: 0.4 });
const clubFloorMesh = new THREE.Mesh(clubFloorGeo, clubFloorMat);
clubFloorMesh.position.y = -0.31;
clubFloorMesh.receiveShadow = true;
scene.add(clubFloorMesh);

// ===== CLUB WALLS (with door opening on front +Z side) =====
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.2;
const HALF_FLOOR = (BOARD_WIDTH + 4) / 2; // 7.5
const DOOR_WIDTH = 2.5;
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.7, metalness: 0.3 });
const wallTrimMat = new THREE.MeshStandardMaterial({ color: 0xabd40a, emissive: 0xabd40a, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.6 });

// Back wall (-Z side, full width)
const backWallGeo = new THREE.BoxGeometry(BOARD_WIDTH + 4, WALL_HEIGHT, WALL_THICKNESS);
const backWall = new THREE.Mesh(backWallGeo, wallMat);
backWall.position.set(0, WALL_HEIGHT / 2 - 0.35, -HALF_FLOOR);
backWall.castShadow = true;
backWall.receiveShadow = true;
scene.add(backWall);

// Front wall (+Z side, split by door)
const frontWallSideWidth = (BOARD_WIDTH + 4 - DOOR_WIDTH) / 2;
const frontWallLeftGeo = new THREE.BoxGeometry(frontWallSideWidth, WALL_HEIGHT, WALL_THICKNESS);
const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, wallMat);
frontWallLeft.position.set(-(DOOR_WIDTH / 2 + frontWallSideWidth / 2), WALL_HEIGHT / 2 - 0.35, HALF_FLOOR);
frontWallLeft.castShadow = true;
frontWallLeft.receiveShadow = true;
scene.add(frontWallLeft);

const frontWallRight = new THREE.Mesh(frontWallLeftGeo, wallMat);
frontWallRight.position.set(DOOR_WIDTH / 2 + frontWallSideWidth / 2, WALL_HEIGHT / 2 - 0.35, HALF_FLOOR);
frontWallRight.castShadow = true;
frontWallRight.receiveShadow = true;
scene.add(frontWallRight);

// Door frame top
const doorTopGeo = new THREE.BoxGeometry(DOOR_WIDTH, 0.3, WALL_THICKNESS);
const doorTop = new THREE.Mesh(doorTopGeo, wallTrimMat);
doorTop.position.set(0, WALL_HEIGHT - 0.35, HALF_FLOOR);
scene.add(doorTop);

// Left wall (-X side, full depth)
const sideWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, BOARD_WIDTH + 4);
const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
leftWall.position.set(-HALF_FLOOR, WALL_HEIGHT / 2 - 0.35, 0);
leftWall.castShadow = true;
leftWall.receiveShadow = true;
scene.add(leftWall);

// Right wall (+X side, full depth)
const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
rightWall.position.set(HALF_FLOOR, WALL_HEIGHT / 2 - 0.35, 0);
rightWall.castShadow = true;
rightWall.receiveShadow = true;
scene.add(rightWall);

// Glowing trim strips along top of all walls
const trimGeo = new THREE.BoxGeometry(BOARD_WIDTH + 4, 0.06, 0.04);
const backTrim = new THREE.Mesh(trimGeo, wallTrimMat);
backTrim.position.set(0, WALL_HEIGHT - 0.35, -HALF_FLOOR + 0.1);
scene.add(backTrim);

const frontTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(frontWallSideWidth, 0.06, 0.04), wallTrimMat);
frontTrimLeft.position.set(-(DOOR_WIDTH / 2 + frontWallSideWidth / 2), WALL_HEIGHT - 0.35, HALF_FLOOR - 0.1);
scene.add(frontTrimLeft);
const frontTrimRight = new THREE.Mesh(new THREE.BoxGeometry(frontWallSideWidth, 0.06, 0.04), wallTrimMat);
frontTrimRight.position.set(DOOR_WIDTH / 2 + frontWallSideWidth / 2, WALL_HEIGHT - 0.35, HALF_FLOOR - 0.1);
scene.add(frontTrimRight);

const sideTrimGeo = new THREE.BoxGeometry(0.04, 0.06, BOARD_WIDTH + 4);
const leftTrim = new THREE.Mesh(sideTrimGeo, wallTrimMat);
leftTrim.position.set(-HALF_FLOOR + 0.1, WALL_HEIGHT - 0.35, 0);
scene.add(leftTrim);
const rightTrim = new THREE.Mesh(sideTrimGeo, wallTrimMat);
rightTrim.position.set(HALF_FLOOR - 0.1, WALL_HEIGHT - 0.35, 0);
scene.add(rightTrim);

// "EXIT" sign above door
const exitSignGeo = new THREE.PlaneGeometry(1.2, 0.3);
const exitCanvas = document.createElement('canvas');
exitCanvas.width = 256;
exitCanvas.height = 64;
const exitCtx = exitCanvas.getContext('2d');
exitCtx.fillStyle = '#0f1923';
exitCtx.fillRect(0, 0, 256, 64);
exitCtx.fillStyle = '#abd40a';
exitCtx.font = 'bold 40px sans-serif';
exitCtx.textAlign = 'center';
exitCtx.textBaseline = 'middle';
exitCtx.fillText('EXIT →', 128, 32);
const exitTex = new THREE.CanvasTexture(exitCanvas);
const exitSignMat = new THREE.MeshBasicMaterial({ map: exitTex, transparent: true });
const exitSign = new THREE.Mesh(exitSignGeo, exitSignMat);
exitSign.position.set(0, WALL_HEIGHT - 0.2, HALF_FLOOR - 0.15);
scene.add(exitSign);

// ===== SKY DOME (stars inside → blue sky outside) =====
const skyGeo = new THREE.SphereGeometry(60, 32, 16);
// Create starfield canvas texture for night sky
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext('2d');
// Dark night gradient
const nightGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
nightGrad.addColorStop(0, '#0a0a18');
nightGrad.addColorStop(0.5, '#0f1923');
nightGrad.addColorStop(1, '#1a1a2e');
skyCtx.fillStyle = nightGrad;
skyCtx.fillRect(0, 0, 1024, 512);
// Stars
for (let i = 0; i < 300; i++) {
  const x = Math.random() * 1024;
  const y = Math.random() * 256;
  const r = Math.random() * 1.5 + 0.3;
  const a = Math.random() * 0.8 + 0.2;
  skyCtx.fillStyle = `rgba(255,255,255,${a})`;
  skyCtx.beginPath();
  skyCtx.arc(x, y, r, 0, Math.PI * 2);
  skyCtx.fill();
}
// Faint moon
skyCtx.fillStyle = 'rgba(200,210,230,0.3)';
skyCtx.beginPath();
skyCtx.arc(750, 80, 20, 0, Math.PI * 2);
skyCtx.fill();
const skyTex = new THREE.CanvasTexture(skyCanvas);
const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, transparent: true, opacity: 0 });
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

// Day sky texture (blue with clouds)
const dayCanvas = document.createElement('canvas');
dayCanvas.width = 1024;
dayCanvas.height = 512;
const dayCtx = dayCanvas.getContext('2d');
const dayGrad = dayCtx.createLinearGradient(0, 0, 0, 512);
dayGrad.addColorStop(0, '#4a90d9');
dayGrad.addColorStop(0.5, '#87ceeb');
dayGrad.addColorStop(1, '#b0d8f0');
dayCtx.fillStyle = dayGrad;
dayCtx.fillRect(0, 0, 1024, 512);
// Simple clouds
for (let i = 0; i < 12; i++) {
  const cx = Math.random() * 1024;
  const cy = Math.random() * 200 + 50;
  const cw = Math.random() * 120 + 60;
  dayCtx.fillStyle = 'rgba(255,255,255,0.4)';
  dayCtx.beginPath();
  dayCtx.ellipse(cx, cy, cw, cw * 0.3, 0, 0, Math.PI * 2);
  dayCtx.fill();
}
const dayTex = new THREE.CanvasTexture(dayCanvas);
const daySkyMat = new THREE.MeshBasicMaterial({ map: dayTex, side: THREE.BackSide, fog: false, transparent: true, opacity: 1 });
const daySkyDome = new THREE.Mesh(skyGeo, daySkyMat);
scene.add(daySkyDome);

// ===== CLUB INTERIOR PROPS =====
// Bar counter along back wall
const barGeo = new THREE.BoxGeometry(6, 1.0, 0.6);
const barMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.3, metalness: 0.5 });
const barCounter = new THREE.Mesh(barGeo, barMat);
barCounter.position.set(-3, 0.15, -HALF_FLOOR + 0.5);
barCounter.castShadow = true;
barCounter.receiveShadow = true;
scene.add(barCounter);

// Bar top (lighter surface)
const barTopGeo = new THREE.BoxGeometry(6, 0.06, 0.7);
const barTopMat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.1, metalness: 0.6 });
const barTop = new THREE.Mesh(barTopGeo, barTopMat);
barTop.position.set(-3, 0.68, -HALF_FLOOR + 0.5);
scene.add(barTop);

// Bar stools
for (let i = 0; i < 4; i++) {
  const stoolGroup = new THREE.Group();
  const stoolLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
  const stoolLegMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
  const stoolLeg = new THREE.Mesh(stoolLegGeo, stoolLegMat);
  stoolLeg.position.y = 0.3;
  stoolGroup.add(stoolLeg);
  const seatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xabd40a, roughness: 0.4, metalness: 0.3, emissive: 0xabd40a, emissiveIntensity: 0.05 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.y = 0.63;
  stoolGroup.add(seat);
  stoolGroup.position.set(-4.5 + i * 2, -0.3, -HALF_FLOOR + 1.2);
  scene.add(stoolGroup);
}

// Potted plants in corners inside
const plantPositions = [
  { x: -HALF_FLOOR + 0.6, z: -HALF_FLOOR + 0.6 },
  { x: HALF_FLOOR - 0.6, z: -HALF_FLOOR + 0.6 },
];
plantPositions.forEach(pos => {
  const plantGroup = new THREE.Group();
  // Pot
  const potGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.5, 8);
  const potMat = new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.8 });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.25;
  pot.castShadow = true;
  plantGroup.add(pot);
  // Foliage — multiple spheres
  for (let i = 0; i < 4; i++) {
    const leafGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.15, 8, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.8 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set((Math.random() - 0.5) * 0.3, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  plantGroup.position.set(pos.x, -0.3, pos.z);
  scene.add(plantGroup);
});

// Lounge seating along left wall
const loungeGeo = new THREE.BoxGeometry(0.6, 0.4, 4);
const loungeMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, roughness: 0.6, metalness: 0.2 });
const lounge = new THREE.Mesh(loungeGeo, loungeMat);
lounge.position.set(-HALF_FLOOR + 0.5, 0.0, 0);
lounge.castShadow = true;
lounge.receiveShadow = true;
scene.add(lounge);

// Lounge cushions
const cushionGeo = new THREE.BoxGeometry(0.5, 0.1, 0.8);
const cushionMat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.5, emissive: 0x4ecdc4, emissiveIntensity: 0.05 });
for (let i = 0; i < 3; i++) {
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.set(-HALF_FLOOR + 0.5, 0.25, -1.3 + i * 1.3);
  cushion.castShadow = true;
  scene.add(cushion);
}

// DJ booth in right-back corner
const djGeo = new THREE.BoxGeometry(1.5, 1.0, 0.8);
const djMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.3, metalness: 0.6 });
const djBooth = new THREE.Mesh(djGeo, djMat);
djBooth.position.set(HALF_FLOOR - 1.2, 0.15, -HALF_FLOOR + 0.8);
djBooth.castShadow = true;
scene.add(djBooth);

// DJ booth top with glowing surface
const djTopGeo = new THREE.BoxGeometry(1.5, 0.04, 0.8);
const djTopMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.1, metalness: 0.9, emissive: 0xabd40a, emissiveIntensity: 0.1 });
const djTop = new THREE.Mesh(djTopGeo, djTopMat);
djTop.position.set(HALF_FLOOR - 1.2, 0.67, -HALF_FLOOR + 0.8);
scene.add(djTop);

// DJ booth light
const djLight = new THREE.PointLight(0xabd40a, 0.3, 4);
djLight.position.set(HALF_FLOOR - 1.2, 0.8, -HALF_FLOOR + 0.8);
scene.add(djLight);

// Street lamps around the outside
const lampPositions = [
  { x: -10, z: -10 }, { x: 10, z: -10 }, { x: -10, z: 10 }, { x: 10, z: 10 },
  { x: -16, z: 0 }, { x: 16, z: 0 }, { x: 0, z: -16 }, { x: 0, z: 16 },
];
const streetLamps = [];
lampPositions.forEach(pos => {
  const lampGroup = new THREE.Group();
  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.6, metalness: 0.7 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2;
  pole.castShadow = true;
  lampGroup.add(pole);
  // Lamp head
  const headGeo = new THREE.SphereGeometry(0.25, 12, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffeaa0, emissive: 0xffeaa0, emissiveIntensity: 0.5, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 4.1;
  lampGroup.add(head);
  // Lamp light
  const lampLight = new THREE.PointLight(0xffeaa0, 0.6, 8);
  lampLight.position.y = 4;
  lampGroup.add(lampLight);
  lampGroup.position.set(pos.x, -0.3, pos.z);
  scene.add(lampGroup);
  streetLamps.push({ group: lampGroup, light: lampLight, head });
});

// Trees outside for atmosphere
const treePositions = [
  { x: -22, z: -8 }, { x: 22, z: 8 }, { x: -8, z: -22 }, { x: 8, z: 22 },
  { x: -20, z: 20 }, { x: 20, z: -20 },
];
treePositions.forEach(pos => {
  const treeGroup = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  treeGroup.add(trunk);
  const leavesGeo = new THREE.SphereGeometry(1, 12, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.8 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 2.2;
  leaves.castShadow = true;
  treeGroup.add(leaves);
  treeGroup.position.set(pos.x, -0.3, pos.z);
  scene.add(treeGroup);
});

// ===== AMBIENT CLUB MUSIC (Web Audio API — generated, no external files) =====
let audioCtx = null;
let musicMaster = null;
let musicStarted = false;

function startClubMusic() {
  if (musicStarted) return;
  musicStarted = true;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicMaster = audioCtx.createGain();
    musicMaster.gain.value = 0.15;
    musicMaster.connect(audioCtx.destination);

    // Low-pass filter for muffled club sound
    const lpFilter = audioCtx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 800;
    lpFilter.connect(musicMaster);

    // Bass drone
    const bassOsc = audioCtx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 55;
    const bassGain = audioCtx.createGain();
    bassGain.gain.value = 0.3;
    bassOsc.connect(bassGain);
    bassGain.connect(lpFilter);
    bassOsc.start();

    // Slow LFO on bass for subtle movement
    const bassLFO = audioCtx.createOscillator();
    bassLFO.frequency.value = 0.1;
    const bassLFOGain = audioCtx.createGain();
    bassLFOGain.gain.value = 5;
    bassLFO.connect(bassLFOGain);
    bassLFOGain.connect(bassOsc.frequency);
    bassLFO.start();

    // Pad chord — three detuned oscillators
    const padFreqs = [220, 277, 330]; // A minor-ish chord
    padFreqs.forEach(freq => {
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(lpFilter);
      osc.start();

      // Slow vibrato
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.3 + Math.random() * 0.2;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
    });

    // Slow kick pulse
    const kickInterval = setInterval(() => {
      if (!audioCtx) return;
      const kick = audioCtx.createOscillator();
      kick.frequency.setValueAtTime(80, audioCtx.currentTime);
      kick.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
      const kickGain = audioCtx.createGain();
      kickGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      kick.connect(kickGain);
      kickGain.connect(musicMaster);
      kick.start();
      kick.stop(audioCtx.currentTime + 0.25);
    }, 600);

    // Hi-hat tick
    const hatInterval = setInterval(() => {
      if (!audioCtx) return;
      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, 2048, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < 2048; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buf;
      const hpFilter = audioCtx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 6000;
      const hatGain = audioCtx.createGain();
      hatGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      noise.connect(hpFilter);
      hpFilter.connect(hatGain);
      hatGain.connect(musicMaster);
      noise.start();
      noise.stop(audioCtx.currentTime + 0.06);
    }, 300);
  } catch (e) {
    console.warn('Audio init failed:', e);
  }
}

// Start music on first user interaction
document.addEventListener('click', () => startClubMusic(), { once: true });
document.addEventListener('keydown', () => startClubMusic(), { once: true });

// ===== ATMOSPHERE TRANSITION (inside club ↔ outside daytime) =====
const ATMOS = {
  insideBg: new THREE.Color(0x0f1923),
  outsideBg: new THREE.Color(0x87ceeb),
  insideFog: new THREE.Color(0x0f1923),
  outsideFog: new THREE.Color(0xb0d8f0),
  insideAmbient: 0.5,
  outsideAmbient: 1.2,
  insideHemi: 0.4,
  outsideHemi: 0.9,
  insideDir: 1.0,
  outsideDir: 1.5,
  insideFogNear: 15,
  outsideFogNear: 30,
  insideFogFar: 35,
  outsideFogFar: 70,
};
const _bgLerp = new THREE.Color();
const _fogLerp = new THREE.Color();

function updateAtmosphere() {
  const dist = camera.position.length();
  // Transition zone: 12 (edge of board) to 22 (well outside)
  const t = Math.max(0, Math.min(1, (dist - 12) / 10));

  _bgLerp.copy(ATMOS.insideBg).lerp(ATMOS.outsideBg, t);
  scene.background = _bgLerp;
  _fogLerp.copy(ATMOS.insideFog).lerp(ATMOS.outsideFog, t);
  scene.fog.color = _fogLerp;
  scene.fog.near = ATMOS.insideFogNear + (ATMOS.outsideFogNear - ATMOS.insideFogNear) * t;
  scene.fog.far = ATMOS.insideFogFar + (ATMOS.outsideFogFar - ATMOS.insideFogFar) * t;

  ambientLight.intensity = ATMOS.insideAmbient + (ATMOS.outsideAmbient - ATMOS.insideAmbient) * t;
  hemiLight.intensity = ATMOS.insideHemi + (ATMOS.outsideHemi - ATMOS.insideHemi) * t;
  dirLight.intensity = ATMOS.insideDir + (ATMOS.outsideDir - ATMOS.insideDir) * t;

  // Accent lights fade out outside (they're club lights)
  const accentFade = 1 - t;
  accentLight1.intensity = 0.4 * accentFade;
  accentLight2.intensity = 0.3 * accentFade;
  accentLight3.intensity = 0.25 * accentFade;
  centerGlow.intensity = (0.6 + Math.sin(performance.now() * 0.001 * 2) * 0.3) * accentFade;

  // Street lamps fade in outside
  streetLamps.forEach(lamp => {
    lamp.light.intensity = 0.6 * t;
    lamp.head.material.emissiveIntensity = 0.5 * t;
  });

  // Sky dome crossfade: night inside, day outside
  skyDome.visible = t < 0.99;
  daySkyDome.visible = t > 0.01;
  skyMat.opacity = 1 - t;
  daySkyMat.opacity = t;
  skyMat.transparent = true;
  daySkyMat.transparent = true;

  // Music volume: full inside, quiet outside
  if (musicMaster && audioCtx) {
    const targetVol = 0.15 * (1 - t * 0.8); // 100% inside, 20% outside
    musicMaster.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.3);
  }
}

// Inner area (the "floor" of the board)
const innerGeo = new THREE.PlaneGeometry(BOARD_WIDTH - 2, BOARD_WIDTH - 2);
const innerMat = new THREE.MeshStandardMaterial({ color: 0x1a2d40, roughness: 0.9 });
const innerMesh = new THREE.Mesh(innerGeo, innerMat);
innerMesh.rotation.x = -Math.PI / 2;
innerMesh.position.y = 0.01;
innerMesh.receiveShadow = true;
scene.add(innerMesh);

// ===== TILE POSITION HELPER =====
// Returns {x, z} world position for a tile index (0-39, clockwise from bottom-left corner)
function getTilePosition(index) {
  const half = (BOARD_SIZE - 1) / 2;
  const edge = BOARD_SIZE - 1;
  let col, row;

  if (index < edge) {
    // Bottom row, left to right
    col = index;
    row = 0;
  } else if (index < edge * 2) {
    // Right column, bottom to top
    col = edge;
    row = index - edge;
  } else if (index < edge * 3) {
    // Top row, right to left
    col = edge - (index - edge * 2);
    row = edge;
  } else {
    // Left column, top to bottom
    col = 0;
    row = edge - (index - edge * 3);
  }

  return {
    x: (col - half) * TILE_SIZE,
    z: (row - half) * TILE_SIZE,
  };
}

// ===== TILE TEXTURE GENERATOR =====
function createTileTexture(config, type, company) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 256;
  canvasEl.height = 256;
  const ctx = canvasEl.getContext('2d');

  // Base colour
  const hexColor = '#' + config.color.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle gradient overlay for depth
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Inner border frame
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 240);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, 232, 232);

  // Company colour band at top
  if (company) {
    const bandColor = '#' + company.colour.toString(16).padStart(6, '0');
    ctx.fillStyle = bandColor;
    ctx.fillRect(12, 12, 232, 30);
    // Company name text
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 14px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(company.name.toUpperCase(), 128, 33);
  }

  // Large icon
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.icon, 128, company ? 120 : 110);

  // Label text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 16px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.label.toUpperCase(), 128, company ? 175 : 165);

  // Tile index number
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Sora, sans-serif';
  ctx.textAlign = 'left';

  const tex = new THREE.CanvasTexture(canvasEl);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ===== 3D DECORATIONS FOR SPECIAL TILES =====
function createTileDecoration(type, pos) {
  const group = new THREE.Group();
  const innerDir = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();

  switch (type) {
    case 'disaster': {
      // Cracked/exclamation cone
      const coneGeo = new THREE.ConeGeometry(0.15, 0.35, 6);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.3, roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.17, pos.z + innerDir.z * 0.15);
      cone.castShadow = true;
      group.add(cone);
      break;
    }
    case 'building_soc': {
      // Small column/pillar
      const colGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, emissive: 0x4ecdc4, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.5 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.15, pos.z + innerDir.z * 0.15);
      col.castShadow = true;
      group.add(col);
      // Roof on top
      const roofGeo = new THREE.ConeGeometry(0.16, 0.12, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d6e3e, roughness: 0.5 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.36, pos.z + innerDir.z * 0.15);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      break;
    }
    case 'news_feed': {
      // Newspaper stack
      const paperGeo = new THREE.BoxGeometry(0.25, 0.04, 0.18);
      const paperMat = new THREE.MeshStandardMaterial({ color: 0xf9a825, emissive: 0xf9a825, emissiveIntensity: 0.1, roughness: 0.6 });
      const paper = new THREE.Mesh(paperGeo, paperMat);
      paper.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.02, pos.z + innerDir.z * 0.15);
      paper.castShadow = true;
      group.add(paper);
      break;
    }
    case 'buy_now': {
      // Shopping bag shape
      const bagGeo = new THREE.BoxGeometry(0.2, 0.25, 0.15);
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xd02f7c, emissive: 0xd02f7c, emissiveIntensity: 0.15, roughness: 0.4 });
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.13, pos.z + innerDir.z * 0.15);
      bag.castShadow = true;
      group.add(bag);
      break;
    }
    case 'account_report': {
      // Clipboard
      const clipGeo = new THREE.BoxGeometry(0.18, 0.02, 0.24);
      const clipMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, emissive: 0x9b59b6, emissiveIntensity: 0.12, roughness: 0.4 });
      const clip = new THREE.Mesh(clipGeo, clipMat);
      clip.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.02, pos.z + innerDir.z * 0.15);
      clip.castShadow = true;
      group.add(clip);
      break;
    }
    case 'insurance_broker': {
      // Shield shape
      const shieldGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.25, 5);
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x2d6e3e, emissive: 0x2d6e3e, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.4 });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.13, pos.z + innerDir.z * 0.15);
      shield.castShadow = true;
      group.add(shield);
      break;
    }
    case 'tax_demand': {
      // Coin stack
      for (let c = 0; c < 3; c++) {
        const coinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, emissive: 0xe67e22, emissiveIntensity: 0.15, roughness: 0.2, metalness: 0.7 });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.02 + c * 0.045, pos.z + innerDir.z * 0.15);
        coin.castShadow = true;
        group.add(coin);
      }
      break;
    }
    case 'credit_card': {
      // Card
      const cardGeo = new THREE.BoxGeometry(0.25, 0.02, 0.16);
      const cardMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad, emissive: 0x8e44ad, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.6 });
      const card = new THREE.Mesh(cardGeo, cardMat);
      card.position.set(pos.x + innerDir.x * 0.15, TILE_HEIGHT + 0.02, pos.z + innerDir.z * 0.15);
      card.castShadow = true;
      group.add(card);
      break;
    }
    case 'start': {
      // Graduation cap — flat square + button
      const capGeo = new THREE.BoxGeometry(0.28, 0.03, 0.28);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(pos.x, TILE_HEIGHT + 0.15, pos.z);
      cap.castShadow = true;
      group.add(cap);
      const buttonGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const buttonMat = new THREE.MeshStandardMaterial({ color: 0xabd40a, emissive: 0xabd40a, emissiveIntensity: 0.3 });
      const button = new THREE.Mesh(buttonGeo, buttonMat);
      button.position.set(pos.x, TILE_HEIGHT + 0.18, pos.z);
      group.add(button);
      break;
    }
  }
  return group;
}

// ===== BUILD TILES =====
const tiles = [];
const tileMeshes = [];
const tileDecorations = [];

BOARD_LAYOUT.forEach((type, i) => {
  const config = SQUARE_TYPES[type];
  const pos = getTilePosition(i);
  const company = (type === 'company' || type === 'blank_company') ? tileCompanyMap[i] : null;

  // Create textured tile
  const tileTex = createTileTexture(config, type, company);
  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, TILE_HEIGHT, TILE_SIZE * 0.95);
  const tileMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    roughness: 0.55,
    metalness: 0.35,
  });
  const tile = new THREE.Mesh(tileGeo, tileMat);
  tile.position.set(pos.x, TILE_HEIGHT / 2, pos.z);
  tile.castShadow = true;
  tile.receiveShadow = true;
  tile.userData = { index: i, type, config };
  scene.add(tile);
  tileMeshes.push(tile);

  // Add edge highlight (thin border frame on top)
  const edgeGeo = new THREE.EdgesGeometry(tileGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.position.copy(tile.position);
  scene.add(edges);

  // Add coloured top strip for company tiles
  if (type === 'company' || type === 'blank_company') {
    const stripColour = company ? company.colour : 0xabd40a;
    const stripGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, 0.04, TILE_SIZE * 0.2);
    const stripMat = new THREE.MeshStandardMaterial({ color: stripColour, roughness: 0.5, emissive: stripColour, emissiveIntensity: 0.15 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    const innerDir = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
    const outerDir = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    strip.position.set(
      pos.x + outerDir.x * TILE_SIZE * 0.35,
      TILE_HEIGHT + 0.02,
      pos.z + outerDir.z * TILE_SIZE * 0.35,
    );
    strip.rotation.y = Math.atan2(innerDir.x, innerDir.z);
    scene.add(strip);
  }

  // Add 3D decoration on special (non-company) tiles
  if (type !== 'company' && type !== 'blank_company') {
    const decoration = createTileDecoration(type, pos);
    if (decoration.children.length > 0) {
      scene.add(decoration);
      tileDecorations.push(decoration);
    }
  }

  tiles.push({ index: i, type, config, pos, mesh: tile });
});

// ===== COMPANY LOGO TEXTURES ON TILES =====
const textureLoader = new THREE.TextureLoader();
const companyLogoPlanes = [];

COMPANY_TILE_INDICES.forEach(tileIdx => {
  const company = tileCompanyMap[tileIdx];
  if (!company) return;
  const pos = getTilePosition(tileIdx);
  const innerDir = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();

  textureLoader.load(
    company.cardImg,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;

      // Flat logo on tile surface
      const logoGeo = new THREE.PlaneGeometry(0.7, 0.5);
      const logoMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
      });
      const logo = new THREE.Mesh(logoGeo, logoMat);

      // Position at inner edge of tile
      logo.position.set(
        pos.x + innerDir.x * TILE_SIZE * 0.28,
        TILE_HEIGHT + 0.03,
        pos.z + innerDir.z * TILE_SIZE * 0.28
      );

      // Lay completely flat — face up
      logo.rotation.x = -Math.PI / 2;

      // Rotate around Y to align with tile edge
      logo.rotation.z = Math.atan2(innerDir.x, innerDir.z);

      scene.add(logo);
      companyLogoPlanes.push(logo);
    },
    undefined,
    (err) => { console.error('[LOGOS] Failed to load:', company.cardImg, err); }
  );
});

// ===== PLAYER TOKENS =====
const TOKEN_COLORS = [0xfc6b6b, 0x4ecdc4, 0xf9a825, 0xabd40a, 0x9b59b6];
const playerTokens = [];

function createToken(color, index) {
  const group = new THREE.Group();

  // Pedestal base — hexagonal disc
  const baseGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.08, 6);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a2d40, roughness: 0.4, metalness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.04;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Coloured ring around pedestal
  const ringGeo = new THREE.TorusGeometry(0.24, 0.02, 6, 16);
  const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.5 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.08;
  group.add(ringMesh);

  // Person figurine — body + head, all in player colour
  const tokenMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.2, metalness: 0.6,
    emissive: color, emissiveIntensity: 0.2,
  });

  // Body — capsule (torso)
  const bodyGeo = new THREE.CapsuleGeometry(0.12, 0.18, 8, 16);
  const bodyMesh = new THREE.Mesh(bodyGeo, tokenMat);
  bodyMesh.position.y = 0.22;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Head — sphere
  const headGeo = new THREE.SphereGeometry(0.1, 20, 20);
  const headMesh = new THREE.Mesh(headGeo, tokenMat);
  headMesh.position.y = 0.40;
  headMesh.castShadow = true;
  group.add(headMesh);

  // Glow light under token
  const glowLight = new THREE.PointLight(color, 0.5, 1.5);
  glowLight.position.y = 0.1;
  group.add(glowLight);

  // Offset tokens on same tile
  const offsets = [
    { x: -0.2, z: -0.2 },
    { x: 0.2, z: -0.2 },
    { x: -0.2, z: 0.2 },
    { x: 0.2, z: 0.2 },
    { x: 0, z: 0 },
  ];

  const startPos = getTilePosition(0);
  group.position.set(
    startPos.x + offsets[index].x,
    TILE_HEIGHT,
    startPos.z + offsets[index].z,
  );

  scene.add(group);
  return { mesh: group, position: 0, offset: offsets[index], color, tokenMesh: bodyMesh, glowLight };
}

// ===== DICE 3D (Green Question Dice per PDF) =====
const diceGroup = new THREE.Group();
const dice = [];

function createDie(offsetX, isQuestionDie) {
  const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const materials = [];
  for (let i = 0; i < 6; i++) {
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 128;
    canvasEl.height = 128;
    const ctx = canvasEl.getContext('2d');
    // White dice for movement, green for question dice
    ctx.fillStyle = isQuestionDie ? '#abd40a' : '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    // Border
    ctx.strokeStyle = isQuestionDie ? '#8ab00a' : '#cccccc';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);
    ctx.fillStyle = '#0f1923';
    drawDots(ctx, i + 1);
    const tex = new THREE.CanvasTexture(canvasEl);
    materials.push(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
  }
  const die = new THREE.Mesh(geo, materials);
  die.position.set(offsetX, 0.5, 0);
  die.castShadow = true;
  diceGroup.add(die);
  return die;
}

function drawDots(ctx, num) {
  const positions = {
    1: [[64, 64]],
    2: [[40, 40], [88, 88]],
    3: [[40, 40], [64, 64], [88, 88]],
    4: [[40, 40], [88, 40], [40, 88], [88, 88]],
    5: [[40, 40], [88, 40], [64, 64], [40, 88], [88, 88]],
    6: [[40, 35], [88, 35], [40, 64], [88, 64], [40, 93], [88, 93]],
  };
  ctx.fillStyle = '#0f1923';
  for (const [x, y] of (positions[num] || [])) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 2 white movement dice + 1 green question die (per PDF)
const die1 = createDie(-0.7, false);
const die2 = createDie(0, false);
const questionDie = createDie(0.7, true);
diceGroup.position.set(0, 0, 0);
scene.add(diceGroup);

// ===== CENTER INFO DISPLAY (per PDF board center) =====
// Stepped platform base
const centerBaseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.08, 32);
const centerBaseMat = new THREE.MeshStandardMaterial({ color: 0x0a1520, roughness: 0.5, metalness: 0.8 });
const centerBaseMesh = new THREE.Mesh(centerBaseGeo, centerBaseMat);
centerBaseMesh.position.y = 0.02;
centerBaseMesh.receiveShadow = true;
scene.add(centerBaseMesh);

const centerGeo = new THREE.CylinderGeometry(2, 2, 0.1, 32);
const centerMat = new THREE.MeshStandardMaterial({ color: 0x0f1923, roughness: 0.5, metalness: 0.7 });
const centerMesh = new THREE.Mesh(centerGeo, centerMat);
centerMesh.position.y = 0.06;
scene.add(centerMesh);

// Center glow light — pulses
const centerGlow = new THREE.PointLight(0xabd40a, 0.8, 8);
centerGlow.position.set(0, 0.5, 0);
scene.add(centerGlow);

// Load logo texture for center display
const logoImg = new Image();
logoImg.crossOrigin = 'anonymous';
logoImg.src = 'assets/hl_logo.png';
let logoLoaded = false;
logoImg.onload = () => { logoLoaded = true; updateInfoDisplay(); };

// Center info display canvas (shows game state + logo)
const infoCanvas = document.createElement('canvas');
infoCanvas.width = 512;
infoCanvas.height = 512;
const infoCtx = infoCanvas.getContext('2d');
const infoTexture = new THREE.CanvasTexture(infoCanvas);

function updateInfoDisplay() {
  const ctx = infoCtx;
  ctx.fillStyle = '#0f1923';
  ctx.fillRect(0, 0, 512, 512);

  // Draw logo large in center
  if (logoLoaded) {
    const logoSize = 300;
    const logoX = 256 - logoSize / 2;
    const logoY = 256 - logoSize / 2;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  }

  // Current player
  const player = gameState.players[gameState.currentPlayer];
  if (player) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.avatar} ${player.name}`, 256, 60);
    ctx.fillStyle = '#abd40a';
    ctx.font = '20px Sora, sans-serif';
    ctx.fillText(`${player.hecu.toLocaleString()} HECU`, 256, 90);
  }

  // Turn phase
  ctx.fillStyle = '#a8c4d8';
  ctx.font = '16px Sora, sans-serif';
  const phaseText = {
    waiting: 'Roll the dice to begin your turn',
    rolling: 'Rolling dice...',
    moving: 'Moving...',
    event: 'Event in progress',
  };
  ctx.fillText(phaseText[gameState.turnPhase] || '', 256, 120);

  // Player standings at bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Standings:', 40, 410);
  gameState.players.forEach((p, i) => {
    const isCurrent = i === gameState.currentPlayer;
    ctx.fillStyle = isCurrent ? '#abd40a' : '#a8c4d8';
    ctx.font = isCurrent ? 'bold 15px Sora, sans-serif' : '13px Sora, sans-serif';
    ctx.fillText(`${p.avatar} ${p.name} — ${p.hecu.toLocaleString()} HECU`, 60, 432 + i * 22);
  });

  infoTexture.needsUpdate = true;
}

const infoPlaneGeo = new THREE.PlaneGeometry(3.2, 3.2);
const infoPlaneMat = new THREE.MeshBasicMaterial({ map: infoTexture, transparent: true });
const infoPlane = new THREE.Mesh(infoPlaneGeo, infoPlaneMat);
infoPlane.rotation.x = -Math.PI / 2;
infoPlane.position.y = 0.15;
scene.add(infoPlane);

// 3D Logo removed — logo is now in center display only

// ===== GAME STATE =====
const gameState = {
  players: [],
  currentPlayer: 0,
  isRolling: false,
  isMoving: false,
  turnPhase: 'waiting', // waiting, rolling, moving, event, question
  // Company ownership: tileIndex -> { ownerId, workers: [] }
  companyOwnership: {},
  // Question flow state
  questionFlow: {
    active: false,
    tileIndex: null,
    company: null,
    playerId: null,
    landingPlayerId: null,
    phase: null, // advert, question, answer, result
    timer: 0,
    timerInterval: null,
    boffinUsed: false,
    rewardValue: 0,
    isConsultation: false,
    consultingPlayer: null,
    isOwnCompany: false,
    question: null,
    currentCorrectIdx: undefined,
  },
  lastDiceRoll: 0,
  mode: 'free', // 'free' (non-prize) or a ticket tier: bronze/silver/gold/platinum/diamond
  gameStarted: false,
};

// ===== BOFFINS SYSTEM (Rules of Play) =====
// Three types: Junior and Senior eliminate wrong answers; Major swaps the
// question for another. Acquired via Gold Coins (expire at end of game) or by
// cash purchase (return to the Personal Game Account if unused).
const BOFFIN_TYPES = [
  { id: 'junior', name: 'Junior Boffin', icon: '💡', eliminates: 1, coinCost: 3, cashPricePence: 50,  desc: 'Removes 1 wrong answer' },
  { id: 'senior', name: 'Senior Boffin', icon: '✂️', eliminates: 2, coinCost: 5, cashPricePence: 100, desc: 'Removes 2 wrong answers' },
  { id: 'major',  name: 'Major Boffin',  icon: '🎓', swapQuestion: true, coinCost: 8, cashPricePence: 200, desc: 'Swaps question for another' },
];

// ===== PLAYER ACCOUNT / GAME MODES =====
// The local user always occupies seat 0; other seats are remote players.
const HUMAN_PLAYER = 0;
const GAME_MODES = ['free', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
const NEXT_TIER = { bronze: 'silver', silver: 'gold', gold: 'platinum', platinum: 'diamond', diamond: null };
let selectedMode = 'free';
let acct = window.PlayerAccount || null;

// ===== INSURANCE POLICIES =====
const INSURANCE_POLICIES = [
  { id: 'basic',     name: 'Basic Policy',     price: 500,  colour: 0x95a5a6, cover: 'Dice total 2-5 only' },
  { id: 'bronze',    name: 'Bronze Policy',    price: 750,  colour: 0xcd7f32, cover: 'Dice total 2-5, disasters only' },
  { id: 'silver',    name: 'Silver Policy',    price: 1000, colour: 0xc0c0c0, cover: 'Dice total 2-6' },
  { id: 'gold',      name: 'Gold Policy',      price: 1200, colour: 0xffd700, cover: 'Dice total 2-7 + 50% Court Claims' },
  { id: 'platinum',  name: 'Platinum Policy',  price: 1500, colour: 0xe5e4e2, cover: 'Highest coverage' },
];

// ===== ASSET ITEMS (10 different items needed to win) =====
const ASSET_ITEMS = [
  { id: 1,  name: 'House',           stars: 5, price: 25000, icon: '🏠' },
  { id: 2,  name: 'Car',             stars: 4, price: 18000, icon: '🚗' },
  { id: 3,  name: 'Yacht',           stars: 5, price: 35000, icon: '🛥️' },
  { id: 4,  name: 'Art Collection',  stars: 3, price: 12000, icon: '🖼️' },
  { id: 5,  name: 'Jewellery',       stars: 4, price: 15000, icon: '💎' },
  { id: 6,  name: 'Home Cinema',     stars: 2, price: 8000,  icon: '🎬' },
  { id: 7,  name: 'Gym Equipment',   stars: 2, price: 6000,  icon: '🏋️' },
  { id: 8,  name: 'Music Studio',    stars: 3, price: 10000, icon: '🎵' },
  { id: 9,  name: 'Holiday Home',    stars: 4, price: 20000, icon: '🏖️' },
  { id: 10, name: 'Wine Cellar',     stars: 3, price: 11000, icon: '🍷' },
];

// ===== BANK LOANS =====
const BANK_LOANS = [
  { id: 'loan_20k', value: 20000, label: '£20,000 Loan' },
  { id: 'loan_40k', value: 40000, label: '£40,000 Loan' },
  { id: 'loan_80k', value: 80000, label: '£80,000 Loan' },
];
const LOAN_INTEREST_RATE = 0.05; // 5% every 2nd Building Society pass

// ===== TEAM WORKER 3D OBJECTS =====
const teamWorkerMeshes = {}; // tileIndex -> array of meshes

function createTeamWorker(tileIndex, playerIndex) {
  const pos = getTilePosition(tileIndex);
  const playerColor = TOKEN_COLORS[playerIndex];
  const geo = new THREE.CapsuleGeometry(0.08, 0.12, 4, 8);
  const mat = new THREE.MeshStandardMaterial({ color: playerColor, roughness: 0.3, metalness: 0.6, emissive: playerColor, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.userData.playerId = playerIndex;

  // Count existing workers on this tile
  const existing = teamWorkerMeshes[tileIndex] || [];
  const workerCount = existing.length;
  const angle = (workerCount / 6) * Math.PI * 2;
  const radius = 0.25;
  mesh.position.set(
    pos.x + Math.cos(angle) * radius,
    TILE_HEIGHT + 0.15,
    pos.z + Math.sin(angle) * radius,
  );
  scene.add(mesh);

  if (!teamWorkerMeshes[tileIndex]) teamWorkerMeshes[tileIndex] = [];
  teamWorkerMeshes[tileIndex].push(mesh);
  return mesh;
}

// ===== ANIMATE TOKEN MOVEMENT =====
async function moveToken(token, fromIndex, toIndex) {
  const steps = [];
  let diff = toIndex - fromIndex;
  if (diff < 0) diff += BOARD_LAYOUT.length;
  for (let i = 1; i <= diff; i++) {
    steps.push((fromIndex + i) % BOARD_LAYOUT.length);
  }
  for (const step of steps) {
    const pos = getTilePosition(step);
    const startY = token.mesh.position.y;
    const targetY = TILE_HEIGHT;

    // Hop animation
    const duration = sim.active ? (sim.speed === 'turbo' ? 80 : sim.speed === 'fast' ? 150 : sim.speed === 'normal' ? 300 : 400) : 300;
    const startTime = performance.now();

    await new Promise(resolve => {
      function animate() {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easeT = 1 - Math.pow(1 - t, 3);

        token.mesh.position.x = THREE.MathUtils.lerp(token.mesh.position.x, pos.x + token.offset.x, easeT);
        token.mesh.position.z = THREE.MathUtils.lerp(token.mesh.position.z, pos.z + token.offset.z, easeT);
        // Hop arc
        token.mesh.position.y = startY + Math.sin(t * Math.PI) * 0.5;

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          token.mesh.position.y = targetY;
          resolve();
        }
      }
      animate();
    });
  }
  token.position = toIndex;
}

// ===== TILE HIGHLIGHT =====
let highlightedTile = null;
let highlightPulse = 0;

function highlightTile(tileIndex) {
  // Remove previous highlight
 if (highlightedTile !== null && tiles[highlightedTile]) {
    tiles[highlightedTile].mesh.material.emissive.setHex(0x000000);
    tiles[highlightedTile].mesh.material.emissiveIntensity = 0;
  }
  highlightedTile = tileIndex;
  highlightPulse = 0;
}

function updateTileHighlight() {
  if (highlightedTile === null || !tiles[highlightedTile]) return;
  highlightPulse += 0.05;
  const intensity = 0.25 + Math.sin(highlightPulse) * 0.15;
  tiles[highlightedTile].mesh.material.emissive.setHex(0xabd40a);
  tiles[highlightedTile].mesh.material.emissiveIntensity = intensity;
}

// ===== CAMERA TRACKING (follow active player in sim mode) =====
let camTrackTarget = null;
let camTrackEnabled = false;

function updateCameraTracking() {
  if (!camTrackEnabled || !camTrackTarget) return;
  // Smoothly look at the tracked token
  const targetPos = camTrackTarget.mesh.position;
  controls.target.lerp(targetPos, 0.04);
}

// ===== ROLL DICE =====
async function rollDice() {
  if (gameState.isRolling || gameState.isMoving) return;
  clearIdleWatch();
  gameState.isRolling = true;
  gameState.turnPhase = 'rolling';

  const rollBtn = document.getElementById('roll-btn');
  rollBtn.disabled = true;
  rollBtn.textContent = 'Rolling…';

  // Animate dice
  document.getElementById('die-1').classList.add('rolling');
  document.getElementById('die-2').classList.add('rolling');
  document.getElementById('question-die').classList.add('rolling');

  // Spin 3D dice
  const spinDuration = sim.active ? (sim.speed === 'turbo' ? 200 : sim.speed === 'fast' ? 400 : sim.speed === 'normal' ? 700 : 900) : 800;
  const startTime = performance.now();
  const startRot1 = { x: 0, y: 0, z: 0 };
  const startRot2 = { x: 0, y: 0, z: 0 };
  const startRotQ = { x: 0, y: 0, z: 0 };
  const endRot1 = { x: Math.PI * 2 * 3, y: Math.PI * 2 * 2, z: Math.PI * 2 };
  const endRot2 = { x: Math.PI * 2 * 2, y: Math.PI * 2 * 3, z: Math.PI * 2 * 1.5 };
  const endRotQ = { x: Math.PI * 2 * 4, y: Math.PI * 2 * 1.5, z: Math.PI * 2 * 2 };

  await new Promise(resolve => {
    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / spinDuration, 1);
      const easeT = 1 - Math.pow(1 - t, 2);

      die1.rotation.x = THREE.MathUtils.lerp(startRot1.x, endRot1.x, easeT);
      die1.rotation.y = THREE.MathUtils.lerp(startRot1.y, endRot1.y, easeT);
      die1.rotation.z = THREE.MathUtils.lerp(startRot1.z, endRot1.z, easeT);

      die2.rotation.x = THREE.MathUtils.lerp(startRot2.x, endRot2.x, easeT);
      die2.rotation.y = THREE.MathUtils.lerp(startRot2.y, endRot2.y, easeT);
      die2.rotation.z = THREE.MathUtils.lerp(startRot2.z, endRot2.z, easeT);

      questionDie.rotation.x = THREE.MathUtils.lerp(startRotQ.x, endRotQ.x, easeT);
      questionDie.rotation.y = THREE.MathUtils.lerp(startRotQ.y, endRotQ.y, easeT);
      questionDie.rotation.z = THREE.MathUtils.lerp(startRotQ.z, endRotQ.z, easeT);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    animate();
  });

  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const questionRoll = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2;

  // Show dice values in UI
  document.getElementById('die-1').textContent = roll1;
  document.getElementById('die-2').textContent = roll2;
  document.getElementById('question-die').textContent = questionRoll;

  // Set 3D dice to show the rolled values (simplified - just set rotation)
  die1.rotation.set(0, 0, 0);
  die2.rotation.set(0, 0, 0);
  questionDie.rotation.set(0, 0, 0);

  gameState.isRolling = false;
  gameState.isMoving = true;
  gameState.turnPhase = 'moving';
  gameState.lastDiceRoll = total;

  try {
    // Move current player's token
    const token = playerTokens[gameState.currentPlayer];
    if (token) {
      const newPos = (token.position + total) % BOARD_LAYOUT.length;
      await moveToken(token, token.position, newPos);

      // Highlight the landed tile
      highlightTile(newPos);

      // Particle burst on landing
      const tileColor = SQUARE_TYPES[BOARD_LAYOUT[newPos]]?.color || 0xabd40a;
      burstAtTile(newPos, tileColor);

      // Trigger event for landed square
      showSquareEvent(newPos);
    }
  } catch (err) {
    console.error('Error during token movement/event:', err);
  }

  gameState.isMoving = false;
  gameState.turnPhase = 'event';
}

// ===== COMPANY SQUARE DICE (colour-banded) =====
function rollCompanyDice(company) {
  const roll = Math.floor(Math.random() * 6) + 1;
  const multiplier = roll / 6; // 1/6 to 1.0
  return Math.round(company.baseReward * multiplier);
}

// ===== COMPANY-SPECIFIC QUESTIONS =====
const COMPANY_QUESTIONS = {
  1: [ // American Airlines
    { question: 'What industry is American Airlines in?', options: ['Aviation', 'Banking', 'Agriculture', 'Mining'], correct: 0 },
    { question: 'American Airlines primarily offers what service?', options: ['Passenger flights', 'Cargo shipping only', 'Train travel', 'Bus routes'], correct: 0 },
    { question: 'What type of aircraft does American Airlines operate?', options: ['Commercial jets', 'Helicopters', 'Gliders', 'Spacecraft'], correct: 0 },
  ],
  2: [ // Asda
    { question: 'What type of store is Asda?', options: ['Supermarket', 'Car dealership', 'Pharmacy', 'Bookstore'], correct: 0 },
    { question: 'Asda is best known for selling what?', options: ['Groceries', 'Electronics only', 'Furniture', 'Jewellery'], correct: 0 },
    { question: 'Which country did Asda originate in?', options: ['UK', 'USA', 'Germany', 'Japan'], correct: 0 },
  ],
  3: [ // Bakery
    { question: 'What does a bakery primarily produce?', options: ['Bread and pastries', 'Electronics', 'Clothing', 'Furniture'], correct: 0 },
    { question: 'What is the main ingredient in most bakery products?', options: ['Flour', 'Plastic', 'Steel', 'Wood'], correct: 0 },
    { question: 'Which of these is a common bakery item?', options: ['Croissant', 'Smartphone', 'Shovel', 'Tyre'], correct: 0 },
  ],
  4: [ // Black & Decker
    { question: 'What does Black & Decker manufacture?', options: ['Power tools', 'Food products', 'Clothing', 'Software'], correct: 0 },
    { question: 'Black & Decker is best known for what?', options: ['Drills and saws', 'Bread', 'Shoes', 'Books'], correct: 0 },
    { question: 'Which product would you buy from Black & Decker?', options: ['Cordless drill', 'Loaf of bread', 'Pair of jeans', 'Novel'], correct: 0 },
  ],
  5: [ // British Airways
    { question: 'What is British Airways\' primary service?', options: ['Air travel', 'Sea freight', 'Rail transport', 'Bus service'], correct: 0 },
    { question: 'British Airways is the flag carrier of which country?', options: ['United Kingdom', 'France', 'Spain', 'Italy'], correct: 0 },
    { question: 'Where is British Airways\' main hub?', options: ['London Heathrow', 'New York JFK', 'Tokyo Haneda', 'Sydney'], correct: 0 },
  ],
  6: [ // Banking Group
    { question: 'What service does a Banking Group provide?', options: ['Financial services', 'Air travel', 'Food delivery', 'Car repair'], correct: 0 },
    { question: 'Which of these is a banking product?', options: ['Savings account', 'Airline ticket', 'Loaf of bread', 'Power drill'], correct: 0 },
    { question: 'What would you use a bank for?', options: ['Storing money', 'Buying groceries', 'Booking flights', 'Repairing tools'], correct: 0 },
  ],
  7: [ // Bicycling
    { question: 'What product is associated with Bicycling?', options: ['Bicycles', 'Aeroplanes', 'Ships', 'Trains'], correct: 0 },
    { question: 'What do you need to ride a bicycle?', options: ['Balance and pedals', 'A pilot licence', 'A captain\'s ticket', 'A driving licence'], correct: 0 },
    { question: 'Bicycles are primarily powered by what?', options: ['Human pedalling', 'Petrol engine', 'Jet engine', 'Sails'], correct: 0 },
  ],
  8: [ // Cornerstone
    { question: 'What does Cornerstone likely provide?', options: ['Building materials', 'Airline tickets', 'Groceries', 'Software'], correct: 0 },
    { question: 'A cornerstone is traditionally used in what?', options: ['Construction', 'Aviation', 'Cooking', 'Banking'], correct: 0 },
    { question: 'Which material might Cornerstone supply?', options: ['Stone and brick', 'Aircraft parts', 'Fresh bread', 'Bank cards'], correct: 0 },
  ],
  9: [ // Enterprise
    { question: 'Enterprise is best known for what service?', options: ['Car rental', 'Food delivery', 'Banking', 'Insurance'], correct: 0 },
    { question: 'What would you rent from Enterprise?', options: ['A vehicle', 'A house', 'A boat', 'A plane'], correct: 0 },
    { question: 'Enterprise operates primarily in which sector?', options: ['Transport', 'Food', 'Finance', 'Technology'], correct: 0 },
  ],
  10: [ // Food Co
    { question: 'What does Food Co produce?', options: ['Food products', 'Software', 'Aircraft', 'Power tools'], correct: 0 },
    { question: 'Which would you buy from Food Co?', options: ['Packaged meals', 'Drill bits', 'Flight tickets', 'Savings plans'], correct: 0 },
    { question: 'Food Co operates in which industry?', options: ['Food and beverage', 'Aerospace', 'Construction', 'Banking'], correct: 0 },
  ],
  11: [ // Horizon
    { question: 'Horizon is likely in which business sector?', options: ['Technology/Telecoms', 'Bakery', 'Car rental', 'Bicycles'], correct: 0 },
    { question: 'The word horizon is associated with what?', options: ['Looking forward/vision', 'Baking bread', 'Driving cars', 'Riding bikes'], correct: 0 },
    { question: 'Which service might Horizon provide?', options: ['Communication services', 'Fresh pastries', 'Vehicle hire', 'Tool repair'], correct: 0 },
  ],
  12: [ // Media Group
    { question: 'What does a Media Group produce?', options: ['Content and advertising', 'Food products', 'Power tools', 'Aircraft'], correct: 0 },
    { question: 'Which would you get from a Media Group?', options: ['TV programmes', 'Loaf of bread', 'Cordless drill', 'Airline ticket'], correct: 0 },
    { question: 'Media Groups primarily work with what?', options: ['Information and entertainment', 'Baking ingredients', 'Construction materials', 'Flight schedules'], correct: 0 },
  ],
  13: [ // Kleeneze
    { question: 'Kleeneze is known for what type of sales?', options: ['Door-to-door catalogue', 'Online only', 'Supermarket', 'Wholesale only'], correct: 0 },
    { question: 'What products does Kleeneze typically sell?', options: ['Household goods', 'Aircraft parts', 'Fresh food', 'Banking services'], correct: 0 },
    { question: 'How did Kleeneze originally reach customers?', options: ['Catalogue distribution', 'TV adverts', 'Billboards', 'Radio'], correct: 0 },
  ],
  14: [ // Kwik Fit
    { question: 'What service does Kwik Fit provide?', options: ['Tyre and exhaust fitting', 'Baking', 'Banking', 'Air travel'], correct: 0 },
    { question: 'What would you take to Kwik Fit?', options: ['A car for repairs', 'A loaf for baking', 'Money for saving', 'A suitcase for flying'], correct: 0 },
    { question: 'Kwik Fit operates in which industry?', options: ['Automotive repair', 'Food', 'Finance', 'Aviation'], correct: 0 },
  ],
  15: [ // Ferries
    { question: 'What do Ferries transport?', options: ['Passengers and vehicles across water', 'Goods by air', 'Food by road', 'Money by wire'], correct: 0 },
    { question: 'A ferry travels on what?', options: ['Water', 'Air', 'Road', 'Rail'], correct: 0 },
    { question: 'Where would you board a ferry?', options: ['A port', 'An airport', 'A garage', 'A bakery'], correct: 0 },
  ],
  16: [ // Retail Co
    { question: 'What does Retail Co operate?', options: ['Retail stores', 'Airlines', 'Bakeries', 'Banks'], correct: 0 },
    { question: 'Where do you go to shop at Retail Co?', options: ['A shop or store', 'An airport', 'A port', 'A garage'], correct: 0 },
    { question: 'Retail Co sells goods how?', options: ['Directly to consumers', 'Only wholesale', 'Only online', 'Only by mail'], correct: 0 },
  ],
  17: [ // Pizza Hut
    { question: 'What does Pizza Hut sell?', options: ['Pizza', 'Aircraft', 'Power tools', 'Banking services'], correct: 0 },
    { question: 'Pizza Hut is what type of establishment?', options: ['Restaurant', 'Bank', 'Garage', 'Airport'], correct: 0 },
    { question: 'How is Pizza Hut food typically delivered?', options: ['Dine-in and delivery', 'Only by ship', 'Only by plane', 'Only by train'], correct: 0 },
  ],
  18: [ // Rolex
    { question: 'What does Rolex manufacture?', options: ['Luxury watches', 'Bread', 'Aircraft', 'Bicycles'], correct: 0 },
    { question: 'Rolex is known for what quality?', options: ['Precision and luxury', 'Fast food', 'Cheap tools', 'Budget travel'], correct: 0 },
    { question: 'Where would you buy a Rolex?', options: ['Jewellery shop', 'Bakery', 'Garage', 'Supermarket'], correct: 0 },
  ],
  19: [ // S&S Carpets
    { question: 'What does S&S Carpets sell?', options: ['Flooring and carpets', 'Watches', 'Aircraft tickets', 'Food'], correct: 0 },
    { question: 'Where would you install carpets?', options: ['On floors', 'On aircraft wings', 'In ovens', 'On bicycle wheels'], correct: 0 },
    { question: 'S&S Carpets operates in which industry?', options: ['Home furnishing', 'Aviation', 'Food', 'Automotive'], correct: 0 },
  ],
  20: [ // Photographic
    { question: 'What does a Photographic company deal with?', options: ['Cameras and images', 'Bread', 'Car tyres', 'Bank accounts'], correct: 0 },
    { question: 'A photographer primarily works with what?', options: ['Cameras and lighting', 'Ovens and flour', 'Tyres and engines', 'Money and loans'], correct: 0 },
    { question: 'Which product would a Photographic company sell?', options: ['Camera lenses', 'Loaves of bread', 'Exhaust pipes', 'Savings accounts'], correct: 0 },
  ],
  21: [ // Pepsi
    { question: 'What does Pepsi manufacture?', options: ['Soft drinks', 'Aircraft', 'Power tools', 'Watches'], correct: 0 },
    { question: 'Pepsi is best known for what beverage?', options: ['Cola', 'Orange juice', 'Milk', 'Coffee'], correct: 0 },
    { question: 'Which is a Pepsi product line?', options: ['Pepsi Max', 'Pepsi Air', 'Pepsi Drill', 'Pepsi Watch'], correct: 0 },
  ],
};

// Generic fallback questions
const GENERIC_QUESTIONS = [
  { question: 'What is the primary service of this company?', options: ['Its core business', 'Unrelated service', 'Something else', 'Nothing'], correct: 0 },
  { question: 'What does this company sell?', options: ['Its main product', 'Random goods', 'Nothing', 'Everything'], correct: 0 },
];

function getRandomQuestion(companyId, exclude = null) {
  let pool = (companyId && COMPANY_QUESTIONS[companyId]) ? COMPANY_QUESTIONS[companyId] : GENERIC_QUESTIONS;
  if (exclude) {
    const filtered = pool.filter(q => q.question !== exclude.question);
    if (filtered.length > 0) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ===== SHOW SQUARE EVENT =====
function showSquareEvent(tileIndex) {
  const tile = tiles[tileIndex];
  if (!tile) return;

  const tileType = tile.type;

  // Company squares get the full question flow
  if (tileType === 'company' || tileType === 'blank_company') {
    handleCompanySquare(tileIndex);
    return;
  }

  // Route to specific square handlers
  const handlers = {
    start: handleTrainingGrant,
    disaster: handleDisaster,
    building_soc: handleBuildingSociety,
    news_feed: handleNewsFeed,
    buy_now: handleBuyNow,
    account_report: handleAccountReport,
    insurance_broker: handleInsuranceBroker,
    tax_demand: handleTaxDemand,
    credit_card: handleCreditCard,
  };

  const handler = handlers[tileType];
  if (handler) {
    handler(tileIndex);
  } else {
    showSimpleEvent(tile.config.icon, tile.config.label, 'You landed on a square.', 'Continue', () => nextTurn());
  }
}

// ===== HELPER: Show simple event modal =====
function showSimpleEvent(icon, title, desc, btnText, onContinue) {
  const modal = document.getElementById('event-modal');
  document.getElementById('event-icon').textContent = icon;
  document.getElementById('event-title').textContent = title;
  document.getElementById('event-desc').textContent = desc;
  const btnEl = document.getElementById('event-btn');
  btnEl.textContent = btnText;
  modal.classList.add('is-open');
  btnEl.onclick = () => {
    modal.classList.remove('is-open');
    if (onContinue) onContinue();
  };
}

// ===== HELPER: Show toast =====
function showToast(msg) {
  const toast = document.getElementById('game-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== HELPER: Count total team workers for a player =====
function countTeamWorkers(playerId) {
  let count = 0;
  for (const tileIdx in gameState.companyOwnership) {
    const ownership = gameState.companyOwnership[tileIdx];
    if (ownership.ownerId === playerId && ownership.workers) {
      count += ownership.workers.length;
    }
  }
  return count;
}

// ===== TRAINING GRANT SQUARE =====
function handleTrainingGrant(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const workerCount = countTeamWorkers(gameState.currentPlayer);
  const payment = workerCount * 200;

  if (workerCount > 0) {
    player.hecu += payment;
    showSimpleEvent('🎓', 'Training Grant Square',
      `You have ${workerCount} Team Worker${workerCount > 1 ? 's' : ''} on the Game Board.\nCollect ${payment.toLocaleString()} HECUs from Game Bank.`,
      'Collect', () => { updateUI(); nextTurn(); });
  } else {
    showSimpleEvent('🎓', 'Training Grant Square',
      'You have no Team Workers yet. Land on Company Squares and answer questions correctly to gain Team Workers.',
      'Continue', () => nextTurn());
  }
}

// ===== TAX DEMAND SQUARE =====
function handleTaxDemand(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const amounts = [500, 2500, 5000];
  const tax = amounts[Math.floor(Math.random() * amounts.length)];

  if (player.hecu >= tax) {
    player.hecu -= tax;
    showSimpleEvent('💰', 'Tax Demand Square',
      `A random tax demand of ${tax.toLocaleString()} HECUs has been automatically taken from your Personal Game Account.\nNo insurance covers this demand.\nYour balance: ${player.hecu.toLocaleString()} HECUs.`,
      'Continue', () => { updateUI(); nextTurn(); });
  } else {
    const shortfall = tax - player.hecu;
    player.hecu = 0;
    showSimpleEvent('💰', 'Tax Demand — Insufficient Funds!',
      `Tax demand: ${tax.toLocaleString()} HECUs.\nYou are ${shortfall.toLocaleString()} HECUs short. Bankruptcy proceedings may follow.`,
      'Continue', () => { updateUI(); if (!checkBankruptcy(gameState.currentPlayer)) nextTurn(); });
  }
}

// ===== CREDIT CARD SQUARE =====
function handleCreditCard(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const diceTotal = gameState.lastDiceRoll || 2;
  const bill = diceTotal * 100;

  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">💳</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Credit Card Statement</h2>
    <p style="color:#a8c4d8;font-size:.9rem;margin-bottom:16px">
      Your Credit Card bill is <strong style="color:#abd40a">${bill.toLocaleString()} HECUs</strong><br>
      (100 × your dice roll of ${diceTotal})<br>
      Your balance: ${player.hecu.toLocaleString()} HECUs
    </p>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#abd40a;margin:12px 0" id="cc-timer">5</div>
    <p style="color:#fc6b6b;font-size:.8rem;margin-bottom:16px">Click payment button within 5 seconds or face bankruptcy!</p>
    <button class="advert-click-btn" id="cc-pay-btn">Pay ${bill.toLocaleString()} HECUs Now</button>
  `;

  modal.classList.add('is-open');
  gameState.turnPhase = 'event';

  let timeLeft = simTimer(5);
  const timerEl = document.getElementById('cc-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      modal.classList.remove('is-open');
      if (player.hecu >= bill) {
        player.hecu -= bill;
        showToast(`Credit Card paid: ${bill.toLocaleString()} HECUs deducted`);
        updateUI();
        nextTurn();
      } else {
        player.hecu = 0;
        showToast('Insufficient funds for Credit Card bill!');
        updateUI();
        if (!checkBankruptcy(gameState.currentPlayer)) nextTurn();
      }
    }
  }, 1000);

  document.getElementById('cc-pay-btn').onclick = () => {
    clearInterval(interval);
    modal.classList.remove('is-open');
    if (player.hecu >= bill) {
      player.hecu -= bill;
      addCogPoints(gameState.currentPlayer, 3, 'credit-card');
      showToast(`Credit Card paid: ${bill.toLocaleString()} HECUs deducted`);
      updateUI();
      nextTurn();
    } else {
      player.hecu = 0;
      showToast('Insufficient funds for Credit Card bill!');
      updateUI();
      if (!checkBankruptcy(gameState.currentPlayer)) nextTurn();
    }
  };
}

// ===== INSURANCE BROKER SQUARE =====
function handleInsuranceBroker(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  const currentPolicy = player.insurancePolicy
    ? INSURANCE_POLICIES.find(p => p.id === player.insurancePolicy)
    : null;

  let policiesHtml = INSURANCE_POLICIES.map(p => {
    const canAfford = player.hecu >= p.price;
    const isCurrent = currentPolicy && currentPolicy.id === p.id;
    return `
      <button class="boffin-btn" data-policy="${p.id}" ${isCurrent || !canAfford ? 'disabled style="opacity:.4"' : ''}>
        <span class="boffin-icon">🛡️</span>
        <span class="boffin-name">${p.name} — ${p.price} HECUs</span>
        <span class="boffin-reward">${isCurrent ? 'HELD' : canAfford ? p.cover : 'Insufficient'}</span>
      </button>
    `;
  }).join('');

  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">🛡️</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Insurance Broker</h2>
    <p style="color:#a8c4d8;font-size:.85rem;margin-bottom:12px">
      ${currentPolicy ? 'You currently hold: <strong style="color:#abd40a">' + currentPolicy.name + '</strong>. Surrender it to upgrade.' : 'You hold no insurance policy.'}<br>
      Balance: ${player.hecu.toLocaleString()} HECUs
    </p>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#abd40a;margin:8px 0" id="ins-timer">5</div>
    <p style="color:#a8c4d8;font-size:.8rem;margin-bottom:12px">Select a policy within 5 seconds or move ends.</p>
    <div style="text-align:left">${policiesHtml}</div>
    <button class="advert-click-btn" id="ins-skip-btn" style="margin-top:12px;background:rgba(255,255,255,.1);color:#a8c4d8">Skip</button>
  `;

  modal.classList.add('is-open');
  gameState.turnPhase = 'event';

  let timeLeft = simTimer(5);
  const timerEl = document.getElementById('ins-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      modal.classList.remove('is-open');
      showToast('Time expired. Move ends.');
      nextTurn();
    }
  }, 1000);

  content.querySelectorAll('[data-policy]').forEach(btn => {
    btn.onclick = () => {
      clearInterval(interval);
      const policyId = btn.dataset.policy;
      const policy = INSURANCE_POLICIES.find(p => p.id === policyId);
      if (player.hecu >= policy.price) {
        player.hecu -= policy.price;
        player.insurancePolicy = policyId;
        addCogPoints(gameState.currentPlayer, 4, 'insurance');
        showToast(`Purchased ${policy.name} for ${policy.price} HECUs`);
        updateUI();
      }
      modal.classList.remove('is-open');
      nextTurn();
    };
  });

  document.getElementById('ins-skip-btn').onclick = () => {
    clearInterval(interval);
    modal.classList.remove('is-open');
    nextTurn();
  };
}

// ===== DISASTER SQUARE =====
function handleDisaster(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const hasInsurance = player.insurancePolicy !== null;
  const hasAssets = player.assets && player.assets.length > 0;

  if (!hasAssets) {
    showSimpleEvent('💥', 'Disaster Square',
      'A disaster occurred, but you have no Asset Items to be damaged. You are safe this time.',
      'Continue', () => nextTurn());
    return;
  }

  if (hasInsurance) {
    const policy = INSURANCE_POLICIES.find(p => p.id === player.insurancePolicy);
    showSimpleEvent('💥', 'Disaster Square — Insured!',
      `A disaster struck! Your ${policy.name} covers this event.\nNo excess payment required. Your assets are protected.`,
      'Continue', () => nextTurn());
  } else {
    const excess = Math.floor(Math.random() * 3000) + 1000;
    if (player.hecu >= excess) {
      player.hecu -= excess;
      showSimpleEvent('💥', 'Disaster Square — No Insurance!',
      `A disaster struck! You have no insurance coverage.\nExcess payment of ${excess.toLocaleString()} HECUs taken from your account.\nBalance: ${player.hecu.toLocaleString()} HECUs.`,
      'Continue', () => { updateUI(); nextTurn(); });
    } else {
      player.hecu = 0;
      showSimpleEvent('💥', 'Disaster Square — Bankruptcy Risk!',
      `A disaster struck! Excess payment of ${excess.toLocaleString()} HECUs required.\nYou have insufficient funds.`,
      'Continue', () => { updateUI(); if (!checkBankruptcy(gameState.currentPlayer)) nextTurn(); });
    }
  }
}

// ===== NEWS FEED SQUARE =====
function handleNewsFeed(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const ticketNumbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1);
  player.lotteryTickets.push(ticketNumbers);

  const winChance = Math.random();
  const isWin = winChance < 0.15;
  const prize = isWin ? Math.floor(Math.random() * 20000) + 5000 : 0;
  if (isWin) player.hecu += prize;

  // Create animated lottery card overlay
  const overlay = document.createElement('div');
  overlay.className = 'lottery-overlay';
  overlay.innerHTML = `
    <div class="lottery-card ${isWin ? 'lottery-win' : ''}">
      <div class="lottery-card-icon">📰</div>
      <h2>Highlife Lottery</h2>
      <p class="lottery-card-subtitle">${player.name}, your lottery numbers are being drawn...</p>
      <div class="lottery-numbers" id="lottery-numbers">
        ${ticketNumbers.map(n => `<div class="lottery-ball" data-number="${n}">${n}</div>`).join('')}
      </div>
      <div class="lottery-result" id="lottery-result"></div>
      <button class="advert-click-btn" id="lottery-continue-btn" style="display:none">Continue</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Reveal numbers one by one
  const balls = overlay.querySelectorAll('.lottery-ball');
  balls.forEach((ball, i) => {
    setTimeout(() => {
      ball.classList.add('revealed');
    }, 600 + i * 400);
  });

  // Show result after all numbers revealed
  const totalRevealTime = 600 + ticketNumbers.length * 400 + 500;
  setTimeout(() => {
    const resultEl = overlay.querySelector('#lottery-result');
    const btn = overlay.querySelector('#lottery-continue-btn');
    if (isWin) {
      resultEl.textContent = `🎉 You won ${prize.toLocaleString()} HECUs!`;
      resultEl.classList.add('show', 'win');
      burstAtTile(tileIndex, 0xf9a825);
    } else {
      resultEl.textContent = 'No match this time. Better luck next draw!';
      resultEl.classList.add('show', 'lose');
    }
    btn.style.display = 'inline-block';
    btn.onclick = () => {
      overlay.remove();
      updateUI();
      nextTurn();
    };
  }, totalRevealTime);
}

// ===== BUY NOW SQUARE =====
function handleBuyNow(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  const coinPrice = [100, 200, 300][Math.floor(Math.random() * 3)];
  const ownedAssetIds = player.assets.map(a => a.id);
  const availableAssets = ASSET_ITEMS.filter(a => !ownedAssetIds.includes(a.id));

  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">🛒</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Buy Now Square</h2>
    <p style="color:#a8c4d8;font-size:.85rem;margin-bottom:12px">
      Balance: ${player.hecu.toLocaleString()} HECUs | Gold Coins: ${player.goldCoins}/6 | Assets: ${player.assets.length}/10
    </p>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#abd40a;margin:8px 0" id="bn-timer">5</div>
    <div style="text-align:left;margin-bottom:12px">
      <button class="boffin-btn" id="bn-buy-coin">
        <span class="boffin-icon">🪙</span>
        <span class="boffin-name">Buy 1 Gold Coin — ${coinPrice} HECUs</span>
        <span class="boffin-reward">${player.goldCoins < 6 && player.hecu >= coinPrice ? 'Available' : 'Unavailable'}</span>
      </button>
      ${BOFFIN_TYPES.map(b => `
      <button class="boffin-btn" data-bn-boffin="${b.id}">
        <span class="boffin-icon">${b.icon}</span>
        <span class="boffin-name">Trade ${b.coinCost} Gold Coins for ${b.name} <span style="color:#6a8aaa;font-weight:400">— ${b.desc}</span></span>
        <span class="boffin-reward">${player.goldCoins >= b.coinCost ? 'Available' : `Need ${b.coinCost} coins`}</span>
      </button>`).join('')}
      <button class="boffin-btn" id="bn-buy-assets">
        <span class="boffin-icon">📦</span>
        <span class="boffin-name">Browse Asset Items for Sale</span>
        <span class="boffin-reward">${availableAssets.length > 0 ? availableAssets.length + ' available' : 'All owned'}</span>
      </button>
    </div>
    <button class="advert-click-btn" id="bn-skip-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Skip</button>
  `;

  modal.classList.add('is-open');
  gameState.turnPhase = 'event';

  let timeLeft = simTimer(5);
  const timerEl = document.getElementById('bn-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      modal.classList.remove('is-open');
      nextTurn();
    }
  }, 1000);

  function closeAndNext() {
    clearInterval(interval);
    modal.classList.remove('is-open');
    updateUI();
    nextTurn();
  }

  document.getElementById('bn-buy-coin').onclick = () => {
    if (player.goldCoins < 6 && player.hecu >= coinPrice) {
      player.hecu -= coinPrice;
      player.goldCoins++;
      player.earnedCoins = (player.earnedCoins || 0) + 1; // acquired in play
      showToast(`Bought 1 Gold Coin for ${coinPrice} HECUs`);
      closeAndNext();
    }
  };
  content.querySelectorAll('[data-bn-boffin]').forEach(btn => {
    btn.onclick = () => {
      const def = BOFFIN_TYPES.find(b => b.id === btn.dataset.bnBoffin);
      if (def && player.goldCoins >= def.coinCost) {
        spendCoins(player, def.coinCost);
        // Boffins bought with Gold Coins are spent at end of this game
        player.boffins.push({ ...def, source: 'gold' });
        showToast(`Traded ${def.coinCost} Gold Coins for a ${def.name} (expires at end of game)`);
        closeAndNext();
      }
    };
  });
  document.getElementById('bn-buy-assets').onclick = () => {
    if (availableAssets.length > 0) {
      clearInterval(interval);
      showAssetPurchasePhase(player, availableAssets);
    }
  };
  document.getElementById('bn-skip-btn').onclick = closeAndNext;
}

// ===== ASSET PURCHASE PHASE (15 seconds) =====
function showAssetPurchasePhase(player, availableAssets) {
  const content = document.getElementById('question-modal-content');

  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">📦</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Asset Items for Sale</h2>
    <p style="color:#a8c4d8;font-size:.85rem;margin-bottom:8px">Select up to 3 items. Balance: ${player.hecu.toLocaleString()} HECUs</p>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#abd40a;margin:8px 0" id="asset-timer">15</div>
    <div style="text-align:left;max-height:300px;overflow-y:auto;margin-bottom:12px">
      ${availableAssets.map(a => {
        const canAfford = player.hecu >= a.price;
        return `
          <button class="boffin-btn" data-asset="${a.id}" ${!canAfford ? 'disabled style="opacity:.4"' : ''}>
            <span class="boffin-icon">${a.icon}</span>
            <span class="boffin-name">${a.name} (${'⭐'.repeat(a.stars)})</span>
            <span class="boffin-reward">${canAfford ? a.price.toLocaleString() + ' HECUs' : 'Insufficient'}</span>
          </button>
        `;
      }).join('')}
    </div>
    <button class="advert-click-btn" id="asset-done-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Done</button>
  `;

  let timeLeft = simTimer(15);
  let purchased = 0;
  const timerEl = document.getElementById('asset-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0 || purchased >= 3) {
      clearInterval(interval);
      finishAssetPurchase();
    }
  }, 1000);

  function finishAssetPurchase() {
    clearInterval(interval);
    document.getElementById('question-modal').classList.remove('is-open');
    updateUI();
    checkWinCondition(gameState.currentPlayer);
    nextTurn();
  }

  content.querySelectorAll('[data-asset]').forEach(btn => {
    btn.onclick = () => {
      const assetId = parseInt(btn.dataset.asset);
      const asset = ASSET_ITEMS.find(a => a.id === assetId);
      if (asset && player.hecu >= asset.price && purchased < 3) {
        player.hecu -= asset.price;
        player.assets.push({ ...asset });
        purchased++;
        addCogPoints(gameState.currentPlayer, 5, 'asset');
        // Rules: some Asset Items come with bonus Gold Coins
        if (asset.stars >= 4) {
          player.goldCoins++;
          player.earnedCoins = (player.earnedCoins || 0) + 1;
          showToast(`Purchased ${asset.name} for ${asset.price.toLocaleString()} HECUs — bonus 🪙 Gold Coin included!`);
        } else {
          showToast(`Purchased ${asset.name} for ${asset.price.toLocaleString()} HECUs`);
        }
        btn.disabled = true;
        btn.style.opacity = '.4';
        if (purchased >= 3) finishAssetPurchase();
      }
    };
  });

  document.getElementById('asset-done-btn').onclick = finishAssetPurchase;
}

// ===== ACCOUNT REPORT SQUARE =====
function handleAccountReport(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const isGoodNews = Math.random() < 0.9; // 18/20 = 90% positive

  if (isGoodNews) {
    const bonus = Math.floor(Math.random() * 15000) + 5000;
    player.hecu += bonus;
    showSimpleEvent('📋', 'Account Report — Good News!',
      `The Company Report Card shows positive results!\nBonus award of ${bonus.toLocaleString()} HECUs credited to your account.\nBalance: ${player.hecu.toLocaleString()} HECUs.`,
      'Pay Me', () => { updateUI(); nextTurn(); });
  } else {
    const fine = Math.floor(Math.random() * 8000) + 2000;
    const hasPlatinum = player.insurancePolicy === 'platinum';
    const hasGold = player.insurancePolicy === 'gold';

    if (hasPlatinum) {
      showSimpleEvent('📋', 'Account Report — Bad News (Covered)',
        `Poor results. A fine of ${fine.toLocaleString()} HECUs was issued.\nYour Platinum Insurance Policy covers 100% of the fine!\nNo payment required.`,
        'Continue', () => nextTurn());
    } else if (hasGold) {
      const covered = Math.floor(fine * 0.5);
      const remainder = fine - covered;
      if (player.hecu >= remainder) {
        player.hecu -= remainder;
        showSimpleEvent('📋', 'Account Report — Bad News (Partially Covered)',
          `Poor results. Fine: ${fine.toLocaleString()} HECUs.\nGold Insurance covers 50% (${covered.toLocaleString()} HECUs).\nYou pay ${remainder.toLocaleString()} HECUs.\nBalance: ${player.hecu.toLocaleString()} HECUs.`,
          'Pay Fine', () => { updateUI(); nextTurn(); });
      } else {
        player.hecu = 0;
        showSimpleEvent('📋', 'Account Report — Insufficient Funds',
          `Poor results. Fine: ${fine.toLocaleString()} HECUs.\nGold Insurance covers 50%, but you can't pay the remaining ${remainder.toLocaleString()} HECUs.\nBankruptcy risk!`,
          'Continue', () => { updateUI(); nextTurn(); });
      }
    } else {
      if (player.hecu >= fine) {
        player.hecu -= fine;
        showSimpleEvent('📋', 'Account Report — Bad News',
          `Poor results. A fine of ${fine.toLocaleString()} HECUs has been taken from your account.\nBalance: ${player.hecu.toLocaleString()} HECUs.`,
          'Pay Fine', () => { updateUI(); nextTurn(); });
      } else {
        player.hecu = 0;
        showSimpleEvent('📋', 'Account Report — Insufficient Funds',
          `Poor results. Fine: ${fine.toLocaleString()} HECUs.\nYou have insufficient funds.`,
          'Continue', () => { updateUI(); if (!checkBankruptcy(gameState.currentPlayer)) nextTurn(); });
      }
    }
  }
}

// ===== BUILDING SOCIETY SQUARE =====
function handleBuildingSociety(tileIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  const outcomes = [
    { label: 'Market Up', amount: Math.floor(Math.random() * 5000) + 1000, positive: true },
    { label: 'Market Down', amount: -(Math.floor(Math.random() * 3000) + 500), positive: false },
    { label: 'Stable', amount: 0, positive: true },
    { label: 'Bonus Dividend', amount: Math.floor(Math.random() * 8000) + 2000, positive: true },
  ];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

  player.hecu += outcome.amount;
  if (player.hecu < 0) player.hecu = 0;

  const reportMsg = outcome.amount === 0
    ? 'The market is stable. Your investments remain unchanged.'
    : outcome.positive
      ? `Annual Report: ${outcome.label}! +${outcome.amount.toLocaleString()} HECUs.`
      : `Annual Report: ${outcome.label}. ${outcome.amount.toLocaleString()} HECUs.`;

  // Check for loan interest (every 2nd Building Society visit)
  let interestMsg = '';
  if (player.bankLoan) {
    player.boardCircuits = (player.boardCircuits || 0) + 1;
    if (player.boardCircuits % 2 === 0) {
      const interest = Math.round(player.bankLoan.value * LOAN_INTEREST_RATE);
      if (player.hecu >= interest) {
        player.hecu -= interest;
        interestMsg = `\n\nLoan interest of ${interest.toLocaleString()} HECUs (5%) has been paid.`;
      } else {
        interestMsg = `\n\n⚠️ Insufficient funds for loan interest of ${interest.toLocaleString()} HECUs!`;
      }
    }
  }

  // Build loan options
  const hasLoan = player.bankLoan !== null;
  const assetValue = player.assets.reduce((sum, a) => sum + a.price, 0);
  const canTakeLoan = !hasLoan && player.assets.length > 0 && player.goldCoins >= 2;

  let loanHtml = '';
  if (hasLoan) {
    loanHtml = `
      <button class="boffin-btn" id="bs-repay-loan">
        <span class="boffin-icon">🏦</span>
        <span class="boffin-name">Repay Loan (${player.bankLoan.label})</span>
        <span class="boffin-reward">${player.bankLoan.value.toLocaleString()} HECUs</span>
      </button>
    `;
  } else if (canTakeLoan) {
    loanHtml = BANK_LOANS.map(loan => {
      const securityNeeded = loan.value * 0.5;
      const hasSecurity = assetValue >= securityNeeded;
      return `
        <button class="boffin-btn" data-loan="${loan.id}" ${!hasSecurity ? 'disabled style="opacity:.4"' : ''}>
          <span class="boffin-icon">💰</span>
          <span class="boffin-name">${loan.label} (fee: 2🪙)</span>
          <span class="boffin-reward">${hasSecurity ? 'Available' : 'Need 50% security'}</span>
        </button>
      `;
    }).join('');
  } else {
    loanHtml = `<p style="color:#a8c4d8;font-size:.8rem;text-align:center;padding:8px">${hasLoan ? 'You already have a loan.' : 'Need Asset Items + 2 Gold Coins to take a loan.'}</p>`;
  }

  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">🏦</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Building Society</h2>
    <p style="color:#a8c4d8;font-size:.9rem;margin-bottom:8px">${reportMsg}${interestMsg}</p>
    <p style="color:#a8c4d8;font-size:.85rem;margin-bottom:12px">Balance: ${player.hecu.toLocaleString()} HECUs | Gold Coins: ${player.goldCoins}</p>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#abd40a;margin:8px 0" id="bs-timer">5</div>
    <div style="text-align:left;margin-bottom:12px">${loanHtml}</div>
    <button class="advert-click-btn" id="bs-skip-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Continue</button>
  `;

  modal.classList.add('is-open');
  gameState.turnPhase = 'event';

  let timeLeft = simTimer(5);
  const timerEl = document.getElementById('bs-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      modal.classList.remove('is-open');
      updateUI();
      nextTurn();
    }
  }, 1000);

  function closeAndNext() {
    clearInterval(interval);
    modal.classList.remove('is-open');
    updateUI();
    nextTurn();
  }

  if (hasLoan) {
    const repayBtn = document.getElementById('bs-repay-loan');
    if (repayBtn) {
      repayBtn.onclick = () => {
        if (player.hecu >= player.bankLoan.value) {
          player.hecu -= player.bankLoan.value;
          showToast(`Loan repaid: ${player.bankLoan.value.toLocaleString()} HECUs`);
          player.bankLoan = null;
          addCogPoints(gameState.currentPlayer, 4, 'repay');
          updateUI();
          checkWinCondition(gameState.currentPlayer);
          if (gameState.turnPhase !== 'gameover') closeAndNext();
        } else {
          showToast('Insufficient funds to repay loan');
        }
      };
    }
  } else if (canTakeLoan) {
    content.querySelectorAll('[data-loan]').forEach(btn => {
      btn.onclick = () => {
        const loanId = btn.dataset.loan;
        const loan = BANK_LOANS.find(l => l.id === loanId);
        if (loan && player.goldCoins >= 2) {
          spendCoins(player, 2);
          player.hecu += loan.value;
          player.bankLoan = { ...loan };
          addCogPoints(gameState.currentPlayer, 3, 'loan');
          showToast(`Loan taken: ${loan.label} for 2 Gold Coins`);
          closeAndNext();
        }
      };
    });
  }

  document.getElementById('bs-skip-btn').onclick = closeAndNext;
}

// ===== WIN CONDITION CHECK =====
function checkWinCondition(playerId) {
  const player = gameState.players[playerId];
  if (!player) return;
  const uniqueAssetIds = new Set(player.assets.map(a => a.id));
  if (uniqueAssetIds.size >= 10 && !player.bankLoan) {
    endGame(playerId, 'WINNER!', `${player.name} collected all 10 Asset Items — Account Director!`);
  }
}

// ===== BANKRUPTCY CHECK =====
function checkBankruptcy(playerId) {
  const player = gameState.players[playerId];
  if (!player || player.hecu > 0) return false;

  if (player.assets.length > 0) {
    const modal = document.getElementById('question-modal');
    const content = document.getElementById('question-modal-content');
    content.innerHTML = `
      <div style="font-size:3rem;margin-bottom:12px">⚠️</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#fc6b6b;margin-bottom:8px">Bankruptcy Risk</h2>
      <p style="color:#a8c4d8;font-size:.9rem;margin-bottom:12px">You have insufficient funds. Sell Asset Items to raise HECUs.</p>
      <div style="text-align:left;max-height:250px;overflow-y:auto;margin-bottom:12px">
        ${player.assets.map((a, i) => `
          <button class="boffin-btn" data-sell="${i}">
            <span class="boffin-icon">${a.icon}</span>
            <span class="boffin-name">${a.name}</span>
            <span class="boffin-reward">Sell for ${Math.floor(a.price * 0.2).toLocaleString()} HECUs (20%)</span>
          </button>
        `).join('')}
      </div>
      <button class="advert-click-btn" id="bankrupt-btn" style="background:#fc6b6b">Declare Bankruptcy</button>
    `;
    modal.classList.add('is-open');

    content.querySelectorAll('[data-sell]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.sell);
        const asset = player.assets[idx];
        const sellPrice = Math.floor(asset.price * 0.2);
        player.hecu += sellPrice;
        player.assets.splice(idx, 1);
        showToast(`Sold ${asset.name} for ${sellPrice.toLocaleString()} HECUs (20%)`);
        if (player.hecu > 0) {
          modal.classList.remove('is-open');
          updateUI();
          nextTurn();
        } else {
          checkBankruptcy(playerId);
        }
      };
    });

    document.getElementById('bankrupt-btn').onclick = () => {
      modal.classList.remove('is-open');
      declareBankruptcy(playerId);
    };
    return true;
  }

  declareBankruptcy(playerId);
  return true;
}

// ===== DECLARE BANKRUPTCY =====
function declareBankruptcy(playerId) {
  const player = gameState.players[playerId];
  if (!player) return;

  player.bankrupt = true;
  player.hecu = 0;
  player.assets = [];
  player.bankLoan = null;
  player.insurancePolicy = null;

  // Return company accounts to board
  player.companyAccounts.forEach(tileIdx => {
    delete gameState.companyOwnership[tileIdx];
  });
  player.companyAccounts = [];

  showSimpleEvent('💀', 'Bankruptcy Declared',
    `${player.name} has been declared bankrupt and is eliminated from the game.\nAll assets, accounts, and insurance have been returned.`,
    'Continue', () => { updateUI(); nextTurn(); });

  // Red particle burst at bankrupt player's token
  const token = playerTokens[playerId];
  if (token) {
    spawnParticles(token.mesh.position, 0xfc6b6b, 40, 1.2);
  }
}

// ===== HANDLE COMPANY SQUARE (3 scenarios from PPTX) =====
function handleCompanySquare(tileIndex) {
  const company = tileCompanyMap[tileIndex];
  if (!company) return;

  const ownership = gameState.companyOwnership[tileIndex];
  const currentPlayerId = gameState.currentPlayer;

  if (!ownership) {
    // Scenario 1: Unissued company square
    startCompanyQuestionFlow(tileIndex, company, currentPlayerId, false);
  } else if (ownership.ownerId === currentPlayerId) {
    // Scenario 2: Owned by current player
    startCompanyQuestionFlow(tileIndex, company, currentPlayerId, false, true);
  } else {
    // Scenario 3: Owned by another player (consultation)
    startConsultationFlow(tileIndex, company, ownership.ownerId, currentPlayerId);
  }
}

// ===== COMPANY QUESTION FLOW =====
function startCompanyQuestionFlow(tileIndex, company, playerId, isConsultation, isOwnCompany = false) {
  const qf = gameState.questionFlow;
  qf.active = true;
  qf.tileIndex = tileIndex;
  qf.company = company;
  qf.playerId = playerId;
  qf.isConsultation = isConsultation;
  qf.boffinUsed = false;
  qf.isOwnCompany = isOwnCompany;
  gameState.turnPhase = 'question';

  // Roll company dice for reward value
  let reward = rollCompanyDice(company);

  if (isConsultation) {
    // Consultation: reward is 10% of basic value
    reward = Math.round(company.baseReward * 0.10);
  } else if (isOwnCompany) {
    // Own company: full reward (or 50% if no click)
    // Will handle the no-click case in the advert phase
  }

  qf.rewardValue = reward;
  qf.question = getRandomQuestion(company.id);

  // Show advert phase (10 seconds)
  showAdvertPhase(company, playerId, isOwnCompany);
}

// ===== ADVERT PHASE (10 seconds) =====
function showAdvertPhase(company, playerId, isOwnCompany) {
  const qf = gameState.questionFlow;
  qf.phase = 'advert';
  qf.timer = simTimer(10);

  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  const player = gameState.players[playerId];
  const message = isOwnCompany
    ? `Click screen to attempt question to gain another Team Worker on this Company Account. Boffins allowed — select any on screen.`
    : `Click screen to attempt question to gain this account. Use of Boffins not allowed.`;

  // Show boffins if own company
  const boffinsHtml = isOwnCompany && player.boffins.length > 0
    ? `<div class="boffin-list">
        <p class="boffin-title">Your Boffins (click to use):</p>
        ${player.boffins.map((b, i) => `
          <button class="boffin-btn" data-boffin="${i}">
            <span class="boffin-icon">${b.icon}</span>
            <span class="boffin-name">${b.name} <span style="color:#6a8aaa;font-weight:400">— ${b.desc || ''}</span></span>
            <span class="boffin-reward">${b.source === 'cash' ? '💳 cash' : '🪙 coins'}</span>
          </button>
        `).join('')}
      </div>`
    : '';

  content.innerHTML = `
    <div class="advert-display">
      <img src="${company.cardImg}" alt="${company.name}" class="company-card-img" />
      <div class="advert-text-side">
        <h2 class="company-name">${company.name}</h2>
        <p class="advert-message">${message}</p>
        <div class="advert-timer" id="advert-timer">${qf.timer}s</div>
      </div>
      <div class="advert-bottom">
        <button class="advert-click-btn" id="advert-click-btn">Click to Attempt Question</button>
        ${boffinsHtml}
      </div>
    </div>
  `;

  modal.classList.add('is-open');

  // Timer countdown
  qf.timerInterval = setInterval(() => {
    qf.timer--;
    const timerEl = document.getElementById('advert-timer');
    if (timerEl) timerEl.textContent = `${qf.timer}s`;

    if (qf.timer <= 0) {
      clearInterval(qf.timerInterval);
      // No click in time
      if (qf.isOwnCompany) {
        // Action 3a: auto dice roll, 50% value credited
        const halfReward = Math.round(qf.rewardValue * 0.5);
        gameState.players[playerId].hecu += halfReward;
        closeQuestionModal();
        showResultMessage(`${player.name} didn't click — auto 50% reward: ${halfReward} HECU`);
      } else {
        // Action 1a: go ends
        closeQuestionModal();
        showResultMessage(`${player.name} didn't click — turn ends.`);
      }
      endQuestionFlow();
    }
  }, 1000);

  // Click handler
  document.getElementById('advert-click-btn').addEventListener('click', () => {
    clearInterval(qf.timerInterval);
    showQuestionPhase();
  });

  // Boffin click handlers
  if (isOwnCompany) {
    document.querySelectorAll('.boffin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const boffinIdx = parseInt(btn.dataset.boffin);
        useBoffin(boffinIdx, playerId);
        clearInterval(qf.timerInterval);
        showQuestionPhase();
      });
    });
  }
}

// ===== USE BOFFIN =====
// Rules: Junior removes 1 wrong answer, Senior removes 2 wrong answers,
// Major swaps the question for a different one. Once used, a Boffin is
// removed from the player's game account.
function useBoffin(boffinIdx, playerId) {
  const player = gameState.players[playerId];
  const boffin = player.boffins[boffinIdx];
  if (!boffin) return;

  const qf = gameState.questionFlow;

  if (boffin.swapQuestion) {
    // Major Boffin: change the question for another one
    qf.question = getRandomQuestion(qf.company?.id, qf.question);
    qf.boffinUsed = { ...boffin, eliminates: 0 };
    showResultMessage(`🎓 ${boffin.name} used — question swapped for a different one.`);
  } else {
    qf.boffinUsed = boffin;
    showResultMessage(`${boffin.icon} ${boffin.name} used — ${boffin.eliminates} wrong answer${boffin.eliminates > 1 ? 's' : ''} will be removed.`);
  }

  // Remove boffin from player (a used boffin is spent)
  player.boffins.splice(boffinIdx, 1);
  addCogPoints(playerId, 4, 'boffin');
}

// ===== QUESTION PHASE (20 seconds read-only) =====
function showQuestionPhase() {
  const qf = gameState.questionFlow;
  qf.phase = 'question';
  qf.timer = simTimer(20);

  const content = document.getElementById('question-modal-content');
  const player = gameState.players[qf.playerId];
  const boffinNote = qf.boffinUsed ? `<p class="boffin-used-note">${qf.boffinUsed.icon} ${qf.boffinUsed.name} used${qf.boffinUsed.swapQuestion ? ' — question swapped' : ''}</p>` : '';

  content.innerHTML = `
    <div class="question-display">
      <div class="question-header">
        <img src="${qf.company.cardImg}" alt="${qf.company.name}" class="company-card-img-small" />
        <div>
          <h2 class="company-name">${qf.company.name}</h2>
          <p class="reward-display">Reward: ${qf.rewardValue.toLocaleString()} HECU</p>
        </div>
      </div>
      ${boffinNote}
      <div class="question-text" id="question-text">${qf.question.question}</div>
      <div class="question-timer" id="question-timer">${qf.timer}s — Read carefully</div>
    </div>
  `;

  // Timer countdown
  qf.timerInterval = setInterval(() => {
    qf.timer--;
    const timerEl = document.getElementById('question-timer');
    if (timerEl) timerEl.textContent = `${qf.timer}s — Read carefully`;

    if (qf.timer <= 0) {
      clearInterval(qf.timerInterval);
      showAnswerPhase();
    }
  }, 1000);
}

// ===== ANSWER PHASE (20 seconds, 4 options) =====
function showAnswerPhase() {
  const qf = gameState.questionFlow;
  qf.phase = 'answer';
  qf.timer = simTimer(20);

  const content = document.getElementById('question-modal-content');
  const player = gameState.players[qf.playerId];

  // If a Junior/Senior Boffin was used, remove that many wrong answers
  let options = [...qf.question.options];
  let correctIdx = qf.question.correct;

  if (qf.boffinUsed && qf.boffinUsed.eliminates > 0) {
    const wrongIndices = options.map((_, i) => i).filter(i => i !== correctIdx);
    const toRemove = wrongIndices.sort(() => Math.random() - 0.5).slice(0, qf.boffinUsed.eliminates);
    const newOptions = [];
    const newCorrectMap = [];
    options.forEach((opt, i) => {
      if (!toRemove.includes(i)) {
        newCorrectMap.push(i);
        newOptions.push(opt);
      }
    });
    options = newOptions;
    correctIdx = newCorrectMap.indexOf(qf.question.correct);
  }

  qf.currentCorrectIdx = correctIdx;

  const boffinNote = qf.boffinUsed
    ? `<p class="boffin-hint-text">${qf.boffinUsed.icon} ${qf.boffinUsed.name} in play${qf.boffinUsed.eliminates ? ` — ${qf.boffinUsed.eliminates} wrong answer${qf.boffinUsed.eliminates > 1 ? 's' : ''} removed` : ' — question swapped'}</p>`
    : '';

  content.innerHTML = `
    <div class="answer-display">
      <div class="question-text-small">${qf.question.question}</div>
      ${boffinNote}
      <div class="answer-options" id="answer-options">
        ${options.map((opt, i) => `
          <button class="answer-option" data-answer="${i}">${opt}</button>
        `).join('')}
      </div>
      <div class="answer-timer" id="answer-timer">${qf.timer}s</div>
    </div>
  `;

  // Timer countdown
  qf.timerInterval = setInterval(() => {
    qf.timer--;
    const timerEl = document.getElementById('answer-timer');
    if (timerEl) timerEl.textContent = `${qf.timer}s`;

    if (qf.timer <= 0) {
      clearInterval(qf.timerInterval);
      // No answer selected — turn ends
      handleAnswerResult(false, qf.playerId);
    }
  }, 1000);

  // Answer click handlers
  document.querySelectorAll('.answer-option').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(qf.timerInterval);
      const selectedIdx = parseInt(btn.dataset.answer);
      const isCorrect = selectedIdx === correctIdx;
      handleAnswerResult(isCorrect, qf.playerId);
    });
  });
}

// ===== HANDLE ANSWER RESULT =====
function handleAnswerResult(isCorrect, playerId) {
  const qf = gameState.questionFlow;
  const player = gameState.players[playerId];
  const tileIndex = qf.tileIndex;

  closeQuestionModal();

  if (isCorrect) {
    if (qf.isConsultation) {
      // Consultation correct: controlling player gets 10% fee
      gameState.players[qf.consultingPlayer].hecu += qf.rewardValue;
      addCogPoints(qf.consultingPlayer, 8, 'consultation');
      showResultMessage(`✅ Correct! ${gameState.players[qf.consultingPlayer].name} earned ${qf.rewardValue.toLocaleString()} HECU consultation fee.`);
    } else {
      addCogPoints(playerId, 10, 'correct-answer');
      // Normal correct answer
      // Credit company account + team worker + HECU reward
      if (!gameState.companyOwnership[tileIndex]) {
        // New company account
        gameState.companyOwnership[tileIndex] = { ownerId: playerId, workers: [playerId] };
        player.companyAccounts.push(tileIndex);
      } else {
        // Add team worker to existing
        gameState.companyOwnership[tileIndex].workers.push(playerId);
      }

      // Create 3D team worker on tile
      createTeamWorker(tileIndex, playerId);

      // Calculate HECU reward: reward per team worker
      const workerCount = gameState.companyOwnership[tileIndex].workers.length;
      const totalReward = qf.rewardValue * workerCount;
      player.hecu += totalReward;

      showResultMessage(`✅ Correct! ${player.name} gained a Team Worker and earned ${totalReward.toLocaleString()} HECU (${qf.rewardValue.toLocaleString()} × ${workerCount} workers).`);
      burstAtTile(tileIndex, 0xabd40a);
    }
  } else {
    if (qf.isConsultation) {
      // Wrong consultation: landing player compensated 3x fee
      const compensation = qf.rewardValue * 3;
      const landingPlayer = gameState.players[qf.landingPlayerId] || player;
      landingPlayer.hecu += compensation;
      addCogPoints(qf.consultingPlayer, -8, 'bad-consultation');
      showResultMessage(`❌ Bad Consultation Advice! ${landingPlayer.name} compensated with ${compensation.toLocaleString()} HECU (3× consultation fee).`);
    } else {
      addCogPoints(playerId, -5, 'wrong-answer');
      showResultMessage(`❌ Wrong answer! ${player.name}'s turn ends.`);
    }
  }

  endQuestionFlow();
}

// ===== CONSULTATION FLOW =====
function startConsultationFlow(tileIndex, company, ownerId, landingPlayerId) {
  const qf = gameState.questionFlow;
  qf.active = true;
  qf.tileIndex = tileIndex;
  qf.company = company;
  qf.playerId = ownerId; // The owner answers the question
  qf.consultingPlayer = ownerId;
  qf.landingPlayerId = landingPlayerId;
  qf.isConsultation = true;
  qf.boffinUsed = false;
  gameState.turnPhase = 'question';

  // Reward is 10% of basic value
  qf.rewardValue = Math.round(company.baseReward * 0.10);
  qf.question = getRandomQuestion(company.id);

  const owner = gameState.players[ownerId];
  const landingPlayer = gameState.players[landingPlayerId];

  // Show consultation request to owner
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  content.innerHTML = `
    <div class="consultation-request">
      <img src="${company.cardImg}" alt="${company.name}" class="company-card-img" />
      <div class="consultation-text-side">
        <h2 class="company-name">${company.name}</h2>
        <p class="consultation-message">Landing player <b>${landingPlayer.name}</b> wants to consult with you.</p>
        <p class="consultation-note">Click screen to get question. No Boffins allowed.</p>
        <p class="reward-display">Consultation Fee: ${qf.rewardValue.toLocaleString()} HECU (10% of base)</p>
      </div>
      <div class="consultation-bottom">
        <button class="advert-click-btn" id="consult-click-btn">Click to Answer Question</button>
        <div class="advert-timer" id="advert-timer">10s</div>
      </div>
    </div>
  `;

  modal.classList.add('is-open');
  qf.timer = simTimer(10);
  qf.phase = 'advert';

  qf.timerInterval = setInterval(() => {
    qf.timer--;
    const timerEl = document.getElementById('advert-timer');
    if (timerEl) timerEl.textContent = `${qf.timer}s`;

    if (qf.timer <= 0) {
      clearInterval(qf.timerInterval);
      closeQuestionModal();
      showResultMessage(`${owner.name} didn't respond to consultation request. Turn ends.`);
      endQuestionFlow();
    }
  }, 1000);

  document.getElementById('consult-click-btn').addEventListener('click', () => {
    clearInterval(qf.timerInterval);
    showQuestionPhase();
  });
}

// ===== CLOSE QUESTION MODAL =====
function closeQuestionModal() {
  const modal = document.getElementById('question-modal');
  modal.classList.remove('is-open');
}

// ===== END QUESTION FLOW =====
function endQuestionFlow() {
  const qf = gameState.questionFlow;
  if (qf.timerInterval) clearInterval(qf.timerInterval);
  qf.active = false;
  qf.phase = null;
  qf.tileIndex = null;
  qf.company = null;
  qf.playerId = null;
  qf.landingPlayerId = null;
  qf.timer = 0;
  qf.timerInterval = null;
  qf.boffinUsed = false;
  qf.rewardValue = 0;
  qf.isConsultation = false;
  qf.consultingPlayer = null;
  qf.isOwnCompany = false;
  qf.question = null;
  qf.currentCorrectIdx = undefined;
  updateUI();
  nextTurn();
}

// ===== SHOW RESULT MESSAGE (temporary toast) =====
function showResultMessage(msg) {
  const toast = document.createElement('div');
  toast.className = 'game-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ===== COGNITIVE POINTS TRACKING =====
// Rules: every move requiring a cognitive decision earns or loses tracking
// points. BOT-played turns do not affect a player's tracking. Points reset to
// zero at the end of each week (handled by the account module).
function addCogPoints(playerId, delta, reason) {
  const player = gameState.players[playerId];
  if (!player || player.isBot || player.leftGame || player.bankrupt) return;
  player.cogPoints = (player.cogPoints || 0) + delta;
  updateUI();
}

// ===== GOLD COIN RAIN =====
// Rules: a random amount (1–5) of Gold Coins is triggered to fall down the
// face of the screen at times during a game. Any player captures one by
// clicking on it as it falls. Clicks by the user credit the local player;
// BOTs / sim players may grab coins first.
const coinLayer = document.getElementById('coin-layer');
let coinRainTimer = null;

function scheduleCoinRain() {
  clearTimeout(coinRainTimer);
  coinRainTimer = setTimeout(() => {
    if (gameState.gameStarted && gameState.turnPhase !== 'gameover') {
      spawnCoinRain();
    }
    scheduleCoinRain();
  }, 25000 + Math.random() * 40000); // every ~25–65s of play
}

function spawnCoinRain() {
  const count = 1 + Math.floor(Math.random() * 5);
  showToast(`🪙 ${count} Gold Coin${count > 1 ? 's' : ''} falling — click to capture!`);
  for (let i = 0; i < count; i++) {
    setTimeout(() => dropCoin(), i * 450 + Math.random() * 400);
  }
}

function dropCoin() {
  if (!coinLayer) return;
  const el = document.createElement('div');
  el.className = 'coin-drop';
  el.textContent = 'H';
  el.style.left = `${4 + Math.random() * 90}vw`;
  const fallSecs = 6 + Math.random() * 3;
  el.style.animationDuration = `${fallSecs}s, 0.8s`;
  el.addEventListener('click', () => captureCoin(el, HUMAN_PLAYER));

  // In sim mode / with BOT-controlled players, a bot may beat the user to it
  const botIds = gameState.players
    .map((p, i) => i)
    .filter(i => {
      const p = gameState.players[i];
      return !p.bankrupt && !p.leftGame && (sim.active || p.isBot);
    });
  if (botIds.length > 0 && Math.random() < 0.65) {
    const botId = botIds[Math.floor(Math.random() * botIds.length)];
    const grabAt = 1200 + Math.random() * Math.max(800, fallSecs * 1000 - 2400);
    setTimeout(() => { if (el.isConnected) captureCoin(el, botId); }, grabAt);
  }

  coinLayer.appendChild(el);
  setTimeout(() => el.remove(), fallSecs * 1000 + 300);
}

function captureCoin(el, playerId) {
  if (el.classList.contains('captured')) return;
  el.classList.add('captured');
  const player = gameState.players[playerId];
  if (player && !player.bankrupt && !player.leftGame) {
    player.goldCoins++;
    player.earnedCoins = (player.earnedCoins || 0) + 1;
    showResultMessage(`🪙 ${player.name} captured a Gold Coin!`);
    updateUI();
  }
  setTimeout(() => el.remove(), 320);
}

// Spend in-game coins — earned coins are spent before registered ones so that
// unused registered coins can be returned to the player's account.
function spendCoins(player, n) {
  player.goldCoins = Math.max(0, player.goldCoins - n);
  const fromEarned = Math.min(player.earnedCoins || 0, n);
  player.earnedCoins = (player.earnedCoins || 0) - fromEarned;
  player.regCoins = Math.max(0, (player.regCoins || 0) - (n - fromEarned));
}

// ===== BOT TAKEOVER (disconnect rules) =====
// Free games: a dropped player is played out by a BOT to completion.
// Prize games: a BOT covers up to 3 turns; on the next turn the player is
// deemed to have left — Asset Items return to the Highlife Company Account
// and acquired Gold Coins are credited to their Personal Game Account.
const TURN_IDLE_SECONDS = 25;
const PRIZE_BOT_TURN_LIMIT = 3;
let idleInterval = null;
let botPumpInterval = null;

function clearIdleWatch() {
  if (idleInterval) { clearInterval(idleInterval); idleInterval = null; }
  const el = document.getElementById('idle-countdown');
  if (el) el.textContent = '';
}

function startIdleWatch() {
  clearIdleWatch();
  if (sim.active || !gameState.gameStarted || gameState.turnPhase === 'gameover') return;
  const player = gameState.players[gameState.currentPlayer];
  if (!player || player.isBot || player.bankrupt || player.leftGame) return;

  let secsLeft = TURN_IDLE_SECONDS;
  idleInterval = setInterval(() => {
    if (sim.active || gameState.turnPhase !== 'waiting' || walkMode) { clearIdleWatch(); return; }
    secsLeft--;
    const el = document.getElementById('idle-countdown');
    if (el) el.textContent = secsLeft <= 10 ? ` ⏳ BOT in ${secsLeft}s` : '';
    if (secsLeft <= 0) {
      clearIdleWatch();
      activateBot(gameState.currentPlayer);
    }
  }, 1000);
}

function activateBot(playerId) {
  const player = gameState.players[playerId];
  if (!player || player.isBot) return;
  player.isBot = true;
  player.disconnected = true;
  showResultMessage(`⚡ ${player.name} dropped connection — a BOT ${gameState.mode === 'free' ? 'plays out the game for them' : `covers up to ${PRIZE_BOT_TURN_LIMIT} turns`}.`);
  updateUI();
  startBotPump();
}

function startBotPump() {
  if (botPumpInterval) return;
  botPumpInterval = setInterval(() => {
    if (sim.active || gameState.turnPhase === 'gameover' || walkMode) return;
    const player = gameState.players[gameState.currentPlayer];
    if (!player || !player.isBot) return;

    const eventModal = document.getElementById('event-modal');
    const questionModal = document.getElementById('question-modal');
    const lotteryOverlay = document.querySelector('.lottery-overlay');

    if (eventModal?.classList.contains('is-open')) {
      document.getElementById('event-btn')?.click();
      return;
    }
    if (lotteryOverlay) {
      const btn = lotteryOverlay.querySelector('#lottery-continue-btn');
      if (btn && btn.style.display !== 'none') btn.click();
      return;
    }
    if (questionModal?.classList.contains('is-open')) {
      simHandleQuestionModal();
      return;
    }
    if (gameState.turnPhase === 'waiting' && !gameState.isRolling && !gameState.isMoving) {
      if (gameState.mode !== 'free') {
        if (player.botTurns >= PRIZE_BOT_TURN_LIMIT) {
          removeDroppedPlayer(gameState.currentPlayer);
          return;
        }
        player.botTurns++;
      }
      rollDice();
    }
  }, 1500);
}

// Prize games only: BOT covered its 3 turns — the player has left the game.
function removeDroppedPlayer(playerId) {
  const player = gameState.players[playerId];
  if (!player) return;
  player.leftGame = true;
  player.isBot = false;

  // All Asset Items return to the Highlife Company Account
  player.assets = [];
  player.bankLoan = null;
  player.insurancePolicy = null;
  player.companyAccounts.forEach(t => delete gameState.companyOwnership[t]);
  player.companyAccounts = [];

  // Remove their team workers from the board
  Object.keys(teamWorkerMeshes).forEach(t => {
    teamWorkerMeshes[t] = teamWorkerMeshes[t].filter(m => {
      if (m.userData.playerId === playerId) { scene.remove(m); return false; }
      return true;
    });
  });

  // Gold Coins acquired in play are credited to the player's Personal Game
  // Account; unused cash-bought Boffins return there too.
  const coinsCredited = player.goldCoins;
  const cashBoffins = player.boffins.filter(b => b.source === 'cash');
  if (playerId === HUMAN_PLAYER && acct) {
    if (coinsCredited > 0) acct.addGoldCoins(coinsCredited);
    if (cashBoffins.length > 0) acct.returnBoffins(cashBoffins);
  }
  player.goldCoins = 0;
  player.regCoins = 0;
  player.earnedCoins = 0;
  player.boffins = [];

  const token = playerTokens[playerId];
  if (token) token.mesh.visible = false;

  const tierLabel = acct ? acct.TIER_LABELS[gameState.mode] : gameState.mode;
  showSimpleEvent('🚪', `${player.name} has left the game`,
    `The BOT covered ${PRIZE_BOT_TURN_LIMIT} turns, so ${player.name} is deemed to have left this ${tierLabel} prize game.\n` +
    `All Asset Items return to the Highlife Company Account. ${coinsCredited} Gold Coin${coinsCredited === 1 ? '' : 's'} credited to their Personal Game Account.\n` +
    `They may email Highlife Games to appeal for a replacement ${tierLabel} game ticket (reissue at company discretion).`,
    'Continue', () => { updateUI(); nextTurn(); });
}

// ===== END-OF-GAME SETTLEMENT =====
// Rules: ticket parts/whole tickets are awarded by finishing position; all
// acquired HECUs are deemed spent; 50% of unused in-game Gold Coins are
// credited to the Personal Game Account; gold-coin Boffins expire, unused
// cash-bought Boffins are credited back.
function playerNetWorth(p) {
  return p.hecu + p.assets.reduce((s, a) => s + a.price, 0) - (p.bankLoan?.value || 0);
}

function getStandings(winnerId = null) {
  return gameState.players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      if (a.i === winnerId) return -1;
      if (b.i === winnerId) return 1;
      const aOut = a.p.bankrupt || a.p.leftGame;
      const bOut = b.p.bankrupt || b.p.leftGame;
      if (aOut !== bOut) return aOut ? 1 : -1;
      return playerNetWorth(b.p) - playerNetWorth(a.p);
    })
    .map((e, idx) => ({ ...e, rank: idx + 1 }));
}

function endGame(winnerId, headline, subline) {
  if (gameState.turnPhase === 'gameover') return;
  gameState.turnPhase = 'gameover';
  clearIdleWatch();
  clearTimeout(coinRainTimer);
  document.querySelectorAll('.coin-drop').forEach(el => el.remove());

  const standings = getStandings(winnerId);

  // ---- Ticket awards per rules of play ----
  const awards = [];
  if (gameState.mode === 'free') {
    const [first, second, third] = standings;
    if (first)  awards.push({ playerId: first.i,  kind: 'whole', tier: 'bronze' });
    if (second) awards.push({ playerId: second.i, kind: 'parts', tier: 'bronze', count: 2 });
    if (third)  awards.push({ playerId: third.i,  kind: 'parts', tier: 'bronze', count: 1 });
  } else {
    const nextTier = NEXT_TIER[gameState.mode];
    const [first, second] = standings;
    if (first)  awards.push({ playerId: first.i,  kind: nextTier ? 'parts' : 'grand', tier: nextTier, count: nextTier ? 2 : 0 });
    if (second && nextTier) awards.push({ playerId: second.i, kind: 'parts', tier: nextTier, count: 1 });
  }

  const awardLines = awards.map(a => {
    const p = gameState.players[a.playerId];
    const tierName = acct ? acct.TIER_LABELS[a.tier] : a.tier;
    let desc;
    if (a.kind === 'whole') desc = `a whole ${tierName} seat ticket`;
    else if (a.kind === 'grand') desc = 'the Diamond prize';
    else desc = `${a.count} random part${a.count > 1 ? 's' : ''} of a ${tierName} seat ticket`;
    let serialNote = '';
    if (a.playerId === HUMAN_PLAYER && acct) {
      if (a.kind === 'whole') {
        const t = acct.awardWholeTicket(a.tier);
        serialNote = ` <span style="color:#6a8aaa">(#${t.serial})</span>`;
      } else if (a.kind === 'parts') {
        const res = acct.awardRandomParts(a.tier, a.count);
        serialNote = ` <span style="color:#6a8aaa">(part${a.count > 1 ? 's' : ''} ${res.awarded.map(x => x.part + 1).join(', ')})</span>`;
      }
    }
    return `<div style="padding:4px 0;color:#a8c4d8;font-size:.85rem">${p.avatar} ${p.name} — ${desc}${serialNote}</div>`;
  }).join('');

  // ---- Settle the local player's Personal Game Account ----
  const me = gameState.players[HUMAN_PLAYER];
  let settleLines = '';
  if (me && acct) {
    const regUnused = me.regCoins || 0;
    const earned = me.earnedCoins || 0;
    const result = acct.settleGame({
      unusedRegisteredCoins: regUnused,
      earnedCoins: earned,
      unusedBoffins: me.boffins || [],
    });
    const cashBack = (me.boffins || []).filter(b => b.source === 'cash').length;
    const expired = (me.boffins || []).filter(b => b.source !== 'cash').length;
    if ((me.cogPoints || 0) !== 0) acct.addCognitivePoints(me.cogPoints);

    settleLines = `
      <div style="border-top:1px solid rgba(255,255,255,.1);margin-top:14px;padding-top:12px;text-align:left">
        <p style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:6px">Your Personal Game Account</p>
        <div style="padding:3px 0;color:#a8c4d8;font-size:.8rem">🪙 ${result.coinCredit} Gold Coin${result.coinCredit === 1 ? '' : 's'} credited (${regUnused} registered unused + 50% of ${earned} earned)</div>
        ${cashBack ? `<div style="padding:3px 0;color:#a8c4d8;font-size:.8rem">💳 ${cashBack} cash-bought Boffin${cashBack > 1 ? 's' : ''} returned to your account</div>` : ''}
        ${expired ? `<div style="padding:3px 0;color:#6a8aaa;font-size:.8rem">🪙 ${expired} Gold-Coin Boffin${expired > 1 ? 's' : ''} expired (spent at end of game)</div>` : ''}
        <div style="padding:3px 0;color:#6a8aaa;font-size:.8rem">💰 All HECUs acquired in play are deemed spent — none carry over</div>
        <div style="padding:3px 0;color:#4ecdc4;font-size:.8rem">🧠 ${me.cogPoints || 0} cognitive tracking points banked this game</div>
      </div>`;
  }

  const standingsHtml = standings.map(s => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.82rem;color:${s.i === winnerId ? '#abd40a' : '#a8c4d8'}">
      <span>${s.rank}. ${s.p.avatar} ${s.p.name}${s.p.leftGame ? ' 🚪' : ''}${s.p.bankrupt ? ' 💀' : ''}</span>
      <span>${playerNetWorth(s.p).toLocaleString()} HECU</span>
    </div>`).join('');

  const modeLabel = gameState.mode === 'free' ? 'Free Game' : `${acct ? acct.TIER_LABELS[gameState.mode] : gameState.mode} Prize Game`;
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');
  content.innerHTML = `
    <div style="font-size:4rem;margin-bottom:10px">🏆</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;color:#abd40a;margin-bottom:4px">${headline}</h2>
    <p style="color:#a8c4d8;font-size:.85rem;margin-bottom:14px">${subline} · ${modeLabel}</p>
    <div style="text-align:left;max-width:420px;margin:0 auto">${standingsHtml}</div>
    <div style="border-top:1px solid rgba(255,255,255,.1);margin-top:14px;padding-top:12px;max-width:420px;margin-left:auto;margin-right:auto;text-align:left">
      <p style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:6px">Ticket Awards</p>
      ${awardLines || '<div style="color:#6a8aaa;font-size:.8rem">No ticket awards this game.</div>'}
    </div>
    ${settleLines}
    <button class="advert-click-btn" style="margin-top:18px" onclick="location.reload()">Play Again</button>
  `;
  modal.classList.add('is-open');

  const token = winnerId != null ? playerTokens[winnerId] : null;
  if (token) {
    spawnParticles(token.mesh.position, 0xf9a825, 60, 1.5);
    spawnParticles(token.mesh.position, 0xabd40a, 40, 1.0);
  }
}

// ===== MY GAME ACCOUNT PANEL =====
function renderAccountModal(focusTier = null, onComplete = null) {
  const modal = document.getElementById('account-modal');
  const card = document.getElementById('account-card');
  if (!modal || !card || !acct) return;

  const acc = acct.loadAccount();

  const ticketsHtml = acc.tickets.length === 0
    ? '<p style="color:#6a8aaa;font-size:.85rem">No seat tickets yet — finish on the podium in a Free Game to win Bronze parts.</p>'
    : acc.tickets.map(t => {
        const missing = acct.missingParts(t);
        const complete = acct.isComplete(t);
        const price = acct.partPricePence(t.tier);
        // Parts are purchasable only on the day that tier's game is played
        const gameDay = focusTier === t.tier;
        const canBuy = gameDay && !complete && t.purchasedParts < acct.MAX_PURCHASABLE_PARTS;
        return `
        <div class="ticket-card">
          <div class="ticket-head">
            <span class="ticket-title">${acct.TIER_ICONS[t.tier]} ${acct.TIER_LABELS[t.tier]} Seat Ticket</span>
            <span class="ticket-serial">#${t.serial}</span>
          </div>
          <div class="ticket-parts">
            ${t.parts.map((has, i) => {
              const digits = t.serial.substr(i * 2, 2);
              if (has) return `<div class="ticket-part held"><span class="part-num">Part ${i + 1}</span>${digits}</div>`;
              if (canBuy) return `<div class="ticket-part buyable" data-buy="${t.id}:${i}"><span class="part-num">Part ${i + 1}</span>Buy ${price}p</div>`;
              return `<div class="ticket-part"><span class="part-num">Part ${i + 1}</span>missing</div>`;
            }).join('')}
          </div>
          <div class="ticket-status ${complete ? 'complete' : 'incomplete'}">
            ${complete ? '✓ Complete — valid for a seat' : `${missing.length} missing · ${Math.max(0, acct.MAX_PURCHASABLE_PARTS - t.purchasedParts)} purchasable${gameDay ? '' : ' · prices shown on game day'}`}
          </div>
        </div>`;
      }).join('');

  const boffinsHtml = acc.boffins.length === 0
    ? '<p style="color:#6a8aaa;font-size:.8rem">None — buy Boffins with cash during a game via 🧰 Tools, or trade Gold Coins on a Buy Now square.</p>'
    : acc.boffins.map(b => {
        const def = acct.BOFFIN_DEFS[b.type];
        return `<span style="display:inline-block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 10px;margin:3px;font-size:.8rem">${def.icon} ${def.name}</span>`;
      }).join('');

  card.innerHTML = `
    <h2>My Game Account</h2>
    <p class="acct-sub">${focusTier ? `${acct.TIER_LABELS[focusTier]} prize game day — missing parts are purchasable below` : 'Components persist between games'}</p>
    <div class="acct-grid">
      <div class="acct-stat"><div class="acct-stat-value">🪙 ${acc.goldCoins}</div><div class="acct-stat-label">Gold Coins</div></div>
      <div class="acct-stat"><div class="acct-stat-value">${acc.boffins.length}</div><div class="acct-stat-label">Boffins</div></div>
      <div class="acct-stat"><div class="acct-stat-value">${acc.cognitive.points}</div><div class="acct-stat-label">Cognitive pts (${acc.cognitive.weekKey})</div></div>
      <div class="acct-stat"><div class="acct-stat-value">${acc.tickets.length}</div><div class="acct-stat-label">Seat Tickets</div></div>
    </div>
    <div style="text-align:left;margin-bottom:14px">${ticketsHtml}</div>
    <p style="color:#fff;font-size:.85rem;font-weight:600;text-align:left;margin-bottom:6px">Boffins (cash-bought — usable in future games)</p>
    <div style="text-align:left;margin-bottom:16px">${boffinsHtml}</div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      ${focusTier ? `<button class="advert-click-btn" id="acct-enter-btn">${acct.findCompleteTicket(focusTier) ? `Take ${acct.TIER_LABELS[focusTier]} Seat` : 'Need a complete ticket'}</button>` : ''}
      <button class="advert-click-btn" id="acct-close-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Close</button>
    </div>
  `;

  modal.classList.add('is-open');

  card.querySelectorAll('[data-buy]').forEach(el => {
    el.addEventListener('click', () => {
      const [ticketId, partStr] = el.dataset.buy.split(':');
      const partIdx = parseInt(partStr);
      const t = acct.loadAccount().tickets.find(x => x.id === ticketId);
      const price = acct.partPricePence(t.tier);
      if (confirm(`Buy Part ${partIdx + 1} of this ${acct.TIER_LABELS[t.tier]} ticket for ${price}p on your registered card?`)) {
        const res = acct.buyTicketPart(ticketId, partIdx);
        if (res.error) showToast(res.error);
        else showToast(`Part ${partIdx + 1} purchased for ${res.pricePence}p`);
        renderAccountModal(focusTier, onComplete);
      }
    });
  });

  document.getElementById('acct-close-btn').onclick = () => modal.classList.remove('is-open');
  const enterBtn = document.getElementById('acct-enter-btn');
  if (enterBtn) {
    enterBtn.onclick = () => {
      const ticket = acct.findCompleteTicket(focusTier);
      if (!ticket) { showToast(`You need a complete ${acct.TIER_LABELS[focusTier]} ticket — win parts, trade, or buy up to 2`); return; }
      modal.classList.remove('is-open');
      if (onComplete) onComplete();
    };
  }
}

// ===== PRE-GAME COMPONENT REGISTRATION =====
// Rules: registered players may register Gold Coins and cash-bought Boffins
// into a game before play starts. Unused registered coins are held in the
// account after the game; registered components are spent at end of play.
function openRegisterModal(onDone) {
  const modal = document.getElementById('register-modal');
  const card = document.getElementById('register-card');
  const acc = acct ? acct.loadAccount() : { goldCoins: 0, boffins: [] };

  const isFree = selectedMode === 'free';
  const maxCoins = isFree ? Math.min(6, acc.goldCoins) : 0;
  let chosenCoins = 0;
  const chosenBoffins = new Set();

  function render() {
    card.innerHTML = `
      <h2>Register Components</h2>
      <p class="acct-sub">${isFree ? 'Free non-prize game' : `${acct.TIER_LABELS[selectedMode]} prize game`} — choose what to bring into play</p>
      ${isFree ? `
      <div style="margin-bottom:16px">
        <p style="color:#fff;font-size:.85rem;font-weight:600;text-align:left;margin-bottom:6px">🪙 Gold Coins (${acc.goldCoins} in account — usable in non-prize games)</p>
        <div style="display:flex;align-items:center;gap:12px;justify-content:center">
          <button class="sim-btn-small" id="reg-coin-minus">−</button>
          <span style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:#abd40a;min-width:40px" id="reg-coin-count">${chosenCoins}</span>
          <button class="sim-btn-small" id="reg-coin-plus">+</button>
        </div>
      </div>` : '<p style="color:#6a8aaa;font-size:.8rem;margin-bottom:14px">Gold Coins can only be registered into non-prize games.</p>'}
      <div style="text-align:left;margin-bottom:16px">
        <p style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:6px">🧰 Cash-bought Boffins (unused ones return after the game)</p>
        ${acc.boffins.length === 0 ? '<p style="color:#6a8aaa;font-size:.8rem">None in your account.</p>' :
          acc.boffins.map(b => {
            const def = acct.BOFFIN_DEFS[b.type];
            return `<label class="reg-option"><input type="checkbox" data-reg-boffin="${b.uid}" ${chosenBoffins.has(b.uid) ? 'checked' : ''} /> ${def.icon} ${def.name} — ${def.desc}</label>`;
          }).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="advert-click-btn" id="reg-go-btn">Take Seat ▶</button>
        <button class="advert-click-btn" id="reg-cancel-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Cancel</button>
      </div>
    `;

    const minus = document.getElementById('reg-coin-minus');
    const plus = document.getElementById('reg-coin-plus');
    if (minus) minus.onclick = () => { chosenCoins = Math.max(0, chosenCoins - 1); document.getElementById('reg-coin-count').textContent = chosenCoins; };
    if (plus) plus.onclick = () => { chosenCoins = Math.min(maxCoins, chosenCoins + 1); document.getElementById('reg-coin-count').textContent = chosenCoins; };
    card.querySelectorAll('[data-reg-boffin]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) chosenBoffins.add(cb.dataset.regBoffin); else chosenBoffins.delete(cb.dataset.regBoffin);
      });
    });
    document.getElementById('reg-go-btn').onclick = () => {
      modal.classList.remove('is-open');
      onDone(chosenCoins, [...chosenBoffins]);
    };
    document.getElementById('reg-cancel-btn').onclick = () => modal.classList.remove('is-open');
  }

  render();
  modal.classList.add('is-open');
}

// ===== GAME ENTRY (ticket check + component registration) =====
let pendingTicket = null; // complete ticket held for the prize game being entered

function tryEnterGame() {
  gameState.mode = selectedMode;
  pendingTicket = null;

  if (selectedMode === 'free' || !acct) {
    openRegisterModal(applyRegistrationAndStart);
    return;
  }

  // Prize game: need a complete 5-part ticket of this tier
  const complete = acct.findCompleteTicket(selectedMode);
  if (complete) {
    pendingTicket = complete; // consumed when the seat is actually taken
    openRegisterModal(applyRegistrationAndStart);
    return;
  }

  // Incomplete ticket — purchase window opens on game day (max 2 parts)
  const incomplete = acct.getTickets(selectedMode).find(t => !acct.isComplete(t));
  const missing = incomplete ? acct.missingParts(incomplete).length : acct.TICKET_PARTS_COUNT;
  const purchasable = incomplete ? acct.MAX_PURCHASABLE_PARTS - incomplete.purchasedParts : 0;

  if (incomplete && missing - purchasable <= 0) {
    renderAccountModal(selectedMode, applyRegistrationAndStartPrompt);
  } else {
    showToast(`You need a complete ${acct.TIER_LABELS[selectedMode]} seat ticket (${missing} parts missing, max ${acct.MAX_PURCHASABLE_PARTS} purchasable). Win parts in ${selectedMode === 'bronze' ? 'Free Games' : `${acct.TIER_LABELS[Object.keys(NEXT_TIER).find(k => NEXT_TIER[k] === selectedMode)] || 'lower'} games`} or trade with other players.`);
  }
}

function applyRegistrationAndStartPrompt() {
  pendingTicket = acct.findCompleteTicket(selectedMode);
  openRegisterModal(applyRegistrationAndStart);
}

function applyRegistrationAndStart(coins, boffinUids) {
  const me = gameState.players[HUMAN_PLAYER];
  if (pendingTicket && acct) {
    acct.consumeTicket(pendingTicket.id);
    showToast(`🎫 ${acct.TIER_LABELS[selectedMode]} ticket #${pendingTicket.serial} — seat confirmed!`);
    pendingTicket = null;
  }
  if (acct && me) {
    if (coins > 0) acct.spendGoldCoins(coins);
    const taken = acct.withdrawBoffins(boffinUids);
    me.goldCoins += coins;
    me.regCoins = (me.regCoins || 0) + coins;
    me.boffins.push(...taken.map(b => ({ ...acct.BOFFIN_DEFS[b.type], source: 'cash', uid: b.uid })));
    if (coins > 0 || taken.length > 0) {
      showToast(`Registered: ${coins} Gold Coin${coins === 1 ? '' : 's'}, ${taken.length} Boffin${taken.length === 1 ? '' : 's'}`);
    }
  }
  updateUI();
  const ts = document.getElementById('title-screen');
  if (ts) ts.classList.add('hidden');
  setTimeout(() => startOutsideClub(), 600);
}

// ===== NEXT TURN =====
function nextTurn() {
  if (gameState.turnPhase === 'gameover') return;
  const activePlayers = gameState.players.filter(p => !p.bankrupt && !p.leftGame);
  if (activePlayers.length <= 1) {
    if (activePlayers.length === 1) {
      const winnerIdx = gameState.players.indexOf(activePlayers[0]);
      endGame(winnerIdx, 'WINNER!', `${activePlayers[0].name} is the last player standing`);
    } else {
      endGame(null, 'GAME OVER', 'No players remaining');
    }
    return;
  }
  do {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
  } while (gameState.players[gameState.currentPlayer].bankrupt || gameState.players[gameState.currentPlayer].leftGame);
  gameState.turnPhase = 'waiting';
  updateUI();
  startIdleWatch();
}

// ===== UPDATE UI =====
function updateUI() {
  const player = gameState.players[gameState.currentPlayer];
  if (player) {
    document.getElementById('turn-player').textContent = player.name;
  }

  // Update player chips
  const strip = document.getElementById('players-strip');
  const playerHexColors = ['#fc6b6b', '#4ecdc4', '#f9a825', '#abd40a', '#9b59b6'];
  strip.innerHTML = gameState.players.map((p, i) => {
    const color = playerHexColors[i] || '#fff';
    return `
    <div class="player-chip ${i === gameState.currentPlayer ? 'active' : ''}" style="border-left: 4px solid ${color}">
      <span class="player-chip-avatar">${p.avatar}</span>
      <div class="player-chip-info">
        <span class="player-chip-name" style="color:${color}">${p.name}</span>
        <span class="player-chip-hecu">${p.hecu.toLocaleString()} HECU${p.isBot ? '<span class="bot-badge">BOT</span>' : ''}</span>
        <span class="player-chip-extra">${p.companyAccounts.length} accts · ${p.boffins.length} boffins · ${p.goldCoins}🪙${p.insurancePolicy ? ' · 🛡️' : ''} · ${p.assets.length}/10📦${p.bankLoan ? ' · 💰' : ''} · 🧠${p.cogPoints || 0}${p.bankrupt ? ' · 💀' : ''}${p.leftGame ? ' · 🚪' : ''}</span>
      </div>
    </div>
  `;}).join('');

  const rollBtn = document.getElementById('roll-btn');
  rollBtn.disabled = false;
  rollBtn.textContent = 'Roll Dice';

  // Update sim stats if active
  if (sim.active) updateSimStats();
}

// ===== INIT GAME (placeholder — will connect to Supabase later) =====
async function initGame() {
  // For now, create placeholder players
  // This will be replaced with real game session data from Supabase
  const mkPlayer = (over) => ({
    hecu: 50000, goldCoins: 0, regCoins: 0, earnedCoins: 0, cogPoints: 0,
    isBot: false, botTurns: 0, disconnected: false, leftGame: false, bankrupt: false,
    insurancePolicy: null, lotteryTickets: [], bankLoan: null, boardCircuits: 0,
    boffins: [], assets: [], companyAccounts: [], ...over,
  });
  const placeholderPlayers = [
    mkPlayer({ name: 'Player 1', avatar: '🎲' }), // seat 0 = local player; components arrive via registration
    mkPlayer({ name: 'Player 2', avatar: '🏆', goldCoins: 1, boffins: [{ ...BOFFIN_TYPES[0], source: 'cash' }] }),
    mkPlayer({ name: 'Player 3', avatar: '🧠', boffins: [{ ...BOFFIN_TYPES[2], source: 'gold' }] }),
    mkPlayer({ name: 'Player 4', avatar: '🛡️', goldCoins: 3, boffins: [{ ...BOFFIN_TYPES[1], source: 'gold' }] }),
    mkPlayer({ name: 'Player 5', avatar: '⭐', goldCoins: 1 }),
  ];

  gameState.players = placeholderPlayers;
  gameState.mode = selectedMode;

  // Create tokens for each player
  placeholderPlayers.forEach((p, i) => {
    const token = createToken(TOKEN_COLORS[i], i);
    playerTokens.push(token);
  });

  updateUI();

  // Hide loading screen
  document.getElementById('game-loading').style.display = 'none';
}

// ===== START OUTSIDE CLUB (walk-in intro) =====
let enteredClub = false;

function startOutsideClub() {
  enteredClub = false;
  const token = playerTokens[0];
  if (!token) return;

  // Place token outside the club door on the street
  token.mesh.position.set(0, -0.2, 12);
  token.mesh.rotation.y = 0; // Facing the club entrance (-Z direction is into the club)

  // Enter walk mode
  walkMode = true;
  walkOriginalPos = { x: 0, y: TILE_HEIGHT, z: 0 };
  controls.enabled = false;

  // Position camera behind token (further south, looking north toward club)
  camera.position.set(0, 3, 16);
  camera.lookAt(0, 0, 7.5);

  // Show intro prompt
  const hint = document.getElementById('walk-hint');
  if (hint) {
    hint.innerHTML = '<span style="font-size:1rem">🚶 Walk into the club with <kbd>W</kbd> to start the game</span>';
    hint.classList.add('show');
  }

  // Hide the walk button until inside
  const walkBtn = document.getElementById('walk-btn');
  if (walkBtn) walkBtn.style.display = 'none';

  // Force atmosphere to full outside (daytime)
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog.color = new THREE.Color(0xb0d8f0);
  scene.fog.near = 30;
  scene.fog.far = 70;
  ambientLight.intensity = 1.2;
  hemiLight.intensity = 0.9;
  dirLight.intensity = 1.5;
  accentLight1.intensity = 0;
  accentLight2.intensity = 0;
  accentLight3.intensity = 0;
  centerGlow.intensity = 0;
  skyDome.visible = false;
  daySkyDome.visible = true;
  skyMat.opacity = 0;
  daySkyMat.opacity = 1;
  streetLamps.forEach(lamp => {
    lamp.light.intensity = 0.6;
    lamp.head.material.emissiveIntensity = 0.5;
  });
}

// ===== CAMERA VIEWING POSITIONS (4 per PDF page 3) =====
const CAMERA_VIEWS = [
  { x: 0, y: 12, z: 14, label: 'View 1' },   // South
  { x: 14, y: 12, z: 0, label: 'View 2' },    // East
  { x: 0, y: 12, z: -14, label: 'View 3' },   // North
  { x: -14, y: 12, z: 0, label: 'View 4' },   // West
];
let currentView = 0;

function setCameraView(viewIndex) {
  currentView = viewIndex;
  const view = CAMERA_VIEWS[viewIndex];
  // Animate camera to new position
  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(view.x, view.y, view.z);
  const startTime = performance.now();
  const duration = 600;

  function animateCam() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easeT = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos, endPos, easeT);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    if (t < 1) requestAnimationFrame(animateCam);
  }
  animateCam();

  // Update active button
  document.querySelectorAll('.view-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === viewIndex);
  });
}

// ===== ROLL BUTTON =====
document.getElementById('roll-btn').addEventListener('click', rollDice);

// View buttons
document.querySelectorAll('.view-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => setCameraView(i));
});

// ===== PARTICLE EFFECTS =====
const particleSystems = [];

function spawnParticles(position, color, count = 30, spread = 0.8) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y + 0.3;
    positions[i * 3 + 2] = position.z;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.02 + Math.random() * 0.04;
    velocities.push({
      x: Math.cos(angle) * speed * spread,
      y: 0.03 + Math.random() * 0.05,
      z: Math.sin(angle) * speed * spread,
    });
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: color,
    size: 0.08,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  particleSystems.push({
    mesh: points,
    velocities,
    life: 1.0,
    decay: 0.015,
  });
}

function updateParticles() {
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    const ps = particleSystems[i];
    ps.life -= ps.decay;

    if (ps.life <= 0) {
      scene.remove(ps.mesh);
      ps.mesh.geometry.dispose();
      ps.mesh.material.dispose();
      particleSystems.splice(i, 1);
      continue;
    }

    const positions = ps.mesh.geometry.attributes.position.array;
    for (let j = 0; j < ps.velocities.length; j++) {
      positions[j * 3] += ps.velocities[j].x;
      positions[j * 3 + 1] += ps.velocities[j].y;
      positions[j * 3 + 2] += ps.velocities[j].z;
      ps.velocities[j].y -= 0.002; // gravity
    }
    ps.mesh.geometry.attributes.position.needsUpdate = true;
    ps.mesh.material.opacity = ps.life;
  }
}

// Helper to trigger particle burst at a tile
function burstAtTile(tileIndex, color) {
  if (tileIndex === null || !tiles[tileIndex]) return;
  const pos = tiles[tileIndex].pos;
  spawnParticles({ x: pos.x, y: TILE_HEIGHT, z: pos.z }, color, 25, 0.6);
}

// ===== RESIZE HANDLER =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== WALK MODE (WASD free movement outside the board) =====
let walkMode = false;
let walkOriginalPos = null;
const walkKeys = { w: false, a: false, s: false, d: false, q: false, e: false };
const WALK_SPEED = 0.12;
const WALK_ROT_SPEED = 0.05;

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k in walkKeys) { walkKeys[k] = true; e.preventDefault(); }
});
document.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k in walkKeys) walkKeys[k] = false;
});

function toggleWalkMode() {
  const btn = document.getElementById('walk-btn');
  const hint = document.getElementById('walk-hint');
  const token = playerTokens[gameState.currentPlayer];
  if (!token) return;

  // Don't enter walk mode during active sim (but allow exiting)
  if (!walkMode && sim.active) {
    showToast('Stop the simulation first to walk outside');
    return;
  }

  if (!walkMode) {
    // Enter walk mode — place token at the door, facing outside
    walkMode = true;
    walkOriginalPos = { x: token.mesh.position.x, y: token.mesh.position.y, z: token.mesh.position.z };
    btn.classList.add('active');
    btn.textContent = '🏠 Return';
    hint.classList.add('show');
    // Disable orbit controls while walking
    controls.enabled = false;
    // Position token at the door opening, facing outward (+Z)
    token.mesh.position.set(0, -0.2, HALF_FLOOR - 0.5);
    token.mesh.rotation.y = 0; // Facing +Z (away from board)
    // Position camera behind token (south side, looking north toward board)
    camera.position.set(0, 3, HALF_FLOOR + 4);
    camera.lookAt(token.mesh.position);
  } else {
    // Exit walk mode — return token to board
    walkMode = false;
    token.mesh.position.set(walkOriginalPos.x, walkOriginalPos.y, walkOriginalPos.z);
    btn.classList.remove('active');
    btn.textContent = '🚶 Walk';
    hint.classList.remove('show');
    // Re-enable orbit controls
    controls.enabled = true;
    // Reset camera to default board view
    camera.position.set(0, 12, 14);
    controls.target.set(0, 0, 0);
  }
}

function updateWalk() {
  if (!walkMode) return;
  const token = playerTokens[gameState.currentPlayer];
  if (!token) return;

  const mesh = token.mesh;
  // Forward direction based on current rotation
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(mesh.rotation);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(mesh.rotation);

  // Track if moving for walk animation
  let isMoving = false;
  if (walkKeys.w) { mesh.position.addScaledVector(forward, WALK_SPEED); isMoving = true; }
  if (walkKeys.s) { mesh.position.addScaledVector(forward, -WALK_SPEED); isMoving = true; }
  if (walkKeys.a) { mesh.position.addScaledVector(right, -WALK_SPEED); isMoving = true; }
  if (walkKeys.d) { mesh.position.addScaledVector(right, WALK_SPEED); isMoving = true; }
  if (walkKeys.q) mesh.rotation.y += WALK_ROT_SPEED;
  if (walkKeys.e) mesh.rotation.y -= WALK_ROT_SPEED;

  // Check if player walked through the door into the club
  if (!enteredClub && mesh.position.z < HALF_FLOOR - 0.3) {
    enteredClub = true;
    // Exit walk mode and start the game
    walkMode = false;
    controls.enabled = true;
    // Return token to board position
    token.mesh.position.set(walkOriginalPos.x, walkOriginalPos.y, walkOriginalPos.z);
    token.mesh.rotation.y = 0;
    if (token.tokenMesh) {
      token.tokenMesh.rotation.x = 0;
      token.tokenMesh.rotation.z = 0;
    }
    // Reset camera to board view
    camera.position.set(0, 12, 14);
    controls.target.set(0, 0, 0);
    // Show walk button for future use
    const walkBtn = document.getElementById('walk-btn');
    if (walkBtn) walkBtn.style.display = 'inline-block';
    // Update hint
    const hint = document.getElementById('walk-hint');
    if (hint) hint.classList.remove('show');
    // Welcome toast
    showToast('Welcome to the Highlife Club! Press Roll Dice to begin.');
    gameState.gameStarted = true;
    scheduleCoinRain();
    startIdleWatch();
    // Start sim if user chose auto-play
    if (pendingSimStart) {
      pendingSimStart = false;
      setTimeout(() => startSimulation(), 1000);
    }
    return;
  }

  // Walking animation — bob up/down + lean forward + body sway
  const wt = performance.now() * 0.008;
  if (isMoving) {
    // Bob up and down
    mesh.position.y = -0.2 + Math.abs(Math.sin(wt)) * 0.12;
    // Lean body forward slightly
    if (token.tokenMesh) {
      token.tokenMesh.rotation.x = Math.sin(wt) * 0.08;
      // Sway side to side
      token.tokenMesh.rotation.z = Math.sin(wt * 0.5) * 0.06;
    }
  } else {
    // Settle back to standing
    mesh.position.y = -0.2 + (mesh.position.y - (-0.2)) * 0.8;
    if (token.tokenMesh) {
      token.tokenMesh.rotation.x *= 0.85;
      token.tokenMesh.rotation.z *= 0.85;
    }
  }

  // Camera follows behind token
  const camOffset = new THREE.Vector3(0, 4, 6).applyEuler(mesh.rotation);
  const camTarget = mesh.position.clone().add(camOffset);
  camera.position.lerp(camTarget, 0.1);
  camera.lookAt(mesh.position);

  // Atmosphere based on token distance from board center
  const dist = Math.sqrt(mesh.position.x ** 2 + mesh.position.z ** 2);
  const t = Math.max(0, Math.min(1, (dist - 12) / 10));

  _bgLerp.copy(ATMOS.insideBg).lerp(ATMOS.outsideBg, t);
  scene.background = _bgLerp;
  _fogLerp.copy(ATMOS.insideFog).lerp(ATMOS.outsideFog, t);
  scene.fog.color = _fogLerp;
  scene.fog.near = ATMOS.insideFogNear + (ATMOS.outsideFogNear - ATMOS.insideFogNear) * t;
  scene.fog.far = ATMOS.insideFogFar + (ATMOS.outsideFogFar - ATMOS.insideFogFar) * t;

  ambientLight.intensity = ATMOS.insideAmbient + (ATMOS.outsideAmbient - ATMOS.insideAmbient) * t;
  hemiLight.intensity = ATMOS.insideHemi + (ATMOS.outsideHemi - ATMOS.insideHemi) * t;
  dirLight.intensity = ATMOS.insideDir + (ATMOS.outsideDir - ATMOS.insideDir) * t;

  const accentFade = 1 - t;
  accentLight1.intensity = 0.4 * accentFade;
  accentLight2.intensity = 0.3 * accentFade;
  accentLight3.intensity = 0.25 * accentFade;
  centerGlow.intensity = (0.6 + Math.sin(performance.now() * 0.001 * 2) * 0.3) * accentFade;

  streetLamps.forEach(lamp => {
    lamp.light.intensity = 0.6 * t;
    lamp.head.material.emissiveIntensity = 0.5 * t;
  });

  // Sky dome crossfade
  skyDome.visible = t < 0.99;
  daySkyDome.visible = t > 0.01;
  skyMat.opacity = 1 - t;
  daySkyMat.opacity = t;

  if (musicMaster && audioCtx) {
    const targetVol = 0.15 * (1 - t * 0.8);
    musicMaster.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.3);
  }
}

// ===== RENDER LOOP =====
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const t = performance.now() * 0.001;

  if (walkMode) {
    // Walk mode handles atmosphere + camera
    updateWalk();
  } else {
    // Atmosphere transition (inside club ↔ outside daytime) + music volume
    updateAtmosphere();

    // Hover effect for current player's token
    if (playerTokens[gameState.currentPlayer]) {
      const token = playerTokens[gameState.currentPlayer];
      token.mesh.position.y = TILE_HEIGHT + Math.sin(performance.now() * 0.003) * 0.08;
      if (token.tokenMesh) {
        token.tokenMesh.rotation.y += 0.01;
      }
      if (token.glowLight) {
        token.glowLight.intensity = 0.4 + Math.sin(t * 3) * 0.2;
      }
    }
  }

  // Update tile highlight pulse
  updateTileHighlight();

  // Update camera tracking
  updateCameraTracking();

  // Update particle effects
  updateParticles();

  // Update info display periodically
  if (Math.floor(performance.now() / 500) !== lastInfoUpdate) {
    lastInfoUpdate = Math.floor(performance.now() / 500);
    updateInfoDisplay();
  }

  renderer.render(scene, camera);
}

// ===== SIMULATION MODE (Auto-play for investor demos) =====

// Helper: reduce timer durations when sim is running so demo flows at watchable pace
function simTimer(normalSeconds) {
  if (!sim.active) return normalSeconds;
  if (sim.speed === 'turbo') return Math.max(3, Math.ceil(normalSeconds / 3));
  if (sim.speed === 'fast') return Math.max(6, Math.ceil(normalSeconds / 1.5));
  if (sim.speed === 'normal') return Math.max(12, Math.ceil(normalSeconds * 1.2));
  return Math.max(15, Math.ceil(normalSeconds * 1.5)); // slow
}

const AI_PROFILES = [
  { skill: 0.82, aggression: 0.90, insurancePref: 0.30, assetPref: 0.90, loanPref: 0.70, clickRate: 0.95, strategy: 'Aggressive',
    minCashReserve: 5000, repayThreshold: 0.7, boffinPref: 0.6 },
  { skill: 0.62, aggression: 0.40, insurancePref: 0.70, assetPref: 0.50, loanPref: 0.30, clickRate: 0.72, strategy: 'Conservative',
    minCashReserve: 20000, repayThreshold: 0.9, boffinPref: 0.5 },
  { skill: 0.75, aggression: 0.60, insurancePref: 0.50, assetPref: 0.75, loanPref: 0.50, clickRate: 0.88, strategy: 'Strategic',
    minCashReserve: 12000, repayThreshold: 0.8, boffinPref: 0.7 },
  { skill: 0.52, aggression: 0.95, insurancePref: 0.20, assetPref: 0.80, loanPref: 0.85, clickRate: 0.92, strategy: 'Risk-taker',
    minCashReserve: 3000, repayThreshold: 0.5, boffinPref: 0.4 },
  { skill: 0.48, aggression: 0.35, insurancePref: 0.60, assetPref: 0.45, loanPref: 0.25, clickRate: 0.65, strategy: 'Cautious',
    minCashReserve: 25000, repayThreshold: 0.95, boffinPref: 0.3 },
];

const SIM_SPEEDS = { slow: 10000, normal: 6000, fast: 2500, turbo: 700 };
const SIM_ACTION_DELAY = { slow: 7000, normal: 4500, fast: 1800, turbo: 500 };
const SIM_MODAL_READ = { slow: 10000, normal: 7000, fast: 2500, turbo: 700 };

let sim = {
  active: false,
  paused: false,
  speed: 'normal',
  log: [],
  turnCount: 0,
  lastAction: 0,
  waitingFor: null,
  modalOpenTime: 0,
};

function simLog(msg) {
  const ts = `[T${sim.turnCount}]`;
  sim.log.push(`${ts} ${msg}`);
  if (sim.log.length > 100) sim.log.shift();
  const logEl = document.getElementById('sim-log');
  if (logEl) {
    logEl.innerHTML = sim.log.slice(-30).map(l => `<div class="sim-log-line">${l}</div>`).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }
  updateSimStats();
}

function updateSimStats() {
  const statsEl = document.getElementById('sim-stats');
  if (!statsEl) return;
  const playerHexColors = ['#fc6b6b', '#4ecdc4', '#f9a825', '#abd40a', '#9b59b6'];
  const maxHecu = Math.max(...gameState.players.map(p => p.hecu), 1);

  let html = `<div class="sim-stats-row">
    <span class="sim-stats-label">Turn ${sim.turnCount}</span>
    <span class="sim-stats-value">${sim.speed.toUpperCase()}</span>
  </div>`;

  html += gameState.players.map((p, i) => {
    const color = playerHexColors[i];
    const barWidth = Math.max(2, (p.hecu / maxHecu) * 100);
    const netWorth = p.hecu + p.assets.reduce((s, a) => s + a.price, 0) - (p.bankLoan?.value || 0);
    return `
      <div class="sim-stats-player">
        <span class="sim-stats-dot" style="background:${color}"></span>
        <span class="sim-stats-pname">${p.name.split(' ')[0]}</span>
        <span class="sim-stats-pval">${netWorth.toLocaleString()}</span>
        <span class="sim-stats-passets">${p.assets.length}/10📦</span>
      </div>
      <div class="sim-stats-bar"><div class="sim-stats-bar-fill" style="width:${barWidth}%;background:${color}"></div></div>
    `;
  }).join('');

  statsEl.innerHTML = html;
}

function startSimulation() {
  if (sim.active) return;
  sim.active = true;
  sim.paused = false;
  sim.turnCount = 0;
  sim.log = [];

  const panel = document.getElementById('sim-panel');
  if (panel) panel.style.display = 'flex';

  const startBtn = document.getElementById('sim-start-btn');
  if (startBtn) startBtn.style.display = 'none';

  const pauseBtn = document.getElementById('sim-pause-btn');
  if (pauseBtn) pauseBtn.style.display = 'inline-block';

  const stopBtn = document.getElementById('sim-stop-btn');
  if (stopBtn) stopBtn.style.display = 'inline-block';

  // Rename players with AI names
  const aiNames = ['Alice (Aggressive)', 'Bob (Conservative)', 'Carol (Strategic)', 'Dave (Risk-taker)', 'Eve (Cautious)'];
  gameState.players.forEach((p, i) => { p.name = aiNames[i] || p.name; });

  simLog('🚀 Simulation started — 5 AI players');
  simLog(`Speed: ${sim.speed}`);
  updateUI();

  // Enable camera tracking
  camTrackEnabled = true;
  camTrackTarget = playerTokens[0];

  // Start auto-cycling camera views
  startAutoCameraCycle();

  simLoop();
}

// Auto camera view cycling
let autoCamInterval = null;
let autoCamViewIdx = 0;
function startAutoCameraCycle() {
  if (autoCamInterval) clearInterval(autoCamInterval);
  autoCamInterval = setInterval(() => {
    if (!sim.active || sim.paused) return;
    autoCamViewIdx = (autoCamViewIdx + 1) % CAMERA_VIEWS.length;
    setCameraView(autoCamViewIdx);
  }, 15000); // Change view every 15 seconds
}

function pauseSimulation() {
  sim.paused = !sim.paused;
  const btn = document.getElementById('sim-pause-btn');
  if (btn) btn.textContent = sim.paused ? 'Resume' : 'Pause';
  simLog(sim.paused ? '⏸ Simulation paused' : '▶ Simulation resumed');
}

function stopSimulation() {
  sim.active = false;
  sim.paused = false;
  sim.modalOpenTime = 0;
  camTrackEnabled = false;
  camTrackTarget = null;
  if (autoCamInterval) { clearInterval(autoCamInterval); autoCamInterval = null; }
  const panel = document.getElementById('sim-panel');
  if (panel) panel.style.display = 'none';
  const startBtn = document.getElementById('sim-start-btn');
  if (startBtn) startBtn.style.display = 'inline-block';
  const pauseBtn = document.getElementById('sim-pause-btn');
  if (pauseBtn) pauseBtn.style.display = 'none';
  const stopBtn = document.getElementById('sim-stop-btn');
  if (stopBtn) stopBtn.style.display = 'none';
  simLog('⏹ Simulation stopped');
}

function setSimSpeed(speed) {
  sim.speed = speed;
  simLog(`Speed changed to: ${speed}`);
}

function simLoop() {
  if (!sim.active) return;
  if (!sim.paused) simTick();
  setTimeout(simLoop, SIM_SPEEDS[sim.speed] || 2000);
}

function simCanAct() {
  // Don't act while in walk mode
  if (walkMode) return false;
  // Don't act while dice are spinning or token is moving
  if (gameState.isRolling || gameState.isMoving) return false;
  // Don't act if we recently took an action (prevents double-clicking)
  const now = performance.now();
  const delay = SIM_ACTION_DELAY[sim.speed] || 1500;
  if (now - sim.lastAction < delay) return false;
  return true;
}

function simRecordAction() {
  sim.lastAction = performance.now();
}

function simTick() {
  if (gameState.turnPhase === 'gameover') {
    sim.active = false;
    simLog('🏁 Game over!');
    return;
  }

  if (!simCanAct()) return;

  const eventModal = document.getElementById('event-modal');
  const questionModal = document.getElementById('question-modal');
  const player = gameState.players[gameState.currentPlayer];

  if (!player || player.bankrupt) return;

  // Event modal open — wait for read time, then click continue
  if (eventModal.classList.contains('is-open')) {
    if (sim.modalOpenTime === 0) {
      sim.modalOpenTime = performance.now();
      return;
    }
    const readTime = SIM_MODAL_READ[sim.speed] || 3500;
    if (performance.now() - sim.modalOpenTime < readTime) return;
    const btn = document.getElementById('event-btn');
    if (btn) {
      simRecordAction();
      sim.modalOpenTime = 0;
      btn.click();
    }
    return;
  }

  // Question modal open — wait for read time, then handle
  if (questionModal.classList.contains('is-open')) {
    if (sim.modalOpenTime === 0) {
      sim.modalOpenTime = performance.now();
      return;
    }
    const readTime = SIM_MODAL_READ[sim.speed] || 3500;
    if (performance.now() - sim.modalOpenTime < readTime) return;
    sim.modalOpenTime = 0;
    simHandleQuestionModal();
    return;
  }

  // Lottery overlay open — wait for animation, then click continue
  const lotteryOverlay = document.querySelector('.lottery-overlay');
  if (lotteryOverlay) {
    const lotteryBtn = lotteryOverlay.querySelector('#lottery-continue-btn');
    if (lotteryBtn && lotteryBtn.style.display !== 'none') {
      if (sim.modalOpenTime === 0) {
        sim.modalOpenTime = performance.now();
        return;
      }
      const readTime = SIM_MODAL_READ[sim.speed] || 3500;
      if (performance.now() - sim.modalOpenTime < readTime) return;
      simRecordAction();
      sim.modalOpenTime = 0;
      lotteryBtn.click();
    }
    return;
  }

  // No modal open — reset modal timer
  sim.modalOpenTime = 0;

  // No modal — auto-roll if waiting
  if (gameState.turnPhase === 'waiting') {
    sim.turnCount++;
    simLog(`🎲 ${player.name} rolls...`);
    simRecordAction();
    // Update camera tracking to current player
    camTrackTarget = playerTokens[gameState.currentPlayer];
    document.getElementById('roll-btn').click();
    return;
  }
}

function simHandleQuestionModal() {
  const content = document.getElementById('question-modal-content');
  const qf = gameState.questionFlow;
  const actingPlayerId = qf.consultingPlayer !== null ? qf.consultingPlayer : gameState.currentPlayer;
  const profile = AI_PROFILES[actingPlayerId] || AI_PROFILES[0];
  const playerName = gameState.players[actingPlayerId]?.name || 'Player';

  // Advert phase (company question)
  if (document.getElementById('advert-click-btn')) {
    // Check for boffin buttons (own company) — AI may use a boffin
    const boffinBtns = content.querySelectorAll('.boffin-btn');
    if (boffinBtns.length > 0 && Math.random() < profile.boffinPref) {
      const btn = boffinBtns[Math.floor(Math.random() * boffinBtns.length)];
      simLog(`💡 ${playerName} uses a Boffin`);
      simRecordAction();
      btn.click();
      return;
    }
    if (Math.random() < profile.clickRate) {
      simLog(`👆 ${playerName} clicks to attempt question`);
      simRecordAction();
      document.getElementById('advert-click-btn').click();
    } else {
      simLog(`⏳ ${playerName} hesitates...`);
      simRecordAction();
    }
    return;
  }

  // Consultation click
  if (document.getElementById('consult-click-btn')) {
    if (Math.random() < profile.clickRate) {
      simLog(`👆 ${playerName} accepts consultation`);
      simRecordAction();
      document.getElementById('consult-click-btn').click();
    } else {
      simRecordAction();
    }
    return;
  }

  // Question read phase — just wait for timer to expire
  if (document.getElementById('question-timer')) {
    return;
  }

  // Answer phase — pick an answer
  const answerBtns = content.querySelectorAll('.answer-option');
  if (answerBtns.length > 0) {
    const correctIdx = qf.currentCorrectIdx;
    const isCorrect = Math.random() < profile.skill;

    if (isCorrect && correctIdx !== undefined && answerBtns[correctIdx]) {
      simLog(`✅ ${playerName} answers correctly!`);
      simRecordAction();
      answerBtns[correctIdx].click();
    } else {
      const wrongIndices = Array.from(answerBtns.keys()).filter(i => i !== correctIdx);
      const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)] || 0;
      simLog(`❌ ${playerName} answers incorrectly`);
      simRecordAction();
      answerBtns[pick]?.click();
    }
    return;
  }

  // Credit Card payment
  if (document.getElementById('cc-pay-btn')) {
    const player = gameState.players[gameState.currentPlayer];
    simLog(`💳 ${player.name} pays credit card bill`);
    simRecordAction();
    document.getElementById('cc-pay-btn').click();
    return;
  }

  // Insurance Broker — buy or skip
  const policyBtns = content.querySelectorAll('[data-policy]:not([disabled])');
  if (policyBtns.length > 0) {
    const player = gameState.players[gameState.currentPlayer];
    if (Math.random() < profile.insurancePref && !player.insurancePolicy) {
      const bestBtn = policyBtns[policyBtns.length - 1];
      const policyId = bestBtn.dataset.policy;
      const policy = INSURANCE_POLICIES.find(p => p.id === policyId);
      simLog(`🛡️ ${player.name} buys ${policy.name}`);
      simRecordAction();
      bestBtn.click();
    } else {
      simLog(`🛡️ ${player.name} skips insurance`);
      simRecordAction();
      const skipBtn = document.getElementById('ins-skip-btn');
      if (skipBtn) skipBtn.click();
    }
    return;
  }

  // Buy Now — make purchase decisions
  if (document.getElementById('bn-buy-coin')) {
    const player = gameState.players[gameState.currentPlayer];
    const canAffordAssets = player.hecu > profile.minCashReserve;
    const buyAssets = canAffordAssets && Math.random() < profile.assetPref;
    const buyCoin = canAffordAssets && Math.random() < profile.aggression && player.goldCoins < 6;

    // Trade gold coins for boffins if AI has enough
    const boffinBtns2 = Array.from(content.querySelectorAll('[data-bn-boffin]'))
      .filter(b => player.goldCoins >= (BOFFIN_TYPES.find(t => t.id === b.dataset.bnBoffin)?.coinCost || 99));
    if (boffinBtns2.length > 0 && Math.random() < profile.boffinPref) {
      const btn = boffinBtns2[Math.floor(Math.random() * boffinBtns2.length)];
      const def = BOFFIN_TYPES.find(t => t.id === btn.dataset.bnBoffin);
      simLog(`${def.icon} ${player.name} trades ${def.coinCost} Gold Coins for ${def.name}`);
      simRecordAction();
      btn.click();
      return;
    }

    if (buyAssets && document.getElementById('bn-buy-assets') && !document.getElementById('bn-buy-assets').disabled) {
      simLog(`📦 ${player.name} browses Asset Items`);
      simRecordAction();
      document.getElementById('bn-buy-assets').click();
      return;
    }
    if (buyCoin && document.getElementById('bn-buy-coin') && !document.getElementById('bn-buy-coin').disabled) {
      simRecordAction();
      document.getElementById('bn-buy-coin').click();
      return;
    }
    simLog(`🛒 ${player.name} skips Buy Now`);
    simRecordAction();
    const skipBtn = document.getElementById('bn-skip-btn');
    if (skipBtn) skipBtn.click();
    return;
  }

  // Asset Purchase phase
  const assetBtns = content.querySelectorAll('[data-asset]:not([disabled])');
  if (assetBtns.length > 0) {
    const player = gameState.players[gameState.currentPlayer];
    const wantAssets = Math.random() < profile.assetPref;
    if (wantAssets) {
      const sortedBtns = Array.from(assetBtns).sort((a, b) => {
        const assetA = ASSET_ITEMS.find(ai => ai.id === parseInt(a.dataset.asset));
        const assetB = ASSET_ITEMS.find(ai => ai.id === parseInt(b.dataset.asset));
        return (assetB?.price || 0) - (assetA?.price || 0);
      });
      const btn = sortedBtns[0];
      const asset = ASSET_ITEMS.find(a => a.id === parseInt(btn.dataset.asset));
      if (asset && player.hecu >= asset.price) {
        simLog(`🏠 ${player.name} buys ${asset.name} for ${asset.price.toLocaleString()} HECUs`);
        simRecordAction();
        btn.click();
        return;
      }
    }
    simRecordAction();
    const doneBtn = document.getElementById('asset-done-btn');
    if (doneBtn) doneBtn.click();
    return;
  }

  // Building Society — loan decisions
  const loanBtns = content.querySelectorAll('[data-loan]:not([disabled])');
  if (loanBtns.length > 0) {
    const player = gameState.players[gameState.currentPlayer];
    const needsCash = player.hecu < profile.minCashReserve;
    const wantsLoan = needsCash || Math.random() < profile.loanPref;
    if (wantsLoan) {
      const btn = loanBtns[loanBtns.length - 1];
      const loan = BANK_LOANS.find(l => l.id === btn.dataset.loan);
      simLog(`💰 ${player.name} takes ${loan.label}`);
      simRecordAction();
      btn.click();
    } else {
      simLog(`🏦 ${player.name} skips loan`);
      simRecordAction();
      const skipBtn = document.getElementById('bs-skip-btn');
      if (skipBtn) skipBtn.click();
    }
    return;
  }

  // Building Society — repay loan
  if (document.getElementById('bs-repay-loan')) {
    const player = gameState.players[gameState.currentPlayer];
    const canRepay = player.hecu >= player.bankLoan.value + profile.minCashReserve;
    const wantsRepay = canRepay && Math.random() < profile.repayThreshold;
    if (wantsRepay) {
      simLog(`🏦 ${player.name} repays loan`);
      simRecordAction();
      document.getElementById('bs-repay-loan').click();
    } else {
      simRecordAction();
      const skipBtn = document.getElementById('bs-skip-btn');
      if (skipBtn) skipBtn.click();
    }
    return;
  }

  // Bankruptcy — sell assets
  const sellBtns = content.querySelectorAll('[data-sell]');
  if (sellBtns.length > 0) {
    const player = gameState.players[gameState.currentPlayer];
    const sortedBtns = Array.from(sellBtns).sort((a, b) => {
      const idxA = parseInt(a.dataset.sell);
      const idxB = parseInt(b.dataset.sell);
      return (player.assets[idxA]?.price || 0) - (player.assets[idxB]?.price || 0);
    });
    if (sortedBtns.length > 0) {
      const btn = sortedBtns[0];
      const idx = parseInt(btn.dataset.sell);
      const asset = player.assets[idx];
      simLog(`📉 ${player.name} sells ${asset?.name || 'asset'} at 20%`);
      simRecordAction();
      btn.click();
    }
    return;
  }

  // Bankruptcy — declare
  if (document.getElementById('bankrupt-btn')) {
    simRecordAction();
    document.getElementById('bankrupt-btn').click();
    return;
  }

  // Winner screen — stop simulation
  if (content.innerHTML.includes('WINNER')) {
    sim.active = false;
    return;
  }

  // Generic skip/done buttons
  const skipBtn = document.getElementById('bs-skip-btn') || document.getElementById('bn-skip-btn') || document.getElementById('asset-done-btn') || document.getElementById('ins-skip-btn');
  if (skipBtn) {
    simRecordAction();
    skipBtn.click();
  }
}

// ===== END SIMULATION MODE =====

let lastInfoUpdate = 0;

// ===== START =====
initGame();
updateInfoDisplay();
animate();

// ===== SIMULATION UI WIRING =====
window.startSimulation = startSimulation;
window.pauseSimulation = pauseSimulation;
window.stopSimulation = stopSimulation;
window.setSimSpeed = setSimSpeed;

const simStartBtn = document.getElementById('sim-start-btn');
if (simStartBtn) simStartBtn.addEventListener('click', startSimulation);

const walkBtn = document.getElementById('walk-btn');
if (walkBtn) walkBtn.addEventListener('click', toggleWalkMode);

const simPauseBtn = document.getElementById('sim-pause-btn');
if (simPauseBtn) simPauseBtn.addEventListener('click', pauseSimulation);

const simStopBtn = document.getElementById('sim-stop-btn');
if (simStopBtn) simStopBtn.addEventListener('click', stopSimulation);

const simSpeedSelect = document.getElementById('sim-speed-select');
if (simSpeedSelect) simSpeedSelect.addEventListener('change', (e) => setSimSpeed(e.target.value));

// ===== TOOLS MODAL (Boffin purchases — icon tools in the game account) =====
// Rules: a player obtains Boffins via the icon tools in their game account,
// paying with Gold Coins (expire at end of game) or cash by card (return to
// the account if unused).
function openToolsModal() {
  const modal = document.getElementById('tools-modal');
  const card = document.getElementById('tools-card');
  if (!modal || !card) return;
  const me = gameState.players[HUMAN_PLAYER];
  if (!me) return;

  const owned = me.boffins.map(b => `<span style="display:inline-block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 10px;margin:3px;font-size:.8rem">${b.icon} ${b.name} <span style="color:#6a8aaa">(${b.source === 'cash' ? 'cash' : 'coins'})</span></span>`).join('') || '<span style="color:#6a8aaa;font-size:.8rem">None held</span>';

  card.innerHTML = `
    <h2>🧰 Game Tools</h2>
    <p class="acct-sub">Boffins help you answer questions on your own Company Squares. Gold Coins: ${me.goldCoins}</p>
    <div style="text-align:left;margin-bottom:14px">
      <p style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:6px">Your Boffins this game</p>
      ${owned}
    </div>
    <div style="text-align:left;margin-bottom:16px">
      <p style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:6px">Acquire a Boffin</p>
      ${BOFFIN_TYPES.map(b => `
        <div class="reg-option" style="justify-content:space-between">
          <span>${b.icon} <b>${b.name}</b> — <span style="color:#6a8aaa">${b.desc}</span></span>
          <span style="display:flex;gap:6px;flex-shrink:0">
            <button class="sim-btn-small" data-tool-coin="${b.id}" ${me.goldCoins < b.coinCost ? 'disabled style="opacity:.4"' : ''}>${b.coinCost}🪙</button>
            <button class="sim-btn-small" data-tool-cash="${b.id}">${b.cashPricePence}p 💳</button>
          </span>
        </div>`).join('')}
      <p style="color:#6a8aaa;font-size:.72rem;margin-top:6px">Gold-coin Boffins are spent at end of this game. Cash Boffins return to your account if unused.</p>
    </div>
    <button class="advert-click-btn" id="tools-close-btn" style="background:rgba(255,255,255,.1);color:#a8c4d8">Close</button>
  `;

  modal.classList.add('is-open');

  card.querySelectorAll('[data-tool-coin]').forEach(btn => {
    btn.onclick = () => {
      const def = BOFFIN_TYPES.find(b => b.id === btn.dataset.toolCoin);
      if (def && me.goldCoins >= def.coinCost) {
        spendCoins(me, def.coinCost);
        me.boffins.push({ ...def, source: 'gold' });
        showToast(`Traded ${def.coinCost} Gold Coins for a ${def.name}`);
        updateUI();
        openToolsModal();
      }
    };
  });
  card.querySelectorAll('[data-tool-cash]').forEach(btn => {
    btn.onclick = () => {
      const def = BOFFIN_TYPES.find(b => b.id === btn.dataset.toolCash);
      if (def && confirm(`Buy a ${def.name} for ${def.cashPricePence}p on your registered card?`)) {
        me.boffins.push({ ...def, source: 'cash' });
        const acc = acct.loadAccount();
        acc.purchases.push({ boffin: def.id, pricePence: def.cashPricePence, at: new Date().toISOString() });
        acct.saveAccount(acc);
        showToast(`💳 ${def.name} purchased — unused cash Boffins return to your account`);
        updateUI();
        openToolsModal();
      }
    };
  });
  document.getElementById('tools-close-btn').onclick = () => modal.classList.remove('is-open');
}

// ===== GAME MODE PICKER =====
function renderModePicker() {
  const wrap = document.getElementById('mode-options');
  if (!wrap) return;
  const tierBtns = acct ? acct.TICKET_TIERS.map(t =>
    `<button class="mode-btn ${selectedMode === t ? 'active' : ''}" data-mode="${t}" title="${acct.TIER_LABELS[t]} prize game — a complete 5-part seat ticket is required">${acct.TIER_ICONS[t]} ${acct.TIER_LABELS[t]}</button>`
  ).join('') : '';
  wrap.innerHTML = `<button class="mode-btn ${selectedMode === 'free' ? 'active' : ''}" data-mode="free" title="Non-prize game — podium finishes win Bronze ticket parts">🎮 Free Game</button>${tierBtns}`;
  wrap.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => { selectedMode = btn.dataset.mode; renderModePicker(); });
  });
}

// ===== TITLE SCREEN =====
const titleScreen = document.getElementById('title-screen');
const titleStartBtn = document.getElementById('title-start-btn');
const titleSkipBtn = document.getElementById('title-skip-btn');

let pendingSimStart = false;

renderModePicker();

const accountBtn = document.getElementById('account-btn');
if (accountBtn) accountBtn.addEventListener('click', () => renderAccountModal(selectedMode === 'free' ? null : selectedMode));

const toolsBtn = document.getElementById('tools-btn');
if (toolsBtn) toolsBtn.addEventListener('click', () => {
  if (!gameState.gameStarted) { showToast('Tools are available once the game starts'); return; }
  openToolsModal();
});

if (titleStartBtn) {
  titleStartBtn.addEventListener('click', () => {
    selectedMode = 'free';
    gameState.mode = 'free';
    if (titleScreen) titleScreen.classList.add('hidden');
    pendingSimStart = true;
    setTimeout(() => startOutsideClub(), 600);
  });
}

if (titleSkipBtn) {
  titleSkipBtn.addEventListener('click', () => {
    tryEnterGame();
  });
}
