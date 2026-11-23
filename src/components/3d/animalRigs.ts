import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  DRACO_DECODER_PATH,
  HERO_ANIMAL_MODEL_SLOTS,
  type AnimalModelSlotConfig,
} from '../../config/models';
import {
  createContactShadowTexture,
  createEyeTexture,
  createFurTextures,
} from './proceduralTextures';

export interface AnimatedAnimalRig {
  id: 'dog' | 'cat';
  sourceType: 'glb' | 'procedural-articulated';
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  headPivot: THREE.Object3D | null;
  neckPivot: THREE.Object3D | null;
  eyeLeftPivot: THREE.Object3D | null;
  eyeRightPivot: THREE.Object3D | null;
  earLeftPivot: THREE.Object3D | null;
  earRightPivot: THREE.Object3D | null;
  chestPivot: THREE.Object3D | null;
  tailPivot: THREE.Object3D | null;
  dispose: () => void;
}

function makeTubeLimb(
  points: [number, number, number][],
  radiusStart: number,
  radiusEnd: number,
  radialSegs = 12,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const tubularSegs = 20;
  const geom = new THREE.TubeGeometry(curve, tubularSegs, 1, radialSegs, false);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const r = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);
    curve.getPointAt(t, c);
    for (let j = 0; j <= radialSegs; j++) {
      const idx = i * (radialSegs + 1) + j;
      v.fromBufferAttribute(pos, idx);
      v.sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function createLatheProfile(
  profile: [number, number][],
  segments = 28,
): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geom = new THREE.LatheGeometry(pts, segments);
  geom.computeVertexNormals();
  return geom;
}

function enableShadowRecursive(obj: THREE.Object3D, cast: boolean, receive: boolean) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function createEyeballAssembly(
  eyeTex: THREE.CanvasTexture,
  eyelidMat: THREE.Material,
  radius: number,
  disposeList: { dispose: () => void }[],
): {
  pivot: THREE.Group;
  upperLid: THREE.Mesh;
} {
  const pivot = new THREE.Group();
  const eyeGeo = new THREE.SphereGeometry(radius, 24, 24);
  const eyeMat = new THREE.MeshPhysicalMaterial({
    map: eyeTex,
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    ior: 1.44,
  });
  const eyeball = new THREE.Mesh(eyeGeo, eyeMat);
  eyeball.rotation.y = -Math.PI * 0.5;
  pivot.add(eyeball);

  // Upper eyelid dome that rotates down smoothly during blink
  const lidGeo = new THREE.SphereGeometry(
    radius * 1.06,
    18,
    14,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.52,
  );
  const upperLid = new THREE.Mesh(lidGeo, eyelidMat);
  upperLid.rotation.x = -1.25; // retracted behind brow when eye is open
  upperLid.name = 'UpperEyelid';
  pivot.add(upperLid);

  disposeList.push(eyeGeo, eyeMat, lidGeo);
  return { pivot, upperLid };
}

export function buildGoldenRetrieverRig(
  maxAnisotropy: number,
  slot: AnimalModelSlotConfig,
): AnimatedAnimalRig {
  const disposeList: { dispose: () => void }[] = [];
  const root = new THREE.Group();
  root.name = 'GoldenRetrieverRoot';
  root.position.set(...slot.position);
  root.rotation.y = slot.rotationY;
  root.scale.setScalar(slot.scale);

  const { map: furMap, bumpMap: furBump } = createFurTextures('retriever', maxAnisotropy);
  const eyeTex = createEyeTexture('canine', maxAnisotropy);
  const shadowTex = createContactShadowTexture();
  disposeList.push(furMap, furBump, eyeTex, shadowTex);

  const primaryCoatMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: furMap,
    bumpMap: furBump,
    bumpScale: 0.016,
    roughness: 0.84,
    metalness: 0.0,
    sheen: 0.65,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(0xdfb97e),
  });

  const featheredCreamMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfa569,
    bumpMap: furBump,
    bumpScale: 0.014,
    roughness: 0.88,
    metalness: 0.0,
    sheen: 0.65,
    sheenColor: new THREE.Color(0xe6c792),
  });

  const noseMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e1916,
    roughness: 0.24,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
  });

  const collarLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x183d32,
    roughness: 0.45,
    metalness: 0.1,
  });

  const brassTagMat = new THREE.MeshStandardMaterial({
    color: 0xb99a64,
    roughness: 0.22,
    metalness: 0.88,
  });

  disposeList.push(primaryCoatMat, featheredCreamMat, noseMat, collarLeatherMat, brassTagMat);

  // Ground contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.62, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.015, -0.05);
  root.add(contactShadow);
  disposeList.push(shadowGeo, shadowMat);

  // Pelvis / Seated Hindquarters anchored cleanly on ground y = 0
  const pelvisGeo = createLatheProfile([
    [0.0, 0.0],
    [0.24, 0.02],
    [0.27, 0.16],
    [0.23, 0.34],
    [0.16, 0.46],
    [0.0, 0.48],
  ]);
  const pelvis = new THREE.Mesh(pelvisGeo, primaryCoatMat);
  pelvis.scale.set(0.92, 1.0, 1.18);
  pelvis.position.set(0, 0.0, -0.18);
  root.add(pelvis);
  disposeList.push(pelvisGeo);

  // Chest / Ribcage breathing pivot
  const chestPivot = new THREE.Group();
  chestPivot.name = 'Dog_Chest';
  chestPivot.position.set(0, 0.32, 0.05);
  chestPivot.rotation.x = 0.36;
  root.add(chestPivot);

  const torsoGeo = createLatheProfile([
    [0.0, -0.12],
    [0.19, -0.04],
    [0.24, 0.16],
    [0.22, 0.34],
    [0.15, 0.46],
    [0.0, 0.49],
  ]);
  const torso = new THREE.Mesh(torsoGeo, primaryCoatMat);
  torso.scale.set(0.88, 1.0, 1.04);
  chestPivot.add(torso);
  disposeList.push(torsoGeo);

  // Feathered chest ruff integrated softly into chest
  const ruffGeo = createLatheProfile([
    [0.0, 0.0],
    [0.145, 0.08],
    [0.165, 0.2],
    [0.11, 0.34],
    [0.0, 0.37],
  ]);
  const chestRuff = new THREE.Mesh(ruffGeo, featheredCreamMat);
  chestRuff.scale.set(0.76, 0.88, 0.56);
  chestRuff.position.set(0, 0.14, 0.095);
  chestPivot.add(chestRuff);
  disposeList.push(ruffGeo);

  // Front legs + paws grounded at y = 0
  [-1, 1].forEach((side) => {
    const legGeo = makeTubeLimb(
      [
        [side * 0.14, 0.56, 0.16],
        [side * 0.13, 0.32, 0.24],
        [side * 0.12, 0.11, 0.29],
        [side * 0.12, 0.032, 0.33],
      ],
      0.068,
      0.044,
    );
    const leg = new THREE.Mesh(legGeo, primaryCoatMat);
    root.add(leg);

    const pawGeo = new THREE.SphereGeometry(0.056, 16, 12);
    const paw = new THREE.Mesh(pawGeo, featheredCreamMat);
    paw.scale.set(0.95, 0.56, 1.35);
    paw.position.set(side * 0.12, 0.03, 0.37);
    root.add(paw);

    // Seated hind leg & paw grounded at y = 0
    const hindGeo = makeTubeLimb(
      [
        [side * 0.18, 0.26, -0.18],
        [side * 0.22, 0.14, 0.0],
        [side * 0.2, 0.035, 0.14],
      ],
      0.095,
      0.048,
    );
    const hindLeg = new THREE.Mesh(hindGeo, primaryCoatMat);
    root.add(hindLeg);

    const hindPaw = new THREE.Mesh(pawGeo, featheredCreamMat);
    hindPaw.scale.set(0.92, 0.52, 1.42);
    hindPaw.position.set(side * 0.2, 0.028, 0.19);
    root.add(hindPaw);

    disposeList.push(legGeo, pawGeo, hindGeo);
  });

  // Neck + Head hierarchy
  const neckPivot = new THREE.Group();
  neckPivot.name = slot.boneMap.neck;
  neckPivot.position.set(0, 0.43, 0.04);
  neckPivot.rotation.x = -0.34;
  chestPivot.add(neckPivot);

  const neckGeo = makeTubeLimb(
    [
      [0, -0.02, 0],
      [0, 0.09, 0.03],
      [0, 0.18, 0.05],
    ],
    0.135,
    0.105,
  );
  const neckMesh = new THREE.Mesh(neckGeo, primaryCoatMat);
  neckPivot.add(neckMesh);
  disposeList.push(neckGeo);

  // Leather sanctuary collar + brass tag seated cleanly around neck base
  const collarGeo = new THREE.TorusGeometry(0.122, 0.017, 12, 32);
  const collar = new THREE.Mesh(collarGeo, collarLeatherMat);
  collar.rotation.x = Math.PI * 0.48;
  collar.position.set(0, 0.05, 0.022);
  neckPivot.add(collar);
  const tagGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.006, 20);
  const tag = new THREE.Mesh(tagGeo, brassTagMat);
  tag.rotation.x = Math.PI * 0.42;
  tag.position.set(0, 0.01, 0.142);
  neckPivot.add(tag);
  disposeList.push(collarGeo, tagGeo);

  const headPivot = new THREE.Group();
  headPivot.name = slot.boneMap.head;
  headPivot.position.set(0, 0.19, 0.06);
  neckPivot.add(headPivot);

  // Cranium
  const skullGeo = new THREE.SphereGeometry(0.145, 24, 20);
  const skull = new THREE.Mesh(skullGeo, primaryCoatMat);
  skull.scale.set(0.95, 0.92, 1.08);
  skull.position.set(0, 0.04, 0.02);
  headPivot.add(skull);
  disposeList.push(skullGeo);

  // Tapered muzzle bridge + soft jaw (wide base inside skull tapering forward to nose)
  const muzzleGeo = createLatheProfile([
    [0.0, 0.0],
    [0.088, 0.02],
    [0.072, 0.08],
    [0.056, 0.14],
    [0.0, 0.175],
  ]);
  const muzzle = new THREE.Mesh(muzzleGeo, featheredCreamMat);
  muzzle.rotation.x = Math.PI * 0.52;
  muzzle.scale.set(0.92, 1.0, 0.78);
  muzzle.position.set(0, 0.022, 0.095);
  headPivot.add(muzzle);

  const jawGeo = new THREE.SphereGeometry(0.052, 16, 12);
  const jaw = new THREE.Mesh(jawGeo, featheredCreamMat);
  jaw.scale.set(0.9, 0.48, 1.42);
  jaw.position.set(0, -0.026, 0.165);
  headPivot.add(jaw);

  // Wet sculpted canine nose
  const noseGeo = new THREE.SphereGeometry(0.028, 16, 12);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.scale.set(1.22, 0.85, 0.85);
  nose.position.set(0, 0.016, 0.268);
  headPivot.add(nose);
  disposeList.push(muzzleGeo, jawGeo, noseGeo);

  // Realistic clearcoated eyes with blinking upper eyelids
  const eyeLeft = createEyeballAssembly(eyeTex, primaryCoatMat, 0.0205, disposeList);
  eyeLeft.pivot.position.set(0.062, 0.058, 0.128);
  eyeLeft.pivot.rotation.y = 0.22;
  headPivot.add(eyeLeft.pivot);

  const eyeRight = createEyeballAssembly(eyeTex, primaryCoatMat, 0.0205, disposeList);
  eyeRight.pivot.position.set(-0.062, 0.058, 0.128);
  eyeRight.pivot.rotation.y = -0.22;
  headPivot.add(eyeRight.pivot);

  // Feathered drooping Golden Retriever ears
  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0);
  earShape.quadraticCurveTo(0.075, -0.02, 0.07, -0.14);
  earShape.quadraticCurveTo(0.035, -0.22, -0.01, -0.19);
  earShape.quadraticCurveTo(-0.055, -0.11, -0.03, 0.0);
  earShape.closePath();
  const earGeo = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  disposeList.push(earGeo);

  const earLeftPivot = new THREE.Group();
  earLeftPivot.name = slot.boneMap.earLeft;
  earLeftPivot.position.set(0.115, 0.095, 0.01);
  earLeftPivot.rotation.set(0.14, 0.18, -0.22);
  const earL = new THREE.Mesh(earGeo, primaryCoatMat);
  earLeftPivot.add(earL);
  headPivot.add(earLeftPivot);

  const earRightPivot = new THREE.Group();
  earRightPivot.name = slot.boneMap.earRight;
  earRightPivot.position.set(-0.115, 0.095, 0.01);
  earRightPivot.rotation.set(0.14, -0.18, 0.22);
  const earR = new THREE.Mesh(earGeo, primaryCoatMat);
  earR.scale.x = -1;
  earRightPivot.add(earR);
  headPivot.add(earRightPivot);

  // Feathered curved tail
  const tailPivot = new THREE.Group();
  tailPivot.name = slot.boneMap.tailBase;
  tailPivot.position.set(0, 0.14, -0.4);
  root.add(tailPivot);

  const tailGeo = makeTubeLimb(
    [
      [0, 0, 0],
      [0.05, 0.04, -0.18],
      [0.16, 0.14, -0.32],
      [0.24, 0.28, -0.38],
    ],
    0.056,
    0.022,
  );
  const tailMesh = new THREE.Mesh(tailGeo, featheredCreamMat);
  tailPivot.add(tailMesh);
  disposeList.push(tailGeo);

  enableShadowRecursive(root, true, true);
  contactShadow.castShadow = false;

  // AnimationMixer with organic breathing, blinking, ear twitch, and tail sway clips
  const mixer = new THREE.AnimationMixer(root);

  const breathClip = new THREE.AnimationClip('Dog_Breathing', 4.6, [
    new THREE.VectorKeyframeTrack(
      'Dog_Chest.scale',
      [0, 2.2, 4.6],
      [1, 1, 1, 1.028, 1.012, 1.035, 1, 1, 1],
    ),
  ]);

  const blinkClip = new THREE.AnimationClip('Dog_Blink', 6.4, [
    new THREE.NumberKeyframeTrack(
      '.children[0].rotation[x]', // placeholder overridden below via direct lid targeting
      [0, 6.4],
      [0, 0],
    ),
  ]);
  void blinkClip;

  // Target eyelid objects directly by unique names
  eyeLeft.upperLid.name = 'Dog_Lid_L';
  eyeRight.upperLid.name = 'Dog_Lid_R';

  const naturalBlinkClip = new THREE.AnimationClip('Dog_Natural_Blink', 6.2, [
    new THREE.NumberKeyframeTrack(
      'Dog_Lid_L.rotation[x]',
      [0, 2.7, 2.82, 2.96, 5.4, 5.51, 5.64, 6.2],
      [-1.25, -1.25, 1.02, -1.25, -1.25, 1.02, -1.25, -1.25],
    ),
    new THREE.NumberKeyframeTrack(
      'Dog_Lid_R.rotation[x]',
      [0, 2.7, 2.82, 2.96, 5.4, 5.51, 5.64, 6.2],
      [-1.25, -1.25, 1.02, -1.25, -1.25, 1.02, -1.25, -1.25],
    ),
  ]);

  const earTailClip = new THREE.AnimationClip('Dog_Ear_Tail_Poise', 7.5, [
    new THREE.NumberKeyframeTrack(
      `${slot.boneMap.earLeft}.rotation[z]`,
      [0, 2.4, 3.1, 5.8, 7.5],
      [-0.22, -0.22, -0.13, -0.23, -0.22],
    ),
    new THREE.NumberKeyframeTrack(
      `${slot.boneMap.earRight}.rotation[z]`,
      [0, 4.0, 4.7, 6.5, 7.5],
      [0.22, 0.22, 0.14, 0.22, 0.22],
    ),
    new THREE.NumberKeyframeTrack(
      `${slot.boneMap.tailBase}.rotation[y]`,
      [0, 1.8, 3.7, 5.6, 7.5],
      [0, 0.14, -0.1, 0.12, 0],
    ),
  ]);

  mixer.clipAction(breathClip).play();
  mixer.clipAction(naturalBlinkClip).play();
  mixer.clipAction(earTailClip).play();

  return {
    id: 'dog',
    sourceType: 'procedural-articulated',
    root,
    mixer,
    headPivot,
    neckPivot,
    eyeLeftPivot: eyeLeft.pivot,
    eyeRightPivot: eyeRight.pivot,
    earLeftPivot,
    earRightPivot,
    chestPivot,
    tailPivot,
    dispose: () => {
      mixer.stopAllAction();
      disposeList.forEach((d) => d.dispose());
    },
  };
}

export function buildDomesticCatRig(
  maxAnisotropy: number,
  slot: AnimalModelSlotConfig,
): AnimatedAnimalRig {
  const disposeList: { dispose: () => void }[] = [];
  const root = new THREE.Group();
  root.name = 'DomesticCatRoot';
  root.position.set(...slot.position);
  root.rotation.y = slot.rotationY;
  root.scale.setScalar(slot.scale);

  const { map: furMap, bumpMap: furBump } = createFurTextures('tabby', maxAnisotropy);
  const eyeTex = createEyeTexture('feline', maxAnisotropy);
  const shadowTex = createContactShadowTexture();
  disposeList.push(furMap, furBump, eyeTex, shadowTex);

  const tabbyMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: furMap,
    bumpMap: furBump,
    bumpScale: 0.012,
    roughness: 0.82,
    metalness: 0.0,
    sheen: 0.55,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(0xcbc2b4),
  });

  const creamBibMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2b7a5,
    bumpMap: furBump,
    bumpScale: 0.008,
    roughness: 0.88,
    sheen: 0.5,
  });

  const pinkNoseMat = new THREE.MeshPhysicalMaterial({
    color: 0xb97c74,
    roughness: 0.35,
    clearcoat: 0.35,
  });

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xb48e87,
    roughness: 0.88,
  });

  disposeList.push(tabbyMat, creamBibMat, pinkNoseMat, innerEarMat);

  // Ground contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.36, 28);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.015, 0);
  root.add(contactShadow);
  disposeList.push(shadowGeo, shadowMat);

  // Seated haunches grounded at y = 0
  const haunchGeo = createLatheProfile([
    [0.0, 0.0],
    [0.14, 0.02],
    [0.16, 0.12],
    [0.13, 0.25],
    [0.0, 0.29],
  ]);
  const haunches = new THREE.Mesh(haunchGeo, tabbyMat);
  haunches.scale.set(0.92, 1.0, 1.15);
  haunches.position.set(0, 0, -0.07);
  root.add(haunches);
  disposeList.push(haunchGeo);

  // Lithe seated chest pivot
  const chestPivot = new THREE.Group();
  chestPivot.name = 'Cat_Chest';
  chestPivot.position.set(0, 0.17, 0.02);
  chestPivot.rotation.x = 0.24;
  root.add(chestPivot);

  const torsoGeo = createLatheProfile([
    [0.0, -0.06],
    [0.115, 0.0],
    [0.128, 0.12],
    [0.105, 0.24],
    [0.078, 0.31],
    [0.0, 0.33],
  ]);
  const torso = new THREE.Mesh(torsoGeo, tabbyMat);
  chestPivot.add(torso);
  disposeList.push(torsoGeo);

  // Subtle warm chest bib
  const bibGeo = new THREE.SphereGeometry(0.072, 16, 14);
  const bib = new THREE.Mesh(bibGeo, creamBibMat);
  bib.scale.set(0.68, 1.15, 0.38);
  bib.position.set(0, 0.18, 0.072);
  chestPivot.add(bib);
  disposeList.push(bibGeo);

  // Forelegs + dainty paws flush at y = 0
  [-1, 1].forEach((side) => {
    const legGeo = makeTubeLimb(
      [
        [side * 0.068, 0.36, 0.09],
        [side * 0.06, 0.19, 0.12],
        [side * 0.056, 0.02, 0.14],
      ],
      0.036,
      0.026,
    );
    const leg = new THREE.Mesh(legGeo, tabbyMat);
    root.add(leg);

    const pawGeo = new THREE.SphereGeometry(0.032, 14, 10);
    const paw = new THREE.Mesh(pawGeo, creamBibMat);
    paw.scale.set(0.92, 0.56, 1.32);
    paw.position.set(side * 0.056, 0.018, 0.16);
    root.add(paw);
    disposeList.push(legGeo, pawGeo);
  });

  // Neck + Feline Head hierarchy
  const neckPivot = new THREE.Group();
  neckPivot.name = slot.boneMap.neck;
  neckPivot.position.set(0, 0.3, 0.02);
  neckPivot.rotation.x = -0.22;
  chestPivot.add(neckPivot);

  const headPivot = new THREE.Group();
  headPivot.name = slot.boneMap.head;
  headPivot.position.set(0, 0.07, 0.02);
  neckPivot.add(headPivot);

  const skullGeo = new THREE.SphereGeometry(0.098, 24, 20);
  const skull = new THREE.Mesh(skullGeo, tabbyMat);
  skull.scale.set(1.04, 0.94, 0.98);
  headPivot.add(skull);
  disposeList.push(skullGeo);

  // Delicate feline muzzle & whisker pads
  const muzzleGeo = new THREE.SphereGeometry(0.036, 16, 12);
  const muzzle = new THREE.Mesh(muzzleGeo, creamBibMat);
  muzzle.scale.set(1.02, 0.68, 0.85);
  muzzle.position.set(0, -0.022, 0.084);
  headPivot.add(muzzle);

  const noseGeo = new THREE.ConeGeometry(0.012, 0.011, 3);
  const nose = new THREE.Mesh(noseGeo, pinkNoseMat);
  nose.rotation.x = Math.PI * 0.5;
  nose.rotation.z = Math.PI;
  nose.position.set(0, -0.008, 0.118);
  headPivot.add(nose);
  disposeList.push(muzzleGeo, noseGeo);

  // Expressive feline eyes + blinking lids
  const eyeLeft = createEyeballAssembly(eyeTex, tabbyMat, 0.0175, disposeList);
  eyeLeft.pivot.position.set(0.04, 0.016, 0.082);
  eyeLeft.pivot.rotation.y = 0.2;
  eyeLeft.upperLid.name = 'Cat_Lid_L';
  headPivot.add(eyeLeft.pivot);

  const eyeRight = createEyeballAssembly(eyeTex, tabbyMat, 0.0175, disposeList);
  eyeRight.pivot.position.set(-0.04, 0.016, 0.082);
  eyeRight.pivot.rotation.y = -0.2;
  eyeRight.upperLid.name = 'Cat_Lid_R';
  headPivot.add(eyeRight.pivot);

  // Triangular cat ears
  const earGeo = new THREE.ConeGeometry(0.036, 0.085, 4);
  const innerEarGeo = new THREE.ConeGeometry(0.022, 0.062, 4);
  disposeList.push(earGeo, innerEarGeo);

  const earLeftPivot = new THREE.Group();
  earLeftPivot.name = slot.boneMap.earLeft;
  earLeftPivot.position.set(0.064, 0.075, -0.005);
  earLeftPivot.rotation.set(0.12, 0.25, -0.28);
  const earL = new THREE.Mesh(earGeo, tabbyMat);
  earL.scale.set(1.0, 1.0, 0.55);
  earL.position.y = 0.035;
  const innerL = new THREE.Mesh(innerEarGeo, innerEarMat);
  innerL.scale.set(0.95, 0.95, 0.45);
  innerL.position.set(0, 0.032, 0.008);
  earLeftPivot.add(earL, innerL);
  headPivot.add(earLeftPivot);

  const earRightPivot = new THREE.Group();
  earRightPivot.name = slot.boneMap.earRight;
  earRightPivot.position.set(-0.064, 0.075, -0.005);
  earRightPivot.rotation.set(0.12, -0.25, 0.28);
  const earR = new THREE.Mesh(earGeo, tabbyMat);
  earR.scale.set(1.0, 1.0, 0.55);
  earR.position.y = 0.035;
  const innerR = new THREE.Mesh(innerEarGeo, innerEarMat);
  innerR.scale.set(0.95, 0.95, 0.45);
  innerR.position.set(0, 0.032, 0.008);
  earRightPivot.add(earR, innerR);
  headPivot.add(earRightPivot);

  // Graceful curled feline tail
  const tailPivot = new THREE.Group();
  tailPivot.name = slot.boneMap.tailBase;
  tailPivot.position.set(0, 0.04, -0.18);
  root.add(tailPivot);

  const tailGeo = makeTubeLimb(
    [
      [0, 0, 0],
      [-0.12, 0.015, -0.08],
      [-0.22, 0.03, 0.04],
      [-0.18, 0.05, 0.18],
    ],
    0.025,
    0.016,
  );
  const tailMesh = new THREE.Mesh(tailGeo, tabbyMat);
  tailPivot.add(tailMesh);
  disposeList.push(tailGeo);

  enableShadowRecursive(root, true, true);
  contactShadow.castShadow = false;

  const mixer = new THREE.AnimationMixer(root);

  const breathClip = new THREE.AnimationClip('Cat_Breathing', 3.8, [
    new THREE.VectorKeyframeTrack(
      'Cat_Chest.scale',
      [0, 1.8, 3.8],
      [1, 1, 1, 1.024, 1.01, 1.03, 1, 1, 1],
    ),
  ]);

  const blinkClip = new THREE.AnimationClip('Cat_Natural_Blink', 7.4, [
    new THREE.NumberKeyframeTrack(
      'Cat_Lid_L.rotation[x]',
      [0, 3.4, 3.55, 3.74, 7.4],
      [-1.25, -1.25, 1.02, -1.25, -1.25],
    ),
    new THREE.NumberKeyframeTrack(
      'Cat_Lid_R.rotation[x]',
      [0, 3.4, 3.55, 3.74, 7.4],
      [-1.25, -1.25, 1.02, -1.25, -1.25],
    ),
  ]);

  const earTailClip = new THREE.AnimationClip('Cat_Ear_Tail', 8.0, [
    new THREE.NumberKeyframeTrack(
      `${slot.boneMap.earLeft}.rotation[y]`,
      [0, 2.0, 2.4, 3.2, 8.0],
      [0.25, 0.25, 0.52, 0.25, 0.25],
    ),
    new THREE.NumberKeyframeTrack(
      `${slot.boneMap.tailBase}.rotation[y]`,
      [0, 2.5, 5.2, 8.0],
      [0, 0.1, -0.06, 0],
    ),
  ]);

  mixer.clipAction(breathClip).play();
  mixer.clipAction(blinkClip).play();
  mixer.clipAction(earTailClip).play();

  return {
    id: 'cat',
    sourceType: 'procedural-articulated',
    root,
    mixer,
    headPivot,
    neckPivot,
    eyeLeftPivot: eyeLeft.pivot,
    eyeRightPivot: eyeRight.pivot,
    earLeftPivot,
    earRightPivot,
    chestPivot,
    tailPivot,
    dispose: () => {
      mixer.stopAllAction();
      disposeList.forEach((d) => d.dispose());
    },
  };
}

function createFurStrandDataTexture(): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  // Pre-seed finer deterministic fur tuft centers in periodic [0,1)^2 UV space
  const cellCount = 38;
  const jitterX = new Float32Array(cellCount * cellCount);
  const jitterY = new Float32Array(cellCount * cellCount);
  const cellAmp = new Float32Array(cellCount * cellCount);
  let seed = 48271;
  const nextRand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < cellCount * cellCount; i++) {
    jitterX[i] = 0.14 + nextRand() * 0.72;
    jitterY[i] = 0.14 + nextRand() * 0.72;
    cellAmp[i] = 0.56 + nextRand() * 0.44;
  }

  for (let py = 0; py < size; py++) {
    const v = (py / size) * cellCount;
    const cy0 = Math.floor(v);
    for (let px = 0; px < size; px++) {
      const u = (px / size) * cellCount;
      const cx0 = Math.floor(u);

      let minDistSq = 9.0;
      let peakAmp = 0.7;

      for (let oy = -1; oy <= 1; oy++) {
        const cy = ((cy0 + oy) % cellCount + cellCount) % cellCount;
        for (let ox = -1; ox <= 1; ox++) {
          const cx = ((cx0 + ox) % cellCount + cellCount) % cellCount;
          const idx = cy * cellCount + cx;
          const fx = cx0 + ox + jitterX[idx];
          const fy = cy0 + oy + jitterY[idx];
          const dx = u - fx;
          // Elongated tapered hair clumps along vertical gravity axis
          const dy = (v - fy) * 0.54;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            peakAmp = cellAmp[idx];
          }
        }
      }

      const d = Math.sqrt(minDistSq);
      // Crisp wispy hair tip tapering: dense at base, fine wispy strand tips
      const follicle = Math.max(0, 1.0 - d * 1.92) * peakAmp;
      const fine = 0.80 + 0.20 * Math.sin(px * 0.89 + py * 0.37);
      const val = Math.max(0, Math.min(255, Math.round(follicle * fine * 255)));

      const outIdx = (py * size + px) * 4;
      data[outIdx] = val;
      data[outIdx + 1] = val;
      data[outIdx + 2] = val;
      data[outIdx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function getMeshFurSpec(
  species: 'dog' | 'cat',
  meshName: string,
): { maxLength: number; isHead: boolean; freq: number } | null {
  if (!meshName || meshName.includes('_Lid_')) return null;

  if (species === 'dog') {
    if (meshName === 'Dog_HeadMesh') {
      return { maxLength: 0.0085, isHead: true, freq: 88.0 };
    }
    if (meshName === 'Dog_EarLMesh' || meshName === 'Dog_EarRMesh' || meshName === 'Dog_TailMesh') {
      return { maxLength: 0.025, isHead: false, freq: 72.0 };
    }
    if (meshName === 'Dog_BodyMesh' || meshName === 'Dog_NeckMesh') {
      return { maxLength: 0.019, isHead: false, freq: 78.0 };
    }
    return { maxLength: 0.016, isHead: false, freq: 76.0 };
  }

  if (meshName === 'Cat_HeadMesh' || meshName === 'Cat_EarLMesh' || meshName === 'Cat_EarRMesh') {
    return { maxLength: 0.0062, isHead: meshName === 'Cat_HeadMesh', freq: 118.0 };
  }
  return { maxLength: 0.012, isHead: false, freq: 108.0 };
}

function attachShellFur(
  root: THREE.Object3D,
  species: 'dog' | 'cat',
  strandTex: THREE.DataTexture,
  shellMatsOut: THREE.Material[],
): void {
  const furMeshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!mat) return;
    if (mat.name === 'AnimalFurMaterial' && !obj.name.includes('_Lid_')) {
      furMeshes.push(obj);
    }
  });

  const shellCount = 8;
  for (const baseMesh of furMeshes) {
    const baseMat = (Array.isArray(baseMesh.material)
      ? baseMesh.material[0]
      : baseMesh.material) as THREE.MeshPhysicalMaterial;
    const spec = getMeshFurSpec(species, baseMesh.name);
    if (!spec) continue;

    for (let layerIdx = 1; layerIdx <= shellCount; layerIdx++) {
      const t = layerIdx / shellCount;
      const shellMat = baseMat.clone();
      shellMat.name = `${baseMesh.name}_FurShell_${layerIdx}`;
      shellMat.transparent = false;
      shellMat.depthWrite = true;
      shellMat.side = THREE.FrontSide;
      shellMat.roughness = Math.min(1, (shellMat.roughness ?? 0.85) + 0.05);
      shellMat.customProgramCacheKey = () =>
        `fur-shell-${species}-${baseMesh.name}-${layerIdx}`;

      shellMat.onBeforeCompile = (shader) => {
        shader.uniforms.uFurStrandMap = { value: strandTex };
        shader.vertexShader =
          `varying vec3 vFurLocalPos;\nvarying vec3 vFurLocalNorm;\n` +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vFurLocalPos = position;
            vFurLocalNorm = normalize(objectNormal);
            float furMaxLen = ${spec.maxLength.toFixed(5)};
            ${
              spec.isHead
                ? `furMaxLen *= mix(0.24, 1.0, smoothstep(0.19, 0.03, position.z));`
                : ''
            }
            float furFrac = ${t.toFixed(4)};
            vec3 furOffset = vFurLocalNorm * (furFrac * furMaxLen);
            furOffset.y -= (furFrac * furFrac) * furMaxLen * 0.46;
            transformed += furOffset;
            `,
          );

        shader.fragmentShader =
          `uniform sampler2D uFurStrandMap;\nvarying vec3 vFurLocalPos;\nvarying vec3 vFurLocalNorm;\n` +
          shader.fragmentShader.replace(
            '#include <alphatest_fragment>',
            `
            #include <alphatest_fragment>
            vec3 triW = abs(normalize(vFurLocalNorm));
            triW = triW * triW * triW;
            triW /= (triW.x + triW.y + triW.z + 1e-5);
            float freq = ${spec.freq.toFixed(2)};
            float hX = texture2D(uFurStrandMap, vFurLocalPos.yz * freq).r;
            float hY = texture2D(uFurStrandMap, vFurLocalPos.xz * freq).r;
            float hZ = texture2D(uFurStrandMap, vFurLocalPos.xy * freq).r;
            float strandH = hX * triW.x + hY * triW.y + hZ * triW.z;
            float layerCutoff = ${(Math.pow(t, 0.80) * 0.84 + 0.05).toFixed(4)};
            if (strandH < layerCutoff) discard;
            float rootTipShade = ${(0.64 + 0.52 * t).toFixed(4)};
            diffuseColor.rgb *= rootTipShade;
            `,
          );
      };

      const shellMesh = new THREE.Mesh(baseMesh.geometry, shellMat);
      shellMesh.name = `${baseMesh.name}_Shell_${layerIdx}`;
      shellMesh.castShadow = false;
      shellMesh.receiveShadow = true;
      shellMesh.renderOrder = layerIdx;
      baseMesh.add(shellMesh);
      shellMatsOut.push(shellMat);
    }
  }
}

async function loadExternalGlbAnimal(
  slot: AnimalModelSlotConfig,
  maxAnisotropy: number,
  sharedStrandTex: THREE.DataTexture,
): Promise<AnimatedAnimalRig | null> {
  if (!slot.modelUrl) return null;
  try {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(draco);

    const gltf = await loader.loadAsync(slot.modelUrl);
    const root = gltf.scene;
    root.position.set(...slot.position);
    root.rotation.y = slot.rotationY;
    root.scale.setScalar(slot.scale);
    enableShadowRecursive(root, true, true);

    const aniso = Math.min(4, Math.max(1, maxAnisotropy));
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (!mat) return;
          if ('map' in mat && mat.map) mat.map.anisotropy = aniso;
          if ('normalMap' in mat && mat.normalMap) mat.normalMap.anisotropy = aniso;
        });
      }
    });

    const shellMats: THREE.Material[] = [];
    attachShellFur(root, slot.id, sharedStrandTex, shellMats);

    // Ensure bottom-center flush at y = 0
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    root.position.y -= box.min.y;

    const mixer = new THREE.AnimationMixer(root);
    if (gltf.animations.length > 0) {
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    return {
      id: slot.id,
      sourceType: 'glb',
      root,
      mixer,
      headPivot: root.getObjectByName(slot.boneMap.head) ?? null,
      neckPivot: root.getObjectByName(slot.boneMap.neck) ?? null,
      eyeLeftPivot: null,
      eyeRightPivot: null,
      earLeftPivot: root.getObjectByName(slot.boneMap.earLeft) ?? null,
      earRightPivot: root.getObjectByName(slot.boneMap.earRight) ?? null,
      chestPivot: null,
      tailPivot: root.getObjectByName(slot.boneMap.tailBase) ?? null,
      dispose: () => {
        mixer.stopAllAction();
        draco.dispose();
        const disposedGeos = new Set<THREE.BufferGeometry>();
        const disposedMats = new Set<THREE.Material>();
        const disposedTextures = new Set<THREE.Texture>();
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            if (obj.geometry && !disposedGeos.has(obj.geometry)) {
              disposedGeos.add(obj.geometry);
              obj.geometry.dispose();
            }
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
              if (!mat || disposedMats.has(mat)) return;
              disposedMats.add(mat);
              for (const val of Object.values(mat)) {
                if (
                  val instanceof THREE.Texture &&
                  val !== sharedStrandTex &&
                  !disposedTextures.has(val)
                ) {
                  disposedTextures.add(val);
                  val.dispose();
                }
              }
              mat.dispose();
            });
          }
        });
        shellMats.forEach((m) => m.dispose());
      },
    };
  } catch {
    return null;
  }
}

export function buildProceduralHeroAnimals(maxAnisotropy: number): {
  dog: AnimatedAnimalRig;
  cat: AnimatedAnimalRig;
} {
  return {
    dog: buildGoldenRetrieverRig(maxAnisotropy, HERO_ANIMAL_MODEL_SLOTS.dog),
    cat: buildDomesticCatRig(maxAnisotropy, HERO_ANIMAL_MODEL_SLOTS.cat),
  };
}

export async function loadHeroAnimals(maxAnisotropy: number): Promise<{
  dog: AnimatedAnimalRig;
  cat: AnimatedAnimalRig;
}> {
  const sharedStrandTex = createFurStrandDataTexture();
  const [extDog, extCat] = await Promise.all([
    loadExternalGlbAnimal(HERO_ANIMAL_MODEL_SLOTS.dog, maxAnisotropy, sharedStrandTex),
    loadExternalGlbAnimal(HERO_ANIMAL_MODEL_SLOTS.cat, maxAnisotropy, sharedStrandTex),
  ]);

  const rawDog =
    extDog ?? buildGoldenRetrieverRig(maxAnisotropy, HERO_ANIMAL_MODEL_SLOTS.dog);
  const rawCat =
    extCat ?? buildDomesticCatRig(maxAnisotropy, HERO_ANIMAL_MODEL_SLOTS.cat);

  let disposedCount = 0;
  const wrapDispose = (rig: AnimatedAnimalRig): AnimatedAnimalRig => {
    const origDispose = rig.dispose;
    return {
      ...rig,
      dispose: () => {
        origDispose();
        disposedCount += 1;
        if (disposedCount >= 2) {
          sharedStrandTex.dispose();
        }
      },
    };
  };

  return { dog: wrapDispose(rawDog), cat: wrapDispose(rawCat) };
}
