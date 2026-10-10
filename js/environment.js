import * as THREE from 'three';

export const ENV_PRESETS = {
  CYBERPUNK: 'cyberpunk',
  STUDIO: 'studio',
  VOID: 'void',
  SUNSET: 'sunset'
};

export class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
    this.currentPreset = ENV_PRESETS.CYBERPUNK;

    this.gridHelper = null;
    this.lights = [];

    this.initLights();
    this.initGrid();
    this.applyPreset(ENV_PRESETS.CYBERPUNK);
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    this.dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    this.dirLight1.position.set(40, 60, 40);
    this.scene.add(this.dirLight1);
    this.lights.push(this.dirLight1);

    this.dirLight2 = new THREE.DirectionalLight(0xec4899, 0.8);
    this.dirLight2.position.set(-40, -20, -40);
    this.scene.add(this.dirLight2);
    this.lights.push(this.dirLight2);
  }

  initGrid() {
    
    this.gridHelper = new THREE.GridHelper(60, 60, 0x06b6d4, 0x1e293b);
    this.gridHelper.position.set(0, 0, 0);
    this.scene.add(this.gridHelper);
  }

  toggleGrid(visible) {
    if (this.gridHelper) this.gridHelper.visible = visible;
  }

  applyPreset(preset) {
    this.currentPreset = preset;
    switch (preset) {
      case ENV_PRESETS.CYBERPUNK:
        this.scene.background = new THREE.Color(0x060913);
        this.ambientLight.color.set(0x1e1b4b);
        this.ambientLight.intensity = 0.5;
        this.dirLight1.color.set(0x06b6d4);
        this.dirLight2.color.set(0xec4899);
        break;

      case ENV_PRESETS.STUDIO:
        this.scene.background = new THREE.Color(0x121216);
        this.ambientLight.color.set(0xffffff);
        this.ambientLight.intensity = 0.8;
        this.dirLight1.color.set(0xfffbeb);
        this.dirLight2.color.set(0xe0f2fe);
        break;

      case ENV_PRESETS.VOID:
        this.scene.background = new THREE.Color(0x000000);
        this.ambientLight.color.set(0x27272a);
        this.ambientLight.intensity = 0.3;
        this.dirLight1.color.set(0x38bdf8);
        this.dirLight2.color.set(0xa855f7);
        break;

      case ENV_PRESETS.SUNSET:
        this.scene.background = new THREE.Color(0x180928);
        this.ambientLight.color.set(0x4c1d95);
        this.ambientLight.intensity = 0.6;
        this.dirLight1.color.set(0xf59e0b);
        this.dirLight2.color.set(0xf43f5e);
        break;
    }
  }
}
