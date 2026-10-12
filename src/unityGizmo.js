import * as THREE from 'three';

/**
 * Unity-style Scene View Viewport Orientation Gizmo
 * Faithfully recreates Unity Editor's iconic coordinate orientation gizmo:
 * - Center cube
 * - Red (X), Green (Y), Blue (Z) directional cones with labels
 * - White opposing cones (-X, -Y, -Z)
 * - '< Persp' / '< Iso' text display underneath
 * - Synchronized in real time with the main Three.js camera rotation
 * - Interactive raycasting: clicking axes smoothly navigates the main camera
 */
export class UnityGizmo {
  constructor(mainCamera, mainControls, domElement, onAxisClick) {
    this.mainCamera = mainCamera;
    this.mainControls = mainControls;
    this.domElement = domElement;
    this.onAxisClick = onAxisClick;

    this.width = 120;
    this.height = 140;

    this.initScene();
    this.initMeshes();
    this.initRaycaster();
  }

  initScene() {
    this.scene = new THREE.Scene();

    // Dedicated orthographic camera for the gizmo
    const frustumSize = 2.4;
    const aspect = this.width / this.height;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(3, 4, 5);
    this.scene.add(dirLight);

    // Root group that mirrors main camera rotation
    this.gizmoGroup = new THREE.Group();
    this.scene.add(this.gizmoGroup);
  }

  initMeshes() {
    this.clickableObjects = [];

    // Center cube
    const cubeGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.3,
      metalness: 0.2
    });
    this.centerCube = new THREE.Mesh(cubeGeo, cubeMat);
    this.centerCube.userData = { axis: 'center' };
    this.gizmoGroup.add(this.centerCube);
    this.clickableObjects.push(this.centerCube);

    // Axis definitions (Unity colors: X=Red #e04b4b, Y=Green #63c938, Z=Blue #3b82f6)
    const axes = [
      { name: 'x', dir: new THREE.Vector3(1, 0, 0), color: 0xd94343, label: 'x' },
      { name: 'y', dir: new THREE.Vector3(0, 1, 0), color: 0x5ebd3e, label: 'y' },
      { name: 'z', dir: new THREE.Vector3(0, 0, 1), color: 0x367be2, label: 'z' },
      { name: '-x', dir: new THREE.Vector3(-1, 0, 0), color: 0xcccccc, label: '' },
      { name: '-y', dir: new THREE.Vector3(0, -1, 0), color: 0xcccccc, label: '' },
      { name: '-z', dir: new THREE.Vector3(0, 0, -1), color: 0xcccccc, label: '' },
    ];

    const coneGeo = new THREE.ConeGeometry(0.18, 0.36, 16);
    // Align cone to point along +Y initially
    coneGeo.translate(0, 0.18, 0);

    axes.forEach(axis => {
      const coneMat = new THREE.MeshStandardMaterial({
        color: axis.color,
        roughness: 0.3,
        metalness: 0.1
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);

      // Orient cone along axis direction
      if (axis.dir.x === 1) {
        cone.rotation.z = -Math.PI / 2;
        cone.position.set(0.38, 0, 0);
      } else if (axis.dir.x === -1) {
        cone.rotation.z = Math.PI / 2;
        cone.position.set(-0.38, 0, 0);
      } else if (axis.dir.y === 1) {
        cone.position.set(0, 0.38, 0);
      } else if (axis.dir.y === -1) {
        cone.rotation.z = Math.PI;
        cone.position.set(0, -0.38, 0);
      } else if (axis.dir.z === 1) {
        cone.rotation.x = Math.PI / 2;
        cone.position.set(0, 0, 0.38);
      } else if (axis.dir.z === -1) {
        cone.rotation.x = -Math.PI / 2;
        cone.position.set(0, 0, -0.38);
      }

      cone.userData = { axis: axis.name };
      this.gizmoGroup.add(cone);
      this.clickableObjects.push(cone);
    });
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.domElement.addEventListener('pointerdown', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.clickableObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const axis = hit.userData.axis;
        if (this.onAxisClick) {
          this.onAxisClick(axis);
        }
      }
    });

    // Hover effect
    this.domElement.addEventListener('pointermove', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.clickableObjects);
      this.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    });
  }

  update() {
    if (!this.mainCamera) return;

    // Invert the main camera rotation so the gizmo matches what the viewer sees
    this.gizmoGroup.quaternion.copy(this.mainCamera.quaternion).invert();

    this.renderer.render(this.scene, this.camera);
  }
}
