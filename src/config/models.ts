/**
 * Replaceable GLB / GLTF Hero Animal Asset Registry
 * -------------------------------------------------
 * To upgrade the hero subjects from the built-in articulated procedural
 * anatomical sculptures to external licensed GLB/GLTF models:
 *
 * 1. Place your Draco-compressed `.glb` assets in `/public/models/`
 *    (e.g., `/public/models/golden_retriever.glb` and `/public/models/domestic_cat.glb`).
 * 2. Set `dogModelUrl` and `catModelUrl` below to those paths.
 * 3. Map the skeleton bone / morph-target names in `boneMap` and `clipMap`
 *    if your rig uses custom naming.
 *
 * While `null`, the Three.js loader gracefully uses the zero-404 multi-part
 * articulated procedural sculptures with skeletal animation clips and PBR fur
 * shaders—never firing missing-asset 404 requests.
 */

export interface AnimalModelSlotConfig {
  id: 'dog' | 'cat';
  label: string;
  modelUrl: string | null;
  scale: number;
  position: [number, number, number];
  rotationY: number;
  clipMap: {
    idle: string;
    blink?: string;
    headTurn?: string;
  };
  boneMap: {
    head: string;
    neck: string;
    earLeft: string;
    earRight: string;
    tailBase: string;
  };
}

export const DRACO_DECODER_PATH =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

export const HERO_ANIMAL_MODEL_SLOTS: Record<'dog' | 'cat', AnimalModelSlotConfig> = {
  dog: {
    id: 'dog',
    label: 'Golden Retriever (Sculpted PBR GLB)',
    modelUrl: '/models/golden_retriever.glb',
    scale: 1.15,
    position: [0.82, 0, 0.28],
    rotationY: -0.34,
    clipMap: {
      idle: 'Idle_Sit_Breathing',
      blink: 'Blink',
      headTurn: 'Head_Look',
    },
    boneMap: {
      head: 'Dog_Head',
      neck: 'Dog_Neck',
      earLeft: 'Dog_Ear_L',
      earRight: 'Dog_Ear_R',
      tailBase: 'Dog_Tail_Base',
    },
  },
  cat: {
    id: 'cat',
    label: 'Domestic Shorthair Cat (Sculpted PBR GLB)',
    modelUrl: '/models/domestic_cat.glb',
    scale: 1.15,
    position: [1.66, 0, 0.56],
    rotationY: -0.46,
    clipMap: {
      idle: 'Cat_Idle_Breathing',
      blink: 'Cat_Blink',
      headTurn: 'Cat_Head_Look',
    },
    boneMap: {
      head: 'Cat_Head',
      neck: 'Cat_Neck',
      earLeft: 'Cat_Ear_L',
      earRight: 'Cat_Ear_R',
      tailBase: 'Cat_Tail_Base',
    },
  },
};
