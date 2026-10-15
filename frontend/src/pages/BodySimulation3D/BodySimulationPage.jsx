import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
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
  Zap
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// DANH MỤC MÓN ĂN MẪU ĐƯỢC CHUẨN HÓA DINH DƯỠNG & ĐƯỜNG HUYẾT
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
    risk: 'spike', // Tăng đường huyết nhanh
    riskLabel: 'TĂNG ĐƯỜNG HUYẾT CẤP TÍNH',
    riskSub: 'GI 85 • Quá tải Insulin • Nguy cơ vọt đường',
    peakGlucoseMg: 198,
    peakGlucoseMmol: 11.0,
    color: '#f59e0b',
    glowColor: '#ef4444',
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
    riskSub: 'GI 76 • Tinh bột nhanh & mỡ cao',
    peakGlucoseMg: 175,
    peakGlucoseMmol: 9.7,
    color: '#ea580c',
    glowColor: '#f97316',
  },
  {
    id: 'pho_bo',
    name: 'Phở bò tái nạm hành hoa',
    type: 'Món nước',
    emoji: '🍜',
    calories: 430,
    carbs: 52,
    gi: 58,
    risk: 'moderate',
    riskLabel: 'ĐƯỜNG HUYẾT TRUNG BÌNH',
    riskSub: 'GI 58 • Hấp thu vừa phải, cần theo dõi',
    peakGlucoseMg: 142,
    peakGlucoseMmol: 7.9,
    color: '#0284c7',
    glowColor: '#38bdf8',
  },
  {
    id: 'salad',
    name: 'Salad ức gà sốt mè rang',
    type: 'Healthy / Kiêng',
    emoji: '🥗',
    calories: 230,
    carbs: 9,
    gi: 22,
    risk: 'normal',
    riskLabel: 'ĐƯỜNG HUYẾT RẤT ỔN ĐỊNH',
    riskSub: 'GI 22 • Giàu chất xơ, an toàn tuyệt đối',
    peakGlucoseMg: 108,
    peakGlucoseMmol: 6.0,
    color: '#10b981',
    glowColor: '#34d399',
  },
  {
    id: 'phosphalugel',
    name: 'Gói men/thuốc Phosphalugel P',
    type: 'Dược phẩm tiêu hóa',
    emoji: '💊',
    calories: 12,
    carbs: 1,
    gi: 5,
    risk: 'normal',
    riskLabel: 'BẢO VỆ NIÊM MẠC & KHÔNG ĐƯỜNG',
    riskSub: 'Gel Nhôm Phosphate • Kháng toan dịch vị',
    peakGlucoseMg: 96,
    peakGlucoseMmol: 5.3,
    color: '#eab308',
    glowColor: '#38bdf8',
  },
];

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Trạng thái hiện tại của mô phỏng
  const [selectedFood, setSelectedFood] = useState(PRESET_FOODS[0]);
  const [phaseText, setPhaseText] = useState('Đang quét phân tích món ăn');
  const [simProgress, setSimProgress] = useState(0); // 0 -> 100%
  const [currentGlucose, setCurrentGlucose] = useState(95); // mg/dL
  const [isRotating, setIsRotating] = useState(true);

  // References cho Three.js loop
  const sceneRef = useRef(null);
  const animStateRef = useRef({
    time: 0,
    phase: 0, // 0: Idle/Scan, 1: Move to Mouth, 2: Down Esophagus, 3: Stomach Acid, 4: Stream Blood
    foodMesh: null,
    jawMesh: null,
    esophagusMesh: null,
    stomachMesh: null,
    acidMesh: null,
    glucoseParticles: null,
    bloodVessels: [],
    selectedFood: PRESET_FOODS[0],
    restartTrigger: 0,
  });

  // Đồng bộ món ăn được chọn vào ref
  useEffect(() => {
    animStateRef.current.selectedFood = selectedFood;
    animStateRef.current.phase = 0;
    animStateRef.current.time = 0;
    setSimProgress(0);
    setCurrentGlucose(95);
    setPhaseText('Bắt đầu phân tích món ăn 3D...');
  }, [selectedFood]);

  // Khởi động lại hoạt cảnh
  const handleRestart = useCallback(() => {
    animStateRef.current.phase = 0;
    animStateRef.current.time = 0;
    setSimProgress(0);
    setCurrentGlucose(95);
    setPhaseText('Đang nạp lại hành trình cơ thể...');
  }, []);

  // Xử lý khi người dùng tải ảnh thật lên
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const customFood = {
      id: 'custom_' + Date.now(),
      name: file.name.replace(/\.[^/.]+$/, '').toUpperCase() || 'Món ăn tự chụp',
      type: 'Ảnh thực tế AI phân tích',
      emoji: '📸',
      calories: 520,
      carbs: 64,
      gi: 78,
      risk: 'spike',
      riskLabel: 'CẢNH BÁO TĂNG ĐƯỜNG HUYẾT',
      riskSub: 'Phân tích AI từ ảnh chụp • Carbs cao',
      peakGlucoseMg: 185,
      peakGlucoseMmol: 10.3,
      color: '#ec4899',
      glowColor: '#ef4444',
    };

    setSelectedFood(customFood);
  };

  // ========================================================
  // KHỞI TẠO KHÔNG GIAN 3D VỚI THREE.JS (CHẠY 60 FPS TRỰC TIẾP TRÊN WEB)
  // ========================================================
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x060b14, 0.055);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Hệ thống ánh sáng Neon Hologram
    const ambientLight = new THREE.AmbientLight(0x0a2540, 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const stomachLight = new THREE.PointLight(0xff3b30, 3.0, 6.0);
    stomachLight.position.set(0, -1.0, 0.5);
    scene.add(stomachLight);

    // Group tổng chứa toàn bộ cơ thể
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // ========================================================
    // TẠO MÔ HÌNH NGƯỜI BÁN TRONG SUỐT X-RAY / HOLOGRAM (ẢNH 2)
    // ========================================================
    const hologramMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x003366,
      transparent: true,
      opacity: 0.22,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.7,
      ior: 1.3,
      wireframe: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });

    // Thân trên (Torso)
    const torsoGeo = new THREE.CylinderGeometry(1.6, 1.2, 3.4, 24, 16);
    torsoGeo.scale(1.2, 1.0, 0.65);
    const torsoMesh = new THREE.Mesh(torsoGeo, hologramMaterial);
    torsoMesh.position.set(0, -0.3, 0);
    bodyGroup.add(torsoMesh);

    const torsoWire = new THREE.Mesh(torsoGeo, wireMat);
    torsoWire.position.set(0, -0.3, 0);
    bodyGroup.add(torsoWire);

    // Đầu & Vòm Họng (Head & Jaw)
    const headGeo = new THREE.SphereGeometry(0.85, 24, 20);
    headGeo.scale(0.85, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, hologramMaterial);
    headMesh.position.set(0, 2.15, 0);
    bodyGroup.add(headMesh);

    // Xương hàm chuyển động mở miệng (Jaw)
    const jawGeo = new THREE.BoxGeometry(0.7, 0.35, 0.65);
    const jawMesh = new THREE.Mesh(jawGeo, hologramMaterial);
    jawMesh.position.set(0, 1.62, 0.3);
    bodyGroup.add(jawMesh);
    animStateRef.current.jawMesh = jawMesh;

    // Lồng ngực phát sáng (Ribs)
    for (let r = 0; r < 5; r++) {
      const ribCurve = new THREE.EllipseCurve(0, 0, 1.35 - r * 0.05, 0.65, 0, Math.PI, false, 0);
      const ribPoints = ribCurve.getPoints(24);
      const ribGeo = new THREE.BufferGeometry().setFromPoints(ribPoints);
      const ribLine = new THREE.Line(ribGeo, new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 }));
      ribLine.rotation.x = Math.PI / 2;
      ribLine.position.set(0, 0.8 - r * 0.28, 0);
      bodyGroup.add(ribLine);
    }

    // ========================================================
    // TẠO ỐNG THỰC QUẢN 3D (CHẠY TỪ MIỆNG XUỐNG DẠ DÀY - ẢNH 3)
    // ========================================================
    const esophagusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.75, 0.3),    // Miệng
      new THREE.Vector3(0, 1.3, 0.05),    // Cổ họng
      new THREE.Vector3(0, 0.5, -0.05),   // Giữa ngực
      new THREE.Vector3(-0.02, -0.2, -0.05), // Cơ hoành
      new THREE.Vector3(-0.08, -0.65, 0.0),  // Tâm vị dạ dày
    ]);

    const esophagusGeo = new THREE.TubeGeometry(esophagusCurve, 40, 0.12, 16, false);
    const esophagusMat = new THREE.MeshStandardMaterial({
      color: 0xff6b81,
      emissive: 0x881337,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
    });
    const esophagusMesh = new THREE.Mesh(esophagusGeo, esophagusMat);
    bodyGroup.add(esophagusMesh);
    animStateRef.current.esophagusMesh = esophagusMesh;

    // ========================================================
    // TẠO TÚI DẠ DÀY 3D CHUẨN MẶT CẮT Y KHOA (ẢNH 3)
    // ========================================================
    const stomachShape = new THREE.Shape();
    stomachShape.moveTo(0, 0);
    stomachShape.bezierCurveTo(-0.6, 0.2, -1.2, -0.4, -0.9, -1.0); // Đáy vị to bên trái
    stomachShape.bezierCurveTo(-0.7, -1.5, -0.1, -1.3, 0.2, -0.9);  // Thân vị
    stomachShape.bezierCurveTo(0.4, -0.6, 0.3, -0.3, 0.0, 0.0);    // Môn vị nối tá tràng

    const extrudeSettings = { depth: 0.45, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: 0.12, bevelThickness: 0.1 };
    const stomachGeo = new THREE.ExtrudeGeometry(stomachShape, extrudeSettings);
    stomachGeo.center();
    stomachGeo.scale(1.15, 1.15, 1.15);

    const stomachMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.82,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });

    const stomachMesh = new THREE.Mesh(stomachGeo, stomachMat);
    stomachMesh.position.set(-0.15, -0.95, 0.1);
    bodyGroup.add(stomachMesh);
    animStateRef.current.stomachMesh = stomachMesh;

    // Viền trắng sáng quanh dạ dày (như ảnh thuốc của người dùng)
    const stomachEdgeGeo = new THREE.EdgesGeometry(stomachGeo, 25);
    const stomachEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.6 });
    const stomachEdgeLine = new THREE.LineSegments(stomachEdgeGeo, stomachEdgeMat);
    stomachMesh.add(stomachEdgeLine);

    // Bể Axit dịch vị bên trong dạ dày
    const acidGeo = new THREE.SphereGeometry(0.38, 16, 12);
    acidGeo.scale(1.3, 0.7, 0.8);
    const acidMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.45,
    });
    const acidMesh = new THREE.Mesh(acidGeo, acidMat);
    acidMesh.position.set(-0.18, -1.15, 0.15);
    bodyGroup.add(acidMesh);
    animStateRef.current.acidMesh = acidMesh;

    // ========================================================
    // TẠO HỆ THỐNG MẠCH MÁU DẪN GLUCOSE KHẮP CƠ THỂ
    // ========================================================
    const bloodVessels = [];
    const vesselCurves = [
      // Động mạch chủ lên tim và cổ
      [new THREE.Vector3(-0.05, -0.6, 0), new THREE.Vector3(0, 0.2, 0.1), new THREE.Vector3(0.15, 1.2, 0.15), new THREE.Vector3(0.2, 1.8, 0.2)],
      // Mạch máu rẽ sang vai và tay trái
      [new THREE.Vector3(0, 0.4, 0.05), new THREE.Vector3(-0.6, 0.7, 0.1), new THREE.Vector3(-1.4, 0.4, 0.2), new THREE.Vector3(-1.8, -0.5, 0.2)],
      // Mạch máu rẽ sang vai và tay phải
      [new THREE.Vector3(0, 0.4, 0.05), new THREE.Vector3(0.6, 0.7, 0.1), new THREE.Vector3(1.4, 0.4, 0.2), new THREE.Vector3(1.8, -0.5, 0.2)],
      // Mạch máu tĩnh mạch cửa quanh dạ dày/gan
      [new THREE.Vector3(-0.1, -1.0, 0.1), new THREE.Vector3(0.4, -0.9, 0.15), new THREE.Vector3(0.7, -0.7, 0.1)],
      // Động mạch xuống chi dưới
      [new THREE.Vector3(0, -0.8, -0.05), new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(-0.35, -2.4, 0.1)],
      [new THREE.Vector3(0, -0.8, -0.05), new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(0.35, -2.4, 0.1)],
    ];

    vesselCurves.forEach((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.65,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      bodyGroup.add(tubeMesh);
      bloodVessels.push({ mesh: tubeMesh, mat: tubeMat });
    });
    animStateRef.current.bloodVessels = bloodVessels;

    // ========================================================
    // TẠO HÀNG TRĂM HẠT PHÂN TỬ ĐƯỜNG GLUCOSE PHÁT SÁNG
    // ========================================================
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3 + 0] = -0.15 + (Math.random() - 0.5) * 0.4;
      particlePositions[p * 3 + 1] = -1.0 + (Math.random() - 0.5) * 0.4;
      particlePositions[p * 3 + 2] = 0.15 + (Math.random() - 0.5) * 0.3;

      particleVelocities.push({
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.02 + Math.random() * 0.06,
        vz: (Math.random() - 0.5) * 0.04,
        active: false,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffea00,
      size: 0.08,
      transparent: true,
      opacity: 0.0, // Ban đầu ẩn, chỉ xuất hiện sau khi phân hủy dạ dày
      blending: THREE.AdditiveBlending,
    });
    const glucosePoints = new THREE.Points(particleGeo, particleMat);
    bodyGroup.add(glucosePoints);
    animStateRef.current.glucoseParticles = { points: glucosePoints, velocities: particleVelocities, geo: particleGeo };

    // ========================================================
    // TẠO VẬT THỂ MÓN ĂN 3D (FOOD OBJECT)
    // ========================================================
    const foodGroup = new THREE.Group();
    scene.add(foodGroup);
    animStateRef.current.foodMesh = foodGroup;

    // Tạo hình dáng 3D cho món ăn ban đầu (hộp/ly xoay lơ lửng)
    const foodCoreGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.7, 24);
    const foodCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      roughness: 0.2,
      metalness: 0.3,
    });
    const foodCore = new THREE.Mesh(foodCoreGeo, foodCoreMat);
    foodGroup.add(foodCore);

    // Vòng hào quang quanh món ăn 3D
    const ringGeo = new THREE.RingGeometry(0.48, 0.52, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    foodGroup.add(ringMesh);

    // ========================================================
    // TƯƠNG TÁC XOAY CHUỘT / CHẠM TAY (ORBIT ROTATION)
    // ========================================================
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX || e.touches?.[0]?.clientX || 0;
      prevMouseY = e.clientY || e.touches?.[0]?.clientY || 0;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      bodyGroup.rotation.y += deltaX * 0.008;
      bodyGroup.rotation.x += deltaY * 0.005;
      bodyGroup.rotation.x = Math.max(-0.4, Math.min(0.4, bodyGroup.rotation.x));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onMouseDown, { passive: true });
    window.addEventListener('touchmove', onMouseMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // ========================================================
    // VÒNG LẶP CHUYỂN ĐỘNG LIỀN MẠCH (SEAMLESS 60 FPS ANIMATION LOOP)
    // ========================================================
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const st = animStateRef.current;
      st.time += delta;

      // Xoay nhẹ toàn cảnh khi không tương tác
      if (isRotating && !isDragging) {
        bodyGroup.rotation.y = Math.sin(st.time * 0.4) * 0.12;
      }

      // Nhấp nháy dung dịch axit dạ dày
      if (acidMesh) {
        acidMesh.scale.x = 1.3 + Math.sin(st.time * 4) * 0.06;
        acidMesh.scale.y = 0.7 + Math.cos(st.time * 5) * 0.04;
      }

      // ────────────────────────────────────────────────────────
      // TIẾN TRÌNH 5 GIAI ĐOẠN LIỀN MẠCH (THEO ĐÚNG YÊU CẦU USER)
      // ────────────────────────────────────────────────────────
      const food = st.selectedFood;
      const cycleDuration = 12.0; // 12 giây cho 1 chu kỳ hoàn chỉnh
      const t = st.time % cycleDuration;
      const progressPercent = Math.min(100, Math.floor((t / cycleDuration) * 100));
      setSimProgress(progressPercent);

      // GIAI ĐOẠN 1: Món ăn 3D lơ lửng trước mặt (0s -> 2.5s)
      if (t < 2.5) {
        st.phase = 0;
        setPhaseText('Quét 3D & Phân tích thành phần dinh dưỡng...');
        foodGroup.visible = true;
        foodGroup.scale.set(1.0, 1.0, 1.0);
        foodGroup.position.set(1.2, 0.6, 2.2);
        foodGroup.rotation.y += delta * 1.5;
        foodGroup.rotation.x = Math.sin(st.time * 2) * 0.2;

        if (jawMesh) jawMesh.rotation.x = 0; // Miệng đóng
        if (particleMat) particleMat.opacity = 0;

        // Reset màu mạch máu về xanh ban đầu
        st.bloodVessels.forEach((v) => {
          v.mat.color.setHex(0x38bdf8);
          v.mat.emissive.setHex(0x0284c7);
        });
        setCurrentGlucose(95);
      }
      // GIAI ĐOẠN 2: Món ăn bay vào miệng & Miệng mở ra rồi ngậm lại (2.5s -> 4.5s)
      else if (t < 4.5) {
        st.phase = 1;
        setPhaseText('Đưa vào miệng: Mở hàm nuốt trôi...');
        const p = (t - 2.5) / 2.0;

        // Vị trí bay từ ngoài vào miệng (0, 1.75, 0.3)
        foodGroup.position.x = THREE.MathUtils.lerp(1.2, 0.0, p);
        foodGroup.position.y = THREE.MathUtils.lerp(0.6, 1.75, p);
        foodGroup.position.z = THREE.MathUtils.lerp(2.2, 0.3, p);
        const s = THREE.MathUtils.lerp(1.0, 0.35, p);
        foodGroup.scale.set(s, s, s);

        // Hiệu ứng mở hàm miệng khi thức ăn đến gần rồi khép lại
        if (jawMesh) {
          if (p < 0.6) {
            jawMesh.rotation.x = THREE.MathUtils.lerp(0, 0.35, p / 0.6); // Mở miệng
          } else {
            jawMesh.rotation.x = THREE.MathUtils.lerp(0.35, 0, (p - 0.6) / 0.4); // Đóng miệng
          }
        }
      }
      // GIAI ĐOẠN 3: Chạy tuột dọc thực quản xuống dạ dày (4.5s -> 7.0s) - NHƯ ẢNH USER GỬI
      else if (t < 7.0) {
        st.phase = 2;
        setPhaseText('Thức ăn trôi qua thực quản xuống dạ dày...');
        if (jawMesh) jawMesh.rotation.x = 0; // Đảm bảo miệng đã đóng

        const p = (t - 4.5) / 2.5; // Tiến trình trên ống thực quản 0 -> 1
        const esPoint = esophagusCurve.getPointAt(p);
        foodGroup.position.copy(esPoint);
        foodGroup.scale.set(0.3, 0.3, 0.3);
        foodGroup.visible = true;

        // Ống thực quản co bóp phát sáng quanh viên thức ăn
        if (esophagusMat) {
          esophagusMat.emissiveIntensity = 1.0 + Math.sin(t * 10) * 0.5;
        }
      }
      // GIAI ĐOẠN 4: Rơi vào dạ dày, phân hủy theo axit (7.0s -> 9.0s)
      else if (t < 9.0) {
        st.phase = 3;
        setPhaseText('Dạ dày co bóp & Axit phân giải phân tử...');
        const p = (t - 7.0) / 2.0;

        // Món ăn chìm vào lòng dạ dày và tan biến dần
        foodGroup.position.set(-0.15, -1.05 + Math.sin(t * 8) * 0.05, 0.1);
        const shrink = THREE.MathUtils.lerp(0.3, 0.02, p);
        foodGroup.scale.set(shrink, shrink, shrink);
        if (p > 0.85) foodGroup.visible = false;

        // Dạ dày bừng sáng rực khi phân hủy
        if (stomachMat) {
          stomachMat.emissiveIntensity = 1.2 + Math.sin(t * 12) * 0.6;
        }
        stomachLight.intensity = 4.0;
      }
      // GIAI ĐOẠN 5: Glucose tràn vào DÒNG MÁU KHẮP CƠ THỂ (9.0s -> 12.0s)
      else {
        st.phase = 4;
        foodGroup.visible = false;

        const isSpike = food.risk === 'spike';
        setPhaseText(isSpike ? '⚠️ ĐƯỜNG HUYẾT TĂNG VỌT VÀO MÁU!' : '✅ Glucose hấp thu ổn định vào máu');

        // Kích hoạt hàng trăm hạt Glucose bắn từ dạ dày lan tỏa vào mạch máu
        if (glucosePoints && particleMat) {
          particleMat.opacity = Math.min(1.0, particleMat.opacity + delta * 2);
          particleMat.color.setHex(isSpike ? 0xff3b30 : 0x10b981);

          const posArr = glucosePoints.geometry.attributes.position.array;
          const vels = st.glucoseParticles.velocities;

          for (let i = 0; i < particleCount; i++) {
            posArr[i * 3 + 0] += vels[i].vx;
            posArr[i * 3 + 1] += vels[i].vy;
            posArr[i * 3 + 2] += vels[i].vz;

            // Nếu bay quá xa cơ thể thì tái sinh lại ở dạ dày
            if (posArr[i * 3 + 1] > 2.0 || Math.abs(posArr[i * 3 + 0]) > 1.8) {
              posArr[i * 3 + 0] = -0.15 + (Math.random() - 0.5) * 0.3;
              posArr[i * 3 + 1] = -1.0 + (Math.random() - 0.5) * 0.2;
              posArr[i * 3 + 2] = 0.15 + (Math.random() - 0.5) * 0.2;
            }
          }
          glucosePoints.geometry.attributes.position.needsUpdate = true;
        }

        // Mạng lưới mạch máu đổi màu theo tính chất món ăn
        st.bloodVessels.forEach((v) => {
          if (isSpike) {
            // Đỏ rực cảnh báo tăng vọt đường huyết
            v.mat.color.setHex(0xef4444);
            v.mat.emissive.setHex(0xb91c1c);
            v.mat.emissiveIntensity = 1.4 + Math.sin(t * 15) * 0.6; // Đập liên hồi
          } else {
            // Xanh ngọc an toàn
            v.mat.color.setHex(0x10b981);
            v.mat.emissive.setHex(0x047857);
            v.mat.emissiveIntensity = 0.9;
          }
        });

        // Chỉ số đường huyết nhảy số vọt lên
        const glucoseTarget = food.peakGlucoseMg;
        setCurrentGlucose((prev) => Math.min(glucoseTarget, Math.round(prev + (glucoseTarget - prev) * 0.15)));
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  const isSpike = selectedFood.risk === 'spike';
  const mmolValue = (currentGlucose / 18.0).toFixed(1);

  return (
    <div className={styles.container}>
      {/* 3D WebGL Canvas Layer */}
      <div ref={canvasRef} className={styles.canvasWrapper} />

      {/* Cyber Grid & Ambient Glow */}
      <div className={styles.ambientGrid} />
      <div className={styles.ambientVignette} />

      {/* ── THANH ĐIỀU HƯỚNG TRÊN CÙNG ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/')}
            title="Quay lại Trang chủ DIA+"
          >
            <ArrowLeft size={16} />
            <span>Trang chủ DIA+</span>
          </button>
          <div className={styles.brandPill}>
            <span>Mô phỏng 3D:</span>
            <strong>diaplus.vn/3d</strong>
            <span className={styles.brandBadge}>LIVE</span>
          </div>
        </div>

        <div className={styles.topBarRight}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsRotating((prev) => !prev)}
            title={isRotating ? 'Tạm dừng xoay góc nhìn' : 'Tự động xoay góc nhìn'}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* ── BẢNG CHỈ SỐ GÓC TRÁI (THEO ĐÚNG YÊU CẦU CỦA USER) ── */}
      <aside className={styles.leftHud}>
        {/* Thẻ thông tin món ăn */}
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

          {/* Lượng Calo & Đường (Carbs) */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>
                <Flame size={12} color="#f97316" style={{ display: 'inline', marginRight: 4 }} />
                Năng lượng
              </span>
              <div className={styles.metricValue}>
                {selectedFood.calories} <span className={styles.metricUnit}>kcal</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>
                <Zap size={12} color="#00f0ff" style={{ display: 'inline', marginRight: 4 }} />
                Lượng Đường (Carb)
              </span>
              <div className={styles.metricValue} style={{ color: selectedFood.carbs > 40 ? '#ef4444' : '#10b981' }}>
                {selectedFood.carbs} <span className={styles.metricUnit}>gam</span>
              </div>
            </div>
          </div>

          {/* CẢNH BÁO TĂNG ĐƯỜNG HUYẾT HAY BÌNH THƯỜNG */}
          <div className={`${styles.warningBanner} ${isSpike ? styles.warningSpike : styles.warningNormal}`}>
            <div className={styles.warningIconWrap}>
              {isSpike ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div>
              <div>{selectedFood.riskLabel}</div>
              <div style={{ fontSize: '10.5px', fontWeight: 500, opacity: 0.9 }}>{selectedFood.riskSub}</div>
            </div>
          </div>
        </div>

        {/* Đồng hồ đo nồng độ đường trong máu theo thời gian thực */}
        <div className={styles.glucoseGaugeCard}>
          <div className={styles.gaugeTitleRow}>
            <span>ĐỒNG HỒ ĐƯỜNG HUYẾT MẠCH MÁU</span>
            <Activity size={13} color={isSpike ? '#ef4444' : '#10b981'} />
          </div>

          <div className={styles.glucoseNumberRow}>
            <span
              className={styles.glucoseBigNumber}
              style={{ color: isSpike && currentGlucose > 140 ? '#ef4444' : '#00f0ff' }}
            >
              {currentGlucose}
            </span>
            <span className={styles.metricUnit}>mg/dL</span>
            <span className={styles.glucoseSubMmol}>({mmolValue} mmol/L)</span>
          </div>

          {/* Thanh đo đường huyết */}
          <div className={styles.glucoseTrack}>
            <div
              className={styles.glucoseFill}
              style={{
                width: `${Math.min(100, Math.max(10, ((currentGlucose - 70) / 140) * 100))}%`,
                background: isSpike && currentGlucose > 140 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #00f0ff, #10b981)',
              }}
            />
          </div>

          {/* Dòng trạng thái diễn tiến sinh học */}
          <div className={styles.journeyStatusText}>
            <Info size={13} />
            <span>{phaseText}</span>
          </div>
        </div>
      </aside>

      {/* ── BỘ ĐIỀU KHIỂN & CHỌN MÓN GÓC DƯỚI ── */}
      <footer className={styles.bottomControlTray}>
        {/* Menu cuộn chọn nhanh món ăn mẫu */}
        <div className={styles.foodCarousel}>
          {PRESET_FOODS.map((item) => {
            const isActive = selectedFood.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.foodItemBtn} ${isActive ? styles.foodItemBtnActive : ''}`}
                onClick={() => setSelectedFood(item)}
              >
                <span className={styles.foodEmoji}>{item.emoji}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Nút Chụp ảnh món ăn & Nút xem lại */}
        <div className={styles.actionControlRow}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className={styles.uploadPhotoBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} />
            <span>Chụp ảnh món ăn của bạn</span>
          </button>

          <button
            type="button"
            className={styles.replayBtn}
            onClick={handleRestart}
            title="Chạy lại từ đầu hoạt cảnh thức ăn"
          >
            <RotateCcw size={15} />
            <span>Xem lại từ đầu</span>
          </button>
        </div>
      </footer>

      {/* Nhãn hướng dẫn xoay 3D góc dưới bên phải */}
      <div className={styles.viewHintBadge}>
        <span>Kéo chuột hoặc vuốt màn hình để xoay cơ thể 360°</span>
      </div>
    </div>
  );
}
