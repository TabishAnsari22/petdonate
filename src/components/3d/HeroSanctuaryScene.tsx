import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import panoramaUrl from '../../assets/images/sanctuary_panorama_1795455979177.jpg';
import limestoneUrl from '../../assets/images/limestone_paving_tile_1795455978494.jpg';
import meadowUrl from '../../assets/images/meadow_turf_tile_1795455978877.jpg';
import { GENERATED_IMAGES } from '../../data/sanctuaryData';
import { HERO_ANIMAL_MODEL_SLOTS } from '../../config/models';
import { computeScrollSceneState, type ScrollSceneKeyframe } from '../../lib/sanctuaryLogic';
import {
  buildProceduralHeroAnimals,
  loadHeroAnimals,
  type AnimatedAnimalRig,
} from './animalRigs';
import { createLimestoneTextures, createMeadowTextures } from './proceduralTextures';

gsap.registerPlugin(ScrollTrigger);

interface HeroSanctuarySceneProps {
  onSceneChange?: (scene: ScrollSceneKeyframe) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Generates an outdoor golden-hour sky & sunlit meadow PMREM reflection environment.
 * Avoids RoomEnvironment's bright white studio softboxes that create artificial
 * white patches on clearcoated animal eyes.
 */
function createOutdoorSkyEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(20, 24, 16);
  const pos = skyGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cSkyTop = new THREE.Color(0x9fb8c9);
  const cHorizon = new THREE.Color(0xf4e8d2);
  const cMeadow = new THREE.Color(0x556245);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 20;
    if (y >= 0) {
      tmp.copy(cHorizon).lerp(cSkyTop, Math.pow(y, 0.72));
    } else {
      tmp.copy(cHorizon).lerp(cMeadow, Math.min(1, Math.pow(-y * 2.2, 0.65)));
    }
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const skyMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  envScene.add(skyDome);

  // Small subtle warm golden sun pinpoint high in the upper right sky
  const sunGeo = new THREE.SphereGeometry(0.95, 12, 10);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe4b8 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(11, 12, 9);
  envScene.add(sunMesh);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.06);
  pmrem.dispose();
  skyGeo.dispose();
  skyMat.dispose();
  sunGeo.dispose();
  sunMat.dispose();
  return rt.texture;
}

function createGrassTuftGeometry(bladeCount = 8, heightScale = 1.0): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;

  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI * 2 + b * 0.43;
    const lean = (0.022 + (b % 3) * 0.012) * heightScale;
    const height = (0.055 + (b % 3) * 0.022) * heightScale;
    const w = 0.0042 * Math.min(1.25, Math.max(0.85, heightScale * 0.5));

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const px = -sin * w;
    const pz = cos * w;

    positions.push(
      -px, 0, -pz,
      px, 0, pz,
      -px * 0.5 + cos * lean * 0.45, height * 0.55, -pz * 0.5 + sin * lean * 0.45,
      px * 0.5 + cos * lean * 0.45, height * 0.55, pz * 0.5 + sin * lean * 0.45,
      cos * lean, height, sin * lean,
    );
    for (let v = 0; v < 5; v++) {
      normals.push(cos * 0.25, 0.94, sin * 0.25);
    }
    indices.push(
      vertOffset + 0, vertOffset + 1, vertOffset + 2,
      vertOffset + 1, vertOffset + 3, vertOffset + 2,
      vertOffset + 2, vertOffset + 3, vertOffset + 4,
    );
    vertOffset += 5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0, 'rgba(22, 18, 12, 0.52)');
  grad.addColorStop(0.52, 'rgba(22, 18, 12, 0.20)');
  grad.addColorStop(1, 'rgba(22, 18, 12, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createPollenMoteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 245, 214, 1.0)');
  grad.addColorStop(0.35, 'rgba(255, 232, 178, 0.45)');
  grad.addColorStop(1, 'rgba(255, 232, 178, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export default function HeroSanctuaryScene({
  onSceneChange,
  scrollContainerRef,
}: HeroSanctuarySceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef(0);
  const pointerNormRef = useRef({ x: 0, y: 0 });
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;

  const [activeScene, setActiveScene] = useState<ScrollSceneKeyframe>(() =>
    computeScrollSceneState(0),
  );
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const triggerEl = scrollContainerRef.current;
    if (!triggerEl) return;

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
        const nextScene = computeScrollSceneState(self.progress);
        setActiveScene((prev) =>
          prev.sceneIndex === nextScene.sceneIndex &&
          Math.abs(prev.missionOverlayOpacity - nextScene.missionOverlayOpacity) < 0.025 &&
          Math.abs(prev.heroContentOpacity - nextScene.heroContentOpacity) < 0.025
            ? prev
            : nextScene,
        );
        onSceneChangeRef.current?.(nextScene);
      },
    });

    return () => {
      st.kill();
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    if (reducedMotion) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    const handleContextRestored = () => {
      setWebglUnavailable(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const horizonMistColor = new THREE.Color(0xebe1cf);
    scene.background = horizonMistColor;
    scene.fog = new THREE.FogExp2(0xebe1cf, 0.044);

    const envTex = createOutdoorSkyEnvironment(renderer);
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;

    const initialSceneState = computeScrollSceneState(scrollProgressRef.current);
    const currentLookAt = new THREE.Vector3(...initialSceneState.lookAtTarget);
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 140);
    camera.position.set(...initialSceneState.cameraPosition);
    camera.lookAt(currentLookAt);

    // Golden-Hour Natural Sky + Sun + Soft Limestone Bounce Lighting
    const hemiLight = new THREE.HemisphereLight(0xeef5fa, 0x5c5340, 0.72);
    scene.add(hemiLight);

    const sunKeyLight = new THREE.DirectionalLight(0xffdfb0, 1.82);
    sunKeyLight.position.set(5.6, 6.4, 4.2);
    sunKeyLight.castShadow = !isSoftwareGl;
    sunKeyLight.shadow.mapSize.set(1024, 1024);
    sunKeyLight.shadow.camera.left = -4.8;
    sunKeyLight.shadow.camera.right = 4.8;
    sunKeyLight.shadow.camera.top = 4.8;
    sunKeyLight.shadow.camera.bottom = -4.8;
    sunKeyLight.shadow.camera.near = 1;
    sunKeyLight.shadow.camera.far = 24;
    sunKeyLight.shadow.bias = -0.0005;
    sunKeyLight.shadow.normalBias = 0.02;
    scene.add(sunKeyLight);

    // Warm golden-hour rim light silhouetting shell fur along backs & ears
    const rimLight = new THREE.DirectionalLight(0xffebc8, 0.82);
    rimLight.position.set(-4.2, 3.2, -5.6);
    scene.add(rimLight);

    // Soft limestone terrace upward bounce fill
    const bounceFill = new THREE.DirectionalLight(0xf6ead5, 0.34);
    bounceFill.position.set(1.2, 0.6, 4.5);
    scene.add(bounceFill);

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const meadowBumpPack = createMeadowTextures(maxAnisotropy);
    const limestoneBumpPack = createLimestoneTextures(maxAnisotropy);

    const texLoader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];

    const panoTex = texLoader.load(panoramaUrl, () => {
      if (!disposed) renderer.render(scene, camera);
    });
    panoTex.colorSpace = THREE.SRGBColorSpace;
    panoTex.anisotropy = maxAnisotropy;
    loadedTextures.push(panoTex);

    const limestoneColorTex = texLoader.load(limestoneUrl, () => {
      if (!disposed) renderer.render(scene, camera);
    });
    limestoneColorTex.colorSpace = THREE.SRGBColorSpace;
    limestoneColorTex.wrapS = THREE.RepeatWrapping;
    limestoneColorTex.wrapT = THREE.RepeatWrapping;
    limestoneColorTex.repeat.set(3.2, 3.2);
    limestoneColorTex.anisotropy = maxAnisotropy;
    loadedTextures.push(limestoneColorTex);

    const meadowColorTex = texLoader.load(meadowUrl, () => {
      if (!disposed) renderer.render(scene, camera);
    });
    meadowColorTex.colorSpace = THREE.SRGBColorSpace;
    meadowColorTex.wrapS = THREE.RepeatWrapping;
    meadowColorTex.wrapT = THREE.RepeatWrapping;
    meadowColorTex.repeat.set(16, 16);
    meadowColorTex.anisotropy = maxAnisotropy;
    loadedTextures.push(meadowColorTex);

    // 1. Curved Estate Horizon Panorama Cyclorama (blending naturally into misty meadow ridge)
    const panoGeo = new THREE.CylinderGeometry(
      17.5,
      17.5,
      11.5,
      56,
      1,
      true,
      Math.PI * 0.42,
      Math.PI * 1.16,
    );
    const panoMat = new THREE.MeshBasicMaterial({
      map: panoTex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    const panoMesh = new THREE.Mesh(panoGeo, panoMat);
    panoMesh.position.set(0.8, 2.35, -1.6);
    scene.add(panoMesh);

    // 2. Gently Undulating Meadow Lawn Floor with Horizon Fog-Tint Blend
    const groundGeo = new THREE.PlaneGeometry(36, 36, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const gPos = groundGeo.attributes.position;
    const gColors = new Float32Array(gPos.count * 3);
    const cMeadowNear = new THREE.Color(0x98a879);
    const cMeadowFar = new THREE.Color(0xebe1cf);
    const cTemp = new THREE.Color();

    for (let i = 0; i < gPos.count; i++) {
      const gx = gPos.getX(i);
      const gz = gPos.getZ(i);
      const distFromTerrace = Math.max(0, Math.hypot(gx - 1.14, gz - 0.36) - 2.6);
      const rise =
        gz < -2.2
          ? Math.min(0.65, Math.pow(distFromTerrace * 0.08, 1.35))
          : 0;
      const ripple = Math.sin(gx * 0.45) * Math.cos(gz * 0.42) * 0.025 * Math.min(1, distFromTerrace * 0.4);
      gPos.setY(i, -0.044 + rise + ripple);

      const radialFade = Math.min(1, Math.max(0, (Math.hypot(gx - 0.8, gz - 0.2) - 5.2) / 9.2));
      cTemp.copy(cMeadowNear).lerp(cMeadowFar, Math.pow(radialFade, 1.35));
      gColors[i * 3 + 0] = cTemp.r;
      gColors[i * 3 + 1] = cTemp.g;
      gColors[i * 3 + 2] = cTemp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(gColors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      map: meadowColorTex,
      bumpMap: meadowBumpPack.bumpMap,
      bumpScale: 0.045,
      roughness: 0.94,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // 3. Weathered Travertine Courtyard Terrace + Beveled Limestone Curb Step
    const stoneSlabGeo = new THREE.CylinderGeometry(2.25, 2.38, 0.055, 56);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xf4eee3,
      map: limestoneColorTex,
      bumpMap: limestoneBumpPack.bumpMap,
      bumpScale: 0.022,
      roughness: 0.88,
      metalness: 0.0,
    });
    const terrace = new THREE.Mesh(stoneSlabGeo, stoneMat);
    terrace.position.set(1.14, -0.024, 0.36);
    terrace.receiveShadow = true;
    scene.add(terrace);

    const curbGeo = new THREE.TorusGeometry(2.30, 0.042, 10, 56);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xd9cfbe,
      map: limestoneColorTex,
      bumpMap: limestoneBumpPack.bumpMap,
      bumpScale: 0.025,
      roughness: 0.92,
    });
    const terraceCurb = new THREE.Mesh(curbGeo, curbMat);
    terraceCurb.rotation.x = Math.PI / 2;
    terraceCurb.scale.set(1, 1, 0.55);
    terraceCurb.position.set(1.14, -0.015, 0.36);
    terraceCurb.receiveShadow = true;
    scene.add(terraceCurb);

    // 4. Delicate Meadow Grass Tufts + Soft Botanical Reed Clusters Along Terrace Border
    const bladeGeo = createGrassTuftGeometry(8, 1.0);
    const reedGeo = createGrassTuftGeometry(10, 2.15);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const grassCount = 320;
    const grassMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, grassCount);
    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();
    let seed = 9182;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < grassCount; i++) {
      let x = 0;
      let z = 0;
      let s = 1;
      if (i < 130) {
        const angle = rand() * Math.PI * 2;
        const radius = 2.27 + rand() * 0.45;
        x = 1.14 + Math.cos(angle) * radius;
        z = 0.36 + Math.sin(angle) * radius;
        s = 0.92 + rand() * 0.72;
      } else {
        const angle = rand() * Math.PI * 2;
        const radius = 2.75 + rand() * 7.2;
        x = 1.14 + Math.cos(angle) * radius;
        z = 0.36 + Math.sin(angle) * radius;
        s = 0.85 + rand() * 1.15;
      }
      dummy.position.set(x, -0.025, z);
      dummy.rotation.set(
        (rand() - 0.5) * 0.14,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 0.14,
      );
      dummy.scale.set(s, s * (0.85 + rand() * 0.5), s);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(i, dummy.matrix);

      const paletteChoice = rand();
      if (paletteChoice > 0.72) {
        tintColor.setHex(0x8e9d6c);
      } else if (paletteChoice > 0.35) {
        tintColor.setHex(0x5b7047);
      } else {
        tintColor.setHex(0x748554);
      }
      grassMesh.setColorAt(i, tintColor);
    }
    grassMesh.instanceMatrix.needsUpdate = true;
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    grassMesh.computeBoundingSphere();
    scene.add(grassMesh);

    const reedCount = 96;
    const reedMesh = new THREE.InstancedMesh(reedGeo, bladeMat, reedCount);
    const reedAnchors: [number, number][] = [
      [-1.38, -1.75],
      [-0.85, -2.18],
      [0.25, -2.42],
      [1.95, -2.35],
      [2.85, -1.85],
      [3.42, -1.15],
      [3.52, -0.25],
      [-1.55, -0.85],
    ];
    for (let i = 0; i < reedCount; i++) {
      const anchor = reedAnchors[i % reedAnchors.length];
      const rx = anchor[0] + (rand() - 0.5) * 1.15;
      const rz = anchor[1] + (rand() - 0.5) * 0.95;
      const rs = 0.85 + rand() * 0.65;
      dummy.position.set(rx, -0.025, rz);
      dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
      dummy.scale.set(rs, rs * (0.82 + rand() * 0.45), rs);
      dummy.updateMatrix();
      reedMesh.setMatrixAt(i, dummy.matrix);

      const rPick = rand();
      if (rPick > 0.65) {
        tintColor.setHex(0x8b9b6b);
      } else if (rPick > 0.30) {
        tintColor.setHex(0x5d7249);
      } else {
        tintColor.setHex(0x728456);
      }
      reedMesh.setColorAt(i, tintColor);
    }
    reedMesh.instanceMatrix.needsUpdate = true;
    if (reedMesh.instanceColor) reedMesh.instanceColor.needsUpdate = true;
    reedMesh.computeBoundingSphere();
    scene.add(reedMesh);

    // Subtle Meadow Wildflowers & Lavender Specks
    const blossomGeo = new THREE.SphereGeometry(0.015, 6, 5);
    const blossomMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
    });
    const blossomCount = 130;
    const blossomMesh = new THREE.InstancedMesh(blossomGeo, blossomMat, blossomCount);
    for (let i = 0; i < blossomCount; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 2.34 + rand() * 4.8;
      const bx = 1.14 + Math.cos(angle) * radius;
      const bz = 0.36 + Math.sin(angle) * radius;
      dummy.position.set(bx, 0.065 + rand() * 0.14, bz);
      dummy.rotation.set(0, rand() * Math.PI, 0);
      const bs = 0.75 + rand() * 0.8;
      dummy.scale.set(bs, bs * 0.85, bs);
      dummy.updateMatrix();
      blossomMesh.setMatrixAt(i, dummy.matrix);

      const fPick = rand();
      if (fPick > 0.66) {
        tintColor.setHex(0xf5eedb);
      } else if (fPick > 0.33) {
        tintColor.setHex(0xa89bc2);
      } else {
        tintColor.setHex(0xe4c786);
      }
      blossomMesh.setColorAt(i, tintColor);
    }
    blossomMesh.instanceMatrix.needsUpdate = true;
    if (blossomMesh.instanceColor) blossomMesh.instanceColor.needsUpdate = true;
    scene.add(blossomMesh);

    // 6. Sunlit Floating Golden-Hour Dust / Pollen Motes
    const moteCount = 68;
    const motePos = new Float32Array(moteCount * 3);
    const moteSeed = new Float32Array(moteCount);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3 + 0] = -1.2 + rand() * 4.8;
      motePos[i * 3 + 1] = 0.25 + rand() * 2.1;
      motePos[i * 3 + 2] = -2.2 + rand() * 4.2;
      moteSeed[i] = rand() * Math.PI * 2;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteTex = createPollenMoteTexture();
    const moteMat = new THREE.PointsMaterial({
      size: 0.042,
      map: moteTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const motePoints = new THREE.Points(moteGeo, moteMat);
    scene.add(motePoints);

    // 7. Soft Radial Contact Shadow Discs Beneath Both Animals on Courtyard Travertine
    const contactShadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const dogShadowGeo = new THREE.CircleGeometry(0.50, 28);
    const dogContactShadow = new THREE.Mesh(dogShadowGeo, contactShadowMat);
    dogContactShadow.rotation.x = -Math.PI / 2;
    dogContactShadow.position.set(
      HERO_ANIMAL_MODEL_SLOTS.dog.position[0],
      0.010,
      HERO_ANIMAL_MODEL_SLOTS.dog.position[2] - 0.04,
    );
    scene.add(dogContactShadow);

    const catShadowGeo = new THREE.CircleGeometry(0.28, 24);
    const catContactShadow = new THREE.Mesh(catShadowGeo, contactShadowMat);
    catContactShadow.rotation.x = -Math.PI / 2;
    catContactShadow.position.set(
      HERO_ANIMAL_MODEL_SLOTS.cat.position[0],
      0.010,
      HERO_ANIMAL_MODEL_SLOTS.cat.position[2] - 0.02,
    );
    scene.add(catContactShadow);

    let dogRig: AnimatedAnimalRig | null = null;
    let catRig: AnimatedAnimalRig | null = null;
    let disposed = false;

    const hasExternalGlb = Boolean(
      HERO_ANIMAL_MODEL_SLOTS.dog.modelUrl || HERO_ANIMAL_MODEL_SLOTS.cat.modelUrl,
    );

    if (!hasExternalGlb) {
      const { dog, cat } = buildProceduralHeroAnimals(maxAnisotropy);
      dogRig = dog;
      catRig = cat;
      scene.add(dog.root);
      scene.add(cat.root);
      if (!isSoftwareGl) renderer.compile(scene, camera);
      renderer.render(scene, camera);
    } else {
      renderer.render(scene, camera);
      loadHeroAnimals(maxAnisotropy).then(({ dog, cat }) => {
        if (disposed) {
          dog.dispose();
          cat.dispose();
          return;
        }
        dogRig = dog;
        catRig = cat;
        scene.add(dog.root);
        scene.add(cat.root);
        if (!isSoftwareGl) renderer.compile(scene, camera);
        renderer.render(scene, camera);
      });
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerNormRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNormRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let timerId = 0;
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        timerId = window.setTimeout(() => {
          if (!disposed) frameId = requestAnimationFrame(cb);
        }, 16);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 4);
        } else {
          gl.deleteSync(sync);
          timerId = window.setTimeout(() => {
            if (!disposed) frameId = requestAnimationFrame(cb);
          }, 16);
        }
      };
      timerId = window.setTimeout(poll, 4);
    }

    let lastTime = performance.now();
    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = now * 0.001;

      dogRig?.mixer.update(dt);
      catRig?.mixer.update(dt);

      const px = pointerNormRef.current.x;
      const py = pointerNormRef.current.y;
      const sceneState = computeScrollSceneState(scrollProgressRef.current);

      const posAttr = moteGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        const phase = moteSeed[i];
        const baseY = posAttr.getY(i);
        let nextY = baseY + dt * 0.045;
        if (nextY > 2.35) nextY = 0.25;
        posAttr.setY(i, nextY);
        posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsed * 0.6 + phase) * dt * 0.025);
      }
      posAttr.needsUpdate = true;

      if (dogRig?.headPivot) {
        const sceneLookBias = sceneState.sceneIndex === 3 ? 0.16 : 0.05;
        const targetHeadY = px * 0.14 + Math.sin(elapsed * 0.42) * 0.04 + sceneLookBias;
        const targetHeadX = -py * 0.08 + Math.cos(elapsed * 0.35) * 0.025;
        const damp = 1 - Math.exp(-3.4 * dt);
        dogRig.headPivot.rotation.y = THREE.MathUtils.lerp(
          dogRig.headPivot.rotation.y,
          targetHeadY,
          damp,
        );
        dogRig.headPivot.rotation.x = THREE.MathUtils.lerp(
          dogRig.headPivot.rotation.x,
          targetHeadX,
          damp,
        );
      }

      if (catRig?.headPivot) {
        const catBias = sceneState.sceneIndex === 4 ? 0.22 : 0.06;
        const targetCatY = px * 0.16 + Math.sin(elapsed * 0.55 + 1.2) * 0.05 + catBias;
        const targetCatX = -py * 0.09 + Math.sin(elapsed * 0.31) * 0.02;
        const damp = 1 - Math.exp(-3.8 * dt);
        catRig.headPivot.rotation.y = THREE.MathUtils.lerp(
          catRig.headPivot.rotation.y,
          targetCatY,
          damp,
        );
        catRig.headPivot.rotation.x = THREE.MathUtils.lerp(
          catRig.headPivot.rotation.x,
          targetCatX,
          damp,
        );
      }

      _targetCamPos.set(...sceneState.cameraPosition);
      _targetLookAt.set(...sceneState.lookAtTarget);

      _targetCamPos.x += Math.sin(elapsed * 0.45) * 0.015;
      _targetCamPos.y += Math.cos(elapsed * 0.38) * 0.008;

      const camDamp = 1 - Math.exp(-6.2 * dt);
      camera.position.lerp(_targetCamPos, camDamp);
      currentLookAt.lerp(_targetLookAt, camDamp);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      dogRig?.dispose();
      catRig?.dispose();
      loadedTextures.forEach((t) => t.dispose());
      meadowBumpPack.map.dispose();
      meadowBumpPack.bumpMap.dispose();
      limestoneBumpPack.map.dispose();
      limestoneBumpPack.bumpMap.dispose();
      panoGeo.dispose();
      panoMat.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      stoneSlabGeo.dispose();
      stoneMat.dispose();
      curbGeo.dispose();
      curbMat.dispose();
      bladeGeo.dispose();
      reedGeo.dispose();
      bladeMat.dispose();
      blossomGeo.dispose();
      blossomMat.dispose();
      moteGeo.dispose();
      moteTex.dispose();
      moteMat.dispose();
      contactShadowTex.dispose();
      contactShadowMat.dispose();
      dogShadowGeo.dispose();
      catShadowGeo.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  const showStaticFallback = webglUnavailable || reducedMotion;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#EDE6DA]">
      {!showStaticFallback ? (
        <div
          ref={mountRef}
          data-testid="hero-3d-canvas"
          className="absolute inset-0 w-full h-full"
          aria-label="Interactive 3D sanctuary environment featuring a Golden Retriever and Domestic Cat"
        />
      ) : (
        <img
          src={GENERATED_IMAGES.heroFallback}
          alt="Golden Retriever and Domestic Tabby Cat resting peacefully in the Aurelia sunlit meadow sanctuary"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Responsive scrim that cleanly dissolves during Scene II-IV close-ups so animals & landscape stay vivid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden transition-opacity duration-300"
        style={{
          opacity: activeScene.heroContentOpacity,
          background:
            'linear-gradient(180deg, rgba(247,244,238,0.88) 0%, rgba(247,244,238,0.74) 56%, rgba(247,244,238,0.16) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: activeScene.heroContentOpacity,
          background:
            'linear-gradient(90deg, rgba(247,244,238,0.86) 0%, rgba(247,244,238,0.58) 34%, rgba(247,244,238,0.08) 56%, rgba(247,244,238,0) 76%)',
        }}
      />

      {/* Scene V Mission Statement Cinematic Floating Editorial Veil */}
      <div
        aria-hidden={activeScene.missionOverlayOpacity < 0.05}
        style={{
          opacity: activeScene.missionOverlayOpacity,
          background:
            'radial-gradient(ellipse at center, rgba(247,244,238,0.82) 0%, rgba(247,244,238,0.52) 48%, rgba(247,244,238,0.0) 82%)',
        }}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 transition-opacity duration-500"
      >
        <div className="max-w-3xl text-center px-6 py-10">
          <p className="text-xs tracking-[0.26em] uppercase text-[#183D32] font-semibold mb-4">
            Scene V · The Aurelia Mandate
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-[#242824] leading-[1.12] font-medium">
            “No guardian should ever sign away a heartbeat over an emergency deposit.”
          </h2>
          <p className="mt-5 text-sm md:text-base text-[#242824]/80 max-w-xl mx-auto">
            Scroll onward to witness active medical rescues, hospital partnerships, and transparent direct funding.
          </p>
        </div>
      </div>
    </div>
  );
}
