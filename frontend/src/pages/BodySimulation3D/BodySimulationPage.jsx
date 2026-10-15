import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// GLSL HOLOGRAPHIC SHADERS (MATCHING REFERENCE IMAGE 100%)
// ========================================================

// Outer Glassy Skin Shader (Dark translucent navy core, glowing cyan Fresnel silhouette)
const SKIN_HOLO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SKIN_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uRimColor;
  uniform vec3 uBaseColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.8);

    // Subtle fine holographic scanline
    float scanline = sin(vWorldPosition.y * 60.0 - uTime * 2.0) * 0.5 + 0.5;
    scanline = pow(scanline, 8.0) * 0.12;

    vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.95 + scanline);
    color += uRimColor * pow(fresnel, 4.0) * 2.0;

    // Translucent core to reveal skeleton inside, bright edges
    float alpha = mix(0.12, 0.92, pow(fresnel, 2.2)) * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

// Skeleton Shader (Sapphire-blue bone mass with bright electric cyan ridges and specular highlights)
const SKELETON_HOLO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SKELETON_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBoneColor;
  uniform vec3 uGlowColor;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = max(dot(normal, viewDir), 0.0);
    float rim = pow(1.0 - NdotV, 2.2);

    // Front-top directional key light
    vec3 lightDir = normalize(vec3(0.2, 0.9, 0.8));
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 32.0) * 0.75;

    // Deep sapphire bone core with vibrant electric cyan rim
    vec3 bone = mix(uBoneColor, uGlowColor, diff * 0.4 + rim * 0.7);
    bone += uGlowColor * spec;
    bone += uGlowColor * pow(rim, 2.8) * 1.6;

    // Subtle breathing pulse
    float pulse = sin(uTime * 1.5) * 0.04 + 0.96;
    bone *= pulse * uIntensity;

    gl_FragColor = vec4(bone, 0.98);
  }
`;

// Pedestal Hologram Cone Shader (Soft cyan ray from floor disc to knee level)
const BEAM_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const BEAM_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBeamColor;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Fade out towards top
    float verticalFade = pow(1.0 - vUv.y, 2.2);

    // Vertical hologram light rays
    float angle = atan(vWorldPosition.x, vWorldPosition.z);
    float rays = sin(angle * 16.0 + uTime * 0.5) * 0.5 + 0.5;
    rays = pow(rays, 3.0) * 0.35 + 0.65;

    float alpha = verticalFade * rays * 0.18;
    gl_FragColor = vec4(uBeamColor, alpha);
  }
`;

// Poses arm bones and skin parts into a clean horizontal T-pose
function poseArmsToT(rootGroup) {
  rootGroup.updateMatrixWorld(true);

  // Left shoulder pivot at unscaled coordinate (0.197, 1.248, -0.031)
  const leftPivot = new THREE.Group();
  leftPivot.position.set(0.197, 1.248, -0.031);
  rootGroup.add(leftPivot);

  // Right shoulder pivot at unscaled coordinate (-0.197, 1.248, -0.031)
  const rightPivot = new THREE.Group();
  rightPivot.position.set(-0.197, 1.248, -0.031);
  rootGroup.add(rightPivot);

  rootGroup.updateMatrixWorld(true);

  const leftParts = [];
  const rightParts = [];

  rootGroup.traverse((child) => {
    if (!child.name || !child.isMesh) return;
    const name = child.name.toLowerCase();

    // Skip all lower body elements, head, neck, and thorax
    if (
      name.includes('foot') ||
      name.includes('calcaneus') ||
      name.includes('talus') ||
      name.includes('tibia') ||
      name.includes('fibula') ||
      name.includes('femur') ||
      name.includes('patella') ||
      name.includes('thigh') ||
      name.includes('knee') ||
      name.includes('leg') ||
      name.includes('ankle') ||
      name.includes('popliteal') ||
      name.includes('toe') ||
      name.includes('hip') ||
      name.includes('buttock') ||
      name.includes('gluteal') ||
      name.includes('thorax') ||
      name.includes('clavicular') ||
      name.includes('concha') ||
      name.includes('auricle') ||
      name.includes('antihelix')
    ) {
      return;
    }

    const isArmPart =
      name.includes('humerus') ||
      name.includes('radius') ||
      name.includes('ulna') ||
      name.includes('carpal') ||
      name.includes('hand') ||
      name.includes('phalanx') ||
      name.includes('metacarpal') ||
      name.includes('scaphoid') ||
      name.includes('lunate') ||
      name.includes('triquetrum') ||
      name.includes('pisiform') ||
      name.includes('trapez') ||
      name.includes('capitate') ||
      name.includes('hamate') ||
      name.includes('arm') ||
      name.includes('elbow') ||
      name.includes('forearm') ||
      name.includes('wrist') ||
      name.includes('palm') ||
      name.includes('digit') ||
      name.includes('cubital') ||
      name.includes('nail') ||
      name.includes('perionyx') ||
      name.includes('foveola') ||
      name.includes('bicipital');

    if (!isArmPart) return;

    const worldPos = new THREE.Vector3();
    child.getWorldPosition(worldPos);

    if (name.endsWith('.l') || name.includes('.l_') || name.includes('left') || worldPos.x > 0.05) {
      leftParts.push(child);
    } else if (name.endsWith('.r') || name.includes('.r_') || name.includes('right') || worldPos.x < -0.05) {
      rightParts.push(child);
    }
  });

  // Attach using Three.js attach to automatically compute proper relative matrix
  leftParts.forEach((obj) => leftPivot.attach(obj));
  rightParts.forEach((obj) => rightPivot.attach(obj));

  // Rotate pivots on world Z axis
  leftPivot.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(75.5));
  rightPivot.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(-75.5));

  rootGroup.updateMatrixWorld(true);
}

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const mountRef = useRef(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(15);
  const [showSkin, setShowSkin] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // Scene references
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const controlsState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0,
    rotY: 0,
    targetRotY: 0,
    targetRotX: 0,
    distance: 2.7,
    targetDistance: 2.7,
  });
  const skinGroupRef = useRef(null);
  const skeletonGroupRef = useRef(null);
  const uniformsRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050914); // Deep navy black matching iStock photo
    scene.fog = new THREE.FogExp2(0x050914, 0.05);

    // 2. Camera (framing full standing human from head to toes on pedestal)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.95, 2.7);
    camera.lookAt(0, 0.95, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Post-processing Bloom
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.45, // strength
      0.35, // radius
      0.72 // threshold
    );
    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    composerRef.current = composer;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x071b30, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    keyLight.position.set(1.5, 3.5, 3);
    scene.add(keyLight);

    const backRimLight = new THREE.DirectionalLight(0x0284c7, 2.2);
    backRimLight.position.set(-1.5, 2.5, -3);
    scene.add(backRimLight);

    // 6. Background Perspective Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x0ea5e9, 0x0a1c30);
    gridHelper.position.y = -0.005;
    scene.add(gridHelper);

    const bgPlaneGeo = new THREE.PlaneGeometry(16, 12, 32, 24);
    const bgPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x07182d,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const bgPlane = new THREE.Mesh(bgPlaneGeo, bgPlaneMat);
    bgPlane.position.set(0, 4.0, -4.0);
    scene.add(bgPlane);

    // ========================================================
    // HOLOGRAM PEDESTAL (EXACT 100% MATCH WITH REFERENCE PHOTO)
    // ========================================================
    const pedestal = new THREE.Group();
    scene.add(pedestal);

    // Base disc (compact for straight down pose)
    const discGeo = new THREE.CircleGeometry(0.95, 64);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x030e1c,
      transparent: true,
      opacity: 0.9,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.position.y = 0.001;
    pedestal.add(discMesh);

    // Outer cyan perimeter ring (R = 0.95)
    const outerRingGeo = new THREE.RingGeometry(0.935, 0.95, 96);
    outerRingGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.position.y = 0.003;
    pedestal.add(outerRing);

    // Middle concentric ring (R = 0.52)
    const midRingGeo = new THREE.RingGeometry(0.505, 0.52, 80);
    midRingGeo.rotateX(-Math.PI / 2);
    const midRing = new THREE.Mesh(midRingGeo, ringMat);
    midRing.position.y = 0.004;
    pedestal.add(midRing);

    // Inner concentric ring under feet (R = 0.22)
    const innerRingGeo = new THREE.RingGeometry(0.20, 0.22, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    innerRing.position.y = 0.005;
    pedestal.add(innerRing);

    // Low Upward Hologram Projection Cone (Rises from outer ring up to shin level, y ~ 0.55)
    const coneGeo = new THREE.CylinderGeometry(1.08, 0.95, 0.55, 64, 1, true);
    coneGeo.translate(0, 0.275, 0);
    const beamMat = new THREE.ShaderMaterial({
      vertexShader: BEAM_VERT,
      fragmentShader: BEAM_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBeamColor: { value: new THREE.Color(0x00d4ff) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const coneMesh = new THREE.Mesh(coneGeo, beamMat);
    pedestal.add(coneMesh);
    uniformsRef.current.push(beamMat.uniforms.uTime);

    // Floating Scanner Ring 1 (Lower leg / shin level, y ~ 0.38)
    const legRingGeo = new THREE.RingGeometry(0.52, 0.525, 96);
    legRingGeo.rotateX(Math.PI / 2);
    const scannerMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const legRing = new THREE.Mesh(legRingGeo, scannerMat);
    legRing.position.y = 0.38;
    scene.add(legRing);

    // Floating Scanner Ring 2 (Faint mid-height ring around knee/lower thigh, y ~ 0.82)
    const midScannerGeo = new THREE.RingGeometry(0.58, 0.585, 96);
    midScannerGeo.rotateX(Math.PI / 2);
    const midScannerMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const midScannerRing = new THREE.Mesh(midScannerGeo, midScannerMat);
    midScannerRing.position.y = 0.82;
    scene.add(midScannerRing);

    // Floating Scanner Ring 3 (Chest level, y ~ 1.24)
    const chestRingGeo = new THREE.RingGeometry(0.66, 0.666, 96);
    chestRingGeo.rotateX(Math.PI / 2);
    const chestRing = new THREE.Mesh(chestRingGeo, scannerMat);
    chestRing.position.y = 1.24;
    scene.add(chestRing);

    // ========================================================
    // LOAD HIGH-FIDELITY 3D SKELETON & BODY
    // ========================================================
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const skinGroup = new THREE.Group();
    modelGroup.add(skinGroup);
    skinGroupRef.current = skinGroup;

    const skeletonGroup = new THREE.Group();
    modelGroup.add(skeletonGroup);
    skeletonGroupRef.current = skeletonGroup;

    // Materials
    const skinShaderMat = new THREE.ShaderMaterial({
      vertexShader: SKIN_HOLO_VERT,
      fragmentShader: SKIN_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRimColor: { value: new THREE.Color(0x00f5ff) },
        uBaseColor: { value: new THREE.Color(0x021025) },
        uOpacity: { value: 0.88 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    uniformsRef.current.push(skinShaderMat.uniforms.uTime);

    const skeletonShaderMat = new THREE.ShaderMaterial({
      vertexShader: SKELETON_HOLO_VERT,
      fragmentShader: SKELETON_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBoneColor: { value: new THREE.Color(0x003366) },
        uGlowColor: { value: new THREE.Color(0x00f5ff) },
        uIntensity: { value: 1.15 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    uniformsRef.current.push(skeletonShaderMat.uniforms.uTime);

    // Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load Skeleton
    setLoadProgress(35);
    gltfLoader.load(
      '/models/skeletal_male.glb',
      (gltf) => {
        setLoadProgress(70);
        const skelRoot = gltf.scene;

        skelRoot.traverse((c) => {
          if (c.isMesh) {
            c.material = skeletonShaderMat;
          }
        });

        // Arms hang naturally straight down along the body per user request

        // Normalize height and place feet on pedestal at y = 0
        skelRoot.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(skelRoot);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const targetHeight = 1.82;
        const scale = targetHeight / (size.y || 1);
        skelRoot.scale.set(scale, scale, scale);

        skelRoot.position.x = -center.x * scale;
        skelRoot.position.y = -box.min.y * scale;
        skelRoot.position.z = -center.z * scale;

        skeletonGroup.add(skelRoot);

        // Load Outer Skin
        gltfLoader.load(
          '/models/regional_male.glb',
          (skinGltf) => {
            setLoadProgress(95);
            const skinRoot = skinGltf.scene;

            skinRoot.traverse((c) => {
              if (c.isMesh) {
                const name = (c.name || '').toLowerCase();
                // Remove genital, pubic, and anal regions per user request
                if (
                  name.includes('urogenital') ||
                  name.includes('pubic') ||
                  name.includes('anal') ||
                  name.includes('perine') ||
                  name.includes('genital')
                ) {
                  c.visible = false;
                  c.geometry = new THREE.BufferGeometry();
                  return;
                }
                c.material = skinShaderMat;
              }
            });

            // Arms hang naturally straight down matching skeleton
            skinRoot.scale.set(scale, scale, scale);
            skinRoot.position.set(
              skelRoot.position.x,
              skelRoot.position.y,
              skelRoot.position.z
            );

            skinGroup.add(skinRoot);
            setLoading(false);
          },
          undefined,
          (err) => {
            console.warn('Skin load error, using skeleton only:', err);
            setLoading(false);
          }
        );
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.round((xhr.loaded / xhr.total) * 60) + 20;
          setLoadProgress(pct);
        }
      },
      (err) => {
        console.error('Error loading skeletal_male:', err);
        setLoading(false);
      }
    );

    // ========================================================
    // INTERACTION (MOUSE & TOUCH DRAG ORBIT)
    // ========================================================
    const dom = renderer.domElement;

    const onPointerDown = (e) => {
      controlsState.current.isDragging = true;
      controlsState.current.prevX = e.clientX;
      controlsState.current.prevY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!controlsState.current.isDragging) return;
      const dx = e.clientX - controlsState.current.prevX;
      const dy = e.clientY - controlsState.current.prevY;
      controlsState.current.prevX = e.clientX;
      controlsState.current.prevY = e.clientY;

      controlsState.current.targetRotY += dx * 0.007;
      controlsState.current.targetRotX = Math.max(
        -0.35,
        Math.min(0.55, controlsState.current.targetRotX + dy * 0.005)
      );
    };

    const onPointerUp = () => {
      controlsState.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsState.current.targetDistance = Math.max(
        1.8,
        Math.min(4.5, controlsState.current.targetDistance + e.deltaY * 0.003)
      );
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ========================================================
    // RENDER LOOP
    // ========================================================
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      uniformsRef.current.forEach((u) => {
        if (u) u.value = elapsed;
      });

      const ctrl = controlsState.current;
      if (autoRotate && !ctrl.isDragging) {
        ctrl.targetRotY += delta * 0.2;
      }

      ctrl.rotY += (ctrl.targetRotY - ctrl.rotY) * 0.08;
      ctrl.rotX += (ctrl.targetRotX - ctrl.rotX) * 0.08;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.08;

      const lookTarget = new THREE.Vector3(0, 0.95, 0);
      const camY = 0.95 + Math.sin(ctrl.rotX) * ctrl.distance;
      const horizDist = Math.cos(ctrl.rotX) * ctrl.distance;
      const camX = Math.sin(ctrl.rotY) * horizDist;
      const camZ = Math.cos(ctrl.rotY) * horizDist;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(lookTarget);

      legRing.position.y = 0.38 + Math.sin(elapsed * 1.8) * 0.01;
      midScannerRing.position.y = 0.82 + Math.sin(elapsed * 1.8 + 0.6) * 0.012;
      chestRing.position.y = 1.24 + Math.sin(elapsed * 1.8 + 1.2) * 0.014;

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      dracoLoader.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  const toggleSkin = useCallback(() => {
    setShowSkin((prev) => {
      const next = !prev;
      if (skinGroupRef.current) skinGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleSkeleton = useCallback(() => {
    setShowSkeleton((prev) => {
      const next = !prev;
      if (skeletonGroupRef.current) skeletonGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const resetCamera = useCallback(() => {
    controlsState.current.targetRotY = 0;
    controlsState.current.targetRotX = 0;
    controlsState.current.targetDistance = 2.7;
  }, []);

  return (
    <div className={styles.page}>
      {/* 3D Canvas Viewport */}
      <div ref={mountRef} className={styles.canvasContainer} />

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <h3 className={styles.loadingTitle}>ĐANG KHỞI TẠO MÔ HÌNH HOLOGRAPHIC 3D</h3>
          <p className={styles.loadingDesc}>Tải khung xương giải phẫu và hình thái cơ thể điện toán...</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span className={styles.progressText}>{loadProgress}%</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className={styles.backBtn}
          title="Quay lại Trang chủ"
        >
          <ArrowLeft size={18} />
          <span>Trang chủ DIA+</span>
        </button>

        <div className={styles.headerTitle}>
          <div className={styles.titleBadge}>
            <span className={styles.pulseDot} />
            <span>DIA+ 3D HOLOGRAPHIC SCAN</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={resetCamera}
            className={styles.iconBtn}
            title="Đặt lại góc nhìn chính diện"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Floating Control Toolbar (Bottom Center) */}
      <div className={styles.bottomToolbar}>
        <button
          type="button"
          onClick={toggleSkeleton}
          className={`${styles.toolBtn} ${showSkeleton ? styles.toolBtnActive : ''}`}
          title="Bật/Tắt Khung xương giải phẫu"
        >
          <Layers size={16} />
          <span>Khung xương</span>
        </button>

        <button
          type="button"
          onClick={toggleSkin}
          className={`${styles.toolBtn} ${showSkin ? styles.toolBtnActive : ''}`}
          title="Bật/Tắt Lớp da trong suốt"
        >
          {showSkin ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>Hình thể Hologram</span>
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`${styles.toolBtn} ${autoRotate ? styles.toolBtnActive : ''}`}
          title="Tự động xoay 360 độ"
        >
          <Sparkles size={16} />
          <span>{autoRotate ? 'Dừng xoay' : 'Tự xoay 360°'}</span>
        </button>

        <button
          type="button"
          onClick={resetCamera}
          className={styles.toolBtn}
          title="Chính diện"
        >
          <Maximize2 size={16} />
          <span>Chính diện</span>
        </button>
      </div>

      {/* Drag & Rotate Hint */}
      <div className={styles.interactionHint}>
        <span>Kéo chuột hoặc vuốt để xoay 360° • Cuộn để phóng to / thu nhỏ</span>
      </div>
    </div>
  );
}
