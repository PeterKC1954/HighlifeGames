import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== BOARD CONFIGURATION =====
const BOARD_SIZE = 11; // 11x11 grid (40 tiles around the edge like Monopoly)
const TILE_SIZE = 1;
const TILE_HEIGHT = 0.3;
const BOARD_WIDTH = BOARD_SIZE * TILE_SIZE;

// Square types and their colors
const SQUARE_TYPES = {
  start:          { color: 0xabd40a, label: 'Training Grant', icon: '🎓' },
  company:        { color: 0x1e5799, label: 'Company Square', icon: '🏢' },
  disaster:       { color: 0xfc6b6b, label: 'Disaster', icon: '💥' },
  building_soc:   { color: 0x4ecdc4, label: 'Building Society', icon: '🏦' },
  news_feed:      { color: 0xf9a825, label: 'News Feed', icon: '📰' },
  buy_now:        { color: 0xd02f7c, label: 'Buy Now', icon: '🛒' },
  account_report: { color: 0x9b59b6, label: 'Account Report', icon: '📋' },
  blank_company:  { color: 0x34495e, label: 'Blank Company Slot', icon: '📐' },
};

// ===== 20 COMPANY SPONSORS (from PPTX) =====
const COMPANIES = [
  { id: 1,  name: 'TechCorp',       colour: 0xe74c3c, cardImg: 'assets/companies/image1.jpg',  baseReward: 5000 },
  { id: 2,  name: 'GreenEnergy',    colour: 0x2ecc71, cardImg: 'assets/companies/image2.jpg',  baseReward: 4000 },
  { id: 3,  name: 'FoodPlus',       colour: 0xf39c12, cardImg: 'assets/companies/image3.jpg',  baseReward: 3500 },
  { id: 4,  name: 'AutoDrive',      colour: 0x3498db, cardImg: 'assets/companies/image4.jpg',  baseReward: 4500 },
  { id: 5,  name: 'StyleCo',        colour: 0xe91e63, cardImg: 'assets/companies/image5.jpg',  baseReward: 3000 },
  { id: 6,  name: 'HomeBuild',      colour: 0x8e44ad, cardImg: 'assets/companies/image6.jpg',  baseReward: 5500 },
  { id: 7,  name: 'HealthFirst',    colour: 0x16a085, cardImg: 'assets/companies/image7.jpg',  baseReward: 4200 },
  { id: 8,  name: 'EduSmart',       colour: 0xd35400, cardImg: 'assets/companies/image8.jpg',  baseReward: 3800 },
  { id: 9,  name: 'TravelWise',     colour: 0x2980b9, cardImg: 'assets/companies/image9.jpg',  baseReward: 4800 },
  { id: 10, name: 'FinSecure',      colour: 0x27ae60, cardImg: 'assets/companies/image10.jpg', baseReward: 6000 },
  { id: 11, name: 'MediaHub',       colour: 0xc0392b, cardImg: 'assets/companies/image11.jpg', baseReward: 3200 },
  { id: 12, name: 'SportZone',      colour: 0x2c3e50, cardImg: 'assets/companies/image12.jpg', baseReward: 3600 },
  { id: 13, name: 'BeautyBox',      colour: 0xe84393, cardImg: 'assets/companies/image13.jpg', baseReward: 2800 },
  { id: 14, name: 'GadgetPro',      colour: 0x00cec9, cardImg: 'assets/companies/image14.jpg', baseReward: 5200 },
  { id: 15, name: 'AgriGrow',       colour: 0x6ab04c, cardImg: 'assets/companies/image15.jpg', baseReward: 3400 },
  { id: 16, name: 'LogiMove',       colour: 0xfd79a8, cardImg: 'assets/companies/image16.jpg', baseReward: 4600 },
  { id: 17, name: 'CloudNet',       colour: 0x0984e3, cardImg: 'assets/companies/image17.jpg', baseReward: 5000 },
  { id: 18, name: 'PureWater',      colour: 0x00b894, cardImg: 'assets/companies/image18.jpg', baseReward: 3900 },
  { id: 19, name: 'BuildMakers',    colour: 0xa29bfe, cardImg: 'assets/companies/image19.jpg', baseReward: 4400 },
  { id: 20, name: 'PetCare',        colour: 0xffeaa7, cardImg: 'assets/companies/image20.jpg', baseReward: 2600 },
];

// Board layout (40 tiles around the edge, clockwise from bottom-left = Start)
const BOARD_LAYOUT = [
  'start', 'company', 'company', 'disaster', 'company',
  'building_soc', 'company', 'company', 'news_feed', 'company',
  'buy_now', 'company', 'company', 'disaster', 'company',
  'building_soc', 'company', 'company', 'account_report', 'company',
  'buy_now', 'company', 'disaster', 'company', 'company',
  'building_soc', 'company', 'company', 'news_feed', 'company',
  'buy_now', 'company', 'company', 'disaster', 'company',
  'building_soc', 'company', 'blank_company', 'account_report', 'company',
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
scene.background = new THREE.Color(0x0f1923);
scene.fog = new THREE.Fog(0x0f1923, 15, 35);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 12, 14);
camera.lookAt(0, 0, 0);

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
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);

// ===== LIGHTING =====
const ambientLight = new THREE.AmbientLight(0x4a6a8a, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(8, 16, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

const fillLight = new THREE.PointLight(0xabd40a, 0.5, 30);
fillLight.position.set(0, 6, 0);
scene.add(fillLight);

// ===== BOARD BASE =====
const baseGeo = new THREE.BoxGeometry(BOARD_WIDTH + 0.5, 0.2, BOARD_WIDTH + 0.5);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x152535, roughness: 0.8, metalness: 0.2 });
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
baseMesh.position.y = -0.15;
baseMesh.receiveShadow = true;
scene.add(baseMesh);

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

// ===== BUILD TILES =====
const tiles = [];
const tileMeshes = [];

BOARD_LAYOUT.forEach((type, i) => {
  const config = SQUARE_TYPES[type];
  const pos = getTilePosition(i);

  // Determine tile orientation (facing inward)
  const halfBoard = (BOARD_SIZE - 1) / 2;
  const isHorizontal = pos.z === halfBoard * TILE_SIZE || pos.z === -halfBoard * TILE_SIZE;
  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, TILE_HEIGHT, TILE_SIZE * 0.95);
  const tileMat = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: 0.6,
    metalness: 0.3,
  });
  const tile = new THREE.Mesh(tileGeo, tileMat);
  tile.position.set(pos.x, TILE_HEIGHT / 2, pos.z);
  tile.castShadow = true;
  tile.receiveShadow = true;
  tile.userData = { index: i, type, config };
  scene.add(tile);
  tileMeshes.push(tile);

  // Add a coloured top strip for company tiles
  if (type === 'company' || type === 'blank_company') {
    const company = tileCompanyMap[i];
    const stripColour = company ? company.colour : 0xabd40a;
    const stripGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, 0.04, TILE_SIZE * 0.25);
    const stripMat = new THREE.MeshStandardMaterial({ color: stripColour, roughness: 0.5, emissive: stripColour, emissiveIntensity: 0.15 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    // Position strip at the inner edge of the tile
    const innerDir = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
    strip.position.set(
      pos.x + innerDir.x * TILE_SIZE * 0.35,
      TILE_HEIGHT + 0.02,
      pos.z + innerDir.z * TILE_SIZE * 0.35,
    );
    scene.add(strip);
  }

  tiles.push({ index: i, type, config, pos, mesh: tile });
});

// ===== PLAYER TOKENS =====
const TOKEN_COLORS = [0xfc6b6b, 0x4ecdc4, 0xf9a825, 0xabd40a, 0x9b59b6];
const TOKEN_SHAPES = ['sphere', 'box', 'cone', 'cylinder', 'torus'];

const playerTokens = [];

function createToken(color, shape, index) {
  let geo;
  switch (shape) {
    case 'sphere': geo = new THREE.SphereGeometry(0.25, 16, 16); break;
    case 'box': geo = new THREE.BoxGeometry(0.35, 0.35, 0.35); break;
    case 'cone': geo = new THREE.ConeGeometry(0.25, 0.5, 16); break;
    case 'cylinder': geo = new THREE.CylinderGeometry(0.22, 0.22, 0.4, 16); break;
    case 'torus': geo = new THREE.TorusGeometry(0.2, 0.1, 8, 16); break;
    default: geo = new THREE.SphereGeometry(0.25, 16, 16);
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6, emissive: color, emissiveIntensity: 0.15 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  // Offset tokens on same tile
  const offsets = [
    { x: -0.2, z: -0.2 },
    { x: 0.2, z: -0.2 },
    { x: -0.2, z: 0.2 },
    { x: 0.2, z: 0.2 },
    { x: 0, z: 0 },
  ];

  const startPos = getTilePosition(0);
  mesh.position.set(
    startPos.x + offsets[index].x,
    TILE_HEIGHT + 0.25,
    startPos.z + offsets[index].z,
  );

  scene.add(mesh);
  return { mesh, position: 0, offset: offsets[index], color, shape };
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
const centerGeo = new THREE.CylinderGeometry(2, 2, 0.1, 32);
const centerMat = new THREE.MeshStandardMaterial({ color: 0x0f1923, roughness: 0.5, metalness: 0.7 });
const centerMesh = new THREE.Mesh(centerGeo, centerMat);
centerMesh.position.y = 0.05;
scene.add(centerMesh);

const ringGeo = new THREE.TorusGeometry(2.1, 0.04, 8, 64);
const ringMat = new THREE.MeshStandardMaterial({ color: 0xabd40a, emissive: 0xabd40a, emissiveIntensity: 0.3 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.12;
scene.add(ring);

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
    phase: null, // advert, question, answer, result
    timer: 0,
    timerInterval: null,
    boffinUsed: false,
    rewardValue: 0,
    isConsultation: false,
    consultingPlayer: null,
  },
};

// ===== BOFFINS SYSTEM =====
const BOFFIN_TYPES = [
  { id: 'hint',    name: 'Hint Boffin',    reduction: 0.75, icon: '💡', desc: 'Shows a hint, reward ×0.75' },
  { id: 'eliminate', name: 'Eliminate Boffin', reduction: 0.50, icon: '✂️', desc: 'Removes 2 wrong answers, reward ×0.50' },
  { id: 'expert',  name: 'Expert Boffin',  reduction: 0.25, icon: '🎓', desc: 'Expert advice, reward ×0.25' },
];

// ===== TEAM WORKER 3D OBJECTS =====
const teamWorkerMeshes = {}; // tileIndex -> array of meshes

function createTeamWorker(tileIndex, playerIndex) {
  const pos = getTilePosition(tileIndex);
  const playerColor = TOKEN_COLORS[playerIndex];
  const geo = new THREE.CapsuleGeometry(0.08, 0.12, 4, 8);
  const mat = new THREE.MeshStandardMaterial({ color: playerColor, roughness: 0.3, metalness: 0.6, emissive: playerColor, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

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
  for (let i = 1; i <= toIndex - fromIndex; i++) {
    steps.push((fromIndex + i) % BOARD_LAYOUT.length);
  }
  for (const step of steps) {
    const pos = getTilePosition(step);
    const startY = token.mesh.position.y;
    const targetY = TILE_HEIGHT + 0.25;

    // Hop animation
    const duration = 300;
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

// ===== ROLL DICE =====
async function rollDice() {
  if (gameState.isRolling || gameState.isMoving) return;
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
  const spinDuration = 800;
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

  // Move current player's token
  const token = playerTokens[gameState.currentPlayer];
  if (token) {
    const newPos = (token.position + total) % BOARD_LAYOUT.length;
    await moveToken(token, token.position, newPos);

    // Trigger event for landed square
    showSquareEvent(newPos);
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

// ===== SAMPLE QUESTIONS (placeholder — will come from Supabase) =====
const SAMPLE_QUESTIONS = [
  {
    question: 'What is the primary service of this company?',
    options: ['Cloud Computing', 'Food Delivery', 'Car Rental', 'Pet Grooming'],
    correct: 0,
  },
  {
    question: 'Which year was this company founded?',
    options: ['1998', '2005', '2012', '2019'],
    correct: 1,
  },
  {
    question: 'What is the company\s main product?',
    options: ['Software Platform', 'Physical Goods', 'Consulting Service', 'Mobile App'],
    correct: 2,
  },
  {
    question: 'Where is this company headquartered?',
    options: ['London', 'Manchester', 'Birmingham', 'Leeds'],
    correct: 0,
  },
];

function getRandomQuestion() {
  return SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];
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

  // Non-company squares use the simple modal
  const modal = document.getElementById('event-modal');
  const iconEl = document.getElementById('event-icon');
  const titleEl = document.getElementById('event-title');
  const descEl = document.getElementById('event-desc');
  const btnEl = document.getElementById('event-btn');

  iconEl.textContent = tile.config.icon;
  titleEl.textContent = tile.config.label;

  const descriptions = {
    start: 'Training Grant Square! Collect your training award for each Account Worker you hold.',
    disaster: 'Disaster Square! You may lose an Asset Item if you don\'t have insurance.',
    building_soc: 'Building Society! Your HECUs may increase or decrease based on the market.',
    news_feed: 'News Feed Square! You receive a Lotto Ticket. Watch the draw for a chance to win HECUs!',
    buy_now: 'Buy Now Square! Purchase Boffins with Gold Coins to help with your questions.',
    account_report: 'Account Report Square! Receive a Report Card with positive or negative results.',
  };

  descEl.textContent = descriptions[tileType] || 'You landed on a square.';
  btnEl.textContent = 'Continue';

  modal.classList.add('is-open');

  btnEl.onclick = () => {
    modal.classList.remove('is-open');
    nextTurn();
  };
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
  qf.question = getRandomQuestion();

  // Show advert phase (10 seconds)
  showAdvertPhase(company, playerId, isOwnCompany);
}

// ===== ADVERT PHASE (10 seconds) =====
function showAdvertPhase(company, playerId, isOwnCompany) {
  const qf = gameState.questionFlow;
  qf.phase = 'advert';
  qf.timer = 10;

  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  const player = gameState.players[playerId];
  const message = isOwnCompany
    ? `Click screen to attempt question to gain another Team Worker on this Company Account. Boffins allowed — select any on screen.`
    : `Click screen to attempt question to gain this account. Use of Boffins not allowed.`;

  // Show boffins if own company
  const boffinsHtml = isOwnCompany && player.boffins.length > 0
    ? `<div class="boffin-list">
        <p class="boffin-title">Your Boffins (click to use — reduces reward):</p>
        ${player.boffins.map((b, i) => `
          <button class="boffin-btn" data-boffin="${i}">
            <span class="boffin-icon">${b.icon}</span>
            <span class="boffin-name">${b.name}</span>
            <span class="boffin-reward">Reward ×${b.reduction}</span>
          </button>
        `).join('')}
      </div>`
    : '';

  content.innerHTML = `
    <div class="advert-display">
      <img src="${company.cardImg}" alt="${company.name}" class="company-card-img" />
      <h2 class="company-name">${company.name}</h2>
      <p class="advert-message">${message}</p>
      <div class="advert-timer" id="advert-timer">${qf.timer}s</div>
      <button class="advert-click-btn" id="advert-click-btn">Click to Attempt Question</button>
      ${boffinsHtml}
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
function useBoffin(boffinIdx, playerId) {
  const player = gameState.players[playerId];
  const boffin = player.boffins[boffinIdx];
  if (!boffin) return;

  // Reduce reward
  gameState.questionFlow.rewardValue = Math.round(gameState.questionFlow.rewardValue * boffin.reduction);
  gameState.questionFlow.boffinUsed = boffin;

  // Remove boffin from player
  player.boffins.splice(boffinIdx, 1);
}

// ===== QUESTION PHASE (20 seconds read-only) =====
function showQuestionPhase() {
  const qf = gameState.questionFlow;
  qf.phase = 'question';
  qf.timer = 20;

  const content = document.getElementById('question-modal-content');
  const player = gameState.players[qf.playerId];
  const boffinNote = qf.boffinUsed ? `<p class="boffin-used-note">${qf.boffinUsed.icon} ${qf.boffinUsed.name} used — reward reduced to ${qf.rewardValue.toLocaleString()} HECU</p>` : '';

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
  qf.timer = 20;

  const content = document.getElementById('question-modal-content');
  const player = gameState.players[qf.playerId];

  // If eliminate boffin used, remove 2 wrong answers
  let options = [...qf.question.options];
  let correctIdx = qf.question.correct;

  if (qf.boffinUsed && qf.boffinUsed.id === 'eliminate') {
    const wrongIndices = options.map((_, i) => i).filter(i => i !== correctIdx);
    // Remove 2 wrong answers
    const toRemove = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
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

  const boffinHint = qf.boffinUsed && qf.boffinUsed.id === 'hint'
    ? `<p class="boffin-hint-text">💡 Hint: The answer relates to the company's core business.</p>`
    : '';

  const boffinExpert = qf.boffinUsed && qf.boffinUsed.id === 'expert'
    ? `<p class="boffin-hint-text">🎓 Expert suggests: Option ${correctIdx + 1} is most likely correct.</p>`
    : '';

  content.innerHTML = `
    <div class="answer-display">
      <div class="question-text-small">${qf.question.question}</div>
      ${boffinHint}
      ${boffinExpert}
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
      showResultMessage(`✅ Correct! ${gameState.players[qf.consultingPlayer].name} earned ${qf.rewardValue.toLocaleString()} HECU consultation fee.`);
    } else {
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
    }
  } else {
    if (qf.isConsultation) {
      // Wrong consultation: landing player compensated 3x fee
      const compensation = qf.rewardValue * 3;
      gameState.players[playerId].hecu += compensation;
      showResultMessage(`❌ Bad Consultation Advice! ${player.name} compensated with ${compensation.toLocaleString()} HECU (3× consultation fee).`);
    } else {
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
  qf.question = getRandomQuestion();

  const owner = gameState.players[ownerId];
  const landingPlayer = gameState.players[landingPlayerId];

  // Show consultation request to owner
  const modal = document.getElementById('question-modal');
  const content = document.getElementById('question-modal-content');

  content.innerHTML = `
    <div class="consultation-request">
      <img src="${company.cardImg}" alt="${company.name}" class="company-card-img" />
      <h2 class="company-name">${company.name}</h2>
      <p class="consultation-message">Landing player <b>${landingPlayer.name}</b> wants to consult with you.</p>
      <p class="consultation-note">Click screen to get question. No Boffins allowed.</p>
      <p class="reward-display">Consultation Fee: ${qf.rewardValue.toLocaleString()} HECU (10% of base)</p>
      <button class="advert-click-btn" id="consult-click-btn">Click to Answer Question</button>
      <div class="advert-timer" id="advert-timer">10s</div>
    </div>
  `;

  modal.classList.add('is-open');
  qf.timer = 10;
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
  qf.boffinUsed = false;
  qf.isConsultation = false;
  qf.consultingPlayer = null;
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

// ===== NEXT TURN =====
function nextTurn() {
  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
  gameState.turnPhase = 'waiting';
  updateUI();
}

// ===== UPDATE UI =====
function updateUI() {
  const player = gameState.players[gameState.currentPlayer];
  if (player) {
    document.getElementById('turn-player').textContent = player.name;
  }

  // Update player chips
  const strip = document.getElementById('players-strip');
  strip.innerHTML = gameState.players.map((p, i) => `
    <div class="player-chip ${i === gameState.currentPlayer ? 'active' : ''}">
      <span class="player-chip-avatar">${p.avatar}</span>
      <div class="player-chip-info">
        <span class="player-chip-name">${p.name}</span>
        <span class="player-chip-hecu">${p.hecu.toLocaleString()} HECU</span>
        <span class="player-chip-extra">${p.companyAccounts.length} accounts · ${p.boffins.length} boffins</span>
      </div>
    </div>
  `).join('');

  const rollBtn = document.getElementById('roll-btn');
  rollBtn.disabled = false;
  rollBtn.textContent = 'Roll Dice';
}

// ===== INIT GAME (placeholder — will connect to Supabase later) =====
async function initGame() {
  // For now, create placeholder players
  // This will be replaced with real game session data from Supabase
  const placeholderPlayers = [
    { name: 'Player 1', avatar: '🎲', hecu: 50000, boffins: [{ ...BOFFIN_TYPES[0] }, { ...BOFFIN_TYPES[1] }], assets: [], companyAccounts: [] },
    { name: 'Player 2', avatar: '🏆', hecu: 50000, boffins: [{ ...BOFFIN_TYPES[0] }], assets: [], companyAccounts: [] },
    { name: 'Player 3', avatar: '🧠', hecu: 50000, boffins: [{ ...BOFFIN_TYPES[2] }], assets: [], companyAccounts: [] },
    { name: 'Player 4', avatar: '🛡️', hecu: 50000, boffins: [{ ...BOFFIN_TYPES[1] }, { ...BOFFIN_TYPES[2] }], assets: [], companyAccounts: [] },
    { name: 'Player 5', avatar: '⭐', hecu: 50000, boffins: [{ ...BOFFIN_TYPES[0] }], assets: [], companyAccounts: [] },
  ];

  gameState.players = placeholderPlayers;

  // Create tokens for each player
  placeholderPlayers.forEach((p, i) => {
    const token = createToken(TOKEN_COLORS[i], TOKEN_SHAPES[i], i);
    playerTokens.push(token);
  });

  updateUI();

  // Hide loading screen
  document.getElementById('game-loading').style.display = 'none';
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

// ===== RESIZE HANDLER =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== RENDER LOOP =====
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Gentle rotation of center ring
  ring.rotation.z += 0.005;

  // Hover effect for current player's token
  if (playerTokens[gameState.currentPlayer]) {
    const token = playerTokens[gameState.currentPlayer];
    token.mesh.position.y = TILE_HEIGHT + 0.25 + Math.sin(performance.now() * 0.003) * 0.08;
  }

  // Update info display periodically
  if (Math.floor(performance.now() / 500) !== lastInfoUpdate) {
    lastInfoUpdate = Math.floor(performance.now() / 500);
    updateInfoDisplay();
  }

  renderer.render(scene, camera);
}

let lastInfoUpdate = 0;

// ===== START =====
initGame();
updateInfoDisplay();
animate();
