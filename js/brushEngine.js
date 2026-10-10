import * as THREE from 'three';

export const BRUSH_PRESETS = {
  TUBE: 'tube',
  RIBBON: 'ribbon',
  SPARKLE: 'sparkle',
  CRYSTAL: 'crystal',
  VOXEL: 'voxel',
  PLASMA: 'plasma',
  WIREFRAME: 'wireframe'
};

export class BrushEngine {
  constructor(materialManager, camera = null) {
    this.materialManager = materialManager;
    this.camera = camera;
    this.currentPreset = BRUSH_PRESETS.TUBE;
    this.brushSize = 0.8;
    this.taper = true;
    this.smoothness = 8;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setPreset(preset) {
    this.currentPreset = preset;
  }

  setSize(size) {
    this.brushSize = parseFloat(size);
  }

  generateStrokeMesh(points, color, materialType, camera = this.camera) {
    if (!points || points.length === 0) return null;

    if (points.length === 1) {
      return this.createDotStroke(points[0], color, materialType);
    }

    const filteredPoints = [points[0]];
    for (let i = 1; i < points.length; i++) {
      if (filteredPoints[filteredPoints.length - 1].distanceTo(points[i]) > 0.1) {
        filteredPoints.push(points[i]);
      }
    }

    if (filteredPoints.length < 2) {
      return this.createDotStroke(filteredPoints[0], color, materialType);
    }

    switch (this.currentPreset) {
      case BRUSH_PRESETS.TUBE:
        return this.createTubeStroke(filteredPoints, color, materialType);

      case BRUSH_PRESETS.RIBBON:
        return this.createRibbonStroke(filteredPoints, color, materialType, camera);

      case BRUSH_PRESETS.SPARKLE:
        return this.createSparkleStroke(filteredPoints, color);

      case BRUSH_PRESETS.CRYSTAL:
        return this.createCrystalStroke(filteredPoints, color, materialType);

      case BRUSH_PRESETS.VOXEL:
        return this.createVoxelStroke(filteredPoints, color, materialType);

      case BRUSH_PRESETS.PLASMA:
        return this.createPlasmaStroke(filteredPoints, color, materialType);

      case BRUSH_PRESETS.WIREFRAME:
        return this.createWireframeStroke(filteredPoints, color, materialType);

      default:
        return this.createTubeStroke(filteredPoints, color, materialType);
    }
  }

  createDotStroke(point, color, materialType) {
    const radius = Math.max(0.1, this.brushSize * 0.4);
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(point);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createTubeStroke(points, color, materialType) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const tubularSegments = Math.max(points.length * 8, 32);
    const radius = Math.max(0.05, this.brushSize * 0.35);
    const radialSegments = 8;

    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createWireframeStroke(points, color, materialType) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const tubularSegments = Math.max(points.length * 8, 32);
    const radius = Math.max(0.05, this.brushSize * 0.35);
    const radialSegments = 5;

    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    const mat = this.materialManager.createMaterial({
      color,
      type: materialType,
      overrides: { wireframe: true }
    });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  createRibbonStroke(points, color, materialType, camera = null) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const segments = Math.max(points.length * 8, 32);
    const sampledPoints = curve.getPoints(segments);
    const tangents = [];
    for (let i = 0; i <= segments; i++) {
      tangents.push(curve.getTangent(i / segments));
    }

    const positions = [];
    const uvs = [];
    const normals = [];
    const indices = [];

    const refDir = new THREE.Vector3(0, 0, -1);
    if (camera) {
      camera.getWorldDirection(refDir);
    }

    const baseWidth = this.brushSize * 0.9;

    for (let i = 0; i <= segments; i++) {
      const pt = sampledPoints[i];
      const tangent = tangents[i];

      let side = new THREE.Vector3().crossVectors(tangent, refDir).normalize();
      if (side.lengthSq() < 0.001) {
        side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      }

      const progress = i / segments;
      let taper = Math.sin(progress * Math.PI);
      taper = THREE.MathUtils.clamp(taper * 1.5, 0.2, 1.0);
      const halfWidth = (baseWidth * 0.5) * taper;

      const pLeft = pt.clone().addScaledVector(side, halfWidth);
      const pRight = pt.clone().addScaledVector(side, -halfWidth);

      positions.push(pLeft.x, pLeft.y, pLeft.z);
      positions.push(pRight.x, pRight.y, pRight.z);

      const norm = new THREE.Vector3().crossVectors(side, tangent).normalize();
      normals.push(norm.x, norm.y, norm.z);
      normals.push(norm.x, norm.y, norm.z);

      uvs.push(0, progress);
      uvs.push(1, progress);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createSparkleStroke(points, color) {
    const particleMultiplier = 16;
    const particleCount = points.length * particleMultiplier;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      for (let j = 0; j < particleMultiplier; j++) {
        const idx = (i * particleMultiplier + j) * 3;
        const spread = this.brushSize * 0.7;
        positions[idx] = p.x + (Math.random() - 0.5) * spread;
        positions[idx + 1] = p.y + (Math.random() - 0.5) * spread;
        positions[idx + 2] = p.z + (Math.random() - 0.5) * spread;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = this.materialManager.createPointMaterial(color, this.brushSize * 1.8);
    const pointsMesh = new THREE.Points(geo, mat);
    pointsMesh.frustumCulled = false;
    return pointsMesh;
  }

  createCrystalStroke(points, color, materialType) {
    const group = new THREE.Group();
    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const crystalGeo = new THREE.ConeGeometry(this.brushSize * 0.4, this.brushSize * 1.4, 5);

    points.forEach((p, idx) => {
      if (idx % 2 === 0 || points.length <= 2) {
        const crystal = new THREE.Mesh(crystalGeo, mat);
        crystal.position.copy(p);
        crystal.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        const scale = 0.6 + Math.random() * 0.8;
        crystal.scale.set(scale, scale, scale);
        crystal.castShadow = true;
        group.add(crystal);
      }
    });

    return group;
  }

  createVoxelStroke(points, color, materialType) {
    const group = new THREE.Group();
    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const voxelSize = Math.max(0.1, this.brushSize * 0.7);
    const boxGeo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    points.forEach((p) => {
      const box = new THREE.Mesh(boxGeo, mat);
      box.position.set(
        Math.round(p.x / voxelSize) * voxelSize,
        Math.round(p.y / voxelSize) * voxelSize,
        Math.round(p.z / voxelSize) * voxelSize
      );
      box.castShadow = true;
      group.add(box);
    });

    return group;
  }

  createPlasmaStroke(points, color, materialType) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const tubularSegments = Math.max(points.length * 10, 40);
    const radius = Math.max(0.05, this.brushSize * 0.35);

    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const jitter = (Math.random() - 0.5) * (this.brushSize * 0.3);
      pos.setX(i, pos.getX(i) + jitter);
      pos.setY(i, pos.getY(i) + jitter);
      pos.setZ(i, pos.getZ(i) + jitter);
    }
    geo.computeVertexNormals();

    const mat = this.materialManager.createMaterial({ color, type: materialType });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }
}
