import * as THREE from 'three';

export const CANVAS_MODES = {
  DISTANCE_LOCK: 'camera', 
  FRONT: 'xy',
  FLOOR: 'xz',
  SIDE: 'yz'
};

export class DrawController {
  constructor(scene, camera, renderer, brushEngine, materialManager, symmetryController, envManager) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.brushEngine = brushEngine;
    this.materialManager = materialManager;
    this.symmetryController = symmetryController;
    this.envManager = envManager;

    this.isDrawing = false;
    this.currentStrokePoints = [];

    this.canvasMode = CANVAS_MODES.DISTANCE_LOCK;
    this.drawDistance = 15.0;
    this.planeOffset = 0.0;
    this.showCanvasGuide = true;

    this.strokeHistory = [];
    this.redoStack = [];

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.plane = new THREE.Plane();
    this.planeNormal = new THREE.Vector3(0, 0, 1);

    this.previewGroup = new THREE.Group();
    this.scene.add(this.previewGroup);

    this.cursorGizmo = this.createCursorGizmo();
    this.scene.add(this.cursorGizmo);

    this.setupDrawingPlaneGuide();
    this.updatePlane();
  }

  createCursorGizmo() {
    const geo = new THREE.RingGeometry(0.25, 0.35, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.visible = false;
    return ring;
  }

  setupDrawingPlaneGuide() {
    
    const size = 50;
    const divisions = 25;
    this.planeGuideMesh = new THREE.GridHelper(size, divisions, 0x38bdf8, 0x1e293b);
    
    this.planeGuideMesh.rotation.x = Math.PI / 2;
    this.planeGuideMesh.material.transparent = true;
    this.planeGuideMesh.material.opacity = 0.25;
    this.planeGuideMesh.material.depthWrite = false;
    this.scene.add(this.planeGuideMesh);
  }

  setCanvasMode(mode) {
    this.canvasMode = mode;
    this.updatePlane();
  }

  setDrawDistance(dist) {
    this.drawDistance = Math.max(2.0, parseFloat(dist));
    this.updatePlane();
  }

  setPlaneOffset(offset) {
    this.planeOffset = parseFloat(offset);
    this.updatePlane();
  }

  setCanvasGuideVisible(visible) {
    this.showCanvasGuide = visible;
    if (this.planeGuideMesh) this.planeGuideMesh.visible = visible;
  }

  updatePlane() {
    if (this.canvasMode === CANVAS_MODES.DISTANCE_LOCK) {
      
      const cameraDir = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDir);
      cameraDir.normalize();

      const planeCenter = this.camera.position.clone().add(cameraDir.clone().multiplyScalar(this.drawDistance));
      this.planeNormal.copy(cameraDir).negate();
      this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, planeCenter);

      if (this.planeGuideMesh && this.showCanvasGuide) {
        this.planeGuideMesh.position.copy(planeCenter);
        this.planeGuideMesh.lookAt(planeCenter.clone().add(cameraDir));
        this.planeGuideMesh.rotation.z = 0;
        this.planeGuideMesh.visible = true;
      }
      return;
    }

    if (this.canvasMode === CANVAS_MODES.FRONT) {
      
      this.planeNormal.set(0, 0, 1);
      this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, new THREE.Vector3(0, 0, this.planeOffset));
      if (this.planeGuideMesh && this.showCanvasGuide) {
        this.planeGuideMesh.position.set(0, 0, this.planeOffset);
        this.planeGuideMesh.rotation.set(Math.PI / 2, 0, 0);
        this.planeGuideMesh.visible = true;
      }
    } else if (this.canvasMode === CANVAS_MODES.FLOOR) {
      
      this.planeNormal.set(0, 1, 0);
      this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, new THREE.Vector3(0, this.planeOffset, 0));
      if (this.planeGuideMesh && this.showCanvasGuide) {
        this.planeGuideMesh.position.set(0, this.planeOffset, 0);
        this.planeGuideMesh.rotation.set(0, 0, 0);
        this.planeGuideMesh.visible = true;
      }
    } else if (this.canvasMode === CANVAS_MODES.SIDE) {
      
      this.planeNormal.set(1, 0, 0);
      this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, new THREE.Vector3(this.planeOffset, 0, 0));
      if (this.planeGuideMesh && this.showCanvasGuide) {
        this.planeGuideMesh.position.set(this.planeOffset, 0, 0);
        this.planeGuideMesh.rotation.set(0, 0, Math.PI / 2);
        this.planeGuideMesh.visible = true;
      }
    }
  }

  get3DPoint(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.updatePlane();

    const hit = new THREE.Vector3();
    const isHit = this.raycaster.ray.intersectPlane(this.plane, hit);

    if (isHit) {
      return hit;
    } else {
      const fallback = new THREE.Vector3();
      this.raycaster.ray.at(this.drawDistance, fallback);
      return fallback;
    }
  }

  updateCursorGizmo(clientX, clientY) {
    const pt = this.get3DPoint(clientX, clientY);
    if (pt) {
      this.cursorGizmo.position.copy(pt);
      this.cursorGizmo.lookAt(this.camera.position);
      const scale = this.brushEngine.brushSize;
      this.cursorGizmo.scale.set(scale, scale, scale);
      this.cursorGizmo.visible = true;
    } else {
      this.cursorGizmo.visible = false;
    }
  }

  startStroke(clientX, clientY) {
    const pt = this.get3DPoint(clientX, clientY);
    if (!pt) return;

    this.isDrawing = true;
    this.currentStrokePoints = [pt];
    this.redoStack = []; 
    this.updatePreviewMesh();
  }

  continueStroke(clientX, clientY) {
    if (!this.isDrawing) return;
    const pt = this.get3DPoint(clientX, clientY);
    if (!pt) return;

    const lastPt = this.currentStrokePoints[this.currentStrokePoints.length - 1];
    if (lastPt && lastPt.distanceTo(pt) > 0.08) {
      this.currentStrokePoints.push(pt);
      this.updatePreviewMesh();
    }
  }

  updatePreviewMesh() {
    while (this.previewGroup.children.length > 0) {
      const obj = this.previewGroup.children[0];
      this.previewGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    if (this.currentStrokePoints.length === 0) return;

    const pointSets = this.symmetryController.getTransformedPointSets(this.currentStrokePoints);
    const color = this.materialManager.currentColor;
    const matType = this.materialManager.currentMaterialType;

    pointSets.forEach(pts => {
      const mesh = this.brushEngine.generateStrokeMesh(pts, color, matType, this.camera);
      if (mesh) this.previewGroup.add(mesh);
    });
  }

  endStroke() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    while (this.previewGroup.children.length > 0) {
      const obj = this.previewGroup.children[0];
      this.previewGroup.remove(obj);
    }

    if (this.currentStrokePoints.length === 0) {
      return;
    }

    const pointSets = this.symmetryController.getTransformedPointSets(this.currentStrokePoints);
    const color = this.materialManager.currentColor;
    const matType = this.materialManager.currentMaterialType;
    const strokeGroup = new THREE.Group();

    pointSets.forEach(pts => {
      const mesh = this.brushEngine.generateStrokeMesh(pts, color, matType, this.camera);
      if (mesh) strokeGroup.add(mesh);
    });

    if (strokeGroup.children.length > 0) {
      this.scene.add(strokeGroup);
      this.strokeHistory.push(strokeGroup);
    }

    this.currentStrokePoints = [];
  }

  undo() {
    if (this.strokeHistory.length === 0) return;
    const lastStroke = this.strokeHistory.pop();
    this.scene.remove(lastStroke);
    this.redoStack.push(lastStroke);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const stroke = this.redoStack.pop();
    this.scene.add(stroke);
    this.strokeHistory.push(stroke);
  }

  clear() {
    while (this.strokeHistory.length > 0) {
      const stroke = this.strokeHistory.pop();
      this.scene.remove(stroke);
    }
    this.redoStack = [];
  }
}
