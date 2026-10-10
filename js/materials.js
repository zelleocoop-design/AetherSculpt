import * as THREE from 'three';

export const MATERIAL_TYPES = {
  GLOW: 'glow',
  METALLIC: 'metallic',
  GLASS: 'glass',
  CLAY: 'clay',
  RAINBOW: 'rainbow',
  WIRE: 'wire',
  GLOSSY: 'glossy',
  IRIDESCENT: 'iridescent'
};

export const MATERIAL_CONFIGS = {
  [MATERIAL_TYPES.GLOW]: {
    name: 'Neon Glow',
    type: 'MeshStandardMaterial',
    roughness: 0.2,
    metalness: 0.1,
    emissiveIntensity: 2.5
  },
  [MATERIAL_TYPES.METALLIC]: {
    name: 'Liquid Chrome',
    type: 'MeshStandardMaterial',
    roughness: 0.05,
    metalness: 0.95,
    emissiveIntensity: 0.0
  },
  [MATERIAL_TYPES.GLASS]: {
    name: 'Crystal Glass',
    type: 'MeshPhysicalMaterial',
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.88,
    ior: 1.5,
    transparent: true,
    opacity: 0.75,
    emissiveIntensity: 0.1
  },
  [MATERIAL_TYPES.CLAY]: {
    name: 'Matte Clay',
    type: 'MeshStandardMaterial',
    roughness: 0.9,
    metalness: 0.05,
    emissiveIntensity: 0.0
  },
  [MATERIAL_TYPES.GLOSSY]: {
    name: 'Gloss Lacquer',
    type: 'MeshPhysicalMaterial',
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.0,
    emissiveIntensity: 0.0
  },
  [MATERIAL_TYPES.IRIDESCENT]: {
    name: 'Iridescent Pearl',
    type: 'MeshPhysicalMaterial',
    roughness: 0.2,
    metalness: 0.3,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    clearcoat: 0.8,
    emissiveIntensity: 0.0
  },
  [MATERIAL_TYPES.WIRE]: {
    name: 'Wireframe',
    type: 'MeshBasicMaterial',
    wireframe: true
  }
};

let particleTextureCache = null;
export function getParticleTexture() {
  if (particleTextureCache) return particleTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  particleTextureCache = new THREE.CanvasTexture(canvas);
  return particleTextureCache;
}

export class MaterialManager {
  constructor() {
    this.currentColor = '#38bdf8';
    this.currentMaterialType = MATERIAL_TYPES.GLOW;
    this.roughness = 0.3;
    this.metalness = 0.8;
    this.opacity = 1.0;
    this.brightnessMultiplier = 1.0; 
  }

  setColor(hexStr) {
    this.currentColor = hexStr;
  }

  setMaterialType(type) {
    this.currentMaterialType = type;
  }

  setBrightness(multiplier) {
    this.brightnessMultiplier = Math.max(0.1, parseFloat(multiplier));
  }

  createMaterial(options = {}) {
    const colorHex = options.color || this.currentColor;
    const type = options.type || this.currentMaterialType;
    const baseColor = new THREE.Color(colorHex);
    const threeColor = baseColor.clone().multiplyScalar(this.brightnessMultiplier);
    const overrides = options.overrides || {};

    if (type === MATERIAL_TYPES.RAINBOW) {
      const vertexShader = `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      const fragmentShader = `
        varying vec3 vPosition;
        uniform float uBrightness;
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        void main() {
          float hue = fract(vPosition.x * 0.05 + vPosition.y * 0.05 + vPosition.z * 0.05);
          vec3 rgb = hsv2rgb(vec3(hue, 0.85, 1.0)) * uBrightness;
          gl_FragColor = vec4(rgb, 1.0);
        }
      `;
      return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uBrightness: { value: this.brightnessMultiplier }
        },
        side: THREE.DoubleSide
      });
    }

    if (type === MATERIAL_TYPES.WIRE || overrides.wireframe) {
      return new THREE.MeshBasicMaterial({
        color: threeColor,
        wireframe: true,
        side: THREE.DoubleSide
      });
    }

    const cfg = MATERIAL_CONFIGS[type] || MATERIAL_CONFIGS[MATERIAL_TYPES.GLOW];

    let material;
    if (cfg.type === 'MeshPhysicalMaterial') {
      material = new THREE.MeshPhysicalMaterial({
        color: threeColor,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
        clearcoat: cfg.clearcoat || 0,
        clearcoatRoughness: cfg.clearcoatRoughness || 0,
        transmission: cfg.transmission || 0,
        ior: cfg.ior || 1.5,
        transparent: !!cfg.transparent,
        opacity: cfg.opacity ?? 1.0,
        iridescence: cfg.iridescence || 0,
        iridescenceIOR: cfg.iridescenceIOR || 1.3,
        side: THREE.DoubleSide
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: threeColor,
        roughness: cfg.roughness,
        metalness: cfg.metalness,
        side: THREE.DoubleSide
      });
    }

    if (cfg.emissiveIntensity > 0 || overrides.isGlow) {
      material.emissive = baseColor.clone();
      const baseIntensity = overrides.emissiveIntensity ?? (cfg.emissiveIntensity || 2.2);
      material.emissiveIntensity = baseIntensity * this.brightnessMultiplier;
    }

    return material;
  }

  createPointMaterial(colorHex, size = 1.6) {
    const baseColor = new THREE.Color(colorHex || this.currentColor);
    const col = baseColor.clone().multiplyScalar(this.brightnessMultiplier);
    return new THREE.PointsMaterial({
      color: col,
      size: size,
      map: getParticleTexture(),
      transparent: true,
      opacity: Math.min(1.0, 0.95 * this.brightnessMultiplier),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
}
