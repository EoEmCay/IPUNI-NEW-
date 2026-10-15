import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  ArrowLeft,
  Camera,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Flame,
  Info,
  Sparkles,
  Zap,
  Pause,
  Play,
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// DANH MỤC MÓN ĂN MẪU (DINH DƯỠNG & ĐƯỜNG HUYẾT ƯỚC TÍNH)
// ========================================================
const PRESET_FOODS = [
  {
    id: 'boba',
    name: 'Trà sữa trân châu đường đen',
    type: 'Đồ uống ngọt',
    emoji: '🧋',
    calories: 485,
    carbs: 68,
    gi: 85,
    risk: 'spike',
    riskLabel: 'TĂNG ĐƯỜNG HUYẾT CẤP TÍNH',
    riskSub: 'GI 85 • Đường đơn hấp thu rất nhanh',
    peakGlucoseMg: 198,
    color: '#f59e0b',
    glowColor: '#ff6b3d',
  },
  {
    id: 'com_tam',
    name: 'Cơm tấm sườn bì chả',
    type: 'Món ăn chính',
    emoji: '🍛',
    calories: 680,
    carbs: 82,
    gi: 76,
    risk: 'spike',
    riskLabel: 'TĂNG ĐƯỜNG HUYẾT CAO',
    riskSub: 'GI 76 • Tinh bột trắng & nhiều mỡ',
    peakGlucoseMg: 175,
    color: '#ea580c',
    glowColor: '#ff7a3d',
  },
  {
    id: 'pho_bo',
    name: 'Phở bò tái nạm',
    type: 'Món nước',
    emoji: '🍜',
    calories: 430,
    carbs: 52,
    gi: 58,
    risk: 'moderate',
    riskLabel: 'ĐƯỜNG HUYẾT TĂNG VỪA',
    riskSub: 'GI 58 • Hấp thu vừa phải, nên theo dõi',
    peakGlucoseMg: 142,
    color: '#0ea5e9',
    glowColor: '#ffd166',
  },
  {
    id: 'salad',
    name: 'Salad ức gà sốt mè',
    type: 'Healthy',
    emoji: '🥗',
    calories: 230,
    carbs: 9,
    gi: 22,
    risk: 'normal',
    riskLabel: 'ĐƯỜNG HUYẾT ỔN ĐỊNH',
    riskSub: 'GI 22 • Giàu chất xơ, hấp thu chậm',
    peakGlucoseMg: 108,
    color: '#10b981',
    glowColor: '#5dffb5',
  },
  {
    id: 'apple',
    name: 'Táo xanh nguyên quả',
    type: 'Trái cây',
    emoji: '🍏',
    calories: 95,
    carbs: 25,
    gi: 36,
    risk: 'normal',
    riskLabel: 'ĐƯỜNG HUYẾT ỔN ĐỊNH',
    riskSub: 'GI 36 • Chất xơ làm chậm hấp thu',
    peakGlucoseMg: 118,
    color: '#84cc16',
    glowColor: '#5dffb5',
  },
];

// Mốc thời gian của 1 chu kỳ hoạt cảnh liền mạch (giây)
const T_SCAN = 2.5;
const T_MOUTH = 4.6;
const T_ESO = 6.9;
const T_STOMACH = 9.2;
const CYCLE = 14.5;

const STEPS = ['Quét', 'Miệng', 'Thực quản', 'Dạ dày', 'Máu'];

const RISK_COLORS = {
  spike: 0xff3b4a,
  moderate: 0xffb020,
  normal: 0x22e39a,
};
const VESSEL_BASE = 0x2a9dff;

// ========================================================
// SHADER HOLOGRAM (FRESNEL VIỀN SÁNG + SCANLINE + MỜ DẦN Ở CHÂN)
// ========================================================
const HOLO_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vY = wp.y;
    vec4 mv = viewMatrix * wp;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const HOLO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBase;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  void main() {
    float f = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), uPower);
    float scan = 0.86 + 0.14 * sin(vY * 52.0 - uTime * 2.4);
    float sweep = smoothstep(0.0, 0.08, 0.08 - abs(fract(vY * 0.12 - uTime * 0.18) - 0.5)) * 0.35;
    float fade = smoothstep(-3.2, -1.85, vY);
    float a = (uBase + f * uIntensity + sweep * f) * scan * fade * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

// Ống có bán kính thay đổi theo chiều dài (tay, chân, thực quản, dạ dày...)
function varTube(curve, segs, radial, radiusFn) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [];
  const nor = [];
  const idx = [];
  const P = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusFn(t);
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const s = Math.sin(v);
      const c = -Math.cos(v);
      n.set(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize();
      pos.push(P.x + r * n.x, P.y + r * n.y, P.z + r * n.z);
      nor.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

const lathe = (profile, segments = 64) =>
  new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);

const curveOf = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Vẽ mặt đĩa món ăn (emoji hoặc ảnh người dùng chụp)
function drawFoodPlate(canvas, food, img) {
  const ctx = canvas.getContext('2d');
  const S = canvas.width;
  const R = S / 2;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.beginPath();
  ctx.arc(R, R, R - 4, 0, Math.PI * 2);
  ctx.clip();
  const bg = ctx.createRadialGradient(R, R * 0.8, R * 0.1, R, R, R);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.75, '#e8eef5');
  bg.addColorStop(1, '#c9d6e3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  if (img) {
    const scale = Math.max(S / img.width, S / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
  } else {
    ctx.font = `${Math.round(S * 0.56)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.emoji, R, R * 1.06);
  }
  ctx.restore();
  ctx.lineWidth = S * 0.035;
  ctx.strokeStyle = food.color;
  ctx.beginPath();
  ctx.arc(R, R, R - ctx.lineWidth / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();
}

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedFood, setSelectedFood] = useState(PRESET_FOODS[0]);
  const [phaseText, setPhaseText] = useState('AI quét 3D & phân tích món ăn');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  const [currentGlucose, setCurrentGlucose] = useState(95);
  const [autoRotate, setAutoRotate] = useState(true);
  const [paused, setPaused] = useState(false);

  const autoRotateRef = useRef(true);
  const pausedRef = useRef(false);
  const animRef = useRef({ time: 0, food: PRESET_FOODS[0], applyFood: null });

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const st = animRef.current;
    st.food = selectedFood;
    st.time = 0;
    st.applyFood?.(selectedFood);
  }, [selectedFood]);

  const handleRestart = useCallback(() => {
    animRef.current.time = 0;
    setPaused(false);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setSelectedFood({
      id: 'custom_' + Date.now(),
      name: 'Món ăn bạn vừa chụp',
      type: 'Ảnh chụp thực tế',
      emoji: '📸',
      imageUrl,
      calories: 520,
      carbs: 64,
      gi: 78,
      risk: 'spike',
      riskLabel: 'CẢNH BÁO TĂNG ĐƯỜNG HUYẾT',
      riskSub: 'Ước tính từ ảnh • Nhiều tinh bột',
      peakGlucoseMg: 185,
      color: '#ec4899',
      glowColor: '#ff6b8b',
    });
    e.target.value = '';
  };

  // ========================================================
  // KHÔNG GIAN 3D
  // ========================================================
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;
    const st = animRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040913);
    scene.fog = new THREE.FogExp2(0x040913, 0.045);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.85, 0.55, 0.12);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Ánh sáng
    scene.add(new THREE.AmbientLight(0x6aa8ff, 0.55));
    scene.add(new THREE.HemisphereLight(0x9fe8ff, 0x0a1430, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x00e5ff, 1.2);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const organLight = new THREE.PointLight(0xff6a5a, 1.5, 3.5);
    organLight.position.set(0.2, -0.7, 0.9);
    scene.add(organLight);

    const timeUniform = { value: 0 };
    const holo = (color, { base = 0.035, intensity = 1.2, power = 2.4, opacity = 1 } = {}) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uBase: { value: base },
          uIntensity: { value: intensity },
          uPower: { value: power },
          uOpacity: { value: opacity },
          uTime: timeUniform,
        },
        vertexShader: HOLO_VERT,
        fragmentShader: HOLO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

    const skinMat = holo(0x2bc8ff, { base: 0.03, intensity: 1.25, power: 2.3 });
    const boneMat = holo(0xcff4ff, { base: 0.07, intensity: 0.85, power: 1.6 });
    const skullMat = holo(0xcff4ff, { base: 0.02, intensity: 0.55, power: 2.0 });
    const lungMat = holo(0x7fd6ff, { base: 0.025, intensity: 0.5, power: 1.8 });
    const featureMat = holo(0xe6fbff, { base: 0.25, intensity: 0.9, power: 1.2 });

    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // ── THÂN NGƯỜI (vai, ngực, eo, hông) ──
    const torsoGeo = lathe([
      [0.0, -1.78], [0.5, -1.74], [0.74, -1.56], [0.8, -1.3], [0.76, -1.0],
      [0.64, -0.62], [0.6, -0.36], [0.64, -0.05], [0.74, 0.32], [0.82, 0.66],
      [0.9, 0.9], [0.88, 1.04], [0.7, 1.16], [0.36, 1.27], [0.2, 1.33], [0.0, 1.35],
    ]);
    torsoGeo.scale(1, 1, 0.6);
    bodyGroup.add(new THREE.Mesh(torsoGeo, skinMat));

    const neckGeo = lathe([[0.2, 1.24], [0.185, 1.42], [0.18, 1.6], [0.2, 1.7]], 40);
    neckGeo.scale(1, 1, 0.9);
    bodyGroup.add(new THREE.Mesh(neckGeo, skinMat));

    // ── ĐẦU (xoay quanh cổ khi nuốt) ──
    const HEAD_PIVOT = 1.58;
    const headGroup = new THREE.Group();
    headGroup.position.y = HEAD_PIVOT;
    bodyGroup.add(headGroup);

    const headGeo = lathe([
      [0.0, 1.6], [0.13, 1.62], [0.26, 1.7], [0.33, 1.82], [0.37, 1.98],
      [0.39, 2.14], [0.38, 2.3], [0.33, 2.45], [0.24, 2.56], [0.12, 2.62], [0.0, 2.64],
    ]);
    headGeo.scale(0.92, 1, 1.0);
    headGeo.translate(0, -HEAD_PIVOT, 0.02);
    headGroup.add(new THREE.Mesh(headGeo, skinMat));

    const skullGeo = lathe([
      [0.0, 1.98], [0.3, 2.02], [0.34, 2.16], [0.33, 2.32], [0.27, 2.47], [0.14, 2.56], [0.0, 2.58],
    ], 40);
    skullGeo.scale(0.9, 1, 1);
    skullGeo.translate(0, -HEAD_PIVOT, 0.0);
    headGroup.add(new THREE.Mesh(skullGeo, skullMat));

    // Mắt, mũi, miệng
    const eyeGeo = new THREE.SphereGeometry(0.045, 16, 12);
    eyeGeo.scale(1.4, 0.6, 0.5);
    [-0.13, 0.13].forEach((x) => {
      const eye = new THREE.Mesh(eyeGeo, featureMat);
      eye.position.set(x, 2.1 - HEAD_PIVOT, 0.37);
      headGroup.add(eye);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 12), skinMat);
    nose.position.set(0, 1.99 - HEAD_PIVOT, 0.4);
    nose.rotation.x = -0.25;
    headGroup.add(nose);

    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 1.85 - HEAD_PIVOT, 0.355);
    headGroup.add(mouthGroup);
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 10, 32), featureMat);
    mouthGroup.add(lips);
    const mouthHole = new THREE.Mesh(
      new THREE.CircleGeometry(0.068, 32),
      new THREE.MeshBasicMaterial({ color: 0x3a0a14, transparent: true, opacity: 0.9 })
    );
    mouthHole.position.z = -0.005;
    mouthGroup.add(mouthHole);

    // ── TAY ──
    const armCurves = [-1, 1].map((s) =>
      curveOf([[s * 0.86, 0.98, 0], [s * 1.0, 0.55, -0.03], [s * 1.1, 0.05, -0.05], [s * 1.16, -0.45, 0.02], [s * 1.2, -0.85, 0.06]])
    );
    armCurves.forEach((c, i) => {
      const s = i === 0 ? -1 : 1;
      bodyGroup.add(new THREE.Mesh(varTube(c, 48, 24, (t) => 0.17 - 0.07 * t + 0.015 * Math.sin(t * Math.PI * 2)), skinMat));
      bodyGroup.add(new THREE.Mesh(varTube(c, 32, 8, () => 0.03), boneMat));
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), skinMat);
      hand.scale.set(0.8, 1.35, 0.55);
      hand.position.set(s * 1.22, -1.0, 0.07);
      bodyGroup.add(hand);
    });

    // ── CHÂN (mờ dần về phía dưới) ──
    [-1, 1].forEach((s) => {
      const c = curveOf([[s * 0.4, -1.45, 0], [s * 0.44, -2.2, 0.02], [s * 0.42, -2.95, 0.04], [s * 0.4, -3.8, 0.0]]);
      bodyGroup.add(new THREE.Mesh(varTube(c, 40, 24, (t) => 0.3 - 0.13 * t), skinMat));
      bodyGroup.add(new THREE.Mesh(varTube(c, 24, 8, () => 0.045), boneMat));
    });

    // ── BỘ XƯƠNG: cột sống, xương sườn, xương ức, xương đòn, chậu ──
    const vertGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.07, 14);
    for (let y = -1.35; y <= 1.5; y += 0.105) {
      const v = new THREE.Mesh(vertGeo, boneMat);
      v.position.set(0, y, -0.24 + 0.05 * Math.cos((y - 0.1) * 1.4));
      bodyGroup.add(v);
    }
    for (let i = 0; i < 10; i++) {
      const y0 = 0.98 - i * 0.12;
      const rx = 0.42 + 0.22 * Math.sin(((i + 1.5) / 11) * Math.PI);
      const span = i > 6 ? 0.78 : 0.95;
      [-1, 1].forEach((s) => {
        const pts = [];
        for (let k = 0; k <= 16; k++) {
          const a = (k / 16) * Math.PI * span;
          pts.push(new THREE.Vector3(s * rx * Math.sin(a), y0 - 0.16 * Math.sin(a * 0.5), -0.22 + 0.55 * (1 - Math.cos(a)) / 2));
        }
        bodyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 6, false), boneMat));
      });
    }
    const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.03), boneMat);
    sternum.position.set(0, 0.68, 0.33);
    bodyGroup.add(sternum);
    [-1, 1].forEach((s) => {
      const c = curveOf([[0, 1.02, 0.28], [s * 0.4, 1.08, 0.2], [s * 0.82, 1.02, 0.02]]);
      bodyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.025, 6, false), boneMat));
    });
    const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 10, 40, Math.PI * 1.15), boneMat);
    pelvis.rotation.set(Math.PI / 2 + 0.35, 0, Math.PI * 0.92);
    pelvis.position.set(0, -1.38, 0.0);
    pelvis.scale.set(1.15, 1, 0.8);
    bodyGroup.add(pelvis);

    // ── PHỔI ──
    const lungs = [];
    [-1, 1].forEach((s) => {
      const lung = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 22), lungMat);
      lung.scale.set(0.95, 1.6, 0.75);
      lung.position.set(s * 0.36, 0.52, -0.02);
      bodyGroup.add(lung);
      lungs.push(lung);
    });

    // ── NỘI TẠNG (đặc, phát sáng) ──
    const organ = (color, emissive, emissiveIntensity = 0.5) =>
      new THREE.MeshPhysicalMaterial({
        color,
        emissive,
        emissiveIntensity,
        roughness: 0.38,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
        sheen: 0.6,
        sheenColor: new THREE.Color(0xffc2c2),
      });

    const HEART_POS = new THREE.Vector3(0.08, 0.5, 0.06);
    const heartMat = organ(0xd7263d, 0x8a0f1f, 0.8);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 22), heartMat);
    heart.scale.set(1, 1.15, 0.9);
    heart.rotation.z = -0.4;
    heart.position.copy(HEART_POS);
    bodyGroup.add(heart);

    const liver = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 22), organ(0x8f2d2d, 0x3d0b0b, 0.45));
    liver.scale.set(1.35, 0.62, 0.8);
    liver.rotation.z = 0.22;
    liver.position.set(-0.3, -0.42, 0.06);
    bodyGroup.add(liver);

    const pancreasCurve = curveOf([[-0.18, -0.98, 0.0], [0.15, -0.9, -0.02], [0.45, -0.82, -0.04]]);
    bodyGroup.add(new THREE.Mesh(varTube(pancreasCurve, 24, 12, (t) => 0.06 - 0.03 * t), organ(0xf2b13b, 0x7a4a05, 0.45)));

    // Thực quản: từ sau miệng xuống tâm vị dạ dày
    const esophagusCurve = curveOf([
      [0, 1.84, 0.2], [0, 1.66, 0.04], [0, 1.25, -0.08], [0.01, 0.6, -0.1],
      [0.04, 0.0, -0.06], [0.09, -0.3, 0.0], [0.14, -0.4, 0.05],
    ]);
    const esoMat = organ(0xff7f8f, 0x8c1d34, 0.55);
    bodyGroup.add(new THREE.Mesh(varTube(esophagusCurve, 80, 16, () => 0.045), esoMat));

    // Dạ dày hình chữ J
    const stomachCurve = curveOf([
      [0.14, -0.42, 0.06], [0.36, -0.34, 0.09], [0.5, -0.56, 0.12], [0.46, -0.86, 0.14],
      [0.28, -1.04, 0.15], [0.06, -1.06, 0.14], [-0.1, -0.95, 0.12], [-0.2, -0.84, 0.1],
    ]);
    const stomachGroup = new THREE.Group();
    bodyGroup.add(stomachGroup);
    const stomachRadius = (t) => {
      if (t < 0.12) return 0.07 + (t / 0.12) * 0.15;
      if (t < 0.55) return 0.22 + 0.05 * Math.sin(((t - 0.12) / 0.43) * Math.PI);
      return 0.22 - ((t - 0.55) / 0.45) * 0.16;
    };
    const stomachGeo = varTube(stomachCurve, 90, 32, stomachRadius);
    const stomachMat = organ(0xe0453f, 0x7a1414, 0.55);
    stomachGroup.add(new THREE.Mesh(stomachGeo, stomachMat));
    const stomachRim = holo(0xffffff, { base: 0.0, intensity: 1.1, power: 2.0 });
    stomachGroup.add(new THREE.Mesh(stomachGeo, stomachRim));
    const STOMACH_CENTER = new THREE.Vector3(0.3, -0.72, 0.13);

    // Tá tràng + ruột non
    const intestinePts = [[-0.2, -0.84, 0.1], [-0.3, -0.98, 0.13], [-0.42, -1.12, 0.16]];
    const rows = [-1.14, -1.26, -1.38, -1.5];
    rows.forEach((y, r) => {
      const dir = r % 2 === 0 ? 1 : -1;
      for (let k = 0; k <= 6; k++) {
        const x = dir * (-0.42 + (k / 6) * 0.84);
        intestinePts.push([x, y + 0.03 * Math.sin(k * 1.7), 0.17 + 0.04 * Math.cos(k * 1.3)]);
      }
    });
    const intestineCurve = curveOf(intestinePts);
    const intestineMat = organ(0xf08a7e, 0x6b2018, 0.35);
    bodyGroup.add(new THREE.Mesh(varTube(intestineCurve, 260, 12, () => 0.05), intestineMat));
    const INTESTINE_POINT = new THREE.Vector3(0.0, -1.3, 0.2);

    // ── MẠCH MÁU & ĐƯỜNG ĐI CỦA GLUCOSE ──
    const H = HEART_POS.toArray();
    const absorbRoute = curveOf([
      INTESTINE_POINT.toArray(), [-0.15, -1.02, 0.16], [-0.32, -0.62, 0.14],
      [-0.2, -0.15, 0.04], [0.0, 0.25, 0.02], H,
    ]);
    const distRoutes = [-1, 1].flatMap((s) => [
      curveOf([H, [0.05, 0.85, 0.02], [s * 0.1, 1.3, 0.03], [s * 0.12, 1.7, 0.06], [s * 0.1, 2.2, 0.05]]),
      curveOf([H, [s * 0.35, 0.9, 0.02], [s * 0.86, 0.96, 0.02], [s * 1.08, 0.1, -0.02], [s * 1.2, -0.85, 0.06]]),
      curveOf([H, [0.02, 0.2, -0.13], [0.0, -0.6, -0.15], [0.0, -1.4, -0.1], [s * 0.4, -1.7, 0.0], [s * 0.44, -2.9, 0.03]]),
    ]);
    const vesselMats = [];
    [absorbRoute, ...distRoutes].forEach((c, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: VESSEL_BASE,
        emissive: VESSEL_BASE,
        emissiveIntensity: 0.55,
        roughness: 0.4,
        transparent: true,
        opacity: 0.85,
      });
      vesselMats.push(mat);
      bodyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 64, i === 0 ? 0.03 : 0.022, 8, false), mat));
    });

    // ── HẠT GLUCOSE CHẢY TRONG MẠCH MÁU ──
    const glowTex = makeGlowTexture();
    const MAX_P = 700;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(MAX_P * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setDrawRange(0, 0);
    const pMat = new THREE.PointsMaterial({
      size: 0.075,
      map: glowTex,
      color: 0xff4d4d,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glucosePoints = new THREE.Points(pGeo, pMat);
    glucosePoints.frustumCulled = false;
    bodyGroup.add(glucosePoints);
    const particles = Array.from({ length: MAX_P }, () => ({
      route: -1, t: 0, speed: 0, delay: 0,
      j: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03),
    }));
    const resetParticles = () => {
      particles.forEach((p) => {
        p.route = -1;
        p.t = 0;
        p.delay = Math.random() * 2.2;
        p.speed = 0.9 + Math.random() * 0.6;
      });
    };
    const routeLen = [absorbRoute, ...distRoutes].map((c) => c.getLength());

    // Hạt thức ăn bị axit phân giải trong dạ dày
    const CHYME = 180;
    const cGeo = new THREE.BufferGeometry();
    const cPos = new Float32Array(CHYME * 3);
    cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
    const cMat = new THREE.PointsMaterial({
      size: 0.06,
      map: glowTex,
      color: 0xffd34d,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const chyme = new THREE.Points(cGeo, cMat);
    chyme.frustumCulled = false;
    bodyGroup.add(chyme);
    const chymeSeeds = Array.from({ length: CHYME }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.04 + Math.random() * 0.14,
      y: (Math.random() - 0.5) * 0.3,
      s: 0.8 + Math.random() * 1.6,
    }));

    // ── MÓN ĂN 3D (đĩa có hình món ăn + hào quang quét AI) ──
    const foodGroup = new THREE.Group();
    bodyGroup.add(foodGroup);
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = plateCanvas.height = 512;
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    plateTex.anisotropy = 4;
    const plateSideMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.65, roughness: 0.28 });
    const plateTopMat = new THREE.MeshStandardMaterial({
      map: plateTex,
      emissive: 0xffffff,
      emissiveMap: plateTex,
      emissiveIntensity: 0.4,
      roughness: 0.45,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.07, 64), [plateSideMat, plateTopMat, plateSideMat]);
    disc.rotation.x = Math.PI / 2 - 0.3;
    const discHolder = new THREE.Group();
    discHolder.add(disc);
    foodGroup.add(discHolder);
    const foodGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xff6b3d, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    foodGlow.scale.set(1.7, 1.7, 1);
    foodGlow.position.z = -0.1;
    discHolder.add(foodGlow);
    const scanRings = [0.56, 0.66].map((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.006, 6, 96),
        new THREE.MeshBasicMaterial({ color: i ? 0x7cf7ff : 0x00e5ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      discHolder.add(ring);
      return ring;
    });

    // Viên thức ăn sau khi nuốt
    const bolusMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.1, roughness: 0.3 });
    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 18), bolusMat);
    const bolusGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xffb347, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    bolusGlow.scale.set(0.42, 0.42, 1);
    bolus.add(bolusGlow);
    bolus.visible = false;
    bodyGroup.add(bolus);

    const FOOD_START = new THREE.Vector3(1.3, 1.25, 1.35);

    st.applyFood = (food) => {
      plateSideMat.color.set(food.color);
      bolusMat.color.set(food.color);
      bolusMat.emissive.set(food.color);
      foodGlow.material.color.set(food.glowColor);
      bolusGlow.material.color.set(food.glowColor);
      drawFoodPlate(plateCanvas, food, null);
      plateTex.needsUpdate = true;
      if (food.imageUrl) {
        const img = new Image();
        img.onload = () => {
          drawFoodPlate(plateCanvas, food, img);
          plateTex.needsUpdate = true;
        };
        img.src = food.imageUrl;
      }
    };
    st.applyFood(st.food);

    // ── PHÔNG NỀN: vòng tròn hologram + bụi sáng ──
    const backdrop = new THREE.Group();
    backdrop.position.set(0, 0.4, -2.4);
    scene.add(backdrop);
    [2.3, 2.9, 3.7].forEach((r, i) => {
      const pts = [];
      for (let k = 0; k <= 128; k++) {
        const a = (k / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x1fb6ff, transparent: true, opacity: 0.14 - i * 0.03 })
      );
      backdrop.add(line);
    });
    const dashPts = [];
    for (let k = 0; k < 72; k++) {
      const a0 = (k / 72) * Math.PI * 2;
      const a1 = a0 + Math.PI / 90;
      dashPts.push(new THREE.Vector3(Math.cos(a0) * 2.6, Math.sin(a0) * 2.6, 0), new THREE.Vector3(Math.cos(a1) * 2.6, Math.sin(a1) * 2.6, 0));
    }
    const dashRing = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(dashPts),
      new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 })
    );
    backdrop.add(dashRing);

    const DUST = 260;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 12;
      dPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dPos[i * 3 + 2] = -4 + Math.random() * 6;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(
      dGeo,
      new THREE.PointsMaterial({ size: 0.03, map: glowTex, color: 0x5fd4ff, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    scene.add(dust);

    // ── CĂN KHUNG CAMERA THEO KÍCH THƯỚC MÀN HÌNH ──
    const frame = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const isMobile = w < 768;
      const needH = 5.1;
      const needW = isMobile ? 2.9 : 3.4;
      const dist = Math.max(needH / 2 / halfTan, needW / 2 / (halfTan * aspect));
      const offX = isMobile ? -0.35 : aspect > 1.2 ? -0.55 : 0;
      camera.position.set(offX, 0.3, dist);
      camera.lookAt(offX, 0.3, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    frame();

    // ── XOAY BẰNG CHUỘT / CẢM ỨNG ──
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let userYaw = 0;
    let userPitch = 0;
    let autoYaw = 0;
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e) => {
      if (!dragging) return;
      userYaw += (e.clientX - lastX) * 0.008;
      userPitch = Math.max(-0.35, Math.min(0.35, userPitch + (e.clientY - lastY) * 0.004));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    container.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // ── ĐỒNG BỘ GIAO DIỆN (CHỈ setState KHI GIÁ TRỊ THAY ĐỔI) ──
    const ui = { progress: -1, text: '', step: -1, glucose: -1 };
    const pushUI = (progress, text, step, glucose) => {
      if (progress !== ui.progress) { ui.progress = progress; setSimProgress(progress); }
      if (text !== ui.text) { ui.text = text; setPhaseText(text); }
      if (step !== ui.step) { ui.step = step; setPhaseIndex(step); }
      if (glucose !== ui.glucose) { ui.glucose = glucose; setCurrentGlucose(glucose); }
    };

    const tmpV = new THREE.Vector3();
    const mouthLocal = new THREE.Vector3();
    const baseColor = new THREE.Color(VESSEL_BASE);
    const riskColor = new THREE.Color();
    let lastStep = -1;
    let elapsed = 0;
    const clock = new THREE.Clock();
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      timeUniform.value = elapsed;
      if (!pausedRef.current) st.time += dt;

      const food = st.food;
      const t = st.time % CYCLE;
      const risk = food.risk;

      // Xoay góc nhìn
      const targetAuto = autoRotateRef.current && !dragging ? Math.sin(elapsed * 0.3) * 0.35 : autoYaw;
      autoYaw += (targetAuto - autoYaw) * 0.05;
      bodyGroup.rotation.y = userYaw + autoYaw;
      bodyGroup.rotation.x = userPitch;
      backdrop.rotation.z = elapsed * 0.03;
      dashRing.rotation.z = -elapsed * 0.12;
      dust.rotation.y = elapsed * 0.01;

      // Nhịp sống: thở & tim đập
      const breath = 1 + Math.sin(elapsed * 1.5) * 0.025;
      lungs.forEach((l) => l.scale.set(0.95 * breath, 1.6 * breath, 0.75 * breath));
      const bpm = t > T_STOMACH && risk === 'spike' ? 11 : 7;
      const beat = 1 + Math.pow(Math.max(0, Math.sin(elapsed * bpm)), 6) * 0.12;
      heart.scale.set(beat, 1.15 * beat, 0.9 * beat);

      mouthGroup.getWorldPosition(tmpV);
      mouthLocal.copy(bodyGroup.worldToLocal(tmpV));

      let step = 0;
      let text = '';
      let mouthOpen = 0;
      let headTilt = 0;
      let glucose = 95;

      // Mặc định
      foodGroup.visible = false;
      bolus.visible = false;
      cMat.opacity = Math.max(0, cMat.opacity - dt * 1.5);
      stomachMat.emissiveIntensity = 0.55;
      stomachGroup.scale.setScalar(1);
      esoMat.emissiveIntensity = 0.55;
      intestineMat.emissiveIntensity = 0.35;
      organLight.intensity = 1.5;

      if (t < T_SCAN) {
        // 1. Món ăn 3D xuất hiện & AI quét
        step = 0;
        text = 'AI quét 3D & phân tích dinh dưỡng món ăn';
        foodGroup.visible = true;
        const pop = clamp01(t / 0.6);
        const s = pop < 1 ? 1 - Math.pow(1 - pop, 3) * Math.cos(pop * 6) : 1;
        foodGroup.scale.setScalar(Math.max(0.01, s));
        foodGroup.position.copy(FOOD_START).y += Math.sin(elapsed * 2) * 0.05;
        discHolder.rotation.y = Math.sin(elapsed * 1.2) * 0.35;
        scanRings[0].rotation.set(elapsed * 1.4, elapsed * 0.8, 0);
        scanRings[1].rotation.set(-elapsed * 0.9, 0, elapsed * 1.1);
        pGeo.setDrawRange(0, 0);
      } else if (t < T_MOUTH) {
        // 2. Bay vào miệng: mở miệng → nuốt → ngậm lại
        step = 1;
        text = 'Mở miệng — đưa thức ăn vào';
        const p = (t - T_SCAN) / (T_MOUTH - T_SCAN);
        const front = tmpV.copy(mouthLocal).add(new THREE.Vector3(0.0, 0.0, 0.42));
        if (p < 0.72) {
          const q = ease(p / 0.72);
          foodGroup.visible = true;
          foodGroup.position.lerpVectors(FOOD_START, front, q);
          foodGroup.scale.setScalar(THREE.MathUtils.lerp(1, 0.28, q));
          discHolder.rotation.y = THREE.MathUtils.lerp(discHolder.rotation.y, 0, 0.1);
        } else {
          const q = ease((p - 0.72) / 0.28);
          foodGroup.visible = q < 0.98;
          foodGroup.position.lerpVectors(front, mouthLocal, q);
          foodGroup.scale.setScalar(THREE.MathUtils.lerp(0.28, 0.02, q));
          bolus.visible = q > 0.55;
          bolus.position.copy(mouthLocal);
          bolus.scale.setScalar(clamp01((q - 0.55) / 0.45));
        }
        mouthOpen = p < 0.3 ? 0 : p < 0.55 ? (p - 0.3) / 0.25 : p < 0.92 ? 1 : 1 - (p - 0.92) / 0.08;
        headTilt = -0.14 * Math.sin(Math.PI * clamp01((p - 0.2) / 0.8));
      } else if (t < T_ESO) {
        // 3. Trôi dọc thực quản xuống dạ dày
        step = 2;
        text = 'Thức ăn trôi qua thực quản xuống dạ dày';
        const p = ease((t - T_MOUTH) / (T_ESO - T_MOUTH));
        bolus.visible = true;
        bolus.scale.setScalar(1);
        esophagusCurve.getPointAt(p, bolus.position);
        esoMat.emissiveIntensity = 0.9 + Math.sin(elapsed * 14) * 0.3;
      } else if (t < T_STOMACH) {
        // 4. Dạ dày co bóp, axit phân giải
        step = 3;
        text = 'Dạ dày co bóp — axit phân giải thức ăn';
        const p = (t - T_ESO) / (T_STOMACH - T_ESO);
        if (p < 0.4) {
          const q = ease(p / 0.4);
          bolus.visible = true;
          bolus.position.lerpVectors(stomachCurve.getPointAt(0.02), STOMACH_CENTER, q);
          bolus.scale.setScalar(1 - q * 0.9);
        }
        cMat.opacity = Math.min(1, cMat.opacity + dt * 2.5);
        const churn = 1 + Math.sin(elapsed * 8) * 0.035;
        stomachGroup.scale.set(churn, 2 - churn, churn);
        stomachMat.emissiveIntensity = 0.9 + Math.sin(elapsed * 10) * 0.35;
        organLight.intensity = 3.2;
      } else {
        // 5. Ruột non hấp thu → glucose vào máu khắp cơ thể
        step = 4;
        const p = (t - T_STOMACH) / (CYCLE - T_STOMACH);
        if (lastStep !== 4) resetParticles();
        text = p < 0.25
          ? 'Ruột non hấp thu glucose vào mạch máu'
          : risk === 'spike'
            ? '⚠️ Glucose ồ ạt vào máu — đường huyết tăng vọt'
            : risk === 'moderate'
              ? 'Glucose vào máu ở mức vừa phải'
              : '✅ Glucose hấp thu chậm — đường huyết ổn định';

        intestineMat.emissiveIntensity = 0.6 + Math.sin(elapsed * 6) * 0.25;
        const n = Math.round(Math.max(40, Math.min(MAX_P, food.carbs * 8)));
        pGeo.setDrawRange(0, n);
        riskColor.setHex(RISK_COLORS[risk] ?? RISK_COLORS.normal);
        pMat.color.copy(riskColor).lerp(new THREE.Color(0xffffff), 0.25);

        for (let i = 0; i < n; i++) {
          const pt = particles[i];
          if (pt.delay > 0) {
            pt.delay -= dt;
            tmpV.copy(INTESTINE_POINT).add(pt.j).multiplyScalar(1);
            tmpV.x += (Math.random() - 0.5) * 0.25;
          } else {
            const routeIdx = pt.route < 0 ? 0 : pt.route;
            pt.t += (pt.speed * dt) / routeLen[routeIdx];
            if (pt.t >= 1) {
              pt.t = 0;
              pt.route = 1 + Math.floor(Math.random() * distRoutes.length);
            }
            const curve = pt.route <= 0 ? absorbRoute : distRoutes[pt.route - 1];
            curve.getPointAt(Math.min(pt.t, 1), tmpV).add(pt.j);
          }
          pPos[i * 3] = tmpV.x;
          pPos[i * 3 + 1] = tmpV.y;
          pPos[i * 3 + 2] = tmpV.z;
        }
        pGeo.attributes.position.needsUpdate = true;

        const k = clamp01(p / 0.3);
        vesselMats.forEach((m) => {
          m.color.copy(baseColor).lerp(riskColor, k);
          m.emissive.copy(baseColor).lerp(riskColor, k);
          m.emissiveIntensity = risk === 'spike' ? 0.7 + k * (0.6 + Math.sin(elapsed * 12) * 0.35) : 0.6 + k * 0.3;
        });

        const q = clamp01(p / 0.6);
        glucose = Math.round(95 + (food.peakGlucoseMg - 95) * (1 - Math.pow(1 - q, 3)));
      }

      if (step !== 4) {
        pGeo.setDrawRange(0, 0);
        vesselMats.forEach((m) => {
          m.color.lerp(baseColor, 0.08);
          m.emissive.lerp(baseColor, 0.08);
          m.emissiveIntensity = 0.55;
        });
      }

      // Hạt dưỡng chất xoáy trong dạ dày
      if (cMat.opacity > 0.01) {
        for (let i = 0; i < CHYME; i++) {
          const c = chymeSeeds[i];
          const a = c.a + elapsed * c.s;
          cPos[i * 3] = STOMACH_CENTER.x + Math.cos(a) * c.r;
          cPos[i * 3 + 1] = STOMACH_CENTER.y + c.y + Math.sin(elapsed * 3 + c.a) * 0.03;
          cPos[i * 3 + 2] = STOMACH_CENTER.z + Math.sin(a) * c.r * 0.6;
        }
        cGeo.attributes.position.needsUpdate = true;
        cMat.color.set(food.glowColor);
      }

      mouthGroup.scale.set(1, 0.18 + mouthOpen * 0.95, 1);
      headGroup.rotation.x = headTilt;

      lastStep = step;
      pushUI(Math.min(100, Math.floor((t / CYCLE) * 100)), text, step, glucose);
      composer.render();
    };
    animate();

    window.addEventListener('resize', frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', frame);
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      st.applyFood = null;
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m?.dispose?.());
      });
      glowTex.dispose();
      plateTex.dispose();
      composer.dispose?.();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  const risk = selectedFood.risk;
  const isSpike = risk === 'spike';
  const mmolValue = (currentGlucose / 18.0).toFixed(1);
  const bannerClass = isSpike ? styles.warningSpike : risk === 'moderate' ? styles.warningModerate : styles.warningNormal;
  const gaugeHot = currentGlucose > 140;

  return (
    <div className={styles.container}>
      <div ref={canvasRef} className={styles.canvasWrapper} />
      <div className={styles.ambientGrid} />
      <div className={styles.ambientVignette} />

      {/* ── THANH TRÊN CÙNG ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/')} title="Quay lại Trang chủ DIA+">
            <ArrowLeft size={16} />
            <span>Trang chủ DIA+</span>
          </button>
          <div className={styles.brandPill}>
            <strong>DIA+ 3D</strong>
            <span className={styles.brandBadge}>LIVE</span>
          </div>
        </div>
        <div className={styles.topBarRight}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setPaused((v) => !v)}
            title={paused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${autoRotate ? styles.actionBtnActive : ''}`}
            onClick={() => setAutoRotate((v) => !v)}
            title={autoRotate ? 'Tắt tự xoay' : 'Bật tự xoay'}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* ── HUD GÓC TRÁI ── */}
      <aside className={styles.leftHud}>
        <div className={styles.foodHeaderCard}>
          <div className={styles.foodTagRow}>
            <span className={styles.foodTypeTag}>
              <Sparkles size={11} /> {selectedFood.type}
            </span>
            <span className={styles.foodPhaseTag}>{simProgress}%</span>
          </div>

          <h1 className={styles.foodName}>
            {selectedFood.emoji} {selectedFood.name}
          </h1>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>
                <Flame size={12} color="#f97316" style={{ display: 'inline', marginRight: 4 }} />
                Calo
              </span>
              <div className={styles.metricValue}>
                {selectedFood.calories} <span className={styles.metricUnit}>kcal</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>
                <Zap size={12} color="#00f0ff" style={{ display: 'inline', marginRight: 4 }} />
                Đường (Carb)
              </span>
              <div className={styles.metricValue} style={{ color: selectedFood.carbs > 40 ? '#f87171' : '#34d399' }}>
                {selectedFood.carbs} <span className={styles.metricUnit}>g</span>
              </div>
            </div>
          </div>

          <div className={`${styles.warningBanner} ${bannerClass}`}>
            <div className={styles.warningIconWrap}>
              {risk === 'normal' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div>
              <div>{selectedFood.riskLabel}</div>
              <div className={styles.warningSub}>{selectedFood.riskSub}</div>
            </div>
          </div>
        </div>

        <div className={styles.glucoseGaugeCard}>
          <div className={styles.gaugeTitleRow}>
            <span>ĐƯỜNG HUYẾT TRONG MÁU</span>
            <Activity size={13} color={gaugeHot ? '#ef4444' : '#10b981'} />
          </div>
          <div className={styles.glucoseNumberRow}>
            <span className={styles.glucoseBigNumber} style={{ color: gaugeHot ? '#f87171' : '#5eead4' }}>
              {currentGlucose}
            </span>
            <span className={styles.metricUnit}>mg/dL</span>
            <span className={styles.glucoseSubMmol}>({mmolValue} mmol/L)</span>
          </div>
          <div className={styles.glucoseTrack}>
            <div
              className={styles.glucoseFill}
              style={{
                width: `${Math.min(100, Math.max(8, ((currentGlucose - 70) / 140) * 100))}%`,
                background: gaugeHot ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #22d3ee, #10b981)',
              }}
            />
          </div>

          <div className={styles.stepRow}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`${styles.stepItem} ${i === phaseIndex ? styles.stepActive : ''} ${i < phaseIndex ? styles.stepDone : ''}`}
              >
                <span className={styles.stepDot} />
                <span className={styles.stepLabel}>{s}</span>
              </div>
            ))}
          </div>

          <div className={styles.journeyStatusText}>
            <Info size={13} />
            <span>{phaseText}</span>
          </div>
        </div>
      </aside>

      {/* ── CHỌN MÓN & CHỤP ẢNH ── */}
      <footer className={styles.bottomControlTray}>
        <div className={styles.foodCarousel}>
          {PRESET_FOODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.foodItemBtn} ${selectedFood.id === item.id ? styles.foodItemBtnActive : ''}`}
              onClick={() => setSelectedFood(item)}
            >
              <span className={styles.foodEmoji}>{item.emoji}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.actionControlRow}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button type="button" className={styles.uploadPhotoBtn} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            <span>Chụp ảnh món ăn</span>
          </button>
          <button type="button" className={styles.replayBtn} onClick={handleRestart} title="Chạy lại từ đầu">
            <RotateCcw size={15} />
            <span>Xem lại</span>
          </button>
        </div>
      </footer>

      <div className={styles.viewHintBadge}>
        <span>Kéo chuột / vuốt để xoay cơ thể</span>
      </div>
    </div>
  );
}
