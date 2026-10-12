import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(container, onCoordinatesUpdate) {
    this.container = container;
    this.onCoordinatesUpdate = onCoordinatesUpdate;

    this.scaleX = 2.0; // World units per unit x1
    this.scaleZ = 2.0; // World units per unit x2
    this.scaleY = 0.55; // World units per unit Profit Z

    this.currentStep = 0;
    this.targetCameraPos = new THREE.Vector3(14.5, 11.0, 15.5);
    this.targetCameraLook = new THREE.Vector3(3.8, 2.4, 3.8);
    this.isTransitioningCamera = true;
    this.isUserInteracting = false;
    this.userHasCustomView = false;
    this.onAnimate = null;

    this.tracerPos = new THREE.Vector3(0, 0, 0);
    this.targetTracerPos = new THREE.Vector3(0, 0, 0);

    // Smooth Shaping Progress for Planes and Polytope
    this.nonNegProgress = 0.0;
    this.targetNonNegProgress = 0.0;
    this.isNonNegStep = false;
    this.woodProgress = 0.0;
    this.targetWoodProgress = 0.0;
    this.laborProgress = 0.0;
    this.targetLaborProgress = 0.0;
    this.ceilingProgress = 0.0;
    this.targetCeilingProgress = 0.0;
    this.prismProgress = 0.0;
    this.targetPrismProgress = 0.0;
    this.cutPlaneProgress = 0.0;
    this.targetCutPlaneProgress = 0.0;
    this.latticeProgress = 0.0;
    this.targetLatticeProgress = 0.0;
    this.cutSliceProgress = 0; // 0 to 1 for wedge slice animation
    this.targetSliceProgress = 0;

    // Plane Index manual overrides & dynamic state tracking
    this.planeOverrides = {
      nonNegX1: null,
      nonNegX2: null,
      nonNegZ: null,
      wood: null,
      labor: null,
      polyhedron: null,
      objective: null,
      cut: null,
      lattice: null
    };
    this.effectivePlaneStates = {
      nonNegX1: false,
      nonNegX2: false,
      nonNegZ: false,
      wood: false,
      labor: false,
      polyhedron: false,
      objective: false,
      cut: false,
      lattice: false
    };
    this.lastState = null;
    this.onPlaneStatesChanged = null;

    this.init();
    this.buildEnvironment();
    this.buildAxesAndLabels();
    this.buildFeasibleRegions();
    this.buildIntegerLattice();
    this.buildCuttingPlane();
    this.buildSimplexTracer();
    this.buildConfettiSystem();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1017);
    this.scene.fog = new THREE.FogExp2(0x0e1017, 0.035);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(14.5, 11.0, 15.5);

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
    this.controls.maxDistance = 40;
    this.controls.target.set(3.8, 2.4, 3.8);

    // Allow user to freely drag, rotate, and zoom without snaps
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

    // Responsive resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.35);
    fillLight.position.set(-8, 10, -8);
    this.scene.add(fillLight);

    const accentLight = new THREE.PointLight(0x9d4edd, 0.8, 15);
    accentLight.position.set(3, 4, 3);
    this.scene.add(accentLight);
  }

  toWorld(x1, Z, x2) {
    return new THREE.Vector3(x1 * this.scaleX, Z * this.scaleY, x2 * this.scaleZ);
  }

  buildEnvironment() {
    // High-tech Unity grid floor
    const gridMajor = new THREE.GridHelper(20, 20, 0x00f0ff, 0x1f2738);
    gridMajor.position.set(5, -0.01, 5);
    this.scene.add(gridMajor);

    // Floor reflector plane
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d13,
      roughness: 0.85,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(5, -0.02, 5);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createTextSprite(text, color = '#ffffff', fontSize = 24, bgColor = 'rgba(12, 16, 26, 0.90)', borderColor = '#00f0ff', worldHeight = 0.52) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const renderFontSize = fontSize * 2;
    ctx.font = `bold ${renderFontSize}px "Segoe UI", Roboto, system-ui, -apple-system, sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const padX = Math.round(renderFontSize * 0.7);
    const padY = Math.round(renderFontSize * 0.35);

    const w = textWidth + padX * 2;
    const h = renderFontSize + padY * 2;

    canvas.width = Math.max(64, w);
    canvas.height = Math.max(32, h);

    // Redraw on perfectly sized canvas
    ctx.font = `bold ${renderFontSize}px "Segoe UI", Roboto, system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(3, Math.round(renderFontSize * 0.08));
    ctx.beginPath();
    const radius = Math.min(canvas.height / 2, 22);
    ctx.roundRect(ctx.lineWidth, ctx.lineWidth, canvas.width - ctx.lineWidth * 2, canvas.height - ctx.lineWidth * 2, radius);
    ctx.fill();
    ctx.stroke();

    // Text centered cleanly
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.userData = { worldHeight, aspect };
    return sprite;
  }

  buildAxesAndLabels() {
    this.axesGroup = new THREE.Group();

    const axisMax1 = 5.5;
    const axisMax2 = 5.5;
    const axisMaxZ = 9.5;

    // X Axis: x1 (Desks - $200) - Red/Orange
    const xDir = new THREE.Vector3(1, 0, 0);
    const xArrow = new THREE.ArrowHelper(xDir, new THREE.Vector3(0, 0, 0), axisMax1 * this.scaleX, 0xff5555, 0.45, 0.28);
    this.axesGroup.add(xArrow);

    // Z Axis: x2 (Chairs - $300) - Blue
    const zDir = new THREE.Vector3(0, 0, 1);
    const zArrow = new THREE.ArrowHelper(zDir, new THREE.Vector3(0, 0, 0), axisMax2 * this.scaleZ, 0x3a86ff, 0.45, 0.28);
    this.axesGroup.add(zArrow);

    // Y Axis: Profit Z - Green/Gold
    const yDir = new THREE.Vector3(0, 1, 0);
    const yArrow = new THREE.ArrowHelper(yDir, new THREE.Vector3(0, 0, 0), axisMaxZ * this.scaleY, 0x00f5d4, 0.45, 0.28);
    this.axesGroup.add(yArrow);

    // Explicit axis labels with correlations in brackets
    const xLabel = this.createTextSprite('x₁ (Desks - $200)', '#ff7070', 24, 'rgba(30, 15, 15, 0.90)', '#ff4444', 0.55);
    xLabel.position.set(axisMax1 * this.scaleX + 0.85, 0.45, 0);
    this.axesGroup.add(xLabel);

    const zLabel = this.createTextSprite('x₂ (Chairs - $300)', '#70a4ff', 24, 'rgba(15, 20, 35, 0.90)', '#3a86ff', 0.55);
    zLabel.position.set(0, 0.45, axisMax2 * this.scaleZ + 0.85);
    this.axesGroup.add(zLabel);

    const yLabel = this.createTextSprite('Profit Z = 2x₁ + 3x₂ ($)', '#00f5d4', 24, 'rgba(10, 30, 25, 0.90)', '#00f5d4', 0.55);
    yLabel.position.set(0, axisMaxZ * this.scaleY + 0.45, 0);
    this.axesGroup.add(yLabel);

    // Tick marks on x1 axis (1 to 5) - elevated above floor grid
    for (let i = 1; i <= 5; i++) {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * this.scaleX, 0.02, -0.16),
        new THREE.Vector3(i * this.scaleX, 0.02, 0.16)
      ]);
      const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xff5555, linewidth: 2 }));
      this.axesGroup.add(tickLine);

      const tick = this.createTextSprite(`${i}`, '#ffaaaa', 20, 'rgba(25, 15, 15, 0.85)', '#ff5555', 0.36);
      tick.position.set(i * this.scaleX, 0.06, -0.45);
      this.axesGroup.add(tick);
    }

    // Tick marks on x2 axis (1 to 5) - elevated above floor grid
    for (let j = 1; j <= 5; j++) {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.16, 0.02, j * this.scaleZ),
        new THREE.Vector3(0.16, 0.02, j * this.scaleZ)
      ]);
      const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0x3a86ff, linewidth: 2 }));
      this.axesGroup.add(tickLine);

      const tick = this.createTextSprite(`${j}`, '#aaccff', 20, 'rgba(15, 20, 35, 0.85)', '#3a86ff', 0.36);
      tick.position.set(-0.45, 0.06, j * this.scaleZ);
      this.axesGroup.add(tick);
    }

    // Tick marks on Profit Z axis (2, 4, 6, 8)
    for (let k = 2; k <= 8; k += 2) {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.16, k * this.scaleY, 0),
        new THREE.Vector3(0.16, k * this.scaleY, 0)
      ]);
      const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0x00f5d4, linewidth: 2 }));
      this.axesGroup.add(tickLine);

      const tick = this.createTextSprite(`${k} ($${k * 100})`, '#a7f3d0', 18, 'rgba(10, 25, 20, 0.85)', '#00f5d4', 0.36);
      tick.position.set(-0.55, k * this.scaleY, -0.55);
      this.axesGroup.add(tick);
    }

    this.scene.add(this.axesGroup);
  }

  buildFeasibleRegions() {
    this.regionsGroup = new THREE.Group();

    // 1. Continuous Polytope (Prism from floor to Objective Plane)
    // Vertices on floor: (0,0), (2.5,0), (5/3, 5/3), (0, 2.5)
    // Profit Z: (0,0)->0, (2.5,0)->5, (5/3, 5/3)->8.333, (0, 2.5)->7.5
    const floorO = this.toWorld(0, 0, 0);
    const floorA = this.toWorld(2.5, 0, 0);
    const floorB = this.toWorld(5/3, 0, 5/3);
    const floorC = this.toWorld(0, 0, 2.5);

    const topO = this.toWorld(0, 0, 0);
    const topA = this.toWorld(2.5, 5, 0);
    const topB = this.toWorld(5/3, 25/3, 5/3);
    const topC = this.toWorld(0, 7.5, 2.5);

    // Cut integer points:
    // Slicing at x1 + x2 = 3:
    // Intersects Wood line (2x1 + x2 = 5) at (2, 1), Z = 7
    // Intersects Labor line (x1 + 2x2 = 5) at (1, 2), Z = 8
    const floorCut1 = this.toWorld(2, 0, 1);
    const floorCut2 = this.toWorld(1, 0, 2);
    const topCut1 = this.toWorld(2, 7, 1);
    const topCut2 = this.toWorld(1, 8, 2);

    // Build Continuous Full Region Mesh (Emerald Glass)
    this.continuousMesh = this.createPrismMesh([
      { floor: floorO, top: topO },
      { floor: floorA, top: topA },
      { floor: floorB, top: topB },
      { floor: floorC, top: topC }
    ], 0x10b981, 0.42);
    this.regionsGroup.add(this.continuousMesh);

    // Build Integer Trimmed Region Mesh (after Gomory cut)
    this.integerMesh = this.createPrismMesh([
      { floor: floorO, top: topO },
      { floor: floorA, top: topA },
      { floor: floorCut1, top: topCut1 },
      { floor: floorCut2, top: topCut2 },
      { floor: floorC, top: topC }
    ], 0x3b82f6, 0.45);
    this.integerMesh.visible = false;
    this.regionsGroup.add(this.integerMesh);

    // Build Sliced-off Fractional Wedge Mesh (Triangle: Cut1, B, Cut2)
    this.slicedWedgeMesh = this.createPrismMesh([
      { floor: floorCut1, top: topCut1 },
      { floor: floorB, top: topB },
      { floor: floorCut2, top: topCut2 }
    ], 0xef4444, 0.5);
    this.slicedWedgeMesh.visible = false;
    this.regionsGroup.add(this.slicedWedgeMesh);

    // Full constraint line endpoints on the (x1, x2) floor axis plane
    const floorWoodExt = this.toWorld(0, 0, 5);
    const floorLaborExt = this.toWorld(5, 0, 0);

    // UNIFORM VERTICAL WALL HEIGHT (parallel to Z-axis, flat level top edge, constant Z = 8.5)
    // 2-variable constraints have NO Z, so their 3D boundary planes extend straight vertically!
    const wallHeightZ = 8.5;
    const topWallA = this.toWorld(2.5, wallHeightZ, 0);
    const topWallB = this.toWorld(5/3, wallHeightZ, 5/3);
    const topWallC = this.toWorld(0, wallHeightZ, 2.5);
    const topWallWoodExt = this.toWorld(0, wallHeightZ, 5);
    const topWallLaborExt = this.toWorld(5, wallHeightZ, 0);

    // Constraint boundary wall 1: Wood (2x1 + x2 = 5) - uniform level top edge!
    this.woodWall = this.createWallMesh(floorA, floorWoodExt, topWallA, topWallWoodExt, 0x00f0ff, 'Wood Plane: 2x₁ + 1x₂ = 5 (≤ 5)', false, 0.68);
    this.regionsGroup.add(this.woodWall);

    // Constraint boundary wall 2: Labor (x1 + 2x2 = 5) - uniform level top edge!
    this.laborWall = this.createWallMesh(floorLaborExt, floorC, topWallLaborExt, topWallC, 0xa855f7, 'Labor Plane: 1x₁ + 2x₂ = 5 (≤ 5)', false, 0.32);
    this.regionsGroup.add(this.laborWall);

    // 2D Floor Axis Plane Constraint Lines & Feasible Footprints
    this.floorWoodLine = this.createFloorConstraintLine(floorA, floorWoodExt, 0x00f0ff, 'Wood Constraint: 2x₁ + 1x₂ = 5');
    this.floorLaborLine = this.createFloorConstraintLine(floorLaborExt, floorC, 0xa855f7, 'Labor Constraint: 1x₁ + 2x₂ = 5');
    this.floorFeasibleArea = this.createFloorPolygonMesh([floorO, floorA, floorB, floorC], 0x10b981, 0.32);

    // 2D Floor Shaded Inequality Half-Planes (Wood: 2x₁ + x₂ ≤ 5; Labor: x₁ + 2x₂ ≤ 5)
    this.floorWoodHalfPlane = this.createFloorPolygonMesh([floorO, floorA, floorWoodExt], 0x00f0ff, 0.16);
    this.floorLaborHalfPlane = this.createFloorPolygonMesh([floorO, floorLaborExt, floorC], 0xa855f7, 0.16);

    // Constraint Direction Arrows on the Floor (pointing towards origin feasible half-plane)
    this.floorWoodArrows = this.createConstraintArrows(floorA, floorWoodExt, 0x00f0ff);
    this.floorLaborArrows = this.createConstraintArrows(floorLaborExt, floorC, 0xa855f7);

    // Floor Origin Test Marker: (0,0) satisfies 2(0)+1(0) = 0 ≤ 5
    this.floorOriginTest = this.createTextSprite('Test (0,0): 0 ≤ 5 ✓ Feasible', '#34d399', 18, 'rgba(10, 20, 18, 0.92)', '#10b981', 0.40);
    this.floorOriginTest.position.set(0.65, 0.25, 0.65);
    this.floorOriginTest.visible = false;

    this.regionsGroup.add(this.floorWoodLine);
    this.regionsGroup.add(this.floorLaborLine);
    this.regionsGroup.add(this.floorFeasibleArea);
    this.regionsGroup.add(this.floorWoodHalfPlane);
    this.regionsGroup.add(this.floorLaborHalfPlane);
    this.regionsGroup.add(this.floorWoodArrows);
    this.regionsGroup.add(this.floorLaborArrows);
    this.regionsGroup.add(this.floorOriginTest);

    // Floor Intersection Ring at (5/3, 5/3)
    const ringGeo = new THREE.RingGeometry(0.12, 0.22, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
    this.floorIntersectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.floorIntersectionRing.rotation.x = -Math.PI / 2;
    this.floorIntersectionRing.position.set(floorB.x, 0.03, floorB.z);
    this.floorIntersectionRing.visible = false;
    this.regionsGroup.add(this.floorIntersectionRing);

    // Objective Function Ceiling Plane (Z = 2x1 + 3x2)
    this.objectiveCeiling = this.createObjectivePlaneMesh(topO, topA, topB, topC, floorO, floorA, floorB, floorC);
    this.regionsGroup.add(this.objectiveCeiling);

    // =========================================================================
    // Foundational Non-Negativity Bounding Planes: x₁ ≥ 0, x₂ ≥ 0, Z ≥ 0 (1st Octant)
    // =========================================================================
    // Full-Domain Octant Guide (Shown in Step 1)
    this.octantGuideGroup = new THREE.Group();
    this.octantGuideGroup.visible = false;

    const spanMax = 5.0;
    const guideHeightZ = wallHeightZ; // Standardized level height (Z = 8.5)
    const floorSpanX1 = this.toWorld(spanMax, 0, 0);
    const floorSpanX2 = this.toWorld(0, 0, spanMax);
    const topSpanX1 = this.toWorld(spanMax, guideHeightZ, 0);
    const topSpanX2 = this.toWorld(0, guideHeightZ, spanMax);
    const topGuideO = this.toWorld(0, guideHeightZ, 0); // Flat constant height at origin (Square/Rectangle)
    const floorSpanCorner = this.toWorld(spanMax, 0, spanMax);

    // Side Wall x₁ = 0 (Constraint: x₁ ≥ 0, Blue Square/Rectangle)
    const guideWallX1 = this.createWallMesh(
      floorSpanX2, floorO, topSpanX2, topGuideO,
      0x38bdf8, 'Constraint: x₁ ≥ 0 (Boundary: x₁ = 0 plane)', false
    );
    this.octantGuideGroup.add(guideWallX1);
    this.guideWallX1 = guideWallX1;

    this.octantArrows = [];

    // Inward Arrows for x₁ ≥ 0
    [1.5, 3.5, 4.8].forEach(x2Pos => {
      [1.5, 4.5, 7.5].forEach(yPos => {
        const arrowStart = this.toWorld(0, yPos, x2Pos);
        const arrow = this.create3DArrow(arrowStart, new THREE.Vector3(1, 0, 0), 0.6, 0x38bdf8);
        arrow.userData = { isWall: true, yPos };
        this.octantGuideGroup.add(arrow);
        this.octantArrows.push(arrow);
      });
    });

    // Back Wall x₂ = 0 (Constraint: x₂ ≥ 0, Red Square/Rectangle)
    const guideWallX2 = this.createWallMesh(
      floorO, floorSpanX1, topGuideO, topSpanX1,
      0xf43f5e, 'Constraint: x₂ ≥ 0 (Boundary: x₂ = 0 plane)', false
    );
    this.octantGuideGroup.add(guideWallX2);
    this.guideWallX2 = guideWallX2;

    // Inward Arrows for x₂ ≥ 0
    [1.5, 3.5, 4.8].forEach(x1Pos => {
      [1.5, 4.5, 7.5].forEach(yPos => {
        const arrowStart = this.toWorld(x1Pos, yPos, 0);
        const arrow = this.create3DArrow(arrowStart, new THREE.Vector3(0, 0, 1), 0.6, 0xf43f5e);
        arrow.userData = { isWall: true, yPos };
        this.octantGuideGroup.add(arrow);
        this.octantArrows.push(arrow);
      });
    });

    // Ground Floor Z = 0 (Constraint: Z ≥ 0, Green Square)
    const guideFloorZ = this.createFloorPolygonMesh(
      [floorO, floorSpanX1, floorSpanCorner, floorSpanX2],
      0x10b981, 0.22
    );
    guideFloorZ.visible = true;
    guideFloorZ.position.y = 0.010;
    this.octantGuideGroup.add(guideFloorZ);
    this.guideFloorZ = guideFloorZ;

    const floorBorderGeo = new THREE.BufferGeometry().setFromPoints([
      floorO, floorSpanX1, floorSpanCorner, floorSpanX2, floorO
    ]);
    const floorBorderMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2, transparent: true, opacity: 0.85 });
    const guideFloorBorder = new THREE.Line(floorBorderGeo, floorBorderMat);
    this.octantGuideGroup.add(guideFloorBorder);
    this.guideFloorBorder = guideFloorBorder;

    // Upward Arrows for Z ≥ 0
    [1.5, 3.5, 4.8].forEach(x1Pos => {
      [1.5, 3.5, 4.8].forEach(x2Pos => {
        const arrowStart = this.toWorld(x1Pos, 0.05, x2Pos);
        const arrow = this.create3DArrow(arrowStart, new THREE.Vector3(0, 1, 0), 0.6, 0x10b981);
        arrow.userData = { isWall: false, yPos: 0 };
        this.octantGuideGroup.add(arrow);
        this.octantArrows.push(arrow);
      });
    });

    const floorZLabel = this.createTextSprite('Constraint: Z ≥ 0 (Boundary: Z = 0 floor)', '#10b981', 20, 'rgba(10, 20, 15, 0.92)', '#10b981', 0.46);
    const midFloor = this.toWorld(spanMax * 0.5, 0.15, spanMax * 0.5);
    floorZLabel.position.copy(midFloor);
    this.octantGuideGroup.add(floorZLabel);
    this.floorZLabel = floorZLabel;

    const octantBadge = this.createTextSprite('★ 1st Octant Feasible Space: x₁ ≥ 0, x₂ ≥ 0, Z ≥ 0', '#ffffff', 22, 'rgba(15, 23, 42, 0.95)', '#38bdf8', 0.56);
    octantBadge.position.copy(this.toWorld(2.5, 3.2, 2.5));
    this.octantBadge = octantBadge;
    this.octantGuideGroup.add(octantBadge);

    this.regionsGroup.add(this.octantGuideGroup);

    // Vertex markers with 3D tags - revealed progressively without overlap
    this.vertexMarkers = [];
    const vData = [
      { pos: topO, offset: new THREE.Vector3(-0.6, 0.35, -0.6), label: 'Origin (0,0) | $0', col: 0x94a3b8, req: 'objective' },
      { pos: floorA, offset: new THREE.Vector3(0.65, 0.25, 0), label: 'Intercept A: (2.5, 0)', col: 0x38bdf8, req: 'woodFloor' },
      { pos: floorC, offset: new THREE.Vector3(0, 0.25, 0.65), label: 'Intercept C: (0, 2.5)', col: 0xa855f7, req: 'laborFloor' },
      { pos: floorB, offset: new THREE.Vector3(0.65, 0.35, 0.65), label: 'Crossing B: (1.67, 1.67)', col: 0xffd700, req: 'laborFloor' },
      { pos: topA, offset: new THREE.Vector3(0.85, 0.45, -0.4), label: 'Vertex A: (2.5, 0) | $500', col: 0x38bdf8, req: 'objective' },
      { pos: topC, offset: new THREE.Vector3(-0.4, 0.45, 0.85), label: 'Vertex C: (0, 2.5) | $750', col: 0xa855f7, req: 'objective' },
      { pos: topB, offset: new THREE.Vector3(0.8, 0.55, 0.8), label: 'Cont. Opt B: (1.67, 1.67) | $833.33', col: 0x10b981, isContinuousOpt: true, req: 'objective' },
      { pos: topCut2, offset: new THREE.Vector3(-0.6, 0.55, 0.6), label: '★ Integer Opt: (1, 2) | $800', col: 0xf59e0b, isIntegerOpt: true, req: 'cut' },
      { pos: topCut1, offset: new THREE.Vector3(0.8, 0.35, -0.3), label: '(2, 1) | $700', col: 0x3b82f6, req: 'cut' }
    ];

    vData.forEach(v => {
      const group = new THREE.Group();
      group.visible = false;
      const dotGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const dotMat = new THREE.MeshStandardMaterial({
        color: v.col,
        emissive: v.col,
        emissiveIntensity: 0.7,
        roughness: 0.2
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(v.pos);
      group.add(dot);

      const tag = this.createTextSprite(v.label, '#ffffff', 20, 'rgba(10, 15, 25, 0.88)', '#00f0ff', 0.44);
      tag.position.copy(v.pos).add(v.offset);
      group.add(tag);

      group.userData = v;
      this.regionsGroup.add(group);
      this.vertexMarkers.push(group);
    });

    this.scene.add(this.regionsGroup);
  }

  createPrismMesh(corners, color, opacity) {
    const group = new THREE.Group();
    const n = corners.length;

    // Floor polygon
    const floorShape = new THREE.Shape();
    floorShape.moveTo(corners[0].floor.x, corners[0].floor.z);
    for (let i = 1; i < n; i++) {
      floorShape.lineTo(corners[i].floor.x, corners[i].floor.z);
    }
    floorShape.closePath();

    const floorGeo = new THREE.ShapeGeometry(floorShape);
    const floorMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.7,
      side: THREE.DoubleSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    group.add(floorMesh);

    // 3D Volume Mesh
    const geom = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    // Push floor vertices (0 to n-1)
    corners.forEach(c => vertices.push(c.floor.x, c.floor.y, c.floor.z));
    // Push top vertices (n to 2n-1)
    corners.forEach(c => vertices.push(c.top.x, c.top.y, c.top.z));

    // Side faces
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const f1 = i;
      const f2 = next;
      const t1 = i + n;
      const t2 = next + n;

      indices.push(f1, t1, t2);
      indices.push(f1, t2, f2);
    }

    // Top face triangulation (fan from top[0])
    for (let i = 1; i < n - 1; i++) {
      indices.push(n, n + i, n + i + 1);
    }

    // Floor face triangulation
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i + 1, i);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.15,
      metalness: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing wireframe edges
    const wireGeo = new THREE.WireframeGeometry(geom);
    const wireMat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.85 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    group.add(wire);

    group.userData = {
      corners,
      mesh,
      floorMesh,
      wire,
      baseOpacity: opacity,
      n
    };

    return group;
  }

  updatePrismShape(prismMesh, progress) {
    if (!prismMesh) return;
    if (progress <= 0.001) {
      prismMesh.visible = false;
      return;
    }
    prismMesh.visible = true;

    const ease = 1 - Math.pow(1 - progress, 3);
    const { corners, mesh, floorMesh, wire, baseOpacity, n } = prismMesh.userData;

    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < n; i++) {
      const topIdx = n + i;
      const f = corners[i].floor;
      const t = corners[i].top;
      const curX = THREE.MathUtils.lerp(f.x, t.x, ease);
      const curY = THREE.MathUtils.lerp(f.y, t.y, ease);
      const curZ = THREE.MathUtils.lerp(f.z, t.z, ease);
      pos.setXYZ(topIdx, curX, curY, curZ);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    mesh.material.opacity = baseOpacity * Math.min(1, progress * 1.3);
    if (wire) {
      wire.material.opacity = 0.85 * Math.min(1, progress * 1.4);
    }
    if (floorMesh) {
      floorMesh.material.opacity = (baseOpacity * 0.7) * Math.min(1, progress * 1.5);
    }
  }

  create3DArrow(origin, direction, length, colorHex) {
    const group = new THREE.Group();
    const dir = direction.clone().normalize();
    const end = origin.clone().addScaledVector(dir, length);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const lineMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2, transparent: true, opacity: 0.95 });
    group.add(new THREE.Line(lineGeo, lineMat));

    const coneGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
    const coneMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(end);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(cone);
    return group;
  }

  createConstraintArrows(p1, p2, colorHex) {
    const group = new THREE.Group();
    const numArrows = 3;
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    // Inward direction on the floor pointing towards origin (0, 0, 0)
    const inward = new THREE.Vector3(-mid.x, 0, -mid.z).normalize();

    for (let i = 1; i <= numArrows; i++) {
      const t = i / (numArrows + 1);
      const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
      pos.y = 0.03;

      const arrowLen = 0.45;
      const arrowEnd = new THREE.Vector3().copy(pos).addScaledVector(inward, arrowLen);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, arrowEnd]);
      const lineMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2, transparent: true, opacity: 0.95 });
      const stem = new THREE.Line(lineGeo, lineMat);
      group.add(stem);

      const coneGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
      const coneMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(arrowEnd);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
      group.add(cone);
    }

    group.visible = false;
    return group;
  }

  createFloorConstraintLine(p1, p2, colorHex, labelText) {
    const group = new THREE.Group();

    // Glowing 2D constraint line on ground floor axis plane
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p1.x, 0.02, p1.z),
      new THREE.Vector3(p2.x, 0.02, p2.z)
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const line = new THREE.Line(geom, mat);
    group.add(line);

    // Axis intercept rings on the floor
    [p1, p2].forEach(p => {
      const ringGeo = new THREE.RingGeometry(0.08, 0.16, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.025, p.z);
      group.add(ring);
    });

    if (labelText) {
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const label = this.createTextSprite(labelText, colorHex, 18, 'rgba(10, 15, 25, 0.9)', colorHex);
      label.position.set(mid.x, 0.25, mid.z);
      label.scale.set(2.8, 0.65, 1);
      group.add(label);
    }

    group.visible = false;
    return group;
  }

  createFloorPolygonMesh(points, colorHex, opacity) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].z);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].z);
    }
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.015;
    mesh.visible = false;
    return mesh;
  }

  createWallMesh(f1, f2, t1, t2, colorHex, labelText, isExtended = false, labelRatio = 0.5) {
    const group = new THREE.Group();
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      f1.x, f1.y, f1.z,
      f2.x, f2.y, f2.z,
      t2.x, t2.y, t2.z,
      t1.x, t1.y, t1.z
    ]);
    const indices = [0, 1, 2, 0, 2, 3];
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const baseOpacity = isExtended ? 0.18 : 0.38;
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: isExtended ? 0.05 : 0.15,
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Dynamic 4-edge border line (5 vertices: f1 -> f2 -> t2 -> t1 -> f1)
    const lineGeom = new THREE.BufferGeometry();
    const lineVerts = new Float32Array(5 * 3);
    for (let i = 0; i < 5; i++) {
      lineVerts[i * 3] = f1.x;
      lineVerts[i * 3 + 1] = f1.y;
      lineVerts[i * 3 + 2] = f1.z;
    }
    lineGeom.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: isExtended ? 0.35 : 0.85,
      linewidth: 2
    });
    const line = new THREE.Line(lineGeom, lineMat);
    group.add(line);

    // Glowing laser leading beam on the rising top edge (2 vertices: t1, t2)
    const laserGeom = new THREE.BufferGeometry();
    const laserVerts = new Float32Array(2 * 3);
    laserVerts[0] = f1.x; laserVerts[1] = f1.y; laserVerts[2] = f1.z;
    laserVerts[3] = f2.x; laserVerts[4] = f2.y; laserVerts[5] = f2.z;
    laserGeom.setAttribute('position', new THREE.BufferAttribute(laserVerts, 3));
    const laserMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      linewidth: 3
    });
    const laser = new THREE.Line(laserGeom, laserMat);
    group.add(laser);

    // Floating equation label
    let label = null;
    if (labelText) {
      const mid = new THREE.Vector3().lerpVectors(t1, t2, labelRatio).add(new THREE.Vector3(0, 0.45, 0));
      label = this.createTextSprite(labelText, '#ffffff', 20, 'rgba(10, 15, 25, 0.9)', colorHex);
      label.position.copy(mid);
      label.scale.set(3.0, 0.7, 1);
      group.add(label);
    }

    group.userData = {
      f1, f2, t1, t2,
      mesh,
      line,
      laser,
      label,
      baseOpacity,
      isExtended,
      labelRatio
    };

    return group;
  }

  updateWallShape(wallGroup, progress, showLabel = true) {
    if (!wallGroup) return;
    if (progress <= 0.001) {
      wallGroup.visible = false;
      return;
    }
    wallGroup.visible = true;

    const ease = 1 - Math.pow(1 - progress, 3);
    const { f1, f2, t1, t2, mesh, line, laser, label, baseOpacity } = wallGroup.userData;

    const curr_t1 = new THREE.Vector3().lerpVectors(f1, t1, ease);
    const curr_t2 = new THREE.Vector3().lerpVectors(f2, t2, ease);

    // Update quad face
    const pos = mesh.geometry.attributes.position;
    pos.setXYZ(0, f1.x, f1.y, f1.z);
    pos.setXYZ(1, f2.x, f2.y, f2.z);
    pos.setXYZ(2, curr_t2.x, curr_t2.y, curr_t2.z);
    pos.setXYZ(3, curr_t1.x, curr_t1.y, curr_t1.z);
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    // Update border outline
    if (line) {
      const linePos = line.geometry.attributes.position;
      linePos.setXYZ(0, f1.x, f1.y, f1.z);
      linePos.setXYZ(1, f2.x, f2.y, f2.z);
      linePos.setXYZ(2, curr_t2.x, curr_t2.y, curr_t2.z);
      linePos.setXYZ(3, curr_t1.x, curr_t1.y, curr_t1.z);
      linePos.setXYZ(4, f1.x, f1.y, f1.z);
      linePos.needsUpdate = true;
    }

    // Update top laser beam
    if (laser) {
      const laserPos = laser.geometry.attributes.position;
      laserPos.setXYZ(0, curr_t1.x, curr_t1.y, curr_t1.z);
      laserPos.setXYZ(1, curr_t2.x, curr_t2.y, curr_t2.z);
      laserPos.needsUpdate = true;
      laser.material.opacity = progress < 0.98 ? 0.95 : 0.65;
    }

    // Material opacity fade-in
    mesh.material.opacity = baseOpacity * Math.min(1, progress * 1.3);

    // Label badge animation
    if (label) {
      if (!showLabel) {
        label.visible = false;
      } else {
        const ratio = (wallGroup.userData && wallGroup.userData.labelRatio !== undefined) ? wallGroup.userData.labelRatio : 0.5;
        const mid = new THREE.Vector3().lerpVectors(curr_t1, curr_t2, ratio).add(new THREE.Vector3(0, 0.45, 0));
        label.position.copy(mid);
        const labelT = THREE.MathUtils.clamp((progress - 0.25) / 0.75, 0, 1);
        const labelEase = 1 - Math.pow(1 - labelT, 2);
        const origW = label.userData.worldHeight * label.userData.aspect;
        const origH = label.userData.worldHeight;
        label.scale.set(origW * labelEase, origH * labelEase, 1);
        label.visible = labelT > 0.05;
      }
    }
  }

  updateNonNegShape(progress, isNonNegStep = false) {
    if (!this.octantGuideGroup) return;
    if (progress <= 0.001) {
      this.octantGuideGroup.visible = false;
      return;
    }
    this.octantGuideGroup.visible = true;

    const eff = this.effectivePlaneStates;
    const showX1 = eff ? eff.nonNegX1 : true;
    const showX2 = eff ? eff.nonNegX2 : true;
    const showZ = eff ? eff.nonNegZ : true;

    // Smoothly grow the two boundary walls - wall equation labels ONLY visible on Step 1
    if (this.guideWallX1) {
      this.updateWallShape(this.guideWallX1, progress, isNonNegStep);
      this.guideWallX1.visible = this.guideWallX1.visible && showX1;
    }
    if (this.guideWallX2) {
      this.updateWallShape(this.guideWallX2, progress, isNonNegStep);
      this.guideWallX2.visible = this.guideWallX2.visible && showX2;
    }

    // Smoothly fade in ground floor (Z = 0)
    if (this.guideFloorZ) {
      this.guideFloorZ.visible = showZ;
      this.guideFloorZ.material.opacity = 0.22 * Math.min(1, progress * 1.5);
    }
    if (this.guideFloorBorder) {
      this.guideFloorBorder.visible = showZ;
      this.guideFloorBorder.material.opacity = 0.85 * Math.min(1, progress * 1.5);
    }

    // Floor label fade in - ONLY on Step 1
    if (this.floorZLabel) {
      this.floorZLabel.visible = isNonNegStep && showZ;
      if (isNonNegStep && showZ) {
        const labelT = THREE.MathUtils.clamp((progress - 0.2) / 0.8, 0, 1);
        this.floorZLabel.material.opacity = 1 - Math.pow(1 - labelT, 2);
      }
    }

    // 27 Directional Arrows - ONLY on Step 1 (non-negativity introduction)
    if (this.octantArrows) {
      this.octantArrows.forEach(arrow => {
        if (!isNonNegStep) {
          arrow.visible = false;
        } else {
          arrow.visible = true;
          const arrowT = THREE.MathUtils.clamp(progress / 0.8, 0, 1);
          arrow.scale.set(arrowT, arrowT, arrowT);
        }
      });
    }

    if (this.octantBadge) {
      this.octantBadge.visible = isNonNegStep;
      if (isNonNegStep) {
        const badgeT = THREE.MathUtils.clamp((progress - 0.3) / 0.7, 0, 1);
        this.octantBadge.material.opacity = 1 - Math.pow(1 - badgeT, 2);
      }
    }
  }

  createObjectivePlaneMesh(tO, tA, tB, tC, floorO, floorA, floorB, floorC) {
    const group = new THREE.Group();
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      tO.x, tO.y, tO.z,
      tA.x, tA.y, tA.z,
      tB.x, tB.y, tB.z,
      tC.x, tC.y, tC.z
    ]);
    const indices = [0, 1, 2, 0, 2, 3];
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.2,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.008;
    group.add(mesh);

    // Dynamic border wireframe (5 vertices)
    const lineGeom = new THREE.BufferGeometry();
    const lineVerts = new Float32Array(5 * 3);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const line = new THREE.Line(lineGeom, lineMat);
    line.position.y = 0.01;
    group.add(line);

    // Floating Objective Plane label
    const mid = new THREE.Vector3().addVectors(tO, tB).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.45, 0));
    const label = this.createTextSprite('Objective Plane: Z = 2x₁ + 3x₂', '#34d399', 20, 'rgba(10, 30, 20, 0.92)', '#34d399', 0.48);
    label.position.copy(mid);
    group.add(label);

    group.userData = {
      tO, tA, tB, tC,
      floorO, floorA, floorB, floorC,
      mesh,
      line,
      label,
      baseOpacity: 0.5
    };

    return group;
  }

  updateObjectiveCeilingShape(progress) {
    if (!this.objectiveCeiling) return;
    if (progress <= 0.001) {
      this.objectiveCeiling.visible = false;
      return;
    }
    this.objectiveCeiling.visible = true;

    const ease = 1 - Math.pow(1 - progress, 3);
    const { tO, tA, tB, tC, floorO, floorA, floorB, floorC, mesh, line, label, baseOpacity } = this.objectiveCeiling.userData;

    const curr_O = new THREE.Vector3().lerpVectors(floorO, tO, ease);
    const curr_A = new THREE.Vector3().lerpVectors(floorA, tA, ease);
    const curr_B = new THREE.Vector3().lerpVectors(floorB, tB, ease);
    const curr_C = new THREE.Vector3().lerpVectors(floorC, tC, ease);

    const pos = mesh.geometry.attributes.position;
    pos.setXYZ(0, curr_O.x, curr_O.y, curr_O.z);
    pos.setXYZ(1, curr_A.x, curr_A.y, curr_A.z);
    pos.setXYZ(2, curr_B.x, curr_B.y, curr_B.z);
    pos.setXYZ(3, curr_C.x, curr_C.y, curr_C.z);
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    if (line) {
      const linePos = line.geometry.attributes.position;
      linePos.setXYZ(0, curr_O.x, curr_O.y, curr_O.z);
      linePos.setXYZ(1, curr_A.x, curr_A.y, curr_A.z);
      linePos.setXYZ(2, curr_B.x, curr_B.y, curr_B.z);
      linePos.setXYZ(3, curr_C.x, curr_C.y, curr_C.z);
      linePos.setXYZ(4, curr_O.x, curr_O.y, curr_O.z);
      linePos.needsUpdate = true;
    }

    mesh.material.opacity = baseOpacity * Math.min(1, progress * 1.4);

    if (label) {
      const mid = new THREE.Vector3().addVectors(curr_O, curr_B).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.45, 0));
      label.position.copy(mid);
      const labelT = THREE.MathUtils.clamp((progress - 0.25) / 0.75, 0, 1);
      const labelEase = 1 - Math.pow(1 - labelT, 2);
      const origW = label.userData.worldHeight * label.userData.aspect;
      const origH = label.userData.worldHeight;
      label.scale.set(origW * labelEase, origH * labelEase, 1);
      label.visible = labelT > 0.05;
    }
  }

  buildIntegerLattice() {
    this.latticeGroup = new THREE.Group();
    this.latticePoints = [];

    // Feasible integer set: (0,0), (1,0), (2,0), (0,1), (1,1), (2,1), (0,2), (1,2)
    const isIntegerFeasible = (x1, x2) => {
      return (2 * x1 + x2 <= 5) && (x1 + 2 * x2 <= 5) && x1 >= 0 && x2 >= 0;
    };

    for (let x1 = 0; x1 <= 4; x1++) {
      for (let x2 = 0; x2 <= 4; x2++) {
        const feasible = isIntegerFeasible(x1, x2);
        const Z = 2 * x1 + 3 * x2;
        const posFloor = this.toWorld(x1, 0, x2);
        const pos3D = this.toWorld(x1, Z, x2);

        const pointGroup = new THREE.Group();

        if (feasible) {
          // Feasible integer point - glowing golden sphere with vertical pillar
          const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: (x1 === 1 && x2 === 2) ? 0xffd700 : 0x00f0ff,
            emissive: (x1 === 1 && x2 === 2) ? 0xffa500 : 0x00a8ff,
            emissiveIntensity: 0.8,
            roughness: 0.1
          });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.copy(pos3D);
          pointGroup.add(sphere);

          // Floor ring
          const ringGeo = new THREE.RingGeometry(0.08, 0.14, 16);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.copy(posFloor);
          pointGroup.add(ring);

          // Vertical ray line connecting floor to profit height
          const lineGeo = new THREE.BufferGeometry().setFromPoints([posFloor, pos3D]);
          const lineMat = new THREE.LineDashedMaterial({
            color: 0x00f0ff,
            dashSize: 0.15,
            gapSize: 0.1,
            opacity: 0.5,
            transparent: true
          });
          const line = new THREE.Line(lineGeo, lineMat);
          line.computeLineDistances();
          pointGroup.add(line);
        } else {
          // Infeasible integer point - faint dark marker
          const sphereGeo = new THREE.SphereGeometry(0.07, 8, 8);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.copy(posFloor);
          pointGroup.add(sphere);
        }

        pointGroup.userData = { x1, x2, Z, feasible };
        this.latticeGroup.add(pointGroup);
        this.latticePoints.push(pointGroup);
      }
    }

    this.scene.add(this.latticeGroup);
  }

  buildCuttingPlane() {
    this.cutGroup = new THREE.Group();

    // Gomory cut in decision space: x1 + x2 <= 3
    const cutFloor1 = this.toWorld(3.2, 0, -0.2);
    const cutFloor2 = this.toWorld(-0.2, 0, 3.2);
    const cutTop1 = this.toWorld(3.2, 9, -0.2);
    const cutTop2 = this.toWorld(-0.2, 9, 3.2);

    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      cutFloor1.x, cutFloor1.y, cutFloor1.z,
      cutFloor2.x, cutFloor2.y, cutFloor2.z,
      cutTop2.x, cutTop2.y, cutTop2.z,
      cutTop1.x, cutTop1.y, cutTop1.z
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex([0, 1, 2, 0, 2, 3]);
    geom.computeVertexNormals();

    // Laser glowing material
    this.cutPlaneMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0044,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.1
    });
    this.cutPlaneMesh = new THREE.Mesh(geom, this.cutPlaneMat);
    this.cutGroup.add(this.cutPlaneMesh);

    // Dynamic 4-edge border line
    const lineGeom = new THREE.BufferGeometry();
    const lineVerts = new Float32Array(5 * 3);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff2a6d, linewidth: 2, transparent: true, opacity: 0.85 });
    this.cutBorderLine = new THREE.Line(lineGeom, lineMat);
    this.cutGroup.add(this.cutBorderLine);

    // Glowing laser beam on cutting edge
    const laserGeom = new THREE.BufferGeometry();
    const laserVerts = new Float32Array(2 * 3);
    laserGeom.setAttribute('position', new THREE.BufferAttribute(laserVerts, 3));
    const laserMat = new THREE.LineBasicMaterial({ color: 0xff0055, linewidth: 3, transparent: true, opacity: 0.95 });
    this.cutTopLaser = new THREE.Line(laserGeom, laserMat);
    this.cutGroup.add(this.cutTopLaser);

    // Floating Gomory Cut Label
    const midCut = new THREE.Vector3().addVectors(cutTop1, cutTop2).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.45, 0));
    this.cutLabel = this.createTextSprite('Gomory Cut: 1x₁ + 1x₂ = 3 (≤ 3)', '#ff0055', 20, 'rgba(40, 10, 20, 0.92)', '#ff0055', 0.48);
    this.cutLabel.position.copy(midCut);
    this.cutGroup.add(this.cutLabel);

    this.cutGroup.userData = {
      cutFloor1, cutFloor2, cutTop1, cutTop2
    };

    this.cutGroup.visible = false;
    this.scene.add(this.cutGroup);
  }

  updateCutPlaneShape(progress) {
    if (!this.cutGroup) return;
    if (progress <= 0.001) {
      this.cutGroup.visible = false;
      return;
    }
    this.cutGroup.visible = true;

    const ease = 1 - Math.pow(1 - progress, 3);
    const { cutFloor1, cutFloor2, cutTop1, cutTop2 } = this.cutGroup.userData;

    const sky1 = new THREE.Vector3(cutTop1.x, cutTop1.y + 6, cutTop1.z);
    const sky2 = new THREE.Vector3(cutTop2.x, cutTop2.y + 6, cutTop2.z);

    const curr_top1 = new THREE.Vector3().lerpVectors(sky1, cutTop1, ease);
    const curr_top2 = new THREE.Vector3().lerpVectors(sky2, cutTop2, ease);
    const curr_floor1 = new THREE.Vector3().lerpVectors(cutTop1, cutFloor1, ease);
    const curr_floor2 = new THREE.Vector3().lerpVectors(cutTop2, cutFloor2, ease);

    const pos = this.cutPlaneMesh.geometry.attributes.position;
    pos.setXYZ(0, curr_floor1.x, curr_floor1.y, curr_floor1.z);
    pos.setXYZ(1, curr_floor2.x, curr_floor2.y, curr_floor2.z);
    pos.setXYZ(2, curr_top2.x, curr_top2.y, curr_top2.z);
    pos.setXYZ(3, curr_top1.x, curr_top1.y, curr_top1.z);
    pos.needsUpdate = true;
    this.cutPlaneMesh.geometry.computeVertexNormals();

    if (this.cutBorderLine) {
      const linePos = this.cutBorderLine.geometry.attributes.position;
      linePos.setXYZ(0, curr_floor1.x, curr_floor1.y, curr_floor1.z);
      linePos.setXYZ(1, curr_floor2.x, curr_floor2.y, curr_floor2.z);
      linePos.setXYZ(2, curr_top2.x, curr_top2.y, curr_top2.z);
      linePos.setXYZ(3, curr_top1.x, curr_top1.y, curr_top1.z);
      linePos.setXYZ(4, curr_floor1.x, curr_floor1.y, curr_floor1.z);
      linePos.needsUpdate = true;
    }

    if (this.cutTopLaser) {
      const laserPos = this.cutTopLaser.geometry.attributes.position;
      laserPos.setXYZ(0, curr_floor1.x, curr_floor1.y, curr_floor1.z);
      laserPos.setXYZ(1, curr_floor2.x, curr_floor2.y, curr_floor2.z);
      laserPos.needsUpdate = true;
    }

    if (this.cutLabel) {
      const mid = new THREE.Vector3().addVectors(curr_top1, curr_top2).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.45, 0));
      this.cutLabel.position.copy(mid);
      const labelT = THREE.MathUtils.clamp((progress - 0.3) / 0.7, 0, 1);
      const origW = this.cutLabel.userData.worldHeight * this.cutLabel.userData.aspect;
      const origH = this.cutLabel.userData.worldHeight;
      this.cutLabel.scale.set(origW * labelT, origH * labelT, 1);
      this.cutLabel.visible = labelT > 0.05;
    }
  }

  updateLatticeShape(progress) {
    if (!this.latticeGroup) return;
    if (progress <= 0.001) {
      this.latticeGroup.visible = false;
      return;
    }
    this.latticeGroup.visible = true;

    this.latticePoints.forEach((pt, idx) => {
      const delay = (idx / this.latticePoints.length) * 0.3;
      const t = THREE.MathUtils.clamp((progress - delay) / (1 - delay), 0, 1);
      const s = 1 - Math.pow(1 - t, 2);
      pt.scale.setScalar(s);
    });
  }

  buildSimplexTracer() {
    this.tracerGroup = new THREE.Group();

    // Hovering solution agent sphere (Unity cyberpunk style)
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

    // Outer pulsating halo ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.03, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d });
    this.tracerRing = new THREE.Mesh(ringGeo, ringMat);
    this.tracerRing.rotation.x = Math.PI / 2;
    this.tracerGroup.add(this.tracerRing);

    // Vertical spotlight beam pointing down to floor
    const light = new THREE.PointLight(0x00f0ff, 2.5, 6);
    this.tracerSphere.add(light);

    // Dynamic Solution HUD Sprite
    this.tracerHUD = this.createTextSprite('Current Solution', '#00f0ff', 22, 'rgba(10, 20, 35, 0.9)', '#00f0ff');
    this.tracerHUD.position.set(0, 0.65, 0);
    this.tracerHUD.scale.set(2.8, 0.7, 1);
    this.tracerGroup.add(this.tracerHUD);

    // Dynamic trail line
    this.trailGeo = new THREE.BufferGeometry();
    this.trailMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 4 });
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
      pos.push(1 * this.scaleX, 8 * this.scaleY, 2 * this.scaleZ);
      velocities.push(
        (Math.random() - 0.5) * 0.08,
        Math.random() * 0.12 + 0.02,
        (Math.random() - 0.5) * 0.08
      );
      const c = new THREE.Color(colChoices[Math.floor(Math.random() * colChoices.length)]);
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
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
    const origin = this.toWorld(1, 8, 2);
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

    // Active Point LERP target
    if (state.activePoint) {
      this.targetTracerPos = this.toWorld(state.activePoint[0], state.activePoint[1], state.activePoint[2]);
      
      // Update HUD text
      const x1 = (Math.round(state.activePoint[0] * 100) / 100).toFixed(2);
      const Z = (Math.round(state.activePoint[1] * 100) / 100).toFixed(2);
      const x2 = (Math.round(state.activePoint[2] * 100) / 100).toFixed(2);
      const dollar = Math.round(state.activePoint[1] * 100);

      const labelText = `(${x1}, ${x2}) | Profit: $${dollar}`;
      this.tracerGroup.remove(this.tracerHUD);
      this.tracerHUD = this.createTextSprite(labelText, '#00f0ff', 22, 'rgba(10, 20, 35, 0.92)', '#00f0ff', 0.52);
      this.tracerHUD.position.set(0, 0.70, 0);
      this.tracerGroup.add(this.tracerHUD);

      if (this.onCoordinatesUpdate) {
        this.onCoordinatesUpdate({ x1, x2, Z, dollar });
      }
    }

    // Camera targets - only auto-glide if user has not manually orbited/zoomed
    if (!this.userHasCustomView) {
      if (state.cameraPosition) {
        this.targetCameraPos.set(...state.cameraPosition);
        this.isTransitioningCamera = true;
      }
      if (state.cameraTarget) {
        this.targetCameraLook.set(...state.cameraTarget);
        this.isTransitioningCamera = true;
      }
    }

    this.lastState = state;

    // Progressive Plane Visibilities for 3D Creation Walkthrough
    const isSimplexStep0 = (state.stepIndex === 0 && !state.showPrism && !state.showLattice && !state.showWoodPlane && !state.showLaborPlane);
    const naturalNonNeg = !isSimplexStep0;
    const naturalWood = state.showWoodPlane !== undefined ? !!state.showWoodPlane : true;
    const naturalLabor = state.showLaborPlane !== undefined ? !!state.showLaborPlane : true;
    const naturalCeiling = state.showObjectiveCeiling !== undefined ? !!state.showObjectiveCeiling : true;
    const naturalPrism = state.showPrism !== undefined ? !!state.showPrism : true;
    const naturalCut = !!state.showCutPlane || !!state.sliceCut;
    const naturalLattice = !!state.showLattice;

    // Apply manual user overrides (null means follow natural step state)
    this.effectivePlaneStates = {
      nonNegX1: this.planeOverrides.nonNegX1 !== null ? this.planeOverrides.nonNegX1 : naturalNonNeg,
      nonNegX2: this.planeOverrides.nonNegX2 !== null ? this.planeOverrides.nonNegX2 : naturalNonNeg,
      nonNegZ:  this.planeOverrides.nonNegZ  !== null ? this.planeOverrides.nonNegZ  : naturalNonNeg,
      wood:     this.planeOverrides.wood     !== null ? this.planeOverrides.wood     : naturalWood,
      labor:    this.planeOverrides.labor    !== null ? this.planeOverrides.labor    : naturalLabor,
      polyhedron: this.planeOverrides.polyhedron !== null ? this.planeOverrides.polyhedron : naturalPrism,
      objective:  this.planeOverrides.objective  !== null ? this.planeOverrides.objective  : naturalCeiling,
      cut:      this.planeOverrides.cut      !== null ? this.planeOverrides.cut      : naturalCut,
      lattice:  this.planeOverrides.lattice  !== null ? this.planeOverrides.lattice  : naturalLattice
    };

    const eff = this.effectivePlaneStates;

    // Notify listeners (UI index toggles)
    if (this.onPlaneStatesChanged) {
      this.onPlaneStatesChanged(this.effectivePlaneStates);
    }

    // Set target progresses for silky smooth shaping
    this.targetWoodProgress = eff.wood ? 1.0 : 0.0;
    this.targetLaborProgress = eff.labor ? 1.0 : 0.0;
    this.targetCeilingProgress = (eff.objective && !state.sliceCut) ? 1.0 : 0.0;
    this.targetPrismProgress = (eff.polyhedron && !state.sliceCut) ? 1.0 : 0.0;
    this.targetCutPlaneProgress = eff.cut ? 1.0 : 0.0;
    this.targetLatticeProgress = eff.lattice ? 1.0 : 0.0;
    this.targetNonNegProgress = (eff.nonNegX1 || eff.nonNegX2 || eff.nonNegZ) ? 1.0 : 0.0;
    this.isNonNegStep = !!state.showNonNeg;

    if (this.octantBadge) {
      this.octantBadge.visible = !!state.showNonNeg && (eff.nonNegX1 || eff.nonNegX2 || eff.nonNegZ);
    }

    if (this.tracerGroup) {
      this.tracerGroup.visible = !state.hideTracer;
    }

    // Progressive 2D Floor Lines, Shaded Inequality Half-Planes & Feasible Footprint
    if (this.floorWoodLine) this.floorWoodLine.visible = eff.wood;
    if (this.floorWoodHalfPlane) this.floorWoodHalfPlane.visible = eff.wood && !eff.polyhedron;
    if (this.floorWoodArrows) this.floorWoodArrows.visible = eff.wood;

    if (this.floorLaborLine) this.floorLaborLine.visible = eff.labor;
    if (this.floorLaborHalfPlane) this.floorLaborHalfPlane.visible = eff.labor && !eff.polyhedron;
    if (this.floorLaborArrows) this.floorLaborArrows.visible = eff.labor;

    if (this.floorOriginTest) this.floorOriginTest.visible = (eff.wood || eff.labor) && !eff.polyhedron;
    if (this.floorIntersectionRing) this.floorIntersectionRing.visible = eff.labor && !eff.polyhedron;
    if (this.floorFeasibleArea) this.floorFeasibleArea.visible = eff.polyhedron;

    // Progressive vertex markers reveal without floor-ceiling duplicate clutter
    if (this.vertexMarkers) {
      this.vertexMarkers.forEach(vm => {
        const req = vm.userData.req;
        let visible = false;
        if (req === 'woodFloor') visible = eff.wood && !eff.polyhedron;
        else if (req === 'laborFloor') visible = eff.labor && !eff.polyhedron;
        else if (req === 'objective') visible = eff.objective;
        else if (req === 'cut') visible = eff.cut;
        else visible = eff.polyhedron;
        vm.visible = visible;
      });
    }

    // Gomory cut mode handling
    if (state.sliceCut && eff.cut) {
      this.targetPrismProgress = 0;
      this.integerMesh.visible = true;
      this.slicedWedgeMesh.visible = true;
      this.targetSliceProgress = 1;
    } else {
      this.integerMesh.visible = false;
      this.slicedWedgeMesh.visible = false;
      this.targetSliceProgress = 0;
    }

    // Trail update
    if (state.simplexPath) {
      this.updateTrail(state.simplexPath);
    }

    // Celebration
    if (state.celebrate) {
      this.triggerConfetti();
    } else {
      this.confettiActive = false;
      this.confettiPoints.visible = false;
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
    ['nonNegX1', 'nonNegX2', 'nonNegZ', 'wood', 'labor', 'polyhedron', 'objective', 'cut', 'lattice'].forEach(k => {
      this.planeOverrides[k] = targetState;
    });
    if (this.lastState) {
      this.updateVisualState(this.lastState);
    }
  }

  clearPlaneOverrides() {
    this.planeOverrides = {
      nonNegX1: null,
      nonNegX2: null,
      nonNegZ: null,
      wood: null,
      labor: null,
      polyhedron: null,
      objective: null,
      cut: null,
      lattice: null
    };
  }

  resetToStateZero() {
    this.clearPlaneOverrides();
    this.userHasCustomView = false;
    this.isTransitioningCamera = true;
    this.targetCameraPos.set(14.5, 11.0, 15.5);
    this.targetCameraLook.set(3.8, 2.4, 3.8);

    // Reset tracer
    this.targetTracerPos.set(0, 0, 0);
    this.tracerPos.set(0, 0, 0);
    this.tracerGroup.position.set(0, 0, 0);
    this.tracerGroup.visible = false;

    // Reset trail
    this.updateTrail([]);

    // Stop confetti
    this.confettiActive = false;
    if (this.confettiPoints) this.confettiPoints.visible = false;

    // Reset progress targets
    this.targetNonNegProgress = 0;
    this.targetWoodProgress = 0;
    this.targetLaborProgress = 0;
    this.targetCeilingProgress = 0;
    this.targetPrismProgress = 0;
    this.targetCutPlaneProgress = 0;
    this.targetLatticeProgress = 0;
    this.targetSliceProgress = 0;

    // Set immediate progresses
    this.nonNegProgress = 0;
    this.woodProgress = 0;
    this.laborProgress = 0;
    this.ceilingProgress = 0;
    this.prismProgress = 0;
    this.cutPlaneProgress = 0;
    this.latticeProgress = 0;
    this.cutSliceProgress = 0;

    // Recompute shapes to 0
    this.updateNonNegShape(0, false);
    this.updateWallShape(this.woodWall, 0);
    this.updateWallShape(this.laborWall, 0);
    this.updateObjectiveCeilingShape(0);
    this.updatePrismShape(this.continuousMesh, 0);
    this.updateCutPlaneShape(0);
    this.updateLatticeShape(0);

    if (this.slicedWedgeMesh) this.slicedWedgeMesh.visible = false;
    if (this.integerMesh) this.integerMesh.visible = false;

    this.effectivePlaneStates = {
      nonNegX1: false,
      nonNegX2: false,
      nonNegZ: false,
      wood: false,
      labor: false,
      polyhedron: false,
      objective: false,
      cut: false,
      lattice: false
    };

    if (this.onPlaneStatesChanged) {
      this.onPlaneStatesChanged(this.effectivePlaneStates);
    }
  }

  setCameraView(type) {
    this.userHasCustomView = false;
    this.isTransitioningCamera = true;
    if (type === 'perspective') {
      this.targetCameraPos.set(14.5, 11.0, 15.5);
      this.targetCameraLook.set(3.8, 2.4, 3.8);
    } else if (type === 'top') {
      // Top down 2D decision space view centered on [0, 5] x [0, 5]
      this.targetCameraPos.set(4.5, 23.0, 4.5);
      this.targetCameraLook.set(4.5, 0, 4.5);
    } else if (type === 'front') {
      // Front view along x1 - Z plane
      this.targetCameraPos.set(4.5, 4.5, 19.0);
      this.targetCameraLook.set(4.5, 2.6, 0);
    } else if (type === 'side') {
      // Side view along x2 - Z plane
      this.targetCameraPos.set(19.0, 4.5, 4.5);
      this.targetCameraLook.set(0, 2.6, 4.5);
    } else if (type === 'focus') {
      // Focus on active solution tracer with wide breathing room
      this.targetCameraPos.copy(this.tracerPos).add(new THREE.Vector3(5.5, 4.5, 5.5));
      this.targetCameraLook.copy(this.tracerPos);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // Smooth camera transition only during programmatic step changes or preset clicks
    if (this.isTransitioningCamera && !this.isUserInteracting) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      this.controls.target.lerp(this.targetCameraLook, 0.06);
      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.04 &&
          this.controls.target.distanceTo(this.targetCameraLook) < 0.04) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetCameraLook);
        this.isTransitioningCamera = false;
      }
    }
    this.controls.update();

    if (this.onAnimate) {
      this.onAnimate();
    }

    // Smooth tracer interpolation
    this.tracerPos.lerp(this.targetTracerPos, 0.08);
    this.tracerGroup.position.copy(this.tracerPos);

    // Tracer ring rotation and bobbing
    if (this.tracerRing) {
      this.tracerRing.rotation.z += 0.03;
      this.tracerSphere.position.y = Math.sin(time * 3) * 0.04;
    }

    // Smooth Shaping Progress for Planes and Polytope
    const shapeSpeed = 0.065;
    this.nonNegProgress = THREE.MathUtils.lerp(this.nonNegProgress, this.targetNonNegProgress, shapeSpeed);
    this.woodProgress = THREE.MathUtils.lerp(this.woodProgress, this.targetWoodProgress, shapeSpeed);
    this.laborProgress = THREE.MathUtils.lerp(this.laborProgress, this.targetLaborProgress, shapeSpeed);
    this.ceilingProgress = THREE.MathUtils.lerp(this.ceilingProgress, this.targetCeilingProgress, shapeSpeed);
    this.prismProgress = THREE.MathUtils.lerp(this.prismProgress, this.targetPrismProgress, shapeSpeed);
    this.cutPlaneProgress = THREE.MathUtils.lerp(this.cutPlaneProgress, this.targetCutPlaneProgress, shapeSpeed);
    this.latticeProgress = THREE.MathUtils.lerp(this.latticeProgress, this.targetLatticeProgress, shapeSpeed);

    if (Math.abs(this.nonNegProgress - this.targetNonNegProgress) < 0.002) this.nonNegProgress = this.targetNonNegProgress;
    if (Math.abs(this.woodProgress - this.targetWoodProgress) < 0.002) this.woodProgress = this.targetWoodProgress;
    if (Math.abs(this.laborProgress - this.targetLaborProgress) < 0.002) this.laborProgress = this.targetLaborProgress;
    if (Math.abs(this.ceilingProgress - this.targetCeilingProgress) < 0.002) this.ceilingProgress = this.targetCeilingProgress;
    if (Math.abs(this.prismProgress - this.targetPrismProgress) < 0.002) this.prismProgress = this.targetPrismProgress;
    if (Math.abs(this.cutPlaneProgress - this.targetCutPlaneProgress) < 0.002) this.cutPlaneProgress = this.targetCutPlaneProgress;
    if (Math.abs(this.latticeProgress - this.targetLatticeProgress) < 0.002) this.latticeProgress = this.targetLatticeProgress;

    // Apply dynamic morphing
    this.updateNonNegShape(this.nonNegProgress, this.isNonNegStep);
    this.updateWallShape(this.woodWall, this.woodProgress);
    this.updateWallShape(this.laborWall, this.laborProgress);

    this.updateObjectiveCeilingShape(this.ceilingProgress);
    this.updatePrismShape(this.continuousMesh, this.prismProgress);
    this.updateCutPlaneShape(this.cutPlaneProgress);
    this.updateLatticeShape(this.latticeProgress);

    // Apply instantaneous visibility overrides from effectivePlaneStates
    if (this.effectivePlaneStates) {
      if (this.woodWall) this.woodWall.visible = this.woodWall.visible && this.effectivePlaneStates.wood;
      if (this.floorWoodLine) this.floorWoodLine.visible = this.floorWoodLine.visible && this.effectivePlaneStates.wood;
      if (this.floorWoodArrows) this.floorWoodArrows.visible = this.floorWoodArrows.visible && this.effectivePlaneStates.wood;

      if (this.laborWall) this.laborWall.visible = this.laborWall.visible && this.effectivePlaneStates.labor;
      if (this.floorLaborLine) this.floorLaborLine.visible = this.floorLaborLine.visible && this.effectivePlaneStates.labor;
      if (this.floorLaborArrows) this.floorLaborArrows.visible = this.floorLaborArrows.visible && this.effectivePlaneStates.labor;

      if (this.continuousMesh) this.continuousMesh.visible = this.continuousMesh.visible && this.effectivePlaneStates.polyhedron;
      if (this.floorFeasibleArea) this.floorFeasibleArea.visible = this.floorFeasibleArea.visible && this.effectivePlaneStates.polyhedron;

      if (this.objectiveCeiling) this.objectiveCeiling.visible = this.objectiveCeiling.visible && this.effectivePlaneStates.objective;

      if (this.cutGroup) this.cutGroup.visible = this.cutGroup.visible && this.effectivePlaneStates.cut;
      if (this.slicedWedgeMesh && !this.effectivePlaneStates.cut) this.slicedWedgeMesh.visible = false;

      if (this.latticeGroup) this.latticeGroup.visible = this.latticeGroup.visible && this.effectivePlaneStates.lattice;
    }

    // Cutting plane laser pulsation
    if (this.cutGroup && this.cutGroup.visible && this.cutPlaneMat) {
      this.cutPlaneMat.opacity = 0.35 + Math.sin(time * 4) * 0.15;
    }

    // Slice separation animation
    this.cutSliceProgress = THREE.MathUtils.lerp(this.cutSliceProgress, this.targetSliceProgress, 0.05);
    if (this.slicedWedgeMesh && this.slicedWedgeMesh.visible) {
      // Elevate and drift away slightly with red emission
      this.slicedWedgeMesh.position.set(
        this.cutSliceProgress * 0.4,
        this.cutSliceProgress * 0.8,
        this.cutSliceProgress * 0.4
      );
      this.slicedWedgeMesh.children[1].material.opacity = 0.5 * (1 - this.cutSliceProgress * 0.5);
    }

    // Confetti particles update
    if (this.confettiActive && this.confettiPoints.visible) {
      const posAttr = this.confettiPoints.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let x = posAttr.getX(i) + this.confettiVelocities[i * 3];
        let y = posAttr.getY(i) + this.confettiVelocities[i * 3 + 1];
        let z = posAttr.getZ(i) + this.confettiVelocities[i * 3 + 2];

        // Gravity
        this.confettiVelocities[i * 3 + 1] -= 0.002;

        if (y < 0) {
          y = 0;
          this.confettiVelocities[i * 3 + 1] *= -0.3; // bounce
        }

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
