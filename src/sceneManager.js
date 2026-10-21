import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

export class SceneManager {
  constructor(container, onCoordinatesUpdate) {
    this.container = container;
    this.onCoordinatesUpdate = onCoordinatesUpdate;

    // 3D Spatial scales (x1: Red, x2: Blue, x3: Cyan Height)
    this.scaleX = 1.6;
    this.scaleZ = 1.7;
    this.scaleY = 1.5;

    this.currentMode = 'hw1'; // 'hw1' | 'hw2'
    this.currentStep = 0;

    this.targetCameraPos = new THREE.Vector3(15, 12, 16);
    this.targetCameraLook = new THREE.Vector3(3.5, 2.5, 2.5);
    this.isTransitioningCamera = true;
    this.isUserInteracting = false;
    this.userHasCustomView = false;
    this.onAnimate = null;

    this.tracerPos = new THREE.Vector3(0, 0, 0);
    this.targetTracerPos = new THREE.Vector3(0, 0, 0);

    // Dynamic morphing progresses
    this.plane1Progress = 1.0;
    this.targetPlane1Progress = 1.0;
    this.plane2Progress = 1.0;
    this.targetPlane2Progress = 1.0;
    this.plane3Progress = 1.0;
    this.targetPlane3Progress = 1.0;
    this.polyhedronProgress = 1.0;
    this.targetPolyhedronProgress = 1.0;
    this.cut1Progress = 0.0;
    this.targetCut1Progress = 0.0;
    this.cut2Progress = 0.0;
    this.targetCut2Progress = 0.0;
    this.latticeProgress = 1.0;
    this.targetLatticeProgress = 1.0;
    this.sliceProgress = 0.0;
    this.targetSliceProgress = 0.0;

    // Plane Index manual overrides & dynamic state tracking
    this.planeOverrides = {
      plane1: null,
      plane2: null,
      plane3: null,
      cut1: null,
      cut2: null,
      polyhedron: null,
      lattice: null
    };

    this.effectivePlaneStates = {
      plane1: true,
      plane2: true,
      plane3: true,
      cut1: false,
      cut2: false,
      polyhedron: true,
      lattice: true
    };

    this.lastState = null;
    this.onPlaneStatesChanged = null;

    // Audience Excitement: 3D Exploded View & Slicing FX State
    this.explodedProgress = 0.0;
    this.targetExplodedProgress = 0.0;
    this.laserEffectProgress = 0.0;

    // Interactive 3D Integer Lattice Raycaster Inspector
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredLatticeSphere = null;
    this.onLatticePointHover = null;
    this.onLatticePointClick = null;

    this.init();
    this.buildEnvironment();
    this.buildAxesAndLabels();
    this.buildOctantGuide();
    this.buildProblemGeometry(this.currentMode);
    this.buildSimplexTracer();
    this.buildConfettiSystem();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.030);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    this.camera.position.copy(this.targetCameraPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep above floor
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 50;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.2;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 1.6;
    this.controls.target.copy(this.targetCameraLook);

    this.controls.addEventListener('start', () => {
      this.isUserInteracting = true;
      this.isTransitioningCamera = false;
      this.userHasCustomView = true;
    });

    this.controls.addEventListener('end', () => {
      this.isUserInteracting = false;
      this.targetCameraPos.copy(this.camera.position);
      this.targetCameraLook.copy(this.controls.target);
    });

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Interactive 3D Integer Lattice Point Raycaster
    const onCanvasPointerMove = (e) => {
      if (this.isUserInteracting) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const targets = (this.latticePoints || []).filter(p => p.visible);
      const intersects = this.raycaster.intersectObjects(targets, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (this.hoveredLatticeSphere !== hit) {
          if (this.hoveredLatticeSphere) {
            this.hoveredLatticeSphere.scale.set(1, 1, 1);
          }
          this.hoveredLatticeSphere = hit;
          hit.scale.set(1.5, 1.5, 1.5);
          this.renderer.domElement.style.cursor = 'crosshair';

          if (this.onLatticePointHover) {
            this.onLatticePointHover(hit.userData, { clientX: e.clientX, clientY: e.clientY });
          }
        }
      } else {
        if (this.hoveredLatticeSphere) {
          this.hoveredLatticeSphere.scale.set(1, 1, 1);
          this.hoveredLatticeSphere = null;
          this.renderer.domElement.style.cursor = 'default';
          if (this.onLatticePointHover) {
            this.onLatticePointHover(null, null);
          }
        }
      }
    };

    const onCanvasClick = (e) => {
      if (this.hoveredLatticeSphere && this.onLatticePointClick) {
        this.onLatticePointClick(this.hoveredLatticeSphere.userData, { clientX: e.clientX, clientY: e.clientY });
      }
    };

    this.renderer.domElement.addEventListener('pointermove', onCanvasPointerMove);
    this.renderer.domElement.addEventListener('click', onCanvasClick);

    // Cinematic Sci-Fi lighting setup
    const ambientLight = new THREE.AmbientLight(0x1e2640, 0.95);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(14, 22, 14);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const cyanRim = new THREE.PointLight(0x00f0ff, 1.4, 40);
    cyanRim.position.set(10, 12, 12);
    this.scene.add(cyanRim);

    const purpleBack = new THREE.PointLight(0xa855f7, 1.1, 40);
    purpleBack.position.set(-6, 8, -6);
    this.scene.add(purpleBack);

    const warmFill = new THREE.DirectionalLight(0xffb077, 0.45);
    warmFill.position.set(-10, 4, 10);
    this.scene.add(warmFill);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Convert (x1, x2, x3) problem coordinates to 3D world space
  // X = x1 (Red axis), Y = x3 (Cyan Elevation axis), Z = x2 (Blue axis)
  toWorld(x1, x2, x3) {
    return new THREE.Vector3(x1 * this.scaleX, x3 * this.scaleY, x2 * this.scaleZ);
  }

  buildEnvironment() {
    // Holographic dual floor grid
    const gridMajor = new THREE.GridHelper(30, 30, 0x00f0ff, 0x141a29);
    gridMajor.position.set(6, -0.01, 5);
    this.scene.add(gridMajor);

    // Subtle dark circular ground pedestal
    const floorGeo = new THREE.CircleGeometry(24, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.90,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(6, -0.02, 5);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createTextSprite(text, color = '#ffffff', fontSize = 24, bgColor = 'rgba(12, 16, 26, 0.92)', borderColor = '#00f0ff', worldHeight = 0.50) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const renderFontSize = fontSize * 2;
    ctx.font = `bold ${renderFontSize}px "Plus Jakarta Sans", "Segoe UI", Roboto, system-ui, sans-serif`;

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const isTransparent = bgColor === 'transparent';
    const paddingX = isTransparent ? 8 : 24;
    const paddingY = isTransparent ? 4 : 14;
    const w = Math.ceil(textWidth + paddingX * 2);
    const h = Math.ceil(renderFontSize + paddingY * 2);

    canvas.width = w;
    canvas.height = h;

    ctx.font = `bold ${renderFontSize}px "Plus Jakarta Sans", "Segoe UI", Roboto, system-ui, sans-serif`;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      const r = 14;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();

      if (borderColor) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
      }
    }

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    const aspect = w / h;
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.userData = { aspect, worldHeight };
    return sprite;
  }

  buildAxesAndLabels() {
    if (this.axesGroup) this.scene.remove(this.axesGroup);
    this.axesGroup = new THREE.Group();

    const max1 = 6.8;
    const max2 = 4.8;
    const max3 = 6.0;

    // X Axis: x1 (Spatial Axis) - Red
    const xDir = new THREE.Vector3(1, 0, 0);
    const xArrow = new THREE.ArrowHelper(xDir, new THREE.Vector3(0, 0, 0), max1 * this.scaleX, 0xff4757, 0.45, 0.28);
    this.axesGroup.add(xArrow);

    const xLabel = this.createTextSprite('x₁ (Spatial Axis)', '#ff6b81', 20, 'rgba(25, 12, 16, 0.92)', '#ff4757', 0.45);
    xLabel.position.set(max1 * this.scaleX + 0.85, 0.35, 0);
    this.axesGroup.add(xLabel);

    // Z Axis: x2 (Spatial Axis) - Blue
    const zDir = new THREE.Vector3(0, 0, 1);
    const zArrow = new THREE.ArrowHelper(zDir, new THREE.Vector3(0, 0, 0), max2 * this.scaleZ, 0x3867d6, 0.45, 0.28);
    this.axesGroup.add(zArrow);

    const zLabel = this.createTextSprite('x₂ (Spatial Axis)', '#70a1ff', 20, 'rgba(12, 18, 32, 0.92)', '#3867d6', 0.45);
    zLabel.position.set(0, 0.35, max2 * this.scaleZ + 0.85);
    this.axesGroup.add(zLabel);

    // Y Axis: x3 (Spatial Height Axis) - Cyan
    const yDir = new THREE.Vector3(0, 1, 0);
    const yArrow = new THREE.ArrowHelper(yDir, new THREE.Vector3(0, 0, 0), max3 * this.scaleY, 0x00f0ff, 0.45, 0.28);
    this.axesGroup.add(yArrow);

    const yLabel = this.createTextSprite('x₃ (Height Axis)', '#00f0ff', 20, 'rgba(8, 24, 30, 0.92)', '#00f0ff', 0.45);
    yLabel.position.set(0, max3 * this.scaleY + 0.50, 0);
    this.axesGroup.add(yLabel);

    // Clean, minimalist numeric tick marks (no heavy rectangular boxes!)
    for (let i = 1; i <= 6; i++) {
      const tick = this.createTextSprite(`${i}`, '#ff9999', 16, 'transparent', null, 0.28);
      tick.position.set(i * this.scaleX, 0.08, -0.32);
      this.axesGroup.add(tick);
    }

    for (let j = 1; j <= 4; j++) {
      const tick = this.createTextSprite(`${j}`, '#99ccff', 16, 'transparent', null, 0.28);
      tick.position.set(-0.32, 0.08, j * this.scaleZ);
      this.axesGroup.add(tick);
    }

    for (let k = 1; k <= 5; k++) {
      const tick = this.createTextSprite(`${k}`, '#99ffea', 16, 'transparent', null, 0.28);
      tick.position.set(-0.32, k * this.scaleY, -0.32);
      this.axesGroup.add(tick);
    }

    this.scene.add(this.axesGroup);
  }

  buildOctantGuide() {
    if (this.octantGroup) this.scene.remove(this.octantGroup);
    this.octantGroup = new THREE.Group();

    const max1 = 6.0;
    const max2 = 4.0;
    const max3 = 5.0;

    // Plane x1 = 0 (Side Wall in x2-x3)
    const wallX1Geo = new THREE.PlaneGeometry(max2 * this.scaleZ, max3 * this.scaleY);
    const wallX1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const wallX1 = new THREE.Mesh(wallX1Geo, wallX1Mat);
    wallX1.position.set(0, (max3 * this.scaleY) / 2, (max2 * this.scaleZ) / 2);
    wallX1.rotation.y = Math.PI / 2;
    this.octantGroup.add(wallX1);

    // Plane x2 = 0 (Back Wall in x1-x3)
    const wallX2Geo = new THREE.PlaneGeometry(max1 * this.scaleX, max3 * this.scaleY);
    const wallX2Mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const wallX2 = new THREE.Mesh(wallX2Geo, wallX2Mat);
    wallX2.position.set((max1 * this.scaleX) / 2, (max3 * this.scaleY) / 2, 0);
    this.octantGroup.add(wallX2);

    // Plane x3 = 0 (Ground Floor in x1-x2)
    const floorGeo = new THREE.PlaneGeometry(max1 * this.scaleX, max2 * this.scaleZ);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.16, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set((max1 * this.scaleX) / 2, 0.01, (max2 * this.scaleZ) / 2);
    floor.rotation.x = -Math.PI / 2;
    this.octantGroup.add(floor);

    // Inward directional arrows
    const arrowX1 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 2.5 * this.scaleY, 2.0 * this.scaleZ), 1.2, 0x38bdf8, 0.35, 0.22);
    const arrowX2 = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(3.0 * this.scaleX, 2.5 * this.scaleY, 0), 1.2, 0xf43f5e, 0.35, 0.22);
    const arrowX3 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(3.0 * this.scaleX, 0, 2.0 * this.scaleZ), 1.2, 0x10b981, 0.35, 0.22);
    this.octantGroup.add(arrowX1);
    this.octantGroup.add(arrowX2);
    this.octantGroup.add(arrowX3);

    // Badge
    const badge = this.createTextSprite('★ 1st Octant Domain: x₁ ≥ 0, x₂ ≥ 0, x₃ ≥ 0', '#38bdf8', 20, 'rgba(10, 20, 35, 0.95)', '#38bdf8', 0.48);
    badge.position.set((max1 * this.scaleX) / 2, (max3 * this.scaleY) / 2 + 0.5, (max2 * this.scaleZ) / 2);
    badge.visible = false;
    this.octantGroup.add(badge);
    this.octantBadge = badge;

    this.octantGroup.visible = false;
    this.scene.add(this.octantGroup);
  }

  // Construct true 3D constraint plane quad with laser boundary and equation badge
  createPlaneMesh(corners, colorHex, labelText, labelPos) {
    const group = new THREE.Group();
    const geom = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    // Triangulate convex planar polygon
    corners.forEach(c => vertices.push(c.x, c.y, c.z));
    for (let i = 1; i < corners.length - 1; i++) {
      indices.push(0, i, i + 1);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.2,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Perimeter boundary line
    const linePoints = [...corners, corners[0]];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // Glowing laser beam on active edge
    if (corners.length >= 2) {
      const laserGeo = new THREE.BufferGeometry().setFromPoints([corners[1], corners[2] || corners[0]]);
      const laserMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
        linewidth: 3
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      group.add(laser);
      group.userData.laser = laser;
    }

    if (labelText) {
      const label = this.createTextSprite(labelText, '#ffffff', 20, 'rgba(10, 15, 25, 0.92)', colorHex, 0.44);
      label.position.copy(labelPos || corners[0]);
      group.add(label);
      group.userData.label = label;
    }

    group.userData.mesh = mesh;
    group.userData.line = line;
    group.userData.baseOpacity = 0.32;
    return group;
  }

  buildProblemGeometry(mode = 'hw1') {
    if (this.problemGroup) this.scene.remove(this.problemGroup);
    this.problemGroup = new THREE.Group();
    this.currentMode = mode;

    if (mode === 'hw1') {
      this.buildHw1Geometry();
    } else {
      this.buildHw2Geometry();
    }

    this.scene.add(this.problemGroup);
  }

  buildHw1Geometry() {
    // -------------------------------------------------------------------------
    // H.W. 1: Pure Gomory Cutting Plane Method
    // Max z = 3x1 + x2 + 3x3
    // Plane 1 (C1): -x1 + 2x2 + x3 <= 4
    // Plane 2 (C2): 2x2 - 1.5x3 <= 1  (4x2 - 3x3 <= 2)
    // Plane 3 (C3): x1 - 3x2 + 2x3 <= 3
    // Cut 1 (G1): 2x2 - x3 <= 2
    // Cut 2 (G2): x3 <= 2
    // Continuous Optimum: (16/3, 3, 10/3) = (5.333, 3, 3.333) -> Z = 29
    // Integer Optimum: (5, 2, 2) -> Z = 23
    // -------------------------------------------------------------------------

    // 1. Continuous Polytope Vertices
    const V0 = this.toWorld(0, 0, 0);
    const V1 = this.toWorld(0, 0, 1.5);
    const V2 = this.toWorld(0, 0.5, 0);
    const V3 = this.toWorld(0, 1.4, 1.2);
    const V4 = this.toWorld(0, 0.714, 2.571);
    const V5 = this.toWorld(3.0, 0, 0);
    const V6 = this.toWorld(4.5, 0.5, 0);
    const V7 = this.toWorld(5.333, 3.0, 3.333); // Continuous LP Peak!

    const continuousVerts = [V0, V1, V2, V3, V4, V5, V6, V7];
    const polyGeo = new ConvexGeometry(continuousVerts);

    const polyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.42,
      roughness: 0.15,
      metalness: 0.2,
      depthWrite: false
    });
    this.polyhedronMesh = new THREE.Mesh(polyGeo, polyMat);
    const wireGeo = new THREE.WireframeGeometry(polyGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2, transparent: true, opacity: 0.85 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    this.polyhedronMesh.add(wire);
    this.problemGroup.add(this.polyhedronMesh);

    // 2. Plane 1 (C1): -x1 + 2x2 + x3 <= 4  (Cyan)
    const p1Corners = [
      this.toWorld(0, 2, 0),
      this.toWorld(4, 4, 0),
      this.toWorld(6, 4, 2),
      this.toWorld(1, 0, 5),
      this.toWorld(0, 0, 4)
    ];
    this.plane1Mesh = this.createPlaneMesh(
      p1Corners,
      0x00f0ff,
      'Plane 1 (C₁): −x₁ + 2x₂ + x₃ ≤ 4',
      this.toWorld(2.5, 3.8, 2.0)
    );
    this.problemGroup.add(this.plane1Mesh);

    // 3. Plane 2 (C2): 2x2 - 1.5x3 <= 1  (Purple)
    const p2Corners = [
      this.toWorld(0, 0.5, 0),
      this.toWorld(6, 0.5, 0),
      this.toWorld(6, 3.5, 4.0),
      this.toWorld(0, 3.5, 4.0)
    ];
    this.plane2Mesh = this.createPlaneMesh(
      p2Corners,
      0xa855f7,
      'Plane 2 (C₂): 2x₂ − 1.5x₃ ≤ 1',
      this.toWorld(3.0, 3.6, 3.5)
    );
    this.problemGroup.add(this.plane2Mesh);

    // 4. Plane 3 (C3): x1 - 3x2 + 2x3 <= 3  (Amber)
    const p3Corners = [
      this.toWorld(3, 0, 0),
      this.toWorld(0, 0, 1.5),
      this.toWorld(0, 2, 4.5),
      this.toWorld(6, 3, 3)
    ];
    this.plane3Mesh = this.createPlaneMesh(
      p3Corners,
      0xf59e0b,
      'Plane 3 (C₃): x₁ − 3x₂ + 2x₃ ≤ 3',
      this.toWorld(3.2, 0.6, 1.6)
    );
    this.problemGroup.add(this.plane3Mesh);

    // 5. Gomory Cut 1 (G1): 2x2 - x3 <= 2  (Neon Crimson)
    const cut1Corners = [
      this.toWorld(0, 1.0, 0),
      this.toWorld(6, 1.0, 0),
      this.toWorld(6, 3.0, 4.0),
      this.toWorld(0, 3.0, 4.0)
    ];
    this.cut1Mesh = this.createPlaneMesh(
      cut1Corners,
      0xff0055,
      'Gomory Cut 1 (G₁): 2x₂ − x₃ ≤ 2',
      this.toWorld(3.0, 2.5, 3.2)
    );
    this.cut1Mesh.visible = false;
    this.problemGroup.add(this.cut1Mesh);

    // 6. Gomory Cut 2 (G2): x3 <= 2  (Neon Emerald)
    const cut2Corners = [
      this.toWorld(0, 0, 2.0),
      this.toWorld(6, 0, 2.0),
      this.toWorld(6, 4, 2.0),
      this.toWorld(0, 4, 2.0)
    ];
    this.cut2Mesh = this.createPlaneMesh(
      cut2Corners,
      0x38ef7d,
      'Gomory Cut 2 (G₂): x₃ ≤ 2',
      this.toWorld(3.0, 2.0, 2.3)
    );
    this.cut2Mesh.visible = false;
    this.problemGroup.add(this.cut2Mesh);

    // 7. Sliced Fractional Wedge (Wedge sliced off by Cut 1 and Cut 2)
    const wedgeVerts = [
      this.toWorld(5.333, 3.0, 3.333),
      this.toWorld(4.4, 2.6, 3.2),
      this.toWorld(5.0, 2.0, 2.0),
      this.toWorld(4.5, 2.2, 2.4)
    ];
    const wedgeGeo = new ConvexGeometry(wedgeVerts);
    const wedgeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2
    });
    this.slicedWedgeMesh = new THREE.Mesh(wedgeGeo, wedgeMat);
    this.slicedWedgeMesh.visible = false;
    this.problemGroup.add(this.slicedWedgeMesh);

    // 8. 3D Integer Lattice (x1, x2, x3 in Z^3)
    this.buildLatticeHw1();

    // 9. Vertex Markers & Callouts
    this.buildVertexMarkersHw1();
  }

  buildHw2Geometry() {
    // -------------------------------------------------------------------------
    // H.W. 2: Mixed Integer Algorithm
    // Max z = 4x1 + 6x2 + 2x3
    // Plane 1 (C1): 4x1 - 4x2 <= 5
    // Plane 2 (C2): -x1 + 6x2 <= 5
    // Plane 3 (C3): -x1 + x2 + x3 <= 5
    // Cut 1 (G1): x1 <= 2
    // Cut 2 (G2): x3 <= 6
    // Continuous Optimum: (2.5, 1.25, 6.25) -> Z = 30
    // Mixed Optimum: (2, 1, 6) -> Z = 26
    // -------------------------------------------------------------------------

    const V0 = this.toWorld(0, 0, 0);
    const V1 = this.toWorld(0, 0, 5.0);
    const V2 = this.toWorld(0, 0.833, 0);
    const V3 = this.toWorld(0, 0.833, 4.167);
    const V4 = this.toWorld(1.25, 0, 0);
    const V5 = this.toWorld(1.25, 0, 6.25);
    const V6 = this.toWorld(2.5, 1.25, 0);
    const V7 = this.toWorld(2.5, 1.25, 6.25); // Continuous Relaxation Peak

    const polyGeo = new ConvexGeometry([V0, V1, V2, V3, V4, V5, V6, V7]);
    const polyMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.40,
      roughness: 0.15,
      metalness: 0.2,
      depthWrite: false
    });
    this.polyhedronMesh = new THREE.Mesh(polyGeo, polyMat);
    const wireGeo = new THREE.WireframeGeometry(polyGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xc084fc, linewidth: 2, transparent: true, opacity: 0.85 });
    this.polyhedronMesh.add(new THREE.LineSegments(wireGeo, wireMat));
    this.problemGroup.add(this.polyhedronMesh);

    // Plane 1: 4x1 - 4x2 <= 5
    const p1Corners = [
      this.toWorld(1.25, 0, 0),
      this.toWorld(2.5, 1.25, 0),
      this.toWorld(2.5, 1.25, 7.0),
      this.toWorld(1.25, 0, 7.0)
    ];
    this.plane1Mesh = this.createPlaneMesh(p1Corners, 0x00f0ff, 'Plane 1 (C₁): 4x₁ − 4x₂ ≤ 5', this.toWorld(2.0, 0.8, 3.5));
    this.problemGroup.add(this.plane1Mesh);

    // Plane 2: -x1 + 6x2 <= 5
    const p2Corners = [
      this.toWorld(0, 0.833, 0),
      this.toWorld(2.5, 1.25, 0),
      this.toWorld(2.5, 1.25, 7.0),
      this.toWorld(0, 0.833, 7.0)
    ];
    this.plane2Mesh = this.createPlaneMesh(p2Corners, 0xa855f7, 'Plane 2 (C₂): −x₁ + 6x₂ ≤ 5', this.toWorld(1.2, 1.1, 4.0));
    this.problemGroup.add(this.plane2Mesh);

    // Plane 3: -x1 + x2 + x3 <= 5
    const p3Corners = [
      this.toWorld(0, 0, 5.0),
      this.toWorld(1.25, 0, 6.25),
      this.toWorld(2.5, 1.25, 6.25),
      this.toWorld(0, 0.833, 4.167)
    ];
    this.plane3Mesh = this.createPlaneMesh(p3Corners, 0xf59e0b, 'Plane 3 (C₃): −x₁ + x₂ + x₃ ≤ 5', this.toWorld(1.2, 0.5, 6.2));
    this.problemGroup.add(this.plane3Mesh);

    // Mixed Cut 1: x1 <= 2
    const cut1Corners = [
      this.toWorld(2.0, 0, 0),
      this.toWorld(2.0, 2.0, 0),
      this.toWorld(2.0, 2.0, 7.0),
      this.toWorld(2.0, 0, 7.0)
    ];
    this.cut1Mesh = this.createPlaneMesh(cut1Corners, 0xff0055, 'Mixed Cut 1 (G₁): x₁ ≤ 2', this.toWorld(2.0, 1.2, 3.5));
    this.cut1Mesh.visible = false;
    this.problemGroup.add(this.cut1Mesh);

    // Mixed Cut 2: x3 <= 6
    const cut2Corners = [
      this.toWorld(0, 0, 6.0),
      this.toWorld(3.0, 0, 6.0),
      this.toWorld(3.0, 2.0, 6.0),
      this.toWorld(0, 2.0, 6.0)
    ];
    this.cut2Mesh = this.createPlaneMesh(cut2Corners, 0x38ef7d, 'Mixed Cut 2 (G₂): x₃ ≤ 6', this.toWorld(1.5, 1.0, 6.2));
    this.cut2Mesh.visible = false;
    this.problemGroup.add(this.cut2Mesh);

    // Sliced Wedge for HW2
    const wedgeVerts = [
      this.toWorld(2.5, 1.25, 6.25),
      this.toWorld(2.0, 1.167, 5.833),
      this.toWorld(2.0, 1.0, 6.0)
    ];
    const wedgeGeo = new ConvexGeometry(wedgeVerts);
    this.slicedWedgeMesh = new THREE.Mesh(wedgeGeo, new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.45
    }));
    this.slicedWedgeMesh.visible = false;
    this.problemGroup.add(this.slicedWedgeMesh);

    this.buildLatticeHw2();
    this.buildVertexMarkersHw2();
  }

  buildLatticeHw1() {
    this.latticeGroup = new THREE.Group();
    this.latticePoints = [];

    // Feasible check for HW1
    const isFeasible = (x1, x2, x3) => {
      return (-x1 + 2 * x2 + x3 <= 4) &&
             (4 * x2 - 3 * x3 <= 2) &&
             (x1 - 3 * x2 + 2 * x3 <= 3) &&
             x1 >= 0 && x2 >= 0 && x3 >= 0;
    };

    for (let x1 = 0; x1 <= 6; x1++) {
      for (let x2 = 0; x2 <= 3; x2++) {
        for (let x3 = 0; x3 <= 4; x3++) {
          const feas = isFeasible(x1, x2, x3);
          const pos = this.toWorld(x1, x2, x3);
          const isOpt = (x1 === 5 && x2 === 2 && x3 === 2);

          if (feas) {
            const sphereGeo = new THREE.SphereGeometry(isOpt ? 0.18 : 0.11, 16, 16);
            const sphereMat = new THREE.MeshStandardMaterial({
              color: isOpt ? 0xffd700 : 0x00f0ff,
              emissive: isOpt ? 0xffa500 : 0x00a8ff,
              emissiveIntensity: isOpt ? 1.0 : 0.6,
              roughness: 0.1
            });
            const mesh = new THREE.Mesh(sphereGeo, sphereMat);
            mesh.position.copy(pos);
            mesh.userData = {
              isLattice: true,
              x1, x2, x3,
              isOpt,
              feas,
              mode: 'hw1',
              valZ: 3 * x1 + x2 + 3 * x3
            };
            this.latticeGroup.add(mesh);
            this.latticePoints.push(mesh);

            // Vertical beacon pillar to ground
            const groundPos = this.toWorld(x1, x2, 0);
            const lineGeo = new THREE.BufferGeometry().setFromPoints([groundPos, pos]);
            const lineMat = new THREE.LineDashedMaterial({
              color: isOpt ? 0xffd700 : 0x00f0ff,
              dashSize: 0.15,
              gapSize: 0.1,
              opacity: isOpt ? 0.8 : 0.35,
              transparent: true
            });
            const line = new THREE.Line(lineGeo, lineMat);
            line.computeLineDistances();
            this.latticeGroup.add(line);

            if (isOpt) {
              const haloGeo = new THREE.TorusGeometry(0.32, 0.03, 16, 32);
              const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
              const halo = new THREE.Mesh(haloGeo, haloMat);
              halo.rotation.x = Math.PI / 2;
              halo.position.copy(pos);
              halo.visible = false;
              this.latticeGroup.add(halo);
              this.optimumHalo = halo;

              const badge = this.createTextSprite('★ Integer Optimum (5, 2, 2) | Z = 23', '#ffd700', 20, 'rgba(30, 25, 10, 0.95)', '#ffd700', 0.50);
              badge.position.copy(pos).add(new THREE.Vector3(0, 0.65, 0));
              badge.visible = false;
              this.latticeGroup.add(badge);
              this.optimumBadge = badge;
            }
          }
        }
      }
    }

    this.problemGroup.add(this.latticeGroup);
  }

  buildLatticeHw2() {
    this.latticeGroup = new THREE.Group();
    this.latticePoints = [];

    // HW2 Mixed: x1, x3 in Z, x2 in R
    for (let x1 = 0; x1 <= 3; x1++) {
      for (let x3 = 0; x3 <= 7; x3++) {
        const x2 = 1.0;
        const isOpt = (x1 === 2 && x3 === 6);
        const pos = this.toWorld(x1, x2, x3);

        const sphereGeo = new THREE.SphereGeometry(isOpt ? 0.18 : 0.11, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: isOpt ? 0xffd700 : 0xa855f7,
          emissive: isOpt ? 0xffa500 : 0x9333ea,
          emissiveIntensity: isOpt ? 1.0 : 0.6,
          roughness: 0.1
        });
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.position.copy(pos);
        const feas = (4 * x1 - 4 * x2 <= 5) && (-x1 + 6 * x2 <= 5) && (-x1 + x2 + x3 <= 5) && x1 >= 0 && x2 >= 0 && x3 >= 0;
        mesh.userData = {
          isLattice: true,
          x1, x2, x3,
          isOpt,
          feas,
          mode: 'hw2',
          valZ: 4 * x1 + 6 * x2 + 2 * x3
        };
        this.latticeGroup.add(mesh);
        this.latticePoints.push(mesh);

        if (isOpt) {
          const haloGeo = new THREE.TorusGeometry(0.32, 0.03, 16, 32);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = Math.PI / 2;
          halo.position.copy(pos);
          halo.visible = false;
          this.latticeGroup.add(halo);
          this.optimumHalo = halo;

          const badge = this.createTextSprite('★ Mixed Optimum (2, 1, 6) | Z = 26', '#ffd700', 20, 'rgba(30, 25, 10, 0.95)', '#ffd700', 0.50);
          badge.position.copy(pos).add(new THREE.Vector3(0, 0.65, 0));
          badge.visible = false;
          this.latticeGroup.add(badge);
          this.optimumBadge = badge;
        }
      }
    }

    this.problemGroup.add(this.latticeGroup);
  }

  buildVertexMarkersHw1() {
    this.vertexMarkers = [];
    const vList = [
      { stepIndex: 6, pt: [0, 0, 0], label: 'Tableau 1: Origin (0,0,0)', col: 0x94a3b8 },
      { stepIndex: 7, pt: [3, 0, 0], label: 'Tableau 2: (3, 0, 0)', col: 0x38bdf8 },
      { stepIndex: 8, pt: [4.5, 0.5, 0], label: 'Tableau 3: (4.5, 0.5, 0)', col: 0xa855f7 },
      { stepIndex: 9, pt: [5.333, 3.0, 3.333], label: 'Tableau 4 Cont. Opt: (16/3, 3, 10/3)', col: 0x10b981 },
      { stepIndex: 11, pt: [4.4, 2.6, 3.2], label: 'Tableau 6 After Cut 1: (4.4, 2.6, 3.2)', col: 0xff0055 },
      { stepIndex: 13, pt: [5.0, 2.0, 2.0], label: 'Tableau 8 ★ Integer Opt: (5, 2, 2)', col: 0xffd700 }
    ];

    vList.forEach(v => {
      const pos = this.toWorld(v.pt[0], v.pt[1], v.pt[2]);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: v.col, emissive: v.col, emissiveIntensity: 0.85 })
      );
      dot.position.copy(pos);
      dot.visible = false;
      this.problemGroup.add(dot);

      const tag = this.createTextSprite(v.label, '#ffffff', 18, 'rgba(10, 15, 25, 0.90)', v.col, 0.38);
      tag.position.copy(pos).add(new THREE.Vector3(0, 0.45, 0));
      tag.visible = false;
      this.problemGroup.add(tag);
      this.vertexMarkers.push({ dot, tag, pt: v.pt, stepIndex: v.stepIndex });
    });
  }

  buildVertexMarkersHw2() {
    this.vertexMarkers = [];
    const vList = [
      { stepIndex: 6, pt: [0, 0, 0], label: 'Tableau 1: Origin (0,0,0)', col: 0x94a3b8 },
      { stepIndex: 7, pt: [0, 0.833, 0], label: 'Tableau 2: (0, 0.83, 0)', col: 0x38bdf8 },
      { stepIndex: 8, pt: [2.5, 1.25, 0], label: 'Tableau 3: (2.5, 1.25, 0)', col: 0xa855f7 },
      { stepIndex: 9, pt: [2.5, 1.25, 6.25], label: 'Tableau 4 Cont. Opt: (2.5, 1.25, 6.25)', col: 0x10b981 },
      { stepIndex: 13, pt: [2.0, 1.0, 6.0], label: 'Tableau 8 ★ Mixed Opt: (2, 1, 6)', col: 0xffd700 }
    ];

    vList.forEach(v => {
      const pos = this.toWorld(v.pt[0], v.pt[1], v.pt[2]);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: v.col, emissive: v.col, emissiveIntensity: 0.85 })
      );
      dot.position.copy(pos);
      dot.visible = false;
      this.problemGroup.add(dot);

      const tag = this.createTextSprite(v.label, '#ffffff', 18, 'rgba(10, 15, 25, 0.90)', v.col, 0.38);
      tag.position.copy(pos).add(new THREE.Vector3(0, 0.45, 0));
      tag.visible = false;
      this.problemGroup.add(tag);
      this.vertexMarkers.push({ dot, tag, pt: v.pt, stepIndex: v.stepIndex });
    });
  }

  buildSimplexTracer() {
    this.tracerGroup = new THREE.Group();

    // Solution agent sphere
    const sphereGeo = new THREE.SphereGeometry(0.22, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.8
    });
    this.tracerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.tracerGroup.add(this.tracerSphere);

    // Pulsating halo ring
    const ringGeo = new THREE.TorusGeometry(0.36, 0.03, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d });
    this.tracerRing = new THREE.Mesh(ringGeo, ringMat);
    this.tracerRing.rotation.x = Math.PI / 2;
    this.tracerGroup.add(this.tracerRing);

    // Spotlight beam pointing down to ground
    const light = new THREE.PointLight(0x00f0ff, 2.5, 8);
    this.tracerSphere.add(light);

    // Floating solution coordinate badge
    this.tracerHUD = this.createTextSprite('(0, 0, 0) | Z = 0', '#00f0ff', 22, 'rgba(10, 20, 35, 0.92)', '#00f0ff', 0.50);
    this.tracerHUD.position.set(0, 0.70, 0);
    this.tracerGroup.add(this.tracerHUD);

    // Trail line connecting past simplex vertices
    this.trailGeo = new THREE.BufferGeometry();
    this.trailMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.90
    });
    this.trailLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.scene.add(this.trailLine);

    this.scene.add(this.tracerGroup);
  }

  buildConfettiSystem() {
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const colors = [];
    const velocities = [];
    const colChoices = [0xffd700, 0x00f0ff, 0xff0055, 0x38ef7d, 0xa855f7];

    for (let i = 0; i < count; i++) {
      pos.push(5 * this.scaleX, 2 * this.scaleY, 2 * this.scaleZ);
      velocities.push(
        (Math.random() - 0.5) * 0.10,
        Math.random() * 0.14 + 0.04,
        (Math.random() - 0.5) * 0.10
      );
      const c = new THREE.Color(colChoices[Math.floor(Math.random() * colChoices.length)]);
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.confettiPoints = new THREE.Points(geo, mat);
    this.confettiVelocities = velocities;
    this.confettiPoints.visible = false;
    this.scene.add(this.confettiPoints);
  }

  triggerConfetti() {
    this.confettiActive = true;
    this.confettiPoints.visible = true;
    const posAttr = this.confettiPoints.geometry.attributes.position;
    const origin = this.currentMode === 'hw1' ? this.toWorld(5, 2, 2) : this.toWorld(2, 1, 6);
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setXYZ(i, origin.x, origin.y, origin.z);
    }
    posAttr.needsUpdate = true;
  }

  updateTrail(points) {
    if (!points || points.length === 0) return;
    const worldPoints = points.map(p => this.toWorld(p[0], p[1], p[2]));
    if (this.trailGeo) this.trailGeo.dispose();
    this.trailGeo = new THREE.BufferGeometry().setFromPoints(worldPoints);
    if (this.trailLine) this.trailLine.geometry = this.trailGeo;
  }

  updateVisualState(state) {
    if (!state) return;

    // Check if problem mode changed (hw1 vs hw2)
    const mode = state.problemMode || 'hw1';
    if (this.currentMode !== mode) {
      this.buildProblemGeometry(mode);
    }

    // Active Point LERP target
    if (state.activePoint) {
      this.targetTracerPos = this.toWorld(state.activePoint[0], state.activePoint[1], state.activePoint[2]);

      const x1 = (Math.round(state.activePoint[0] * 100) / 100).toFixed(2);
      const x2 = (Math.round(state.activePoint[1] * 100) / 100).toFixed(2);
      const x3 = (Math.round(state.activePoint[2] * 100) / 100).toFixed(2);
      const isHw2 = mode === 'hw2';
      const Z = isHw2
        ? (4 * Number(x1) + 6 * Number(x2) + 2 * Number(x3)).toFixed(2)
        : (3 * Number(x1) + 1 * Number(x2) + 3 * Number(x3)).toFixed(2);

      const labelText = `(${x1}, ${x2}, ${x3}) | Z = ${Z}`;
      this.tracerGroup.remove(this.tracerHUD);
      this.tracerHUD = this.createTextSprite(labelText, '#00f0ff', 22, 'rgba(10, 20, 35, 0.92)', '#00f0ff', 0.50);
      this.tracerHUD.position.set(0, 0.70, 0);
      this.tracerGroup.add(this.tracerHUD);

      if (this.onCoordinatesUpdate) {
        this.onCoordinatesUpdate({ x1, x2, x3, Z });
      }
    }

    // Camera targets - auto-glide if user is not actively interacting
    if (!this.userHasCustomView) {
      if (state.cameraTarget) {
        const look = this.toWorld(state.cameraTarget[0], state.cameraTarget[1], state.cameraTarget[2]);
        this.targetCameraLook.copy(look);
      }
      if (state.cameraPosition) {
        this.targetCameraPos.set(...state.cameraPosition);
      }
      this.isTransitioningCamera = true;
    }

    this.lastState = state;

    if (this.octantGroup) {
      this.octantGroup.visible = !!state.showOctant;
      if (this.octantBadge) {
        this.octantBadge.visible = (state.stepIndex === 1);
      }
    }
    if (this.tracerGroup) {
      this.tracerGroup.visible = !state.hideTracer;
    }

    // Step-aware vertex markers: avoid clutter, show only active step label
    if (this.vertexMarkers) {
      this.vertexMarkers.forEach(vm => {
        if (state.stepIndex < 6) {
          // Pre-solving phase (graph creation & problem overview): clean view
          vm.dot.visible = false;
          vm.tag.visible = false;
        } else {
          // Solving phase: show dots for visited vertices, show tag ONLY for active vertex
          if (vm.stepIndex < state.stepIndex) {
            vm.dot.visible = true;
            vm.tag.visible = false;
          } else if (vm.stepIndex === state.stepIndex) {
            vm.dot.visible = true;
            vm.tag.visible = true;
          } else {
            vm.dot.visible = false;
            vm.tag.visible = false;
          }
        }
      });
    }

    // Optimum beacon & star halo only appear when reached at final step
    const isFinalOptimum = state.stepIndex === 13 || !!state.celebrate;
    if (this.optimumBadge) this.optimumBadge.visible = isFinalOptimum;
    if (this.optimumHalo) this.optimumHalo.visible = isFinalOptimum;
    if (isFinalOptimum && this.tracerHUD) {
      this.tracerHUD.visible = false;
    }

    // Determine natural visibilities from presentationData state
    const naturalP1 = state.showPlane1 !== undefined ? !!state.showPlane1 : true;
    const naturalP2 = state.showPlane2 !== undefined ? !!state.showPlane2 : true;
    const naturalP3 = state.showPlane3 !== undefined ? !!state.showPlane3 : true;
    const naturalCut1 = !!state.showCut1;
    const naturalCut2 = !!state.showCut2;
    const naturalPoly = state.showPolyhedron !== undefined ? !!state.showPolyhedron : true;
    const naturalLattice = state.showLattice !== undefined ? !!state.showLattice : true;

    // Apply manual overrides if user clicked toggle switches in 3D Plane Index
    const p1 = this.planeOverrides.plane1 !== null ? this.planeOverrides.plane1 : naturalP1;
    const p2 = this.planeOverrides.plane2 !== null ? this.planeOverrides.plane2 : naturalP2;
    const p3 = this.planeOverrides.plane3 !== null ? this.planeOverrides.plane3 : naturalP3;
    const c1 = this.planeOverrides.cut1 !== null ? this.planeOverrides.cut1 : naturalCut1;
    const c2 = this.planeOverrides.cut2 !== null ? this.planeOverrides.cut2 : naturalCut2;
    const poly = this.planeOverrides.polyhedron !== null ? this.planeOverrides.polyhedron : naturalPoly;
    const lat = this.planeOverrides.lattice !== null ? this.planeOverrides.lattice : naturalLattice;

    this.effectivePlaneStates = {
      plane1: p1,
      plane2: p2,
      plane3: p3,
      cut1: c1,
      cut2: c2,
      polyhedron: poly,
      lattice: lat
    };

    if (this.onPlaneStatesChanged) {
      this.onPlaneStatesChanged(this.effectivePlaneStates);
    }

    // Set animation targets
    this.targetPlane1Progress = p1 ? 1.0 : 0.0;
    this.targetPlane2Progress = p2 ? 1.0 : 0.0;
    this.targetPlane3Progress = p3 ? 1.0 : 0.0;
    this.targetCut1Progress = c1 ? 1.0 : 0.0;
    this.targetCut2Progress = c2 ? 1.0 : 0.0;
    this.targetPolyhedronProgress = poly ? 1.0 : 0.0;
    this.targetLatticeProgress = lat ? 1.0 : 0.0;
    this.targetSliceProgress = (c1 || c2) ? 1.0 : 0.0;

    // Trail update
    if (state.simplexPath) {
      this.updateTrail(state.simplexPath);
    }

    // Celebration
    if (state.celebrate || state.stepIndex === 8) {
      this.triggerConfetti();
    } else {
      this.confettiActive = false;
      if (this.confettiPoints) this.confettiPoints.visible = false;
    }
  }

  setPlaneVisibility(planeKey, isVisible) {
    this.planeOverrides[planeKey] = isVisible;
    if (this.lastState) {
      this.updateVisualState(this.lastState);
    }
  }

  togglePlane(planeKey) {
    const current = (this.effectivePlaneStates && this.effectivePlaneStates[planeKey]) !== undefined
      ? this.effectivePlaneStates[planeKey]
      : false;
    this.setPlaneVisibility(planeKey, !current);
    return !current;
  }

  toggleAllPlanes(forceVisible = null) {
    const eff = this.effectivePlaneStates || {};
    const anyActive = Object.values(eff).some(v => !!v);
    const targetState = forceVisible !== null ? forceVisible : !anyActive;
    ['plane1', 'plane2', 'plane3', 'cut1', 'cut2', 'polyhedron', 'lattice'].forEach(k => {
      this.planeOverrides[k] = targetState;
    });
    if (this.lastState) {
      this.updateVisualState(this.lastState);
    }
  }

  clearPlaneOverrides() {
    this.planeOverrides = {
      plane1: null,
      plane2: null,
      plane3: null,
      cut1: null,
      cut2: null,
      polyhedron: null,
      lattice: null
    };
  }

  toggleAutoRotate(forceState = null) {
    if (!this.controls) return false;
    if (forceState !== null) {
      this.controls.autoRotate = forceState;
    } else {
      this.controls.autoRotate = !this.controls.autoRotate;
    }
    return this.controls.autoRotate;
  }

  toggleExplodedView(forceState = null) {
    if (forceState !== null) {
      this.targetExplodedProgress = forceState ? 1.0 : 0.0;
    } else {
      this.targetExplodedProgress = this.targetExplodedProgress > 0.5 ? 0.0 : 1.0;
    }
    return this.targetExplodedProgress > 0.5;
  }

  triggerLaserSliceFX(cutNum = 1) {
    const cutMesh = cutNum === 2 ? this.cut2Mesh : this.cut1Mesh;
    if (!cutMesh) return;

    cutMesh.visible = true;
    if (cutNum === 1) this.targetCut1Progress = 1.0;
    if (cutNum === 2) this.targetCut2Progress = 1.0;
    this.targetSliceProgress = 1.0;

    // Pulse laser edge
    if (cutMesh.userData.mesh) {
      const origEmissive = cutMesh.userData.mesh.material.emissiveIntensity;
      cutMesh.userData.mesh.material.emissiveIntensity = 2.5;
      setTimeout(() => {
        if (cutMesh.userData && cutMesh.userData.mesh) {
          cutMesh.userData.mesh.material.emissiveIntensity = origEmissive;
        }
      }, 500);
    }

    // Dynamic camera swoop towards cut plane
    this.userHasCustomView = false;
    this.isTransitioningCamera = true;
    this.targetCameraPos.set(12, 10, 14);
    this.targetCameraLook.set(3.5, 2.0, 2.0);
  }

  setCameraView(view) {
    this.userHasCustomView = false;
    this.isTransitioningCamera = true;

    if (view === 'top') {
      this.targetCameraPos.set(4.0, 22.0, 3.5);
      this.targetCameraLook.set(4.0, 0.0, 3.5);
    } else if (view === 'front') {
      this.targetCameraPos.set(4.0, 3.5, 20.0);
      this.targetCameraLook.set(4.0, 3.5, 0.0);
    } else if (view === 'side') {
      this.targetCameraPos.set(22.0, 3.5, 3.5);
      this.targetCameraLook.set(0.0, 3.5, 3.5);
    } else if (view === 'vertex') {
      this.targetCameraPos.set(
        this.tracerPos.x + 4.5,
        this.tracerPos.y + 3.0,
        this.tracerPos.z + 4.5
      );
      this.targetCameraLook.copy(this.tracerPos);
    } else {
      // Perspective
      this.targetCameraPos.set(15, 12, 16);
      this.targetCameraLook.set(3.5, 2.5, 2.5);
    }
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    const t = time * 0.001;

    // Smooth OrbitControls update (rotates camera when autoRotate is true)
    if (this.controls && !this.isTransitioningCamera) {
      this.controls.update();
    }

    // Smooth Camera gliding
    if (this.isTransitioningCamera && !this.isUserInteracting) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      this.controls.target.lerp(this.targetCameraLook, 0.06);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05 &&
          this.controls.target.distanceTo(this.targetCameraLook) < 0.05) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetCameraLook);
        this.isTransitioningCamera = false;
      }
    }

    // Exploded View expansion
    this.explodedProgress = THREE.MathUtils.lerp(this.explodedProgress, this.targetExplodedProgress, 0.08);
    const exp = this.explodedProgress * 2.2;

    if (this.plane1Mesh) {
      const n1 = this.currentMode === 'hw1' ? new THREE.Vector3(-0.4, 0.8, 0.4) : new THREE.Vector3(0.8, -0.8, 0);
      this.plane1Mesh.position.copy(n1.multiplyScalar(exp));
    }
    if (this.plane2Mesh) {
      const n2 = this.currentMode === 'hw1' ? new THREE.Vector3(0, 0.8, -0.6) : new THREE.Vector3(-0.3, 0.9, 0);
      this.plane2Mesh.position.copy(n2.multiplyScalar(exp));
    }
    if (this.plane3Mesh) {
      const n3 = this.currentMode === 'hw1' ? new THREE.Vector3(0.5, -0.7, 0.5) : new THREE.Vector3(-0.5, 0.5, 0.7);
      this.plane3Mesh.position.copy(n3.multiplyScalar(exp));
    }
    if (this.cut1Mesh) {
      const nc1 = this.currentMode === 'hw1' ? new THREE.Vector3(0, 0.8, -0.5) : new THREE.Vector3(1, 0, 0);
      this.cut1Mesh.position.copy(nc1.multiplyScalar(exp));
    }
    if (this.cut2Mesh) {
      const nc2 = new THREE.Vector3(0, 0, 1);
      this.cut2Mesh.position.copy(nc2.multiplyScalar(exp));
    }

    // Smooth Tracer gliding along Simplex vertex path
    this.tracerPos.lerp(this.targetTracerPos, 0.08);
    this.tracerGroup.position.copy(this.tracerPos);

    // Tracer pulsating ring rotation
    if (this.tracerRing) {
      this.tracerRing.rotation.z += 0.02;
      const s = 1.0 + Math.sin(t * 5) * 0.08;
      this.tracerRing.scale.set(s, s, s);
    }

    // Dynamic morphing interpolation
    const ease = 0.08;
    this.plane1Progress = THREE.MathUtils.lerp(this.plane1Progress, this.targetPlane1Progress, ease);
    this.plane2Progress = THREE.MathUtils.lerp(this.plane2Progress, this.targetPlane2Progress, ease);
    this.plane3Progress = THREE.MathUtils.lerp(this.plane3Progress, this.targetPlane3Progress, ease);
    this.cut1Progress = THREE.MathUtils.lerp(this.cut1Progress, this.targetCut1Progress, ease);
    this.cut2Progress = THREE.MathUtils.lerp(this.cut2Progress, this.targetCut2Progress, ease);
    this.polyhedronProgress = THREE.MathUtils.lerp(this.polyhedronProgress, this.targetPolyhedronProgress, ease);
    this.latticeProgress = THREE.MathUtils.lerp(this.latticeProgress, this.targetLatticeProgress, ease);
    this.sliceProgress = THREE.MathUtils.lerp(this.sliceProgress, this.targetSliceProgress, 0.05);

    // Apply visibilities & opacities
    if (this.plane1Mesh) {
      this.plane1Mesh.visible = this.plane1Progress > 0.01;
      this.plane1Mesh.userData.mesh.material.opacity = 0.32 * this.plane1Progress;
      if (this.plane1Mesh.userData.label) this.plane1Mesh.userData.label.visible = this.plane1Progress > 0.5;
    }

    if (this.plane2Mesh) {
      this.plane2Mesh.visible = this.plane2Progress > 0.01;
      this.plane2Mesh.userData.mesh.material.opacity = 0.32 * this.plane2Progress;
      if (this.plane2Mesh.userData.label) this.plane2Mesh.userData.label.visible = this.plane2Progress > 0.5;
    }

    if (this.plane3Mesh) {
      this.plane3Mesh.visible = this.plane3Progress > 0.01;
      this.plane3Mesh.userData.mesh.material.opacity = 0.32 * this.plane3Progress;
      if (this.plane3Mesh.userData.label) this.plane3Mesh.userData.label.visible = this.plane3Progress > 0.5;
    }

    if (this.cut1Mesh) {
      this.cut1Mesh.visible = this.cut1Progress > 0.01;
      const pulse = 0.35 + Math.sin(t * 6) * 0.12;
      this.cut1Mesh.userData.mesh.material.opacity = pulse * this.cut1Progress;
      if (this.cut1Mesh.userData.label) this.cut1Mesh.userData.label.visible = this.cut1Progress > 0.4;
    }

    if (this.cut2Mesh) {
      this.cut2Mesh.visible = this.cut2Progress > 0.01;
      const pulse = 0.35 + Math.cos(t * 6) * 0.12;
      this.cut2Mesh.userData.mesh.material.opacity = pulse * this.cut2Progress;
      if (this.cut2Mesh.userData.label) this.cut2Mesh.userData.label.visible = this.cut2Progress > 0.4;
    }

    if (this.polyhedronMesh) {
      this.polyhedronMesh.visible = this.polyhedronProgress > 0.01;
      this.polyhedronMesh.material.opacity = 0.40 * this.polyhedronProgress;
    }

    if (this.latticeGroup) {
      this.latticeGroup.visible = this.latticeProgress > 0.01;
    }

    // Sliced wedge drifting away animation
    if (this.slicedWedgeMesh) {
      this.slicedWedgeMesh.visible = this.sliceProgress > 0.05 && (this.cut1Progress > 0.5 || this.cut2Progress > 0.5);
      if (this.slicedWedgeMesh.visible) {
        this.slicedWedgeMesh.position.set(
          this.sliceProgress * 0.4,
          this.sliceProgress * 0.6,
          this.sliceProgress * 0.4
        );
        this.slicedWedgeMesh.material.opacity = 0.45 * (1 - this.sliceProgress * 0.6);
      }
    }

    // Confetti particles update
    if (this.confettiActive && this.confettiPoints.visible) {
      const posAttr = this.confettiPoints.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let x = posAttr.getX(i) + this.confettiVelocities[i * 3];
        let y = posAttr.getY(i) + this.confettiVelocities[i * 3 + 1];
        let z = posAttr.getZ(i) + this.confettiVelocities[i * 3 + 2];

        this.confettiVelocities[i * 3 + 1] -= 0.002; // gravity

        if (y < 0) {
          y = 0;
          this.confettiVelocities[i * 3 + 1] *= -0.3; // bounce
        }

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    if (this.onAnimate) {
      this.onAnimate();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
