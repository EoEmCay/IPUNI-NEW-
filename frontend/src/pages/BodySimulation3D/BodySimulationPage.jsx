import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  ArrowLeft,
  RotateCcw,
  Layers,
  Heart,
  Wind,
  User,
  Brain,
  Eye,
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// CLEAN STUDIO MEDICAL SHADERS (NO BLOOM, NO FLASHY GLOW)
// Matches Reference Images 2 (Back), 3 (Front), and 4 (X-Ray Brain + Skeleton)
// ========================================================

const STUDIO_VERT = /* glsl */ `
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

// 1. Outer Body Shader:
// - When uSurfaceMode = 1.0 (Images 2 & 3): Smooth sculpted matte-satin cobalt blue with soft sky-blue rim.
// - When uSurfaceMode = 0.0 (Image 4): Crystal-clear X-ray glass silhouette revealing brain, skeleton & vessels inside.
const SKIN_STUDIO_FRAG = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uLitColor;
  uniform vec3 uRimColor;
  uniform float uSurfaceMode;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 2.4);

    // Three-point studio medical lighting
    vec3 keyDir = normalize(vec3(0.35, 0.65, 0.75));
    vec3 fillDir = normalize(vec3(-0.55, 0.25, 0.55));
    vec3 topDir = normalize(vec3(0.0, 1.0, 0.2));

    float keyLight = max(dot(normal, keyDir), 0.0);
    float fillLight = max(dot(normal, fillDir), 0.0) * 0.45;
    float topLight = max(dot(normal, topDir), 0.0) * 0.25;
    float diffuse = clamp(keyLight * 0.75 + fillLight + topLight, 0.0, 1.0);

    // Soft satin highlight for sculpted muscular definition (Images 2 & 3)
    vec3 halfVec = normalize(keyDir + viewDir);
    float satinSpec = pow(max(dot(normal, halfVec), 0.0), 18.0) * 0.22;

    vec3 surfaceCol = mix(uDeepColor, uLitColor, diffuse);
    surfaceCol += uRimColor * (satinSpec + fresnel * 0.52);

    // X-Ray glass silhouette mode (Image 4)
    vec3 xrayCol = mix(uLitColor * 0.65, uRimColor, pow(fresnel, 1.4));
    float xrayAlpha = mix(0.07, 0.74, pow(fresnel, 2.0));

    vec3 finalColor = mix(xrayCol, surfaceCol, uSurfaceMode);
    float finalAlpha = mix(xrayAlpha, 0.98, uSurfaceMode);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// 2. X-Ray Cobalt Skeleton Shader (Matches Image 4: crisp translucent cobalt-blue bone with clean edges)
const SKELETON_STUDIO_FRAG = /* glsl */ `
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 1.65);

    vec3 keyDir = normalize(vec3(0.3, 0.7, 0.7));
    float diff = max(dot(normal, keyDir), 0.0) * 0.45;

    vec3 color = mix(uCoreColor, uEdgeColor, fresnel * 0.82 + diff * 0.35);
    float alpha = mix(0.34, 0.90, fresnel);

    gl_FragColor = vec4(color, alpha);
  }
`;

// 3. Solid Anatomical Studio Shader (For Brain gyri/sulci in Image 4, Blood Vessels, Heart, Liver, Viscera)
const ORGAN_STUDIO_FRAG = /* glsl */ `
  uniform vec3 uShadowColor;
  uniform vec3 uMidColor;
  uniform vec3 uRimColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 2.2);

    vec3 keyDir = normalize(vec3(0.35, 0.65, 0.75));
    vec3 fillDir = normalize(vec3(-0.5, 0.3, 0.5));
    float diff = clamp(max(dot(normal, keyDir), 0.0) * 0.78 + max(dot(normal, fillDir), 0.0) * 0.35, 0.0, 1.0);

    vec3 halfVec = normalize(keyDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 24.0) * 0.18;

    vec3 color = mix(uShadowColor, uMidColor, diff);
    color = mix(color, uRimColor, fresnel * 0.48) + uRimColor * spec;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

// 4. Translucent Lung Shader (Reveals bronchial tree and heart vessels inside)
const LUNG_STUDIO_FRAG = /* glsl */ `
  uniform vec3 uCoreColor;
  uniform vec3 uRimColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 viewDir = normalize(vViewPosition);

    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 1.8);

    vec3 color = mix(uCoreColor, uRimColor, fresnel * 0.85);
    float alpha = mix(0.20, 0.68, fresnel);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ========================================================
// ANATOMICAL ATLAS CLASSIFICATION & GEOMETRY BAKING
// ========================================================

function isBrainOrSpinalNode(name) {
  if (!name) return false;
  const l = name.toLowerCase();
  if (
    l.includes('dura') ||
    l.includes('falx') ||
    l.includes('tentorium') ||
    l.includes('muscle') ||
    l.includes('eyeball') ||
    l.includes('cornea') ||
    l.includes('cochlea') ||
    l.includes('auditory') ||
    l.includes('lacrimal')
  ) {
    return false;
  }
  return (
    l.includes('gyrus') ||
    l.includes('gyri') ||
    l.includes('sulcus') ||
    l.includes('sulci') ||
    l.includes('lobe') ||
    l.includes('lobule') ||
    l.includes('cereb') ||
    l.includes('pons') ||
    l.includes('medulla') ||
    l.includes('thalamus') ||
    l.includes('hypothalamus') ||
    l.includes('corpus callosum') ||
    l.includes('fornix') ||
    l.includes('hippocamp') ||
    l.includes('putamen') ||
    l.includes('caudate') ||
    l.includes('globus pallidus') ||
    l.includes('insula') ||
    l.includes('cuneus') ||
    l.includes('precuneus') ||
    l.includes('vermis') ||
    l.includes('culmen') ||
    l.includes('declive') ||
    l.includes('flocculus') ||
    l.includes('tonsil of cerebellum') ||
    l.includes('midbrain') ||
    l.includes('colliculus') ||
    l.includes('peduncle') ||
    l.includes('olive') ||
    l.includes('pyramid of medulla') ||
    l.includes('amygdal') ||
    l.includes('commissure') ||
    l.includes('septum pellucidum') ||
    l.includes('ventricle') ||
    l.includes('spinal cord') ||
    l.includes('central canal') ||
    l.includes('cauda equina') ||
    l.includes('fasciculus') ||
    l.includes('spinothalamic') ||
    l.includes('spinocerebellar') ||
    l.includes('corticospinal') ||
    l.includes('reticulospinal') ||
    l.includes('vestibulospinal') ||
    l.includes('rubrospinal') ||
    l.includes('tectospinal') ||
    l.includes('posterolateral tract') ||
    l.includes('optic chiasm') ||
    l.includes('optic tract') ||
    l.includes('mamillary') ||
    l.includes('geniculate') ||
    l.includes('habenula') ||
    l.includes('red nucleus') ||
    l.includes('lentiform') ||
    l.includes('septal nuclei') ||
    l.includes('choroid plexus') ||
    l.includes('temporal plane') ||
    l.includes('temporal pole') ||
    l.includes('occipital pole') ||
    l.includes('interpeduncular') ||
    l.includes('stria ') ||
    l.includes('white matter')
  );
}

/**
 * Bakes a mesh's world matrix into its geometry, fixes inside-out winding
 * on mirrored (.l) meshes where determinant < 0, and returns a clean indexed
 * BufferGeometry with only 'position' attribute ready for merging.
 */
function extractCleanWorldGeometry(mesh) {
  if (!mesh.geometry || !mesh.geometry.attributes.position) return null;
  const src = mesh.geometry;
  const posAttr = src.attributes.position.clone();

  const clean = new THREE.BufferGeometry();
  clean.setAttribute('position', posAttr);

  if (src.index) {
    clean.setIndex(src.index.clone());
  } else {
    const count = posAttr.count;
    const indices = new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
    clean.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  clean.applyMatrix4(mesh.matrixWorld);

  // Reverse triangle winding if world matrix had negative determinant (mirrored left-side meshes)
  if (mesh.matrixWorld.determinant() < 0 && clean.index) {
    const arr = clean.index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    clean.index.needsUpdate = true;
  }

  return clean;
}

/**
 * Extracts ONLY the pure outer skin surface from Z-Anatomy's regional_male.glb meshes.
 * In regional_male.glb, each regional skin patch was thickened with Blender's Solidify modifier
 * into 3 disjoint index-space components:
 *   - Component A (first twin): Inner back-surface (offset ~2mm inward with inward normals)
 *   - Component B (second twin): True Outer Skin Surface (with outward normals)
 *   - Rim Component(s): 90-degree side walls around the perimeter of the region
 * Keeping only Component B (or single-sheet ear/toe meshes) eliminates 100% of internal
 * puzzle-piece border lines in X-ray mode and allows seamless vertex welding across regions.
 */
function extractPureOuterSkinGeometry(mesh) {
  const clean = extractCleanWorldGeometry(mesh);
  if (!clean || !clean.index) return clean;

  const posAttr = clean.attributes.position;
  const posArr = posAttr.array;
  const numPts = posAttr.count;
  const idxArr = clean.index.array;
  const numFaces = Math.floor(idxArr.length / 3);

  // Decompose triangle faces into connected components in raw index space
  const parent = new Int32Array(numPts);
  for (let i = 0; i < numPts; i++) parent[i] = i;
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    let c = x;
    while (c !== r) {
      const nxt = parent[c];
      parent[c] = r;
      c = nxt;
    }
    return r;
  };

  for (let f = 0; f < numFaces; f++) {
    const a = idxArr[f * 3];
    const b = idxArr[f * 3 + 1];
    const c = idxArr[f * 3 + 2];
    parent[find(a)] = find(b);
    parent[find(b)] = find(c);
  }

  const compsMap = new Map();
  for (let f = 0; f < numFaces; f++) {
    const a = idxArr[f * 3];
    const b = idxArr[f * 3 + 1];
    const c = idxArr[f * 3 + 2];
    const r = find(a);
    let comp = compsMap.get(r);
    if (!comp) {
      comp = { faces: [], verts: new Set() };
      compsMap.set(r, comp);
    }
    comp.faces.push(a, b, c);
    comp.verts.add(a);
    comp.verts.add(b);
    comp.verts.add(c);
  }

  const comps = [...compsMap.values()];
  if (comps.length > 1) {
    const used = new Set();
    const keptIndices = [];
    let maxTwinFaces = 0;
    for (let i = 0; i < comps.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < comps.length; j++) {
        if (used.has(j)) continue;
        if (
          comps[i].faces.length === comps[j].faces.length &&
          comps[i].verts.size === comps[j].verts.size
        ) {
          used.add(i);
          used.add(j);
          const srcFaces = comps[j].faces;
          if (srcFaces.length > maxTwinFaces) maxTwinFaces = srcFaces.length;
          for (let k = 0; k < srcFaces.length; k++) {
            keptIndices.push(srcFaces[k]);
          }
          break;
        }
      }
    }
    // Also keep any primary unsplit surface component that is larger than the twin pairs (e.g. Dorsal surfaces of digits of hand)
    for (let i = 0; i < comps.length; i++) {
      if (!used.has(i) && comps[i].faces.length > maxTwinFaces) {
        const srcFaces = comps[i].faces;
        for (let k = 0; k < srcFaces.length; k++) {
          keptIndices.push(srcFaces[k]);
        }
      }
    }
    if (keptIndices.length > 0) {
      clean.setIndex(new THREE.BufferAttribute(new Uint32Array(keptIndices), 1));
    }
  }

  // Smoothly flatten any genital bulge in the groin/urogenital region onto the mannequin pelvic plane
  // while leaving the seam at y >= 0.838 (where z <= 0.0692 < zMax) 100% untouched for watertight welding.
  for (let i = 0; i < numPts; i++) {
    const x = posArr[i * 3];
    const y = posArr[i * 3 + 1];
    const z = posArr[i * 3 + 2];
    if (y >= 0.71 && y <= 0.845 && Math.abs(x) < 0.062) {
      const zMax = 0.058 + (y - 0.82) * 0.75;
      if (z > zMax) {
        posArr[i * 3 + 2] = zMax;
      }
    }
  }
  posAttr.needsUpdate = true;

  return clean;
}

/**
 * Merges an array of clean world-space geometries, optionally welds boundary vertices,
 * computes smooth outward vertex normals, and stores the baseline Male positions
 * so unified world-space gender deformation keeps 100% of systems aligned.
 */
function buildMergedAtlasGeometry(geoms, weldTolerance = 0) {
  if (!geoms || geoms.length === 0) return null;
  let merged = mergeGeometries(geoms, false);
  if (!merged) return null;
  if (weldTolerance > 0) {
    merged = mergeVertices(merged, weldTolerance);
  }
  merged.computeVertexNormals();
  merged.userData.malePositions = new Float32Array(merged.attributes.position.array);
  return merged;
}

/**
 * Unified diffeomorphic world-space deformation for Male vs Female anatomy.
 * Because the exact same smooth coordinate function (x, y, z) -> (x', y', z')
 * is applied to every vertex across Skin, Skeleton, Brain, Vessels, and Organs,
 * 100% of anatomical structures remain locked in sub-millimeter alignment.
 */
function deformGeometryForGender(geom, isFemale) {
  if (!geom || !geom.userData.malePositions) return;
  const src = geom.userData.malePositions;
  const dst = geom.attributes.position.array;

  if (!isFemale) {
    dst.set(src);
  } else {
    for (let i = 0; i < src.length; i += 3) {
      const x = src[i];
      const y = src[i + 1];
      const z = src[i + 2];
      const absX = Math.abs(x);

      // Torso radial mask (excludes arms/hands hanging at |x| > 0.17m)
      const torsoExcess = Math.max(0, absX - 0.155);
      const torsoMask = Math.exp(-(torsoExcess * torsoExcess) / (2 * 0.035 * 0.035));

      // 1. Gynecoid pelvis / hip expansion centered at y = 0.85m
      const dyHip = y - 0.85;
      const wHip = Math.exp(-(dyHip * dyHip) / (2 * 0.095 * 0.095)) * torsoMask;

      // 2. Slender female waist taper centered at y = 1.06m
      const dyWaist = y - 1.06;
      const wWaist = Math.exp(-(dyWaist * dyWaist) / (2 * 0.075 * 0.075)) * torsoMask;

      // 3. Narrower female shoulder girdle & thorax centered at y = 1.34m
      const dyShoulder = y - 1.34;
      const wShoulder = Math.exp(-(dyShoulder * dyShoulder) / (2 * 0.14 * 0.14));

      const scaleX = 1.0 + 0.125 * wHip - 0.085 * wWaist - 0.085 * wShoulder;
      const scaleZ = 1.0 + 0.065 * wHip - 0.045 * wWaist - 0.045 * wShoulder;
      const scaleY = 0.96;

      dst[i] = x * scaleX;
      dst[i + 1] = y * scaleY;
      dst[i + 2] = z * scaleZ;
    }
  }

  geom.attributes.position.needsUpdate = true;
  geom.computeVertexNormals();
}

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGender = searchParams.get('gender') === 'female' ? 'female' : 'male';
  const initialPreset = searchParams.get('preset') || 'vessels_detail';
  const mountRef = useRef(null);

  // UI State
  const [gender, setGender] = useState(initialGender);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);

  // Active preset & layers
  const [activePreset, setActivePreset] = useState(initialPreset);
  const [showSkin, setShowSkin] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(
    initialPreset !== 'front_surface' && initialPreset !== 'back_surface'
  );
  const [showBrain, setShowBrain] = useState(
    initialPreset !== 'front_surface' && initialPreset !== 'back_surface'
  );
  const [showVessels, setShowVessels] = useState(
    initialPreset === 'vessels_detail' || initialPreset === 'atlas_full'
  );
  const [showOrgans, setShowOrgans] = useState(initialPreset === 'atlas_full');

  const initialCam = (() => {
    if (initialPreset === 'front_surface') {
      return { rotY: -0.25, rotX: 0.06, distance: 1.55, lookY: 1.22 };
    }
    if (initialPreset === 'back_surface') {
      return { rotY: Math.PI - 0.22, rotX: 0.05, distance: 1.55, lookY: 1.18 };
    }
    if (initialPreset === 'brain_skeleton') {
      return { rotY: -0.32, rotX: 0.06, distance: 1.35, lookY: 1.32 };
    }
    if (initialPreset === 'atlas_full') {
      return { rotY: 0, rotX: 0.04, distance: 2.35, lookY: 0.92 };
    }
    return { rotY: 0, rotX: 0.04, distance: 2.3, lookY: 0.92 };
  })();

  // Scene & Mesh References
  const controlsState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: initialCam.rotX,
    rotY: initialCam.rotY,
    targetRotY: initialCam.rotY,
    targetRotX: initialCam.rotX,
    distance: initialCam.distance,
    targetDistance: initialCam.distance,
    lookY: initialCam.lookY,
    targetLookY: initialCam.lookY,
  });

  const meshesRef = useRef({
    skin: null,
    eyes: null,
    skeleton: null,
    brain: null,
    heart: null,
    arteries: null,
    veins: null,
    lungs: null,
    bronchi: null,
    liver: null,
    digestive: null,
    kidneys: null,
  });
  const skinMatRef = useRef(null);
  const allGeomsRef = useRef([]);
  const layerStateRef = useRef({
    showSkin,
    showSkeleton,
    showBrain,
    showVessels,
    showOrgans,
  });

  const syncMeshVisibility = useCallback(() => {
    const m = meshesRef.current;
    const {
      showSkin: sSkin,
      showSkeleton: sSkel,
      showBrain: sBrain,
      showVessels: sVessels,
      showOrgans: sOrgans,
    } = layerStateRef.current;
    const hasInternal = sSkel || sBrain || sVessels || sOrgans;

    if (m.skin) {
      m.skin.visible = sSkin;
    }
    if (m.eyes) {
      m.eyes.visible = sSkin && !hasInternal;
    }
    if (skinMatRef.current) {
      skinMatRef.current.uniforms.uSurfaceMode.value = hasInternal ? 0.0 : 1.0;
      skinMatRef.current.depthWrite = !hasInternal;
    }

    if (m.skeleton) m.skeleton.visible = sSkel;
    if (m.brain) m.brain.visible = sBrain;

    if (m.heart) m.heart.visible = sVessels || sOrgans;
    if (m.arteries) m.arteries.visible = sVessels;
    if (m.veins) m.veins.visible = sVessels;

    if (m.lungs) m.lungs.visible = sOrgans;
    if (m.bronchi) m.bronchi.visible = sOrgans;
    if (m.liver) m.liver.visible = sOrgans;
    if (m.digestive) m.digestive.visible = sOrgans;
    if (m.kidneys) m.kidneys.visible = sOrgans;
  }, []);

  // Sync visibility & surface/X-ray mode whenever layer states change
  useEffect(() => {
    layerStateRef.current = {
      showSkin,
      showSkeleton,
      showBrain,
      showVessels,
      showOrgans,
    };
    syncMeshVisibility();
  }, [showSkin, showSkeleton, showBrain, showVessels, showOrgans, syncMeshVisibility]);

  // Apply gender deformation across all geometries simultaneously
  const handleGenderChange = useCallback(
    (newGender) => {
      setGender(newGender);
      setSearchParams(newGender === 'female' ? { gender: 'female' } : {});
      const isFemale = newGender === 'female';
      allGeomsRef.current.forEach((g) => deformGeometryForGender(g, isFemale));
    },
    [setSearchParams]
  );

  // View Presets matching user's uploaded reference images
  const applyPreset = useCallback((presetId) => {
    setActivePreset(presetId);
    const ctrl = controlsState.current;

    if (presetId === 'front_surface') {
      // Matches Image 3: Sculpted Cobalt-Blue Outer Character (Front View)
      setShowSkin(true);
      setShowSkeleton(false);
      setShowBrain(false);
      setShowVessels(false);
      setShowOrgans(false);
      ctrl.targetRotY = -0.25;
      ctrl.targetRotX = 0.06;
      ctrl.targetDistance = 1.55;
      ctrl.targetLookY = 1.22;
    } else if (presetId === 'back_surface') {
      // Matches Image 2: Sculpted Cobalt-Blue Outer Character (Back View)
      setShowSkin(true);
      setShowSkeleton(false);
      setShowBrain(false);
      setShowVessels(false);
      setShowOrgans(false);
      ctrl.targetRotY = Math.PI - 0.22;
      ctrl.targetRotX = 0.05;
      ctrl.targetDistance = 1.55;
      ctrl.targetLookY = 1.18;
    } else if (presetId === 'brain_skeleton') {
      // Matches Image 4: Translucent Outer Body + X-Ray Cobalt Skeleton + Brain
      setShowSkin(true);
      setShowSkeleton(true);
      setShowBrain(true);
      setShowVessels(false);
      setShowOrgans(false);
      ctrl.targetRotY = -0.32;
      ctrl.targetRotX = 0.06;
      ctrl.targetDistance = 1.35;
      ctrl.targetLookY = 1.32;
    } else if (presetId === 'vessels_detail') {
      // Detailed Blood Vessels + Brain + Skeleton inside Translucent Body
      setShowSkin(true);
      setShowSkeleton(true);
      setShowBrain(true);
      setShowVessels(true);
      setShowOrgans(false);
      ctrl.targetRotY = 0;
      ctrl.targetRotX = 0.04;
      ctrl.targetDistance = 2.3;
      ctrl.targetLookY = 0.92;
    } else if (presetId === 'atlas_full') {
      // Complete Anatomical Atlas (All Systems Aligned)
      setShowSkin(true);
      setShowSkeleton(true);
      setShowBrain(true);
      setShowVessels(true);
      setShowOrgans(true);
      ctrl.targetRotY = 0;
      ctrl.targetRotX = 0.04;
      ctrl.targetDistance = 2.35;
      ctrl.targetLookY = 0.92;
    }
  }, []);

  const resetCamera = useCallback(() => {
    const ctrl = controlsState.current;
    ctrl.targetRotY = 0;
    ctrl.targetRotX = 0.04;
    ctrl.targetDistance = 2.35;
    ctrl.targetLookY = 0.92;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Clean Studio Scene (transparent background so CSS radial studio gradient shows)
    const scene = new THREE.Scene();

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 30);
    camera.position.set(0, 0.92, 2.35);
    camera.lookAt(0, 0.92, 0);

    // 3. Clean WebGLRenderer (No UnrealBloomPass, No overexposure)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Materials
    const skinMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: SKIN_STUDIO_FRAG,
      uniforms: {
        uDeepColor: { value: new THREE.Color(0x0d3694) },
        uLitColor: { value: new THREE.Color(0x2468f2) },
        uRimColor: { value: new THREE.Color(0x88ccff) },
        uSurfaceMode: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    skinMatRef.current = skinMat;

    const skeletonMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: SKELETON_STUDIO_FRAG,
      uniforms: {
        uCoreColor: { value: new THREE.Color(0x0a3488) },
        uEdgeColor: { value: new THREE.Color(0x52adff) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const brainMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x3b5978) },
        uMidColor: { value: new THREE.Color(0x8cb4d9) },
        uRimColor: { value: new THREE.Color(0xd2e9ff) },
        uOpacity: { value: 0.97 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const heartMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x7a1228) },
        uMidColor: { value: new THREE.Color(0xd92b4c) },
        uRimColor: { value: new THREE.Color(0xff8da1) },
        uOpacity: { value: 0.98 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const arteryMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x8a142c) },
        uMidColor: { value: new THREE.Color(0xe62e50) },
        uRimColor: { value: new THREE.Color(0xff7a90) },
        uOpacity: { value: 0.96 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const veinMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x123e8a) },
        uMidColor: { value: new THREE.Color(0x2979ff) },
        uRimColor: { value: new THREE.Color(0x82baff) },
        uOpacity: { value: 0.92 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const lungMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: LUNG_STUDIO_FRAG,
      uniforms: {
        uCoreColor: { value: new THREE.Color(0x1656a8) },
        uRimColor: { value: new THREE.Color(0x69b8ff) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const bronchiMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x1e5c8a) },
        uMidColor: { value: new THREE.Color(0x4db8e8) },
        uRimColor: { value: new THREE.Color(0xa6e3ff) },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const liverMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x5c2818) },
        uMidColor: { value: new THREE.Color(0xb85635) },
        uRimColor: { value: new THREE.Color(0xf09c78) },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const digestiveMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x1f5c52) },
        uMidColor: { value: new THREE.Color(0x3ba38c) },
        uRimColor: { value: new THREE.Color(0x8ce0cb) },
        uOpacity: { value: 0.94 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    const kidneyMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_VERT,
      fragmentShader: ORGAN_STUDIO_FRAG,
      uniforms: {
        uShadowColor: { value: new THREE.Color(0x591c2b) },
        uMidColor: { value: new THREE.Color(0xa83852) },
        uRimColor: { value: new THREE.Color(0xf2859b) },
        uOpacity: { value: 0.96 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    // 5. Unified Atlas Group (1:1 world space across all files — guarantees 100% alignment)
    const atlasGroup = new THREE.Group();
    scene.add(atlasGroup);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const loadGltf = (url) =>
      new Promise((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
      });

    let completedCount = 0;
    const totalFiles = 7;
    const bumpProgress = () => {
      completedCount++;
      if (!disposed) {
        setLoadProgress(Math.min(98, Math.round((completedCount / totalFiles) * 90) + 8));
      }
    };

    allGeomsRef.current = [];
    const registerMesh = (key, geom, mat, renderOrder) => {
      if (!geom) return null;
      allGeomsRef.current.push(geom);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.renderOrder = renderOrder;
      atlasGroup.add(mesh);
      meshesRef.current[key] = mesh;
      syncMeshVisibility();
      return mesh;
    };

    Promise.all([
      // 1. Outer Body Surface (regional_male.glb — pure outer skin shells welded into 1 seamless mesh)
      loadGltf('/models/regional_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const geoms = [];
        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const l = (c.name || '').toLowerCase();
          if (l.includes('hairs') || l.includes('eyelashes') || l.includes('pubic')) {
            return;
          }
          const g = extractPureOuterSkinGeometry(c);
          if (g) geoms.push(g);
        });
        const merged = buildMergedAtlasGeometry(geoms, 2e-4);
        registerMesh('skin', merged, skinMat, 4);
        bumpProgress();
      }),

      // 2. Skeleton (skeletal_male.glb — pure bones, costal cartilages, and discs)
      loadGltf('/models/skeletal_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const geoms = [];
        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const l = (c.name || '').toLowerCase();
          if (
            l.includes('ligament') ||
            l.includes('sinus') ||
            l.includes('cells of ethmoid') ||
            l.includes('nucleus pulposus') ||
            l.includes('alar cartilage') ||
            l.includes('nasal septal') ||
            l.includes('thyroid cartilage') ||
            l.includes('cricoid') ||
            l.includes('arytenoid') ||
            l.includes('corniculate')
          ) {
            return;
          }
          const g = extractCleanWorldGeometry(c);
          if (g) geoms.push(g);
        });
        const merged = buildMergedAtlasGeometry(geoms, 0);
        registerMesh('skeleton', merged, skeletonMat, 3);
        bumpProgress();
      }),

      // 3. Brain, Spinal Cord & Sculpted Eyes (nervous_male.glb)
      loadGltf('/models/nervous_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const geoms = [];
        const eyeGeoms = [];
        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const l = (c.name || '').toLowerCase();
          if (l.startsWith('cornea.') || l.startsWith('sclera.')) {
            const eg = extractCleanWorldGeometry(c);
            if (eg) eyeGeoms.push(eg);
            return;
          }
          if (!isBrainOrSpinalNode(c.name)) return;
          const g = extractCleanWorldGeometry(c);
          if (g) geoms.push(g);
        });
        const merged = buildMergedAtlasGeometry(geoms, 0);
        registerMesh('brain', merged, brainMat, 1);
        const mergedEyes = buildMergedAtlasGeometry(eyeGeoms, 1e-4);
        registerMesh('eyes', mergedEyes, skinMat, 4);
        bumpProgress();
      }),

      // 4. Detailed Blood Vessels & Heart (cardiovascular_male.glb)
      loadGltf('/models/cardiovascular_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const heartGeoms = [];
        const arteryGeoms = [];
        const veinGeoms = [];

        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const name = c.name || '';
          const l = name.toLowerCase();
          if (
            name.includes('?') ||
            l.includes('basilar venous plexus') ||
            l.includes('cavernous sinus') ||
            l.includes('intercavernous') ||
            l.includes('petrosal sinus') ||
            l.includes('penis') ||
            l.includes('pudendal') ||
            l.includes('testicular')
          ) {
            return;
          }
          const g = extractCleanWorldGeometry(c);
          if (!g) return;

          if (
            l.includes('atrium') ||
            l.includes('ventricle') ||
            l.includes('heart') ||
            l.includes('coronary') ||
            l.includes('cardiac vein') ||
            l.includes('papillary') ||
            l.includes('leaflet')
          ) {
            heartGeoms.push(g);
          } else if (l.includes('artery') || l.includes('aorta') || l.includes('trunk') || l.includes('arteri')) {
            arteryGeoms.push(g);
          } else {
            veinGeoms.push(g);
          }
        });

        registerMesh('heart', buildMergedAtlasGeometry(heartGeoms, 0), heartMat, 1);
        registerMesh('arteries', buildMergedAtlasGeometry(arteryGeoms, 0), arteryMat, 1);
        registerMesh('veins', buildMergedAtlasGeometry(veinGeoms, 0), veinMat, 1);
        bumpProgress();
      }),

      // 5. Lungs & Bronchial Tree (respiratory_male.glb)
      loadGltf('/models/respiratory_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const lungGeoms = [];
        const bronchiGeoms = [];

        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const l = (c.name || '').toLowerCase();
          if (
            l.includes('pleura') ||
            l.includes('pharynx') ||
            l.includes('nasal')
          ) {
            return;
          }
          const g = extractCleanWorldGeometry(c);
          if (!g) return;

          if (l.includes('trachea') || l.includes('bronch')) {
            bronchiGeoms.push(g);
          } else {
            lungGeoms.push(g);
          }
        });

        registerMesh('bronchi', buildMergedAtlasGeometry(bronchiGeoms, 0), bronchiMat, 1);
        registerMesh('lungs', buildMergedAtlasGeometry(lungGeoms, 0), lungMat, 2);
        bumpProgress();
      }),

      // 6. Liver & Digestive Tract (digestive_male.glb)
      loadGltf('/models/digestive_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const liverGeoms = [];
        const digestGeoms = [];

        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const name = c.name || '';
          const l = name.toLowerCase();

          // Keep unified 'Liver' and 'Gallbladder', skip internal overlapping liver sub-segments
          if (name === 'Liver' || l.includes('gallbladder') || l.includes('bile duct')) {
            const g = extractCleanWorldGeometry(c);
            if (g) liverGeoms.push(g);
            return;
          }

          if (
            name === 'Stomach' ||
            l.includes('oesophagus') ||
            l.includes('duodenum') ||
            l.includes('jejunum') ||
            l.includes('colon') ||
            l.includes('appendix') ||
            l.includes('pancrea')
          ) {
            const g = extractCleanWorldGeometry(c);
            if (g) digestGeoms.push(g);
          }
        });

        registerMesh('liver', buildMergedAtlasGeometry(liverGeoms, 0), liverMat, 1);
        registerMesh('digestive', buildMergedAtlasGeometry(digestGeoms, 0), digestiveMat, 1);
        bumpProgress();
      }),

      // 7. Kidneys & Urinary System (renal_male.glb)
      loadGltf('/models/renal_male.glb').then((gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const kidneyGeoms = [];
        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;
          const l = (c.name || '').toLowerCase();
          if (l.includes('urethra')) return;
          const g = extractCleanWorldGeometry(c);
          if (g) kidneyGeoms.push(g);
        });
        registerMesh('kidneys', buildMergedAtlasGeometry(kidneyGeoms, 0), kidneyMat, 1);
        bumpProgress();
      }),
    ])
      .then(() => {
        if (disposed) return;
        if (initialGender === 'female') {
          allGeomsRef.current.forEach((g) => deformGeometryForGender(g, true));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading anatomical atlas:', err);
        if (!disposed) setLoading(false);
      });

    // ========================================================
    // ORBIT, PAN & ZOOM INTERACTION
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
        -0.45,
        Math.min(0.65, controlsState.current.targetRotX + dy * 0.005)
      );
    };

    const onPointerUp = () => {
      controlsState.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsState.current.targetDistance = Math.max(
        0.55,
        Math.min(3.8, controlsState.current.targetDistance + e.deltaY * 0.002)
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
    };
    window.addEventListener('resize', onResize);

    // ========================================================
    // RENDER LOOP
    // ========================================================
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const ctrl = controlsState.current;
      ctrl.rotY += (ctrl.targetRotY - ctrl.rotY) * 0.1;
      ctrl.rotX += (ctrl.targetRotX - ctrl.rotX) * 0.1;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.1;
      ctrl.lookY += (ctrl.targetLookY - ctrl.lookY) * 0.1;

      const camY = ctrl.lookY + Math.sin(ctrl.rotX) * ctrl.distance;
      const horizDist = Math.cos(ctrl.rotX) * ctrl.distance;
      const camX = Math.sin(ctrl.rotY) * horizDist;
      const camZ = Math.cos(ctrl.rotY) * horizDist;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, ctrl.lookY, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      allGeomsRef.current.forEach((g) => g.dispose());
      renderer.dispose();
      dracoLoader.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [initialGender]);

  return (
    <div className={styles.page}>
      {/* 3D Viewport */}
      <div ref={mountRef} className={styles.canvasContainer} />

      {/* Loading Screen */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <h3 className={styles.loadingTitle}>ĐANG TẢI ATLAS GIẢI PHẨU 3D</h3>
          <p className={styles.loadingDesc}>
            Đồng bộ tọa độ cơ thể, khung xương, não bộ, mạch máu và nội tạng...
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${loadProgress}%` }} />
          </div>
          <span className={styles.progressText}>{loadProgress}%</span>
        </div>
      )}

      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={styles.backBtn}
            title="Quay lại Trang chủ"
          >
            <ArrowLeft size={17} />
            <span>Trang chủ DIA+</span>
          </button>
        </div>

        {/* Gender Selector: Nam / Nữ */}
        <div className={styles.headerCenter}>
          <div className={styles.pillGroup}>
            <button
              type="button"
              onClick={() => handleGenderChange('male')}
              className={`${styles.pillBtn} ${gender === 'male' ? styles.pillBtnActive : ''}`}
            >
              <span>Nam ♂</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('female')}
              className={`${styles.pillBtn} ${gender === 'female' ? styles.pillBtnActive : ''}`}
            >
              <span>Nữ ♀</span>
            </button>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={resetCamera}
            className={styles.iconBtn}
            title="Đặt lại góc nhìn toàn thân"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      {/* Left Quick View Presets (Matching Reference Images 2, 3, 4 & Vessels) */}
      <aside className={styles.sidePanel}>
        <div className={styles.sidePanelTitle}>Chế độ xem mẫu</div>
        <button
          type="button"
          onClick={() => applyPreset('atlas_full')}
          className={`${styles.presetBtn} ${activePreset === 'atlas_full' ? styles.presetBtnActive : ''}`}
        >
          <span>Toàn bộ Giải phẫu</span>
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyPreset('brain_skeleton')}
          className={`${styles.presetBtn} ${activePreset === 'brain_skeleton' ? styles.presetBtnActive : ''}`}
        >
          <span>Khung xương & Não (Ảnh 4)</span>
          <Brain size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyPreset('vessels_detail')}
          className={`${styles.presetBtn} ${activePreset === 'vessels_detail' ? styles.presetBtnActive : ''}`}
        >
          <span>Mạch máu chi tiết</span>
          <Heart size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyPreset('front_surface')}
          className={`${styles.presetBtn} ${activePreset === 'front_surface' ? styles.presetBtnActive : ''}`}
        >
          <span>Nhân vật Mặt trước (Ảnh 3)</span>
          <User size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyPreset('back_surface')}
          className={`${styles.presetBtn} ${activePreset === 'back_surface' ? styles.presetBtnActive : ''}`}
        >
          <span>Nhân vật Sau lưng (Ảnh 2)</span>
          <User size={14} />
        </button>
      </aside>

      {/* Bottom Individual Layer Toggles */}
      <div className={styles.bottomToolbar}>
        <button
          type="button"
          onClick={() => {
            setActivePreset('custom');
            setShowSkin((v) => !v);
          }}
          className={`${styles.toolBtn} ${showSkin ? styles.toolBtnActive : ''}`}
        >
          <User size={15} />
          <span>Cơ thể</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePreset('custom');
            setShowSkeleton((v) => !v);
          }}
          className={`${styles.toolBtn} ${showSkeleton ? styles.toolBtnActive : ''}`}
        >
          <Layers size={15} />
          <span>Khung xương</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePreset('custom');
            setShowBrain((v) => !v);
          }}
          className={`${styles.toolBtn} ${showBrain ? styles.toolBtnActive : ''}`}
        >
          <Brain size={15} />
          <span>Não & Tủy sống</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePreset('custom');
            setShowVessels((v) => !v);
          }}
          className={`${styles.toolBtn} ${showVessels ? styles.toolBtnVesselsActive : ''}`}
        >
          <Heart size={15} />
          <span>Mạch máu & Tim</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePreset('custom');
            setShowOrgans((v) => !v);
          }}
          className={`${styles.toolBtn} ${showOrgans ? styles.toolBtnOrgansActive : ''}`}
        >
          <Wind size={15} />
          <span>Phổi, Gan & Nội tạng</span>
        </button>
      </div>

      {/* Interaction Hint */}
      <div className={styles.interactionHint}>
        <span>Kéo chuột để xoay 360° • Cuộn chuột để phóng to / thu nhỏ chi tiết</span>
      </div>
    </div>
  );
}
