import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export class SceneExporter {
  static exportToGLTF(strokeHistory, scene = null) {
    if (!strokeHistory || strokeHistory.length === 0) {
      alert('No 3D strokes to export! Draw something first.');
      return;
    }

    const exportGroup = new THREE.Group();
    strokeHistory.forEach(stroke => exportGroup.add(stroke.clone()));

    const exporter = new GLTFExporter();
    const options = {
      binary: true,
      onlyVisible: true
    };

    exporter.parse(
      exportGroup,
      (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `AetherSculpt_Art_${Date.now()}.glb`;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      (error) => {
        console.error('GLTF Export Error:', error);
        alert('Failed to export glTF/GLB model.');
      },
      options
    );
  }

  static exportScreenshot(renderer, scene, camera, composer = null) {
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `AetherSculpt_Capture_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  static exportToOBJ(strokeHistory) {
    if (!strokeHistory || strokeHistory.length === 0) {
      alert('No 3D strokes to export! Draw something first.');
      return;
    }

    let objContent = '# AetherSculpt 3D Studio Export\n# https://aethersculpt.3d\n\n';
    let vertexOffset = 1;

    strokeHistory.forEach((strokeGroup, groupIdx) => {
      objContent += `o Stroke_${groupIdx + 1}\n`;

      strokeGroup.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const geo = child.geometry.isBufferGeometry ? child.geometry : new THREE.BufferGeometry().fromGeometry(child.geometry);
          const pos = geo.attributes.position;
          if (!pos) return;

          child.updateWorldMatrix(true, false);
          const matrix = child.matrixWorld;

          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(matrix);
            objContent += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
          }

          if (geo.index) {
            const indices = geo.index.array;
            for (let i = 0; i < indices.length; i += 3) {
              const a = indices[i] + vertexOffset;
              const b = indices[i + 1] + vertexOffset;
              const c = indices[i + 2] + vertexOffset;
              objContent += `f ${a} ${b} ${c}\n`;
            }
          } else {
            for (let i = 0; i < pos.count; i += 3) {
              objContent += `f ${i + vertexOffset} ${i + 1 + vertexOffset} ${i + 2 + vertexOffset}\n`;
            }
          }

          vertexOffset += pos.count;
        }
      });
      objContent += '\n';
    });

    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AetherSculpt_Artwork_${Date.now()}.obj`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
