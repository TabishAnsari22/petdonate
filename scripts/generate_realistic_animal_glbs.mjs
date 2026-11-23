import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// ---------------------------------------------------------------------------
// 1. Minimal Node PNG + Canvas + FileReader Shims for GLTFExporter (binary GLB)
// ---------------------------------------------------------------------------
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbaToPngBuffer(width, height, rgba) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0; // filter type 0
    const srcOffset = y * width * 4;
    rgba.copy(raw, rowStart + 1, srcOffset, srcOffset + width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    onloadend = null;
    result = null;
    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.({ target: this });
    }
    async readAsDataURL(blob) {
      const ab = await blob.arrayBuffer();
      const b64 = Buffer.from(ab).toString('base64');
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
      this.onloadend?.({ target: this });
    }
  };
}

class FakeImageCanvas {
  constructor(width = 1, height = 1, rgbaBuffer = null) {
    this.width = width;
    this.height = height;
    this._rgba = rgbaBuffer;
    this._flipY = false;
  }
  getContext() {
    const self = this;
    return {
      translate() {},
      scale(_sx, sy) {
        if (sy < 0) self._flipY = true;
      },
      drawImage(src, _dx, _dy, dw, dh) {
        const w = dw || src.width;
        const h = dh || src.height;
        self.width = w;
        self.height = h;
        const out = Buffer.alloc(w * h * 4);
        const rowBytes = w * 4;
        for (let y = 0; y < h; y++) {
          const srcY = self._flipY ? h - 1 - y : y;
          src._rgba.copy(out, y * rowBytes, srcY * rowBytes, (srcY + 1) * rowBytes);
        }
        self._rgba = out;
      },
      getImageData(_sx, _sy, sw, sh) {
        const buf = self._rgba || Buffer.alloc(sw * sh * 4);
        return { width: sw, height: sh, data: new Uint8ClampedArray(buf) };
      },
      putImageData(imageData) {
        self.width = imageData.width;
        self.height = imageData.height;
        self._rgba = Buffer.from(imageData.data);
      },
    };
  }
  toBlob(cb, mimeType = 'image/png') {
    const buf = this._rgba || Buffer.alloc(this.width * this.height * 4);
    const png = encodeRgbaToPngBuffer(this.width, this.height, buf);
    cb(new Blob([png], { type: mimeType }));
  }
}

globalThis.HTMLCanvasElement = FakeImageCanvas;
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => new FakeImageCanvas(1, 1),
  };
}

function makeFurTexturePack(species) {
  const size = 1024;
  const albedo = Buffer.alloc(size * size * 4);
  const bump = Buffer.alloc(size * size * 4);

  let seed = species === 'retriever' ? 1901 : 4411;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Subtle multi-tone undercoat mottle + neutral base (vertex colors carry macro coat zones)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const mottle =
        Math.sin(x * 0.035 + y * 0.022) * 4 +
        Math.cos(x * 0.075 - y * 0.05) * 3;
      const base = (species === 'retriever' ? 236 : 230) + mottle;
      albedo[i * 4 + 0] = Math.max(0, Math.min(255, Math.round(base)));
      albedo[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(base - 2)));
      albedo[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(base - 7)));
      albedo[i * 4 + 3] = 255;

      bump[i * 4 + 0] = 128;
      bump[i * 4 + 1] = 128;
      bump[i * 4 + 2] = 128;
      bump[i * 4 + 3] = 255;
    }
  }

  // Dense directional silky hair-strand bundles (29,000 combed strokes)
  const count = 29000;
  for (let i = 0; i < count; i++) {
    const x0 = rand() * size;
    const y0 = rand() * size;
    const len = (species === 'retriever' ? 28 : 16) + rand() * 20;
    const waveOffset = Math.sin((x0 / size) * Math.PI * 4 + (y0 / size) * Math.PI * 2) * 0.09;
    const ang = Math.PI * 0.5 + (rand() - 0.5) * 0.30 + waveOffset;
    const shade = rand();
    const delta = shade > 0.62 ? 26 : shade > 0.24 ? -22 : -46;
    const bumpVal = Math.floor(70 + rand() * 175);

    const steps = Math.ceil(len);
    for (let s = 0; s <= steps; s++) {
      const px = ((Math.round(x0 + Math.cos(ang) * s) % size) + size) % size;
      const py = ((Math.round(y0 + Math.sin(ang) * s) % size) + size) % size;
      const idx = (py * size + px) * 4;
      const frac = s / steps;
      const taper = Math.sin(frac * Math.PI);
      const tipWarmth = frac > 0.6 ? 5 : 0;
      const d = Math.round(delta * taper);
      albedo[idx + 0] = Math.max(0, Math.min(255, albedo[idx + 0] + d + tipWarmth));
      albedo[idx + 1] = Math.max(0, Math.min(255, albedo[idx + 1] + d + Math.round(tipWarmth * 0.6)));
      albedo[idx + 2] = Math.max(0, Math.min(255, albedo[idx + 2] + Math.round(d * 0.92)));

      bump[idx + 0] = bumpVal;
      bump[idx + 1] = bumpVal;
      bump[idx + 2] = bumpVal;
    }
  }

  // Convert bump height buffer into tangent-space normal map for crisp micro-fur relief
  const normalRgba = Buffer.alloc(size * size * 4);
  const strength = 3.6;
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const hL = bump[(y * size + xm) * 4] / 255;
      const hR = bump[(y * size + xp) * 4] / 255;
      const hD = bump[(ym * size + x) * 4] / 255;
      const hU = bump[(yp * size + x) * 4] / 255;
      let nx = (hL - hR) * strength;
      let ny = (hD - hU) * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;
      const idx = (y * size + x) * 4;
      normalRgba[idx + 0] = Math.round((nx * 0.5 + 0.5) * 255);
      normalRgba[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalRgba[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalRgba[idx + 3] = 255;
    }
  }

  const map = new THREE.CanvasTexture(new FakeImageCanvas(size, size, albedo));
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.5, 3.5);

  const normalMap = new THREE.CanvasTexture(new FakeImageCanvas(size, size, normalRgba));
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(3.5, 3.5);

  return { map, normalMap };
}

function makeNoseLeatherNormalMap() {
  const size = 256;
  const cells = 28;
  const pts = new Float32Array(cells * cells * 2);
  let seed = 7731;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < cells * cells; i++) {
    pts[i * 2 + 0] = 0.18 + rand() * 0.64;
    pts[i * 2 + 1] = 0.18 + rand() * 0.64;
  }

  const bump = new Float32Array(size * size);
  for (let py = 0; py < size; py++) {
    const v = (py / size) * cells;
    const cy0 = Math.floor(v);
    for (let px = 0; px < size; px++) {
      const u = (px / size) * cells;
      const cx0 = Math.floor(u);
      let minD = 9.0;
      for (let oy = -1; oy <= 1; oy++) {
        const cy = ((cy0 + oy) % cells + cells) % cells;
        for (let ox = -1; ox <= 1; ox++) {
          const cx = ((cx0 + ox) % cells + cells) % cells;
          const idx = (cy * cells + cx) * 2;
          const dx = u - (cx0 + ox + pts[idx]);
          const dy = v - (cy0 + oy + pts[idx + 1]);
          const dSq = dx * dx + dy * dy;
          if (dSq < minD) minD = dSq;
        }
      }
      bump[py * size + px] = Math.max(0, 1.0 - Math.sqrt(minD) * 1.45);
    }
  }

  const normalRgba = Buffer.alloc(size * size * 4);
  const strength = 2.4;
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      let nx = (bump[y * size + xm] - bump[y * size + xp]) * strength;
      let ny = (bump[ym * size + x] - bump[yp * size + x]) * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;
      const idx = (y * size + x) * 4;
      normalRgba[idx + 0] = Math.round((nx * 0.5 + 0.5) * 255);
      normalRgba[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalRgba[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalRgba[idx + 3] = 255;
    }
  }
  const tex = new THREE.CanvasTexture(new FakeImageCanvas(size, size, normalRgba));
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeEyeTexture(species) {
  const size = 256;
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  // Full anatomical iris filling socket with dark pigment limbal margin
  const irisRx = size * 0.32;
  const irisRy = size * 0.36;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / irisRx;
      const dy = (y - cy) / irisRy;
      const distNorm = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      let r = 16;
      let g = 11;
      let b = 8;

      if (distNorm <= 1.03) {
        if (distNorm > 0.89) {
          r = 10;
          g = 7;
          b = 6;
        } else {
          const radialFiber =
            Math.sin(ang * 56 + distNorm * 9.0) * 0.35 +
            Math.cos(ang * 29 - distNorm * 5.0) * 0.25 +
            0.5;
          if (species === 'canine') {
            // Deep soulful warm honey-umber retriever iris
            const t = Math.pow(distNorm, 0.72);
            r = Math.round(THREE.MathUtils.lerp(132, 34, t) + radialFiber * 16);
            g = Math.round(THREE.MathUtils.lerp(72, 16, t) + radialFiber * 9);
            b = Math.round(THREE.MathUtils.lerp(24, 8, t) + radialFiber * 4);
          } else {
            // Serene amber-gold center transitioning into natural olive-sage tabby iris
            const t = Math.pow(distNorm, 0.65);
            const warmInner = Math.max(0, 1 - distNorm / 0.45);
            r = Math.round(THREE.MathUtils.lerp(144, 42, t) + warmInner * 24 + radialFiber * 14);
            g = Math.round(THREE.MathUtils.lerp(136, 62, t) + warmInner * 12 + radialFiber * 14);
            b = Math.round(THREE.MathUtils.lerp(56, 26, t) + radialFiber * 6);
          }

          // Centered anatomical pupil (round canine / crisp vertical elliptical slit feline)
          const inPupil =
            species === 'canine'
              ? distNorm < 0.42
              : (dx * dx) / 0.017 + (dy * dy) / 0.48 < 1;
          if (inPupil) {
            r = 4;
            g = 4;
            b = 5;
          }
        }
      }

      const idx = (y * size + x) * 4;
      rgba[idx + 0] = Math.max(0, Math.min(255, r));
      rgba[idx + 1] = Math.max(0, Math.min(255, g));
      rgba[idx + 2] = Math.max(0, Math.min(255, b));
      rgba[idx + 3] = 255;
    }
  }

  const tex = new THREE.CanvasTexture(new FakeImageCanvas(size, size, rgba));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// 2. SDF Primitives & Smooth Surface-Nets Organic Mesh Sculptor
// ---------------------------------------------------------------------------
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function smax(a, b, k) {
  return -smin(-a, -b, k);
}

function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const pax = px - ax;
  const pay = py - ay;
  const paz = pz - az;
  const bax = bx - ax;
  const bay = by - ay;
  const baz = bz - az;
  const baba = bax * bax + bay * bay + baz * baz;
  const h = baba > 1e-8 ? Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / baba)) : 0;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  const r = ra + (rb - ra) * h;
  return Math.hypot(dx, dy, dz) - r;
}

function sdEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx;
  const y = (py - cy) / ry;
  const z = (pz - cz) / rz;
  const k0 = Math.hypot(x, y, z);
  if (k0 < 1e-6) return -Math.min(rx, ry, rz);
  const k1 = Math.hypot(x / rx, y / ry, z / rz);
  return (k0 * (k0 - 1.0)) / k1;
}

function surfaceNetsMesh(sdfFn, boundsMin, boundsMax, res, colorFn, smoothPasses = 4) {
  const [nx, ny, nz] = res;
  const dx = (boundsMax[0] - boundsMin[0]) / nx;
  const dy = (boundsMax[1] - boundsMin[1]) / ny;
  const dz = (boundsMax[2] - boundsMin[2]) / nz;

  const gx = nx + 1;
  const gy = ny + 1;
  const gz = nz + 1;
  const grid = new Float32Array(gx * gy * gz);
  const idxG = (i, j, k) => (k * gy + j) * gx + i;

  for (let k = 0; k < gz; k++) {
    const z = boundsMin[2] + k * dz;
    for (let j = 0; j < gy; j++) {
      const y = boundsMin[1] + j * dy;
      for (let i = 0; i < gx; i++) {
        const x = boundsMin[0] + i * dx;
        grid[idxG(i, j, k)] = sdfFn(x, y, z);
      }
    }
  }

  const edgePairs = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const cornerOffsets = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ];

  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const idxC = (i, j, k) => (k * ny + j) * nx + i;
  const verts = [];

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let mask = 0;
        const vals = new Float32Array(8);
        for (let c = 0; c < 8; c++) {
          const [oi, oj, ok] = cornerOffsets[c];
          const v = grid[idxG(i + oi, j + oj, k + ok)];
          vals[c] = v;
          if (v <= 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;

        let sx = 0;
        let sy = 0;
        let sz = 0;
        let ec = 0;
        for (let e = 0; e < 12; e++) {
          const [a, b] = edgePairs[e];
          const va = vals[a];
          const vb = vals[b];
          if ((va <= 0) === (vb <= 0)) continue;
          const t = va / (va - vb);
          const ca = cornerOffsets[a];
          const cb = cornerOffsets[b];
          sx += i + ca[0] + t * (cb[0] - ca[0]);
          sy += j + ca[1] + t * (cb[1] - ca[1]);
          sz += k + ca[2] + t * (cb[2] - ca[2]);
          ec++;
        }
        cellVert[idxC(i, j, k)] = verts.length / 3;
        verts.push(
          boundsMin[0] + (sx / ec) * dx,
          boundsMin[1] + (sy / ec) * dy,
          boundsMin[2] + (sz / ec) * dz,
        );
      }
    }
  }

  const indices = [];
  const emitQuad = (v0, v1, v2, v3, flip) => {
    if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) return;
    if (!flip) {
      indices.push(v0, v1, v2, v0, v2, v3);
    } else {
      indices.push(v0, v2, v1, v0, v3, v2);
    }
  };

  for (let k = 1; k < nz; k++) {
    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        const vBase = grid[idxG(i, j, k)];

        // X-edge (i -> i+1) shared by cells (i, j-1..j, k-1..k)
        if (i < nx - 0) {
          const vx = grid[idxG(i + 1, j, k)];
          if ((vBase <= 0) !== (vx <= 0)) {
            emitQuad(
              cellVert[idxC(i, j - 1, k - 1)],
              cellVert[idxC(i, j, k - 1)],
              cellVert[idxC(i, j, k)],
              cellVert[idxC(i, j - 1, k)],
              vx <= 0,
            );
          }
        }
        // Y-edge (j -> j+1) shared by cells (i-1..i, j, k-1..k)
        if (j < ny - 0) {
          const vy = grid[idxG(i, j + 1, k)];
          if ((vBase <= 0) !== (vy <= 0)) {
            emitQuad(
              cellVert[idxC(i - 1, j, k - 1)],
              cellVert[idxC(i - 1, j, k)],
              cellVert[idxC(i, j, k)],
              cellVert[idxC(i, j, k - 1)],
              vy <= 0,
            );
          }
        }
        // Z-edge (k -> k+1) shared by cells (i-1..i, j-1..j, k)
        if (k < nz - 0) {
          const vz = grid[idxG(i, j, k + 1)];
          if ((vBase <= 0) !== (vz <= 0)) {
            emitQuad(
              cellVert[idxC(i - 1, j - 1, k)],
              cellVert[idxC(i, j - 1, k)],
              cellVert[idxC(i, j, k)],
              cellVert[idxC(i - 1, j, k)],
              vz <= 0,
            );
          }
        }
      }
    }
  }

  // Build adjacency for volume-preserving Taubin smoothing
  const vertCount = verts.length / 3;
  const pos = new Float32Array(verts);
  const neighbors = Array.from({ length: vertCount }, () => new Set());
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t];
    const b = indices[t + 1];
    const c = indices[t + 2];
    neighbors[a].add(b);
    neighbors[a].add(c);
    neighbors[b].add(a);
    neighbors[b].add(c);
    neighbors[c].add(a);
    neighbors[c].add(b);
  }

  const tmp = new Float32Array(pos.length);
  const smoothStep = (factor) => {
    for (let v = 0; v < vertCount; v++) {
      const nb = neighbors[v];
      if (nb.size === 0) {
        tmp[v * 3 + 0] = pos[v * 3 + 0];
        tmp[v * 3 + 1] = pos[v * 3 + 1];
        tmp[v * 3 + 2] = pos[v * 3 + 2];
        continue;
      }
      let ax = 0;
      let ay = 0;
      let az = 0;
      for (const u of nb) {
        ax += pos[u * 3 + 0];
        ay += pos[u * 3 + 1];
        az += pos[u * 3 + 2];
      }
      const inv = 1 / nb.size;
      tmp[v * 3 + 0] = pos[v * 3 + 0] + factor * (ax * inv - pos[v * 3 + 0]);
      tmp[v * 3 + 1] = pos[v * 3 + 1] + factor * (ay * inv - pos[v * 3 + 1]);
      tmp[v * 3 + 2] = pos[v * 3 + 2] + factor * (az * inv - pos[v * 3 + 2]);
    }
    pos.set(tmp);
  };

  for (let p = 0; p < smoothPasses; p++) {
    smoothStep(0.5);
    smoothStep(-0.52);
  }

  // Triplanar cylindrical UV mapping + 3D anatomical vertex colors
  const uvs = new Float32Array(vertCount * 2);
  const colors = new Float32Array(vertCount * 3);
  for (let v = 0; v < vertCount; v++) {
    const x = pos[v * 3 + 0];
    const y = pos[v * 3 + 1];
    const z = pos[v * 3 + 2];
    const theta = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
    uvs[v * 2 + 0] = theta * 2.0;
    uvs[v * 2 + 1] = y * 2.2;

    const [sr, sg, sb] = colorFn(x, y, z);
    // glTF COLOR_0 vertex colors must be stored in linear light space
    colors[v * 3 + 0] = Math.pow(Math.max(0, Math.min(1, sr)), 2.2);
    colors[v * 3 + 1] = Math.pow(Math.max(0, Math.min(1, sg)), 2.2);
    colors[v * 3 + 2] = Math.pow(Math.max(0, Math.min(1, sb)), 2.2);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.normalizeNormals();
  return geom;
}

function makeQuatTrack(targetName, times, eulers) {
  const values = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const [rx, ry, rz] of eulers) {
    e.set(rx, ry, rz, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${targetName}.quaternion`, times, values);
}

// ---------------------------------------------------------------------------
// 3. Sculpt Golden Retriever GLB (Body, Neck+Head, Ears, Tail, Recessed Eyes)
// ---------------------------------------------------------------------------
function buildGoldenRetrieverModel() {
  const root = new THREE.Group();
  root.name = 'GoldenRetrieverRoot';

  const { map: furMap, normalMap: furNormal } = makeFurTexturePack('retriever');
  const noseNormalMap = makeNoseLeatherNormalMap();
  const eyeTex = makeEyeTexture('canine');

  const furMat = new THREE.MeshPhysicalMaterial({
    name: 'AnimalFurMaterial',
    color: 0xffffff,
    map: furMap,
    normalMap: furNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    vertexColors: true,
    roughness: 0.87,
    metalness: 0.0,
    sheen: 0.78,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(0xead09d),
  });

  const noseMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1512,
    normalMap: noseNormalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.26,
    metalness: 0.02,
    clearcoat: 0.68,
    clearcoatRoughness: 0.24,
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x183d32,
    roughness: 0.52,
    metalness: 0.08,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb99a64,
    roughness: 0.24,
    metalness: 0.85,
  });

  const eyeMat = new THREE.MeshPhysicalMaterial({
    map: eyeTex,
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.0,
    clearcoat: 0.62,
    clearcoatRoughness: 0.10,
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x9d6326,
    roughness: 0.86,
    metalness: 0.0,
  });

  // A. Athletic Golden Retriever Body SDF (Sculpted ribcage, waist taper, chest & forearm feathering, toes)
  const dogBodySdf = (x, y, z) => {
    const ax = Math.abs(x);
    // Seated pelvis & haunches
    let d = sdEllipsoid(x, y, z, 0, 0.155, -0.175, 0.175, 0.15, 0.205);
    // Athletic golden ribcage tapering naturally toward shoulders and tucked waist
    d = smin(d, sdCapsule(x, y, z, 0, 0.18, -0.13, 0, 0.435, 0.055, 0.145, 0.135), 0.085);
    // Rich feathered sternum & lower chest mane
    d = smin(d, sdEllipsoid(x, y, z, 0, 0.34, 0.118, 0.124, 0.152, 0.112), 0.068);
    d = smin(d, sdEllipsoid(x, y, z, 0, 0.23, 0.105, 0.082, 0.088, 0.075), 0.045);
    // Forward shoulder blades
    d = smin(d, sdEllipsoid(ax, y, z, 0.098, 0.425, 0.07, 0.062, 0.085, 0.075), 0.045);
    // Base of neck socket
    d = smin(d, sdCapsule(x, y, z, 0, 0.445, 0.05, 0, 0.56, 0.062, 0.104, 0.088), 0.05);

    // Forelimbs: shoulder -> elbow -> forearm -> wrist -> sculpted paw with feathering ridge
    d = smin(d, sdCapsule(ax, y, z, 0.098, 0.41, 0.088, 0.092, 0.255, 0.138, 0.054, 0.042), 0.036);
    d = smin(d, sdCapsule(ax, y, z, 0.092, 0.255, 0.138, 0.085, 0.05, 0.208, 0.040, 0.030), 0.026);
    // Subtle Golden Retriever forearm back feathering
    d = smin(d, sdCapsule(ax, y, z, 0.092, 0.26, 0.112, 0.087, 0.09, 0.175, 0.026, 0.015), 0.024);
    // Grounded front paw + distinct sculpted outer/inner toes
    d = smin(d, sdEllipsoid(ax, y, z, 0.085, 0.022, 0.236, 0.036, 0.022, 0.045), 0.016);
    d = smin(d, sdCapsule(ax, y, z, 0.074, 0.018, 0.252, 0.072, 0.015, 0.285, 0.013, 0.010), 0.008);
    d = smin(d, sdCapsule(ax, y, z, 0.096, 0.018, 0.250, 0.098, 0.015, 0.282, 0.013, 0.010), 0.008);

    // Seated hind legs: muscular thigh -> folded hock -> planted hind paw + toes
    d = smin(d, sdCapsule(ax, y, z, 0.128, 0.17, -0.135, 0.156, 0.082, -0.025, 0.072, 0.046), 0.042);
    d = smin(d, sdCapsule(ax, y, z, 0.156, 0.082, -0.025, 0.148, 0.024, 0.108, 0.040, 0.032), 0.024);
    d = smin(d, sdEllipsoid(ax, y, z, 0.148, 0.020, 0.142, 0.036, 0.021, 0.048), 0.016);
    d = smin(d, sdCapsule(ax, y, z, 0.138, 0.017, 0.155, 0.136, 0.014, 0.186, 0.012, 0.009), 0.007);
    d = smin(d, sdCapsule(ax, y, z, 0.158, 0.017, 0.152, 0.160, 0.014, 0.182, 0.012, 0.009), 0.007);

    return smax(d, -y, 0.010);
  };

  const dogBodyColor = (x, y, z) => {
    const ax = Math.abs(x);
    // Warm sunlit golden honey-chestnut palette
    let r = 0.72;
    let g = 0.45;
    let b = 0.16;

    const dorsal = Math.max(0, Math.min(1, (y - 0.12) / 0.4));
    r += dorsal * 0.09;
    g += dorsal * 0.055;
    b += dorsal * 0.015;

    // Creamy-wheat chest ruff feathering & inner forearm feathering
    const chestWeight = Math.exp(-Math.pow((z - 0.17) / 0.12, 2)) * Math.exp(-Math.pow(ax / 0.11, 2)) * Math.max(0, 1 - Math.abs(y - 0.34) / 0.22);
    const pawWeight = Math.max(0, 1 - y / 0.055) * 0.38;
    const cream = Math.min(1, chestWeight * 0.74 + pawWeight);
    r = THREE.MathUtils.lerp(r, 0.88, cream);
    g = THREE.MathUtils.lerp(g, 0.73, cream);
    b = THREE.MathUtils.lerp(b, 0.45, cream);

    // Rich umber AO under chest, between paws, and in tucked thigh folds
    const aoFloor = Math.max(0, 1 - y / 0.06) * 0.28;
    const aoInner = ax < 0.065 && y < 0.25 && z > 0.04 ? 0.26 : 0;
    const ao = 1 - Math.min(0.48, aoFloor + aoInner);
    return [r * ao, g * ao, b * ao];
  };

  const chestPivot = new THREE.Group();
  chestPivot.name = 'Dog_Chest';
  root.add(chestPivot);

  const bodyGeo = surfaceNetsMesh(
    dogBodySdf,
    [-0.26, -0.02, -0.42],
    [0.26, 0.60, 0.36],
    [42, 46, 48],
    dogBodyColor,
    4,
  );
  const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
  bodyMesh.name = 'Dog_BodyMesh';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  chestPivot.add(bodyMesh);

  // B. Neck & Head Sculpture
  const neckPivot = new THREE.Group();
  neckPivot.name = 'Dog_Neck';
  neckPivot.position.set(0, 0.50, 0.055);
  chestPivot.add(neckPivot);

  const headPivot = new THREE.Group();
  headPivot.name = 'Dog_Head';
  headPivot.position.set(0, 0.16, 0.032);
  neckPivot.add(headPivot);

  const dogNeckSdf = (x, y, z) => {
    let d = sdCapsule(x, y, z, 0, -0.05, -0.02, 0, 0.17, 0.028, 0.098, 0.084);
    d = smin(d, sdEllipsoid(x, y, z, 0, 0.012, 0.035, 0.09, 0.078, 0.082), 0.035);
    return d;
  };
  const neckGeo = surfaceNetsMesh(
    dogNeckSdf,
    [-0.14, -0.10, -0.12],
    [0.14, 0.21, 0.16],
    [34, 34, 34],
    (_x, _y, z) => {
      const cream = z > 0.035 ? 0.54 : 0.1;
      return [
        THREE.MathUtils.lerp(0.73, 0.87, cream),
        THREE.MathUtils.lerp(0.46, 0.71, cream),
        THREE.MathUtils.lerp(0.17, 0.43, cream),
      ];
    },
    3,
  );
  const neckMesh = new THREE.Mesh(neckGeo, furMat);
  neckMesh.name = 'Dog_NeckMesh';
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  neckPivot.add(neckMesh);

  // Refined Forest-Green Collar hugging neck naturally + sleek brushed brass buckle on right side
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.013, 14, 38), collarMat);
  collar.rotation.x = Math.PI * 0.46;
  collar.position.set(0, 0.018, 0.008);
  collar.castShadow = true;
  neckPivot.add(collar);
  const brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0032, 10, 22), brassMat);
  brassRing.position.set(0, 0.006, 0.118);
  brassRing.rotation.x = 0.25;
  neckPivot.add(brassRing);

  // Sculpted Golden Retriever Skull: broad flatter forehead, gentle overhanging brow arches, squared deep muzzle
  const dogHeadSdf = (x, y, z) => {
    const ax = Math.abs(x);
    // Broad flatter Retriever cranium (less spherical dome)
    let d = sdEllipsoid(x, y, z, 0, 0.048, 0.002, 0.124, 0.082, 0.122);
    // Cheekbone breadth
    d = smin(d, sdEllipsoid(ax, y, z, 0.068, 0.014, 0.038, 0.060, 0.050, 0.066), 0.04);
    // Gentle overhanging brow arches framing relaxed warm eyes
    d = smin(d, sdEllipsoid(ax, y, z, 0.045, 0.070, 0.098, 0.036, 0.022, 0.038), 0.02);
    // Longer squared Golden Retriever muzzle stopping cleanly behind nose tip
    d = smin(d, sdCapsule(x, y, z, 0, 0.024, 0.062, 0, 0.010, 0.192, 0.058, 0.040), 0.032);
    // Hanging soft upper lip flews
    d = smin(d, sdEllipsoid(ax, y, z, 0.024, -0.010, 0.162, 0.028, 0.024, 0.044), 0.018);
    // Lower jaw & chin
    d = smin(d, sdCapsule(x, y, z, 0, -0.028, 0.06, 0, -0.024, 0.172, 0.044, 0.026), 0.02);
    // Recessed almond orbital sockets
    const eyeSocket = sdEllipsoid(ax, y, z, 0.045, 0.048, 0.106, 0.024, 0.019, 0.026);
    d = smax(d, -eyeSocket, 0.012);
    return d;
  };

  const dogHeadColor = (x, y, z) => {
    const ax = Math.abs(x);
    let r = 0.74;
    let g = 0.47;
    let b = 0.17;
    // Soft warm honey-wheat bridge, gentle cheek highlights & gentle muzzle lightening
    const snoutFade = Math.max(0, Math.min(1, (z - 0.10) / 0.11));
    const cheekWarm = Math.exp(-Math.hypot((ax - 0.07) / 0.04, (y - 0.01) / 0.04, (z - 0.04) / 0.05));
    r = THREE.MathUtils.lerp(r, 0.84, Math.min(1, snoutFade * 0.42 + cheekWarm * 0.18));
    g = THREE.MathUtils.lerp(g, 0.66, Math.min(1, snoutFade * 0.42 + cheekWarm * 0.18));
    b = THREE.MathUtils.lerp(b, 0.40, Math.min(1, snoutFade * 0.42 + cheekWarm * 0.18));

    // Rich dark eye-liner, inner tear-duct shadow, philtrum & lip crease
    const eyeRing = Math.exp(-Math.hypot(ax - 0.045, y - 0.048, z - 0.106) * 46);
    const tearDuct = Math.exp(-Math.hypot(ax - 0.028, y - 0.041, z - 0.114) * 78);
    const mouthLine = Math.exp(-Math.pow((y + 0.021) / 0.0075, 2)) * Math.max(0, (z - 0.10) / 0.09);
    const philtrumLine = Math.exp(-Math.pow(ax / 0.004, 2)) * (y < 0.008 && y > -0.022 && z > 0.185 ? 0.65 : 0);
    const whiskerDots =
      ax > 0.020 && ax < 0.044 && y > -0.012 && y < 0.014 && z > 0.16 && z < 0.21
        ? Math.max(0, Math.sin(ax * 420) * Math.cos(z * 380)) * 0.22
        : 0;
    const dark = Math.min(0.80, eyeRing * 0.68 + tearDuct * 0.45 + mouthLine * 0.56 + philtrumLine * 0.55 + whiskerDots);
    return [r * (1 - dark), g * (1 - dark), b * (1 - dark)];
  };

  const headGeo = surfaceNetsMesh(
    dogHeadSdf,
    [-0.16, -0.10, -0.14],
    [0.16, 0.18, 0.27],
    [38, 36, 42],
    dogHeadColor,
    4,
  );
  const headMesh = new THREE.Mesh(headGeo, furMat);
  headMesh.name = 'Dog_HeadMesh';
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headPivot.add(headMesh);

  // Sculpted wet black canine nose crowning muzzle tip
  const dogNoseSdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEllipsoid(x, y, z, 0, 0, 0, 0.030, 0.020, 0.024);
    const nostril = sdEllipsoid(ax, y, z, 0.012, -0.002, 0.018, 0.0055, 0.0055, 0.010);
    const philtrum = sdEllipsoid(x, y, z, 0, -0.012, 0.021, 0.0025, 0.010, 0.005);
    d = smax(d, -nostril, 0.003);
    return smax(d, -philtrum, 0.002);
  };
  const noseGeo = surfaceNetsMesh(
    dogNoseSdf,
    [-0.038, -0.03, -0.03],
    [0.038, 0.03, 0.032],
    [24, 20, 20],
    () => [0.09, 0.07, 0.065],
    2,
  );
  const noseMesh = new THREE.Mesh(noseGeo, noseMat);
  noseMesh.position.set(0, 0.013, 0.228);
  headPivot.add(noseMesh);

  // Recessed canine eyeballs + warm cornea + fur-matched eyelid rims
  const lidGeo = new THREE.SphereGeometry(0.0206, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.54);
  [-1, 1].forEach((side) => {
    const eyePivot = new THREE.Group();
    eyePivot.position.set(side * 0.044, 0.048, 0.101);
    eyePivot.rotation.y = side * 0.05;

    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.019, 20, 18), eyeMat);
    eyeball.rotation.y = -Math.PI * 0.5;
    eyePivot.add(eyeball);

    const upperLid = new THREE.Mesh(lidGeo, lidMat);
    upperLid.name = side > 0 ? 'Dog_Lid_L' : 'Dog_Lid_R';
    upperLid.rotation.x = -0.82;
    eyePivot.add(upperLid);
    headPivot.add(eyePivot);
  });

  // Broad feathered Retriever ears hugging sides of cheeks cleanly
  const makeDogEarGeo = (mirrorSign) => {
    const earSdf = (px, py, pz) => {
      const x = px * mirrorSign;
      let d = sdCapsule(x, py, pz, 0, 0, 0, 0.004, -0.145, 0.028, 0.038, 0.026);
      d = smin(d, sdEllipsoid(x, py, pz, 0.002, -0.08, 0.016, 0.016, 0.075, 0.056), 0.028);
      return smax(d, -sdEllipsoid(x, py, pz, -0.026, -0.075, 0.01, 0.018, 0.095, 0.045), 0.01);
    };
    const minX = mirrorSign > 0 ? -0.035 : -0.05;
    const maxX = mirrorSign > 0 ? 0.05 : 0.035;
    return surfaceNetsMesh(
      earSdf,
      [minX, -0.19, -0.07],
      [maxX, 0.05, 0.10],
      [22, 34, 24],
      (_x, y) => {
        const tip = Math.max(0, Math.min(1, -y / 0.16));
        return [
          THREE.MathUtils.lerp(0.60, 0.70, tip),
          THREE.MathUtils.lerp(0.34, 0.44, tip),
          THREE.MathUtils.lerp(0.10, 0.16, tip),
        ];
      },
      3,
    );
  };

  const earLeftPivot = new THREE.Group();
  earLeftPivot.name = 'Dog_Ear_L';
  earLeftPivot.position.set(0.106, 0.056, -0.006);
  earLeftPivot.rotation.set(0.08, 0.18, -0.08);
  const earL = new THREE.Mesh(makeDogEarGeo(1), furMat);
  earL.name = 'Dog_EarLMesh';
  earL.castShadow = true;
  earLeftPivot.add(earL);
  headPivot.add(earLeftPivot);

  const earRightPivot = new THREE.Group();
  earRightPivot.name = 'Dog_Ear_R';
  earRightPivot.position.set(-0.106, 0.056, -0.006);
  earRightPivot.rotation.set(0.08, -0.18, 0.08);
  const earR = new THREE.Mesh(makeDogEarGeo(-1), furMat);
  earR.name = 'Dog_EarRMesh';
  earR.castShadow = true;
  earRightPivot.add(earR);
  headPivot.add(earRightPivot);

  // Relaxed Feathered Plume Tail resting naturally beside right hip along ground (not stiff stick!)
  const tailPivot = new THREE.Group();
  tailPivot.name = 'Dog_Tail_Base';
  tailPivot.position.set(0, 0.09, -0.32);
  chestPivot.add(tailPivot);

  const dogTailSdf = (x, y, z) => {
    let d = sdCapsule(x, y, z, 0, 0, 0, 0.10, -0.03, -0.10, 0.042, 0.036);
    d = smin(d, sdCapsule(x, y, z, 0.10, -0.03, -0.10, 0.22, -0.04, 0.04, 0.036, 0.028), 0.032);
    d = smin(d, sdCapsule(x, y, z, 0.22, -0.04, 0.04, 0.27, 0.02, 0.18, 0.028, 0.014), 0.022);
    return smax(d, -(y + 0.075), 0.008);
  };
  const tailGeo = surfaceNetsMesh(
    dogTailSdf,
    [-0.08, -0.09, -0.18],
    [0.32, 0.08, 0.24],
    [34, 20, 36],
    (_x, y) => {
      const feather = y < -0.01 ? 0.62 : 0.28;
      return [
        THREE.MathUtils.lerp(0.71, 0.85, feather),
        THREE.MathUtils.lerp(0.45, 0.69, feather),
        THREE.MathUtils.lerp(0.17, 0.42, feather),
      ];
    },
    3,
  );
  const tailMesh = new THREE.Mesh(tailGeo, furMat);
  tailMesh.name = 'Dog_TailMesh';
  tailMesh.castShadow = true;
  tailPivot.add(tailMesh);

  // Baked glTF-compatible AnimationClips
  const idleClip = new THREE.AnimationClip('Idle_Sit_Breathing', 4.6, [
    new THREE.VectorKeyframeTrack(
      'Dog_Chest.scale',
      [0, 2.2, 4.6],
      [1, 1, 1, 1.016, 1.007, 1.019, 1, 1, 1],
    ),
    makeQuatTrack(
      'Dog_Ear_L',
      [0, 2.2, 3.0, 4.6],
      [
        [0.08, 0.18, -0.08],
        [0.08, 0.18, -0.08],
        [0.10, 0.20, -0.03],
        [0.08, 0.18, -0.08],
      ],
    ),
    makeQuatTrack(
      'Dog_Ear_R',
      [0, 2.6, 3.4, 4.6],
      [
        [0.08, -0.18, 0.08],
        [0.08, -0.18, 0.08],
        [0.10, -0.20, 0.03],
        [0.08, -0.18, 0.08],
      ],
    ),
    makeQuatTrack(
      'Dog_Tail_Base',
      [0, 1.5, 3.2, 4.6],
      [
        [0, 0, 0],
        [0, 0.07, 0],
        [0, -0.04, 0],
        [0, 0, 0],
      ],
    ),
  ]);

  const blinkClip = new THREE.AnimationClip('Blink', 5.8, [
    makeQuatTrack(
      'Dog_Lid_L',
      [0, 2.5, 2.62, 2.76, 5.1, 5.21, 5.34, 5.8],
      [
        [-0.82, 0, 0],
        [-0.82, 0, 0],
        [0.98, 0, 0],
        [-0.82, 0, 0],
        [-0.82, 0, 0],
        [0.98, 0, 0],
        [-0.82, 0, 0],
        [-0.82, 0, 0],
      ],
    ),
    makeQuatTrack(
      'Dog_Lid_R',
      [0, 2.5, 2.62, 2.76, 5.1, 5.21, 5.34, 5.8],
      [
        [-0.82, 0, 0],
        [-0.82, 0, 0],
        [0.98, 0, 0],
        [-0.82, 0, 0],
        [-0.82, 0, 0],
        [0.98, 0, 0],
        [-0.82, 0, 0],
        [-0.82, 0, 0],
      ],
    ),
  ]);

  return { root, animations: [idleClip, blinkClip] };
}

// ---------------------------------------------------------------------------
// 4. Sculpt Domestic Tabby Cat GLB (Body, Head, Hollow Ears, Curled Tail)
// ---------------------------------------------------------------------------
function buildDomesticCatModel() {
  const root = new THREE.Group();
  root.name = 'DomesticCatRoot';

  const { map: furMap, normalMap: furNormal } = makeFurTexturePack('tabby');
  const catNoseNormalMap = makeNoseLeatherNormalMap();
  const eyeTex = makeEyeTexture('feline');

  const furMat = new THREE.MeshPhysicalMaterial({
    name: 'AnimalFurMaterial',
    color: 0xffffff,
    map: furMap,
    normalMap: furNormal,
    normalScale: new THREE.Vector2(0.58, 0.58),
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.0,
    sheen: 0.72,
    sheenRoughness: 0.58,
    sheenColor: new THREE.Color(0xdad2c4),
  });

  const noseMat = new THREE.MeshPhysicalMaterial({
    color: 0xb97c74,
    normalMap: catNoseNormalMap,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughness: 0.32,
    clearcoat: 0.52,
  });

  const eyeMat = new THREE.MeshPhysicalMaterial({
    map: eyeTex,
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.0,
    clearcoat: 0.60,
    clearcoatRoughness: 0.10,
  });

  const catLidMat = new THREE.MeshStandardMaterial({
    color: 0x554e45,
    roughness: 0.85,
    metalness: 0.0,
  });

  const tabbyCoatColor = (x, y, z) => {
    const ax = Math.abs(x);
    // Warm grey-taupe ticked agouti tabby base with subtle golden under-tone
    let r = 0.57;
    let g = 0.51;
    let b = 0.43;

    // Natural mackerel tabby stripes blended gently with organic coat ripples
    const wave = Math.sin(y * 42 + Math.sin(z * 16 + ax * 8) * 1.9 - ax * 13);
    const stripe = Math.pow(Math.max(0, (wave - 0.10) / 0.90), 1.25);
    const spine = Math.exp(-Math.pow(ax / 0.026, 2)) * (z < 0.05 ? 0.82 : 0.22);
    const darkFactor = Math.min(0.84, stripe * 0.64 + spine * 0.58);
    r = THREE.MathUtils.lerp(r, 0.16, darkFactor);
    g = THREE.MathUtils.lerp(g, 0.13, darkFactor);
    b = THREE.MathUtils.lerp(b, 0.11, darkFactor);

    // Warm ivory-cream chest bib & dainty socks
    const chestCream = Math.exp(-Math.pow((z - 0.085) / 0.055, 2)) * Math.exp(-Math.pow(ax / 0.052, 2)) * Math.max(0, 1 - Math.abs(y - 0.21) / 0.11);
    const pawCream = Math.max(0, 1 - y / 0.028) * 0.62;
    const light = Math.min(1, chestCream * 0.75 + pawCream);
    r = THREE.MathUtils.lerp(r, 0.82, light);
    g = THREE.MathUtils.lerp(g, 0.78, light);
    b = THREE.MathUtils.lerp(b, 0.71, light);

    const ao = 1 - Math.max(0, 1 - y / 0.04) * 0.26;
    return [r * ao, g * ao, b * ao];
  };

  const chestPivot = new THREE.Group();
  chestPivot.name = 'Cat_Chest';
  root.add(chestPivot);

  // Seated Feline Body SDF with dainty front toes
  const catBodySdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEllipsoid(x, y, z, 0, 0.115, -0.065, 0.118, 0.11, 0.135);
    // Graceful upright arched seated torso
    d = smin(d, sdCapsule(x, y, z, 0, 0.14, -0.04, 0, 0.30, 0.03, 0.102, 0.082), 0.06);
    // Compact feline chest
    d = smin(d, sdEllipsoid(x, y, z, 0, 0.24, 0.055, 0.078, 0.09, 0.075), 0.048);
    // Slender closely set forelimbs & dainty paws
    d = smin(d, sdCapsule(ax, y, z, 0.052, 0.27, 0.058, 0.040, 0.028, 0.108, 0.031, 0.021), 0.022);
    d = smin(d, sdEllipsoid(ax, y, z, 0.040, 0.013, 0.125, 0.023, 0.015, 0.030), 0.012);
    // Tucked haunch thighs & rear paws
    d = smin(d, sdCapsule(ax, y, z, 0.086, 0.12, -0.05, 0.092, 0.032, 0.05, 0.044, 0.023), 0.028);
    d = smin(d, sdEllipsoid(ax, y, z, 0.092, 0.012, 0.07, 0.022, 0.014, 0.030), 0.010);
    return smax(d, -y, 0.008);
  };

  const catBodyGeo = surfaceNetsMesh(
    catBodySdf,
    [-0.17, -0.015, -0.24],
    [0.17, 0.38, 0.20],
    [36, 40, 42],
    tabbyCoatColor,
    4,
  );
  const catBodyMesh = new THREE.Mesh(catBodyGeo, furMat);
  catBodyMesh.name = 'Cat_BodyMesh';
  catBodyMesh.castShadow = true;
  catBodyMesh.receiveShadow = true;
  chestPivot.add(catBodyMesh);

  // Neck & Head
  const neckPivot = new THREE.Group();
  neckPivot.name = 'Cat_Neck';
  neckPivot.position.set(0, 0.30, 0.032);
  chestPivot.add(neckPivot);

  const headPivot = new THREE.Group();
  headPivot.name = 'Cat_Head';
  headPivot.position.set(0, 0.076, 0.020);
  neckPivot.add(headPivot);

  const catNeckSdf = (x, y, z) =>
    sdCapsule(x, y, z, 0, -0.03, -0.01, 0, 0.082, 0.016, 0.064, 0.053);
  const catNeckGeo = surfaceNetsMesh(
    catNeckSdf,
    [-0.09, -0.05, -0.09],
    [0.09, 0.11, 0.10],
    [28, 28, 28],
    tabbyCoatColor,
    3,
  );
  const catNeckMesh = new THREE.Mesh(catNeckGeo, furMat);
  catNeckMesh.name = 'Cat_NeckMesh';
  catNeckMesh.castShadow = true;
  neckPivot.add(catNeckMesh);

  // Feline Head SDF with realistic wedge-heart cranium, cheek taper, whisker pads, orbital sockets
  const catHeadSdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEllipsoid(x, y, z, 0, 0.009, 0.0, 0.080, 0.070, 0.078);
    // Cheek ruffs (lower tapered feline face)
    d = smin(d, sdEllipsoid(ax, y, z, 0.048, -0.012, 0.018, 0.034, 0.030, 0.038), 0.024);
    // Refined short nasal bridge & twin whisker pads
    d = smin(d, sdCapsule(x, y, z, 0, 0.010, 0.044, 0, -0.004, 0.090, 0.021, 0.014), 0.014);
    d = smin(d, sdEllipsoid(ax, y, z, 0.017, -0.018, 0.078, 0.019, 0.015, 0.021), 0.012);
    // Chin
    d = smin(d, sdEllipsoid(x, y, z, 0, -0.032, 0.066, 0.020, 0.013, 0.022), 0.010);
    // Carved almond orbital sockets
    const socket = sdEllipsoid(ax, y, z, 0.032, 0.015, 0.064, 0.020, 0.016, 0.022);
    return smax(d, -socket, 0.009);
  };

  const catHeadColor = (x, y, z) => {
    const ax = Math.abs(x);
    let r = 0.57;
    let g = 0.51;
    let b = 0.43;

    // Forehead tabby "M" stripes + gentle cheek mascara lines + dark eye margin
    const browStripes = Math.max(0, Math.cos(ax * 145) * (y > 0.016 && z > 0.012 ? 1 : 0));
    const cheekStripe = Math.exp(-Math.pow((y + 0.010) / 0.009, 2)) * (ax > 0.030 && z > 0.01 ? 0.82 : 0);
    const eyeDist = Math.hypot(ax - 0.032, y - 0.015, z - 0.064);
    const eyeRing = Math.exp(-eyeDist * 62);
    // Authentic cream tabby outer "eyeliner" halo ring outside dark lash rim
    const eyeHalo = Math.exp(-Math.pow((eyeDist - 0.023) / 0.0085, 2)) * (z > 0.045 ? 0.62 : 0);
    const dark = Math.min(0.86, browStripes * 0.62 + cheekStripe * 0.62 + eyeRing * 0.68);
    r = THREE.MathUtils.lerp(r, 0.15, dark);
    g = THREE.MathUtils.lerp(g, 0.13, dark);
    b = THREE.MathUtils.lerp(b, 0.11, dark);

    // Warm ivory chin, whisker pads, nose bridge & cream eye halo
    const muzzleCream = Math.exp(-Math.hypot(x / 0.030, (y + 0.020) / 0.020, (z - 0.080) / 0.024));
    const bridgeWarm = Math.exp(-Math.pow(ax / 0.012, 2)) * (z > 0.045 && y > -0.004 && y < 0.028 ? 0.35 : 0);
    const lightTint = Math.min(1, muzzleCream * 0.75 + eyeHalo + bridgeWarm);
    r = THREE.MathUtils.lerp(r, 0.84, lightTint);
    g = THREE.MathUtils.lerp(g, 0.80, lightTint);
    b = THREE.MathUtils.lerp(b, 0.72, lightTint);

    // Subtle dark follicle spots on whisker pads
    const padSpots =
      ax > 0.009 && ax < 0.025 && y > -0.026 && y < -0.010 && z > 0.068
        ? Math.max(0, Math.sin(ax * 620) * Math.sin(y * 540)) * 0.25
        : 0;
    return [r * (1 - padSpots), g * (1 - padSpots), b * (1 - padSpots)];
  };

  const catHeadGeo = surfaceNetsMesh(
    catHeadSdf,
    [-0.11, -0.075, -0.10],
    [0.11, 0.10, 0.125],
    [36, 34, 36],
    catHeadColor,
    4,
  );
  const catHeadMesh = new THREE.Mesh(catHeadGeo, furMat);
  catHeadMesh.name = 'Cat_HeadMesh';
  catHeadMesh.castShadow = true;
  catHeadMesh.receiveShadow = true;
  headPivot.add(catHeadMesh);

  // Sculpted delicate feline pink-terracotta nose leather
  const catNoseSdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEllipsoid(x, y, z, 0, 0.002, 0, 0.011, 0.007, 0.008);
    d = smin(d, sdCapsule(x, y, z, 0, 0.002, 0, 0, -0.006, -0.001, 0.005, 0.0025), 0.004);
    const nostril = sdEllipsoid(ax, y, z, 0.0042, -0.001, 0.0065, 0.002, 0.0022, 0.003);
    return smax(d, -nostril, 0.002);
  };
  const catNoseGeo = surfaceNetsMesh(
    catNoseSdf,
    [-0.016, -0.012, -0.012],
    [0.016, 0.014, 0.014],
    [18, 16, 16],
    () => [0.74, 0.44, 0.42],
    2,
  );
  const nose = new THREE.Mesh(catNoseGeo, noseMat);
  nose.position.set(0, -0.005, 0.100);
  headPivot.add(nose);

  // Delicate curved translucent feline whiskers on muzzle pads & upper superciliary brows
  const whiskerMat = new THREE.MeshStandardMaterial({
    color: 0xeee8dc,
    roughness: 0.32,
    metalness: 0.0,
  });
  [-1, 1].forEach((side) => {
    [
      { oy: -0.012, oz: 0.085, len: 0.078, droop: -0.006, sweep: -0.025 },
      { oy: -0.016, oz: 0.084, len: 0.088, droop: -0.013, sweep: -0.022 },
      { oy: -0.020, oz: 0.082, len: 0.092, droop: -0.020, sweep: -0.018 },
      { oy: -0.025, oz: 0.080, len: 0.076, droop: -0.026, sweep: -0.014 },
    ].forEach((w) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.020, w.oy, w.oz),
        new THREE.Vector3(side * (0.020 + w.len * 0.55), w.oy + w.droop * 0.35, w.oz + w.sweep * 0.45),
        new THREE.Vector3(side * (0.020 + w.len), w.oy + w.droop, w.oz + w.sweep),
      ]);
      const whiskerGeo = new THREE.TubeGeometry(curve, 8, 0.00072, 5, false);
      const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
      headPivot.add(whisker);
    });

    // Upper superciliary brow whiskers above each eye
    [
      { ox: 0.026, oy: 0.036, oz: 0.058, lift: 0.032, out: 0.026, back: -0.022 },
      { ox: 0.034, oy: 0.035, oz: 0.054, lift: 0.026, out: 0.032, back: -0.026 },
    ].forEach((bw) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * bw.ox, bw.oy, bw.oz),
        new THREE.Vector3(side * (bw.ox + bw.out * 0.5), bw.oy + bw.lift * 0.65, bw.oz + bw.back * 0.5),
        new THREE.Vector3(side * (bw.ox + bw.out), bw.oy + bw.lift, bw.oz + bw.back),
      ]);
      const bwGeo = new THREE.TubeGeometry(curve, 7, 0.00062, 5, false);
      headPivot.add(new THREE.Mesh(bwGeo, whiskerMat));
    });
  });

  // Calm recessed almond feline eyes + fur-matched tabby lash lids
  const catLidGeo = new THREE.SphereGeometry(0.0168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54);
  [-1, 1].forEach((side) => {
    const eyePivot = new THREE.Group();
    eyePivot.position.set(side * 0.031, 0.015, 0.059);
    eyePivot.rotation.y = side * 0.02;
    eyePivot.rotation.z = side * 0.10;

    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.0156, 20, 18), eyeMat);
    eyeball.rotation.y = -Math.PI * 0.5;
    eyePivot.add(eyeball);

    const lid = new THREE.Mesh(catLidGeo, catLidMat);
    lid.name = side > 0 ? 'Cat_Lid_L' : 'Cat_Lid_R';
    lid.rotation.x = -0.80;
    eyePivot.add(lid);
    headPivot.add(eyePivot);
  });

  // Sculpted concave triangular cat ears (Cat_Ear_L / Cat_Ear_R) without negative scale
  const makeCatEarGeo = (mirrorSign) => {
    const catEarSdf = (px, py, pz) => {
      const x = px * mirrorSign;
      let d = sdCapsule(x, py, pz, 0, 0, 0, 0.007, 0.078, -0.005, 0.028, 0.006);
      // Hollow inner ear concha facing +Z
      const concha = sdCapsule(x, py, pz, 0, 0.012, 0.022, 0.003, 0.060, 0.012, 0.017, 0.004);
      return smax(d, -concha, 0.005);
    };
    const minX = mirrorSign > 0 ? -0.04 : -0.05;
    const maxX = mirrorSign > 0 ? 0.05 : 0.04;
    return surfaceNetsMesh(
      catEarSdf,
      [minX, -0.02, -0.04],
      [maxX, 0.095, 0.04],
      [22, 28, 22],
      (x, y, z) => {
        const inner = z > 0.005 && y > 0.01 && Math.abs(x) < 0.016 ? 0.65 : 0;
        return [
          THREE.MathUtils.lerp(0.42, 0.72, inner),
          THREE.MathUtils.lerp(0.38, 0.55, inner),
          THREE.MathUtils.lerp(0.34, 0.52, inner),
        ];
      },
      2,
    );
  };

  const earLeftPivot = new THREE.Group();
  earLeftPivot.name = 'Cat_Ear_L';
  earLeftPivot.position.set(0.045, 0.056, -0.005);
  earLeftPivot.rotation.set(0.10, 0.22, -0.22);
  const cEarL = new THREE.Mesh(makeCatEarGeo(1), furMat);
  cEarL.name = 'Cat_EarLMesh';
  cEarL.castShadow = true;
  earLeftPivot.add(cEarL);
  headPivot.add(earLeftPivot);

  const earRightPivot = new THREE.Group();
  earRightPivot.name = 'Cat_Ear_R';
  earRightPivot.position.set(-0.045, 0.056, -0.005);
  earRightPivot.rotation.set(0.10, -0.22, 0.22);
  const cEarR = new THREE.Mesh(makeCatEarGeo(-1), furMat);
  cEarR.name = 'Cat_EarRMesh';
  cEarR.castShadow = true;
  earRightPivot.add(cEarR);
  headPivot.add(earRightPivot);

  // Sinuous curled feline tail (Cat_Tail_Base)
  const tailPivot = new THREE.Group();
  tailPivot.name = 'Cat_Tail_Base';
  tailPivot.position.set(0, 0.032, -0.155);
  chestPivot.add(tailPivot);

  const catTailSdf = (x, y, z) => {
    let d = sdCapsule(x, y, z, 0, 0, 0, -0.10, -0.008, -0.05, 0.021, 0.018);
    d = smin(d, sdCapsule(x, y, z, -0.10, -0.008, -0.05, -0.18, -0.01, 0.05, 0.018, 0.016), 0.018);
    d = smin(d, sdCapsule(x, y, z, -0.18, -0.01, 0.05, -0.145, 0.008, 0.16, 0.016, 0.012), 0.015);
    return d;
  };
  const catTailGeo = surfaceNetsMesh(
    catTailSdf,
    [-0.22, -0.04, -0.10],
    [0.04, 0.04, 0.20],
    [32, 16, 34],
    (x, y, z) => {
      // Tabby tail rings
      const ring = Math.sin((x - z) * 58) > 0.15 ? 0.65 : 0;
      return [
        THREE.MathUtils.lerp(0.49, 0.17, ring),
        THREE.MathUtils.lerp(0.45, 0.15, ring),
        THREE.MathUtils.lerp(0.40, 0.13, ring),
      ];
    },
    3,
  );
  const catTailMesh = new THREE.Mesh(catTailGeo, furMat);
  catTailMesh.name = 'Cat_TailMesh';
  catTailMesh.castShadow = true;
  tailPivot.add(catTailMesh);

  const idleClip = new THREE.AnimationClip('Cat_Idle_Breathing', 4.0, [
    new THREE.VectorKeyframeTrack(
      'Cat_Chest.scale',
      [0, 1.9, 4.0],
      [1, 1, 1, 1.016, 1.007, 1.02, 1, 1, 1],
    ),
    makeQuatTrack(
      'Cat_Ear_L',
      [0, 1.8, 2.2, 2.7, 4.0],
      [
        [0.10, 0.22, -0.24],
        [0.10, 0.22, -0.24],
        [0.14, 0.48, -0.22],
        [0.10, 0.22, -0.24],
        [0.10, 0.22, -0.24],
      ],
    ),
    makeQuatTrack(
      'Cat_Tail_Base',
      [0, 1.6, 3.0, 4.0],
      [
        [0, 0, 0],
        [0, 0.08, 0],
        [0, -0.04, 0],
        [0, 0, 0],
      ],
    ),
  ]);

  const blinkClip = new THREE.AnimationClip('Cat_Blink', 6.8, [
    makeQuatTrack(
      'Cat_Lid_L',
      [0, 3.1, 3.24, 3.4, 6.8],
      [
        [-0.80, 0, 0],
        [-0.80, 0, 0],
        [0.96, 0, 0],
        [-0.80, 0, 0],
        [-0.80, 0, 0],
      ],
    ),
    makeQuatTrack(
      'Cat_Lid_R',
      [0, 3.1, 3.24, 3.4, 6.8],
      [
        [-0.80, 0, 0],
        [-0.80, 0, 0],
        [0.96, 0, 0],
        [-0.80, 0, 0],
        [-0.80, 0, 0],
      ],
    ),
  ]);

  return { root, animations: [idleClip, blinkClip] };
}

// ---------------------------------------------------------------------------
// 5. Export Both Sculpted Animals to /public/models/*.glb
// ---------------------------------------------------------------------------
async function exportModelToGlb(model, outPath) {
  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(model.root, {
    binary: true,
    animations: model.animations,
    onlyVisible: true,
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));
  let totalTris = 0;
  model.root.traverse((o) => {
    if (o.isMesh && o.geometry?.index) {
      totalTris += o.geometry.index.count / 3;
    }
  });
  console.log(`Generated ${outPath}: ${(glbBuffer.byteLength / 1024).toFixed(1)} KB, ${totalTris} triangles`);
}

async function main() {
  const dog = buildGoldenRetrieverModel();
  await exportModelToGlb(dog, path.resolve('public/models/golden_retriever.glb'));

  const cat = buildDomesticCatModel();
  await exportModelToGlb(cat, path.resolve('public/models/domestic_cat.glb'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
