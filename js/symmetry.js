import * as THREE from 'three';

export const SYMMETRY_MODES = {
  NONE: 'none',
  MIRROR_X: 'mirror_x',
  MIRROR_Y: 'mirror_y',
  MIRROR_Z: 'mirror_z',
  RADIAL_4: 'radial_4',
  RADIAL_8: 'radial_8'
};

export class SymmetryController {
  constructor() {
    this.mode = SYMMETRY_MODES.NONE;
  }

  setMode(mode) {
    this.mode = mode;
  }

  getTransformedPointSets(points) {
    if (!points || points.length === 0) return [];
    const sets = [points];

    switch (this.mode) {
      case SYMMETRY_MODES.MIRROR_X: {
        const mirrorX = points.map(p => new THREE.Vector3(-p.x, p.y, p.z));
        sets.push(mirrorX);
        break;
      }
      case SYMMETRY_MODES.MIRROR_Y: {
        const mirrorY = points.map(p => new THREE.Vector3(p.x, -p.y, p.z));
        sets.push(mirrorY);
        break;
      }
      case SYMMETRY_MODES.MIRROR_Z: {
        const mirrorZ = points.map(p => new THREE.Vector3(p.x, p.y, -p.z));
        sets.push(mirrorZ);
        break;
      }
      case SYMMETRY_MODES.RADIAL_4: {
        for (let i = 1; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const rotated = points.map(p => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return new THREE.Vector3(p.x * cos - p.z * sin, p.y, p.x * sin + p.z * cos);
          });
          sets.push(rotated);
        }
        break;
      }
      case SYMMETRY_MODES.RADIAL_8: {
        for (let i = 1; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const rotated = points.map(p => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return new THREE.Vector3(p.x * cos - p.z * sin, p.y, p.x * sin + p.z * cos);
          });
          sets.push(rotated);
        }
        break;
      }
      default:
        break;
    }

    return sets;
  }
}
