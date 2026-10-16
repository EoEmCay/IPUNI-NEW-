import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Heart,
  Wind,
  Flame,
  User,
  Activity,
  Maximize2,
  Scan,
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// GLSL HOLOGRAPHIC SHADERS
// ========================================================

// 1. Outer Glassy Skin Shader (Dark translucent navy core, glowing cyan Fresnel silhouette)
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
  uniform float uScanY;
  uniform float uScanActive;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.8);

    // Subtle fine holographic scanline
    float fineLines = sin(vWorldPosition.y * 70.0 - uTime * 2.5) * 0.5 + 0.5;
    fineLines = pow(fineLines, 8.0) * 0.12;

    // Interactive X-Ray Laser Scanline
    float scanDist = abs(vWorldPosition.y - uScanY);
    float scanGlow = uScanActive * smoothstep(0.08, 0.0, scanDist) * 1.5;

    vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.95 + fineLines);
    color += uRimColor * (pow(fresnel, 4.0) * 2.0 + scanGlow);

    // Translucent core revealing interior organs and skeleton
    float alpha = mix(0.10, 0.88, pow(fresnel, 2.2)) * uOpacity;
    alpha += scanGlow * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

// 2. Skeleton Shader (Sapphire bone mass with electric cyan ridges)
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
  uniform float uScanY;
  uniform float uScanActive;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = max(dot(normal, viewDir), 0.0);
    float rim = pow(1.0 - NdotV, 2.2);

    vec3 lightDir = normalize(vec3(0.2, 0.9, 0.8));
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 32.0) * 0.75;

    vec3 bone = mix(uBoneColor, uGlowColor, diff * 0.35 + rim * 0.7);
    bone += uGlowColor * spec;
    bone += uGlowColor * pow(rim, 2.8) * 1.6;

    // Scanline laser flare
    float scanDist = abs(vWorldPosition.y - uScanY);
    float scanGlow = uScanActive * smoothstep(0.06, 0.0, scanDist) * 1.8;
    bone += uGlowColor * scanGlow;

    float pulse = sin(uTime * 1.5) * 0.04 + 0.96;
    bone *= pulse * uIntensity;

    gl_FragColor = vec4(bone, 0.98);
  }
`;

// 3. Heart Shader (Dual-beat lub-dub animated cardiac pulse with glowing coral-crimson core)
const HEART_HOLO_VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Lub-dub cardiac rhythm: ~72 bpm
    float beat1 = pow(max(sin(uTime * 4.6), 0.0), 14.0) * 0.045;
    float beat2 = pow(max(sin(uTime * 4.6 - 0.45), 0.0), 16.0) * 0.025;
    float pulse = beat1 + beat2;

    vec3 newPos = position + normal * pulse;
    vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const HEART_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uGlowColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = max(dot(normal, viewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.2);

    float beat1 = pow(max(sin(uTime * 4.6), 0.0), 10.0) * 0.6;
    float beat2 = pow(max(sin(uTime * 4.6 - 0.45), 0.0), 12.0) * 0.35;
    float beatFlash = beat1 + beat2;

    vec3 color = mix(uBaseColor, uGlowColor, fresnel * 0.75 + beatFlash * 0.65);
    color += uGlowColor * (pow(fresnel, 3.2) * 1.6 + beatFlash * 1.8);

    gl_FragColor = vec4(color, 0.98);
  }
`;

// 4. Blood Vessels Shader (Full arterial crimson tree with pulsating cyber blood flow)
const VESSELS_HOLO_VERT = /* glsl */ `
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

const VESSELS_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uArteryColor;
  uniform vec3 uVeinColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = max(dot(normal, viewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.0);

    // Traveling cyber pulse through vessels
    float flow = sin(vWorldPosition.y * 32.0 - uTime * 6.5) * 0.5 + 0.5;
    flow = pow(flow, 5.0) * 0.65;

    // Distinguish arterial branches (bright crimson) from venous/microcapillaries
    vec3 base = mix(uArteryColor, uVeinColor, step(0.0, -vNormal.x) * 0.3);
    vec3 color = mix(base, vec3(1.0, 0.4, 0.6), fresnel * 0.75 + flow);
    color += vec3(1.0, 0.2, 0.4) * (pow(fresnel, 3.0) * 1.4 + flow * 1.2);

    gl_FragColor = vec4(color, 0.95);
  }
`;

// 5. Lungs & Respiratory Shader (Translucent ice-blue with gentle respiratory expansion)
const LUNGS_HOLO_VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Gentle respiratory breathing (~14 breaths / min)
    float breath = sin(uTime * 1.4) * 0.025;
    vec3 newPos = position + normal * breath;

    vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LUNGS_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uRimColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.2);

    float breathGlow = sin(uTime * 1.4) * 0.15 + 0.85;

    vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.85);
    color += uRimColor * pow(fresnel, 3.0) * 1.5;

    float alpha = mix(0.18, 0.85, pow(fresnel, 1.8)) * breathGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

// 6. Liver & Visceral Shader (Translucent amber/gold cyber glow)
const LIVER_HOLO_VERT = /* glsl */ `
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

const LIVER_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uRimColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.4);

    vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.9);
    color += uRimColor * pow(fresnel, 3.2) * 1.4;

    float alpha = mix(0.35, 0.92, pow(fresnel, 1.6));
    gl_FragColor = vec4(color, alpha);
  }
`;

// 7. Digestive / Intestines Shader (Emerald/lime glow with wave peristalsis)
const DIGESTIVE_HOLO_VERT = /* glsl */ `
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

const DIGESTIVE_HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uRimColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.2);

    // Peristaltic metabolic wave
    float wave = sin(vWorldPosition.y * 22.0 - uTime * 2.2) * 0.5 + 0.5;
    wave = pow(wave, 3.0) * 0.35;

    vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.85 + wave);
    color += uRimColor * (pow(fresnel, 3.0) * 1.3 + wave * 1.1);

    float alpha = mix(0.28, 0.90, pow(fresnel, 1.8));
    gl_FragColor = vec4(color, alpha);
  }
`;

// 8. Pedestal Hologram Cone Shader
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
    float verticalFade = pow(1.0 - vUv.y, 2.2);
    float angle = atan(vWorldPosition.x, vWorldPosition.z);
    float rays = sin(angle * 16.0 + uTime * 0.5) * 0.5 + 0.5;
    rays = pow(rays, 3.0) * 0.35 + 0.65;

    float alpha = verticalFade * rays * 0.18;
    gl_FragColor = vec4(uBeamColor, alpha);
  }
`;

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGender = searchParams.get('gender') === 'female' ? 'female' : 'male';
  const mountRef = useRef(null);

  // UI state
  const [gender, setGender] = useState(initialGender); // 'male' | 'female'
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showCardio, setShowCardio] = useState(true);
  const [showResp, setShowResp] = useState(true);
  const [showDigest, setShowDigest] = useState(true);
  const [showSkin, setShowSkin] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [scanActive, setScanActive] = useState(true);

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

  // Group references
  const humanModelGroupRef = useRef(null);
  const skeletonGroupRef = useRef(null);
  const cardioGroupRef = useRef(null);
  const respGroupRef = useRef(null);
  const digestGroupRef = useRef(null);
  const skinGroupRef = useRef(null);
  const scanRingRef = useRef(null);

  // Shader Uniform References
  const timeUniformsRef = useRef([]);
  const scanUniformsRef = useRef({
    uScanY: { value: 1.0 },
    uScanActive: { value: 1.0 },
  });

  // Morphing bone & skin nodes for female anatomical dimorphism
  const applyGenderMorph = useCallback((targetGender) => {
    const isFemale = targetGender === 'female';

    // 1. Morph Skeleton Bones
    if (skeletonGroupRef.current) {
      skeletonGroupRef.current.traverse((c) => {
        if (!c.isMesh) return;
        const name = (c.name || '').toLowerCase();

        // Authentic gynecoid pelvis transformation
        if (
          name.includes('ilium') ||
          name.includes('ischium') ||
          name.includes('pubis') ||
          name.includes('sacrum') ||
          name.includes('coccyx')
        ) {
          if (isFemale) {
            c.scale.set(1.15, 0.96, 1.08); // Flared iliac crests & wider pelvic inlet
          } else {
            c.scale.set(1.0, 1.0, 1.0);
          }
        }
        // Narrower female shoulder girdle
        else if (
          name.includes('clavicle') ||
          name.includes('scapula') ||
          name.includes('acromion')
        ) {
          if (isFemale) {
            c.scale.set(0.90, 0.95, 0.95);
          } else {
            c.scale.set(1.0, 1.0, 1.0);
          }
        }
        // Thorax & ribcage
        else if (name.includes('rib') || name.includes('sternum')) {
          if (isFemale) {
            c.scale.set(0.92, 0.97, 0.94);
          } else {
            c.scale.set(1.0, 1.0, 1.0);
          }
        }
        // Slender female limbs
        else if (
          name.includes('femur') ||
          name.includes('tibia') ||
          name.includes('fibula') ||
          name.includes('humerus') ||
          name.includes('radius') ||
          name.includes('ulna')
        ) {
          if (isFemale) {
            c.scale.set(0.92, 0.98, 0.92);
          } else {
            c.scale.set(1.0, 1.0, 1.0);
          }
        }
        // Female cranium & mandible
        else if (name.includes('cranium') || name.includes('mandible')) {
          if (isFemale) {
            c.scale.set(0.95, 0.95, 0.95);
          } else {
            c.scale.set(1.0, 1.0, 1.0);
          }
        }
      });
    }

    // 2. Adapt Organs to Female Dimensions
    if (respGroupRef.current) {
      respGroupRef.current.scale.set(
        isFemale ? 0.92 : 1.0,
        isFemale ? 0.96 : 1.0,
        isFemale ? 0.94 : 1.0
      );
    }

    if (cardioGroupRef.current) {
      cardioGroupRef.current.scale.set(
        isFemale ? 0.94 : 1.0,
        isFemale ? 0.97 : 1.0,
        isFemale ? 0.94 : 1.0
      );
    }

    if (digestGroupRef.current) {
      digestGroupRef.current.scale.set(
        isFemale ? 0.98 : 1.0,
        isFemale ? 0.96 : 1.0,
        isFemale ? 1.02 : 1.0
      );
    }

    // 3. Morph Outer Holographic Silhouette
    if (skinGroupRef.current) {
      skinGroupRef.current.traverse((c) => {
        if (!c.isMesh) return;
        const name = (c.name || '').toLowerCase();

        // Feminine hip curve
        if (
          name.includes('hip') ||
          name.includes('buttock') ||
          name.includes('gluteal') ||
          name.includes('pelvi')
        ) {
          c.scale.set(isFemale ? 1.10 : 1.0, isFemale ? 0.98 : 1.0, isFemale ? 1.06 : 1.0);
        }
        // Slender waist
        else if (
          name.includes('umbilic') ||
          name.includes('abdomen') ||
          name.includes('flank') ||
          name.includes('waist')
        ) {
          c.scale.set(isFemale ? 0.93 : 1.0, isFemale ? 0.97 : 1.0, isFemale ? 0.94 : 1.0);
        }
        // Narrower feminine shoulders
        else if (
          name.includes('deltoid') ||
          name.includes('shoulder') ||
          name.includes('scapular')
        ) {
          c.scale.set(isFemale ? 0.91 : 1.0, isFemale ? 0.96 : 1.0, isFemale ? 0.95 : 1.0);
        }
      });
    }

    // Overall feminine height adjustment (~1.72m vs 1.82m)
    if (humanModelGroupRef.current) {
      const targetScale = isFemale ? 0.95 : 1.0;
      humanModelGroupRef.current.scale.set(targetScale, targetScale, targetScale);
    }
  }, []);

  // Update gender change
  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setSearchParams(newGender === 'female' ? { gender: 'female' } : {});
    applyGenderMorph(newGender);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.045);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.95, 2.7);
    camera.lookAt(0, 0.95, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Post-processing UnrealBloom
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.48, // bloom strength
      0.35, // bloom radius
      0.70  // bloom threshold
    );
    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    composerRef.current = composer;

    // 5. Holographic Stage Lighting
    const ambientLight = new THREE.AmbientLight(0x071b30, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    keyLight.position.set(1.5, 3.5, 3);
    scene.add(keyLight);

    const backRimLight = new THREE.DirectionalLight(0x0284c7, 2.2);
    backRimLight.position.set(-1.5, 2.5, -3);
    scene.add(backRimLight);

    // 6. Holographic Floor Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x0ea5e9, 0x0a1c30);
    gridHelper.position.y = -0.005;
    scene.add(gridHelper);

    // ========================================================
    // HOLOGRAM PEDESTAL
    // ========================================================
    const pedestal = new THREE.Group();
    scene.add(pedestal);

    const discGeo = new THREE.CircleGeometry(0.95, 64);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x030e1c,
      transparent: true,
      opacity: 0.92,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.position.y = 0.001;
    pedestal.add(discMesh);

    // Concentric glowing rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });

    const outerRingGeo = new THREE.RingGeometry(0.935, 0.95, 96);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.position.y = 0.003;
    pedestal.add(outerRing);

    const midRingGeo = new THREE.RingGeometry(0.505, 0.52, 80);
    midRingGeo.rotateX(-Math.PI / 2);
    const midRing = new THREE.Mesh(midRingGeo, ringMat);
    midRing.position.y = 0.004;
    pedestal.add(midRing);

    const innerRingGeo = new THREE.RingGeometry(0.20, 0.22, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    innerRing.position.y = 0.005;
    pedestal.add(innerRing);

    // Low hologram projector cone
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
    timeUniformsRef.current.push(beamMat.uniforms.uTime);

    // Sweeping X-Ray Laser Ring
    const laserRingGeo = new THREE.RingGeometry(0.68, 0.69, 96);
    laserRingGeo.rotateX(Math.PI / 2);
    const laserRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const scanRing = new THREE.Mesh(laserRingGeo, laserRingMat);
    scanRing.position.y = 1.0;
    scene.add(scanRing);
    scanRingRef.current = scanRing;

    // ========================================================
    // SHADER MATERIALS FOR ALL INTERNAL SYSTEMS
    // ========================================================

    // Skeleton Material
    const skeletonMat = new THREE.ShaderMaterial({
      vertexShader: SKELETON_HOLO_VERT,
      fragmentShader: SKELETON_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBoneColor: { value: new THREE.Color(0x002d5a) },
        uGlowColor: { value: new THREE.Color(0x00f5ff) },
        uIntensity: { value: 1.15 },
        uScanY: scanUniformsRef.current.uScanY,
        uScanActive: scanUniformsRef.current.uScanActive,
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    timeUniformsRef.current.push(skeletonMat.uniforms.uTime);

    // Heart Material (Pulsing dual-beat lub-dub)
    const heartMat = new THREE.ShaderMaterial({
      vertexShader: HEART_HOLO_VERT,
      fragmentShader: HEART_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x990022) },
        uGlowColor: { value: new THREE.Color(0xff2a5f) },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    timeUniformsRef.current.push(heartMat.uniforms.uTime);

    // Vessels Material (Neon red arterial cyber network)
    const vesselsMat = new THREE.ShaderMaterial({
      vertexShader: VESSELS_HOLO_VERT,
      fragmentShader: VESSELS_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uArteryColor: { value: new THREE.Color(0xff1e46) },
        uVeinColor: { value: new THREE.Color(0x00b4d8) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    timeUniformsRef.current.push(vesselsMat.uniforms.uTime);

    // Lungs Material (Translucent ice-blue / sky cyan with breathing expansion)
    const lungsMat = new THREE.ShaderMaterial({
      vertexShader: LUNGS_HOLO_VERT,
      fragmentShader: LUNGS_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x0369a1) },
        uRimColor: { value: new THREE.Color(0x38bdf8) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    timeUniformsRef.current.push(lungsMat.uniforms.uTime);

    // Trachea & Bronchi Material (Bright electric teal)
    const tracheaMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: false,
      transparent: true,
      opacity: 0.95,
    });

    // Liver Material (Amber/gold glow)
    const liverMat = new THREE.ShaderMaterial({
      vertexShader: LIVER_HOLO_VERT,
      fragmentShader: LIVER_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x78350f) },
        uRimColor: { value: new THREE.Color(0xf59e0b) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    timeUniformsRef.current.push(liverMat.uniforms.uTime);

    // Digestive Tract Material (Emerald/lime glow with wave peristalsis)
    const digestiveMat = new THREE.ShaderMaterial({
      vertexShader: DIGESTIVE_HOLO_VERT,
      fragmentShader: DIGESTIVE_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x064e3b) },
        uRimColor: { value: new THREE.Color(0x10b981) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    timeUniformsRef.current.push(digestiveMat.uniforms.uTime);

    // Outer Glassy Skin Material
    const skinMat = new THREE.ShaderMaterial({
      vertexShader: SKIN_HOLO_VERT,
      fragmentShader: SKIN_HOLO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRimColor: { value: new THREE.Color(0x00f5ff) },
        uBaseColor: { value: new THREE.Color(0x021025) },
        uOpacity: { value: 0.85 },
        uScanY: scanUniformsRef.current.uScanY,
        uScanActive: scanUniformsRef.current.uScanActive,
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    timeUniformsRef.current.push(skinMat.uniforms.uTime);

    // ========================================================
    // ROOT MODEL GROUP & LOADERS
    // ========================================================
    const humanModelGroup = new THREE.Group();
    scene.add(humanModelGroup);
    humanModelGroupRef.current = humanModelGroup;

    const skeletonGroup = new THREE.Group();
    humanModelGroup.add(skeletonGroup);
    skeletonGroupRef.current = skeletonGroup;

    const cardioGroup = new THREE.Group();
    humanModelGroup.add(cardioGroup);
    cardioGroupRef.current = cardioGroup;

    const respGroup = new THREE.Group();
    humanModelGroup.add(respGroup);
    respGroupRef.current = respGroup;

    const digestGroup = new THREE.Group();
    humanModelGroup.add(digestGroup);
    digestGroupRef.current = digestGroup;

    const skinGroup = new THREE.Group();
    humanModelGroup.add(skinGroup);
    skinGroupRef.current = skinGroup;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load All Anatomical Systems Concurrently
    let loadedSystems = 0;
    const totalSystems = 5;

    const checkAllLoaded = () => {
      loadedSystems++;
      setLoadProgress(Math.round((loadedSystems / totalSystems) * 90) + 10);
      if (loadedSystems >= totalSystems) {
        setLoading(false);
        if (initialGender === 'female') {
          applyGenderMorph('female');
        }
      }
    };

    // 1. Load Skeleton
    gltfLoader.load(
      '/models/skeletal_male.glb',
      (gltf) => {
        const root = gltf.scene;
        root.traverse((c) => {
          if (c.isMesh) {
            c.material = skeletonMat;
          }
        });

        // Compute alignment box to normalize height and position on floor
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const targetHeight = 1.82;
        const normScale = targetHeight / (size.y || 1);

        // Position parent human group so all shared anatomy aligns perfectly at origin
        humanModelGroup.position.x = -center.x * normScale;
        humanModelGroup.position.y = -box.min.y * normScale;
        humanModelGroup.position.z = -center.z * normScale;

        // Apply base normalization to skeleton
        root.scale.set(normScale, normScale, normScale);
        skeletonGroup.add(root);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('Error loading skeleton:', err);
        checkAllLoaded();
      }
    );

    // 2. Load Cardiovascular & Heart (Mạch máu & Tim)
    gltfLoader.load(
      '/models/cardiovascular_male.glb',
      (gltf) => {
        const root = gltf.scene;
        root.traverse((c) => {
          if (c.isMesh) {
            const name = (c.name || '').toLowerCase();
            // Distinguish Heart chamber & coronary vessels from peripheral vessels
            if (
              name.includes('heart') ||
              name.includes('atrium') ||
              name.includes('ventricle') ||
              name.includes('card') ||
              name.includes('coronary') ||
              name.includes('papillary')
            ) {
              c.material = heartMat;
            } else {
              c.material = vesselsMat;
            }
          }
        });

        const targetHeight = 1.82;
        const normScale = targetHeight / 1.65;
        root.scale.set(normScale, normScale, normScale);
        cardioGroup.add(root);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('Error loading cardiovascular:', err);
        checkAllLoaded();
      }
    );

    // 3. Load Respiratory (Phổi, Khí quản, Phế quản)
    gltfLoader.load(
      '/models/respiratory_male.glb',
      (gltf) => {
        const root = gltf.scene;
        root.traverse((c) => {
          if (c.isMesh) {
            const name = (c.name || '').toLowerCase();
            if (name.includes('trachea') || name.includes('bronch')) {
              c.material = tracheaMat;
            } else {
              c.material = lungsMat;
            }
          }
        });

        const targetHeight = 1.82;
        const normScale = targetHeight / 1.65;
        root.scale.set(normScale, normScale, normScale);
        respGroup.add(root);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('Error loading respiratory:', err);
        checkAllLoaded();
      }
    );

    // 4. Load Digestive (Gan, Dạ dày, Phèo non & Đại tràng)
    gltfLoader.load(
      '/models/digestive_male.glb',
      (gltf) => {
        const root = gltf.scene;
        root.traverse((c) => {
          if (c.isMesh) {
            const name = (c.name || '').toLowerCase();
            // Remove anal sphincter / perineal meshes
            if (name.includes('anal') || name.includes('sphincter') || name.includes('perine')) {
              c.visible = false;
              c.geometry = new THREE.BufferGeometry();
              return;
            }

            // Gan (Liver) gets amber glow
            if (name.includes('liver') || name.includes('gallbladder') || name.includes('bile')) {
              c.material = liverMat;
            } else {
              // Stomach, Duodenum, Jejunum (Phèo non), Colon get emerald peristalsis glow
              c.material = digestiveMat;
            }
          }
        });

        const targetHeight = 1.82;
        const normScale = targetHeight / 1.65;
        root.scale.set(normScale, normScale, normScale);
        digestGroup.add(root);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('Error loading digestive:', err);
        checkAllLoaded();
      }
    );

    // 5. Load Outer Holographic Skin Shell
    gltfLoader.load(
      '/models/regional_male.glb',
      (gltf) => {
        const root = gltf.scene;
        root.traverse((c) => {
          if (c.isMesh) {
            const name = (c.name || '').toLowerCase();
            // Strictly exclude all genital, pubic, and perineal meshes
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
            c.material = skinMat;
          }
        });

        const targetHeight = 1.82;
        const normScale = targetHeight / 1.65;
        root.scale.set(normScale, normScale, normScale);
        skinGroup.add(root);
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.error('Error loading skin:', err);
        checkAllLoaded();
      }
    );

    // ========================================================
    // INTERACTION (ORBIT DRAG & TOUCH)
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
        1.6,
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

      // Update shader times
      timeUniformsRef.current.forEach((u) => {
        if (u) u.value = elapsed;
      });

      // Update interactive X-Ray Scanline position (sweeping smoothly up and down)
      const scanCycle = (Math.sin(elapsed * 1.6) * 0.5 + 0.5); // 0 to 1
      const currentScanY = 0.15 + scanCycle * 1.55; // sweeps from feet (y=0.15) to head (y=1.70)
      scanUniformsRef.current.uScanY.value = currentScanY;

      if (scanRingRef.current) {
        scanRingRef.current.position.y = currentScanY;
        scanRingRef.current.visible = scanActive;
      }

      // Camera Orbit Smoothing
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
  }, [autoRotate, scanActive]);

  // System Layer Toggles
  const toggleSkeleton = useCallback(() => {
    setShowSkeleton((prev) => {
      const next = !prev;
      if (skeletonGroupRef.current) skeletonGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleCardio = useCallback(() => {
    setShowCardio((prev) => {
      const next = !prev;
      if (cardioGroupRef.current) cardioGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleResp = useCallback(() => {
    setShowResp((prev) => {
      const next = !prev;
      if (respGroupRef.current) respGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleDigest = useCallback(() => {
    setShowDigest((prev) => {
      const next = !prev;
      if (digestGroupRef.current) digestGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleSkin = useCallback(() => {
    setShowSkin((prev) => {
      const next = !prev;
      if (skinGroupRef.current) skinGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleScan = useCallback(() => {
    setScanActive((prev) => {
      const next = !prev;
      scanUniformsRef.current.uScanActive.value = next ? 1.0 : 0.0;
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
          <p className={styles.loadingDesc}>
            Tải khung xương, mạch máu & tim, phổi hô hấp, gan & hệ tiêu hóa...
          </p>
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
        <div className={styles.headerLeft}>
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
        </div>

        {/* Gender Toggle: Nam / Nữ */}
        <div className={styles.headerCenter}>
          <div className={styles.genderSelector}>
            <button
              type="button"
              onClick={() => handleGenderChange('male')}
              className={`${styles.genderBtn} ${gender === 'male' ? styles.genderBtnActive : ''}`}
              title="Khung xương và giải phẫu Nam"
            >
              <span>Nam ♂</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('female')}
              className={`${styles.genderBtn} ${gender === 'female' ? styles.genderBtnActive : ''}`}
              title="Khung xương và giải phẫu Nữ"
            >
              <span>Nữ ♀</span>
            </button>
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

      {/* Floating HUD Telemetry Card */}
      <div className={styles.hudCard}>
        <div className={styles.hudHeader}>
          <span className={styles.hudTitle}>Hologram Telemetry</span>
          <Activity size={14} color="#00f5ff" />
        </div>
        <div className={styles.hudVitals}>
          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>
              <Heart size={13} color="#ff3366" />
              <span>Nhịp tim:</span>
            </span>
            <span className={`${styles.vitalValue} ${styles.vitalHeart}`}>72 BPM</span>
          </div>

          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>
              <Wind size={13} color="#38bdf8" />
              <span>Nhịp thở:</span>
            </span>
            <span className={`${styles.vitalValue} ${styles.vitalResp}`}>14 BR/M</span>
          </div>

          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>
              <Flame size={13} color="#f59e0b" />
              <span>Chuyển hóa:</span>
            </span>
            <span className={`${styles.vitalValue} ${styles.vitalLiver}`}>Optimal</span>
          </div>

          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>
              <User size={13} color="#00f5ff" />
              <span>Giới tính:</span>
            </span>
            <span className={styles.vitalValue}>
              {gender === 'male' ? 'Nam (Male)' : 'Nữ (Female)'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Control Toolbar (Bottom Center) */}
      <div className={styles.bottomToolbar}>
        {/* Skeleton toggle */}
        <button
          type="button"
          onClick={toggleSkeleton}
          className={`${styles.toolBtn} ${showSkeleton ? styles.toolBtnActive : ''}`}
          title="Bật/Tắt Khung xương (335 xương giải phẫu)"
        >
          <Layers size={15} />
          <span>Khung xương</span>
        </button>

        {/* Cardio & Heart toggle */}
        <button
          type="button"
          onClick={toggleCardio}
          className={`${styles.toolBtn} ${showCardio ? styles.toolBtnHeartActive : ''}`}
          title="Bật/Tắt Hệ tuần hoàn & Tim"
        >
          <Heart size={15} />
          <span>Mạch máu & Tim</span>
        </button>

        {/* Lungs toggle */}
        <button
          type="button"
          onClick={toggleResp}
          className={`${styles.toolBtn} ${showResp ? styles.toolBtnRespActive : ''}`}
          title="Bật/Tắt Phổi & Khí phế quản"
        >
          <Wind size={15} />
          <span>Phổi</span>
        </button>

        {/* Digestive toggle */}
        <button
          type="button"
          onClick={toggleDigest}
          className={`${styles.toolBtn} ${showDigest ? styles.toolBtnLiverActive : ''}`}
          title="Bật/Tắt Gan & Hệ tiêu hóa (Phèo)"
        >
          <Flame size={15} />
          <span>Gan & Phèo</span>
        </button>

        {/* Skin toggle */}
        <button
          type="button"
          onClick={toggleSkin}
          className={`${styles.toolBtn} ${showSkin ? styles.toolBtnActive : ''}`}
          title="Bật/Tắt Lớp hình thể Hologram"
        >
          <User size={15} />
          <span>Hình thể</span>
        </button>

        <div className={styles.toolbarDivider} />

        {/* Scanline laser sweep */}
        <button
          type="button"
          onClick={toggleScan}
          className={`${styles.toolBtn} ${scanActive ? styles.toolBtnActive : ''}`}
          title="Bật/Tắt Tia quét X-Ray Hologram"
        >
          <Scan size={15} />
          <span>Quét X-Ray</span>
        </button>

        {/* Auto rotate 360 */}
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`${styles.toolBtn} ${autoRotate ? styles.toolBtnActive : ''}`}
          title="Tự động xoay 360 độ"
        >
          <Sparkles size={15} />
          <span>{autoRotate ? 'Dừng xoay' : 'Xoay 360°'}</span>
        </button>

        {/* Reset camera */}
        <button
          type="button"
          onClick={resetCamera}
          className={styles.toolBtn}
          title="Đặt lại chính diện"
        >
          <Maximize2 size={15} />
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
