import * as THREE from 'three';

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createFurTextures(
  species: 'retriever' | 'tabby',
  maxAnisotropy: number,
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const [albedoCanvas, aCtx] = makeCanvas(size, size);
  const [bumpCanvas, bCtx] = makeCanvas(size, size);

  if (species === 'retriever') {
    const grad = aCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#BC813B');
    grad.addColorStop(0.5, '#A36826');
    grad.addColorStop(1, '#CC9854');
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, size, size);
  } else {
    const grad = aCtx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, '#7E7467');
    grad.addColorStop(0.5, '#635A4F');
    grad.addColorStop(1, '#8C8274');
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, size, size);

    // Organic broken mackerel tabby markings
    aCtx.fillStyle = 'rgba(34, 30, 26, 0.44)';
    for (let y = 16; y < size; y += 38) {
      for (let seg = 0; seg < 4; seg++) {
        const offsetX = seg * (size * 0.25) + ((y % 76 === 16) ? 18 : -12);
        aCtx.beginPath();
        aCtx.ellipse(offsetX, y + Math.sin(seg + y) * 5, 42, 7, 0.22, 0, Math.PI * 2);
        aCtx.fill();
      }
    }
  }

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Directional hair strands for realistic micro-relief
  let seed = species === 'retriever' ? 1337 : 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 4800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 10 + rand() * 20;
    const angle = (rand() - 0.5) * 0.34 + Math.PI * 0.5;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;

    if (species === 'retriever') {
      const shade = rand();
      aCtx.strokeStyle =
        shade > 0.65
          ? 'rgba(222, 178, 114, 0.30)'
          : shade > 0.25
            ? 'rgba(154, 96, 36, 0.28)'
            : 'rgba(108, 62, 18, 0.22)';
    } else {
      const shade = rand();
      aCtx.strokeStyle =
        shade > 0.68
          ? 'rgba(184, 174, 158, 0.26)'
          : shade > 0.32
            ? 'rgba(54, 48, 42, 0.30)'
            : 'rgba(26, 23, 20, 0.28)';
    }
    aCtx.lineWidth = 1.1 + rand() * 1.4;
    aCtx.beginPath();
    aCtx.moveTo(x, y);
    aCtx.lineTo(x + dx, y + dy);
    aCtx.stroke();

    const bumpVal = Math.floor(90 + rand() * 140);
    bCtx.strokeStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
    bCtx.lineWidth = 1.2;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + dx, y + dy);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createEyeTexture(
  species: 'canine' | 'feline',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Warm muted sclera (not bright stark white)
  ctx.fillStyle = '#D5CFC3';
  ctx.fillRect(0, 0, size, size);

  // Outer limbal ring
  const irisRadius = size * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, irisRadius + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#18120D';
  ctx.fill();

  // Iris gradient
  const irisGrad = ctx.createRadialGradient(cx, cy, irisRadius * 0.25, cx, cy, irisRadius);
  if (species === 'canine') {
    irisGrad.addColorStop(0, '#784014');
    irisGrad.addColorStop(0.55, '#4A240B');
    irisGrad.addColorStop(1, '#211005');
  } else {
    irisGrad.addColorStop(0, '#A5AF52');
    irisGrad.addColorStop(0.55, '#59743D');
    irisGrad.addColorStop(1, '#22361D');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, irisRadius, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  // Iris radial fibers
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ctx.strokeStyle =
      species === 'canine' ? 'rgba(202, 134, 58, 0.16)' : 'rgba(204, 218, 114, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * irisRadius * 0.25, cy + Math.sin(a) * irisRadius * 0.25);
    ctx.lineTo(cx + Math.cos(a) * irisRadius * 0.92, cy + Math.sin(a) * irisRadius * 0.92);
    ctx.stroke();
  }

  // Pupil
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  if (species === 'canine') {
    ctx.arc(cx, cy, irisRadius * 0.44, 0, Math.PI * 2);
  } else {
    ctx.ellipse(cx, cy, irisRadius * 0.16, irisRadius * 0.62, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Subtle wet cornea catchlight
  ctx.fillStyle = 'rgba(255, 248, 232, 0.78)';
  ctx.beginPath();
  ctx.arc(cx - irisRadius * 0.26, cy - irisRadius * 0.26, irisRadius * 0.11, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createMeadowTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const [albedo, aCtx] = makeCanvas(size, size);
  const [bump, bCtx] = makeCanvas(size, size);

  aCtx.fillStyle = '#536548';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  let seed = 8899;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 8;
    const tone = rand();
    aCtx.fillStyle =
      tone > 0.72
        ? 'rgba(136, 154, 126, 0.24)'
        : tone > 0.35
          ? 'rgba(66, 86, 56, 0.28)'
          : 'rgba(122, 110, 76, 0.22)';
    aCtx.beginPath();
    aCtx.ellipse(x, y, r, r * 0.45, rand() * Math.PI, 0, Math.PI * 2);
    aCtx.fill();

    const bv = Math.floor(100 + rand() * 95);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.fillRect(x, y, 2, 4);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 14);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(14, 14);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createLimestoneTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const [albedo, aCtx] = makeCanvas(size, size);
  const [bump, bCtx] = makeCanvas(size, size);

  aCtx.fillStyle = '#B7AB97';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  let seed = 5511;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 4000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 4 + rand() * 24;
    const h = 2 + rand() * 6;
    const shade = rand();
    aCtx.fillStyle =
      shade > 0.65
        ? 'rgba(208, 198, 180, 0.22)'
        : shade > 0.3
          ? 'rgba(148, 137, 118, 0.24)'
          : 'rgba(116, 108, 92, 0.18)';
    aCtx.fillRect(x, y, w, h);

    const bv = Math.floor(110 + rand() * 60);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.fillRect(x, y, w, h);
  }

  // Subtle architectural stone joint lines
  aCtx.strokeStyle = 'rgba(104, 96, 82, 0.22)';
  aCtx.lineWidth = 2;
  for (let y = 0; y < size; y += 128) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(size, y);
    aCtx.stroke();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 3);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const grad = ctx.createRadialGradient(cx, cx, 10, cx, cx, cx);
  grad.addColorStop(0, 'rgba(20, 26, 22, 0.62)');
  grad.addColorStop(0.55, 'rgba(20, 26, 22, 0.25)');
  grad.addColorStop(1, 'rgba(20, 26, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
