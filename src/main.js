import { SceneManager } from './sceneManager.js';
import { UnityGizmo } from './unityGizmo.js';
import { sound } from './sound.js';
import { hw1Steps, hw2Steps } from './presentationData.js';
import { InequalityGraphModal } from './inequalityGraph.js';

const AUDIENCE_QUESTIONS = [
  {
    id: 1,
    roll: 33,
    title: "In H.W. 1 Table 4, continuous LP yields x₁ = 16/3 and x₃ = 10/3 (Z = 29). Why does naive integer rounding fail compared to Gomory's Cutting Plane?",
    detail: "Topic: Pure Integer Cutting Plane vs Naive Rounding. How does continuous relaxation overshoot discrete manufacturability?",
    answer: "Continuous LP optimum (16/3, 3, 10/3) gives fractional values. Rounding down violates constraint boundaries (e.g. 2x₂ − 1.5x₃ = 1.5 > 1). Gomory's cutting planes systematically slice away fractional space without deleting integer lattice points, discovering the true integer peak (5, 2, 2) with Z = 23."
  },
  {
    id: 2,
    roll: 6,
    title: "How is Gomory's Cut 1 derived from the fractional x₁ row in Table 4, and why does it have a negative RHS (P₀ = −1/3)?",
    detail: "Topic: Gomory Cut Formulation & Dual Simplex Trigger. Why do we move from primal simplex to dual simplex once G₁ is added?",
    answer: "From row x₁: x₁ + (1/9)S₁ + (14/9)S₂ + (10/9)S₃ = 16/3. Decomposing into integers and fractions: the cut is -(1/9)S₁ - (5/9)S₂ - (1/9)S₃ + G₁ = -1/3. Because P₀ = -1/3 < 0, the primal solution is infeasible, triggering the Dual Simplex Method!"
  },
  {
    id: 3,
    roll: 1,
    title: "In H.W. 1 Table 8, which constraints are strictly binding (bottlenecks) at the final integer optimum (5, 2, 2), and which has slack?",
    detail: "Topic: Resource Bottleneck & Slack Analysis. Evaluate Plane 1, Plane 2, and Plane 3.",
    answer: "At (5, 2, 2): Constraint 1 has Slack S₁ = 3 (unused resource slack!). Constraint 2 has Slack S₂ = 0 (100% Binding Bottleneck!). Constraint 3 has Slack S₃ = 0 (100% Binding Bottleneck!)."
  },
  {
    id: 4,
    roll: 21,
    title: "In H.W. 2 (Mixed Integer), why is variable x₂ allowed to remain fractional, and how does the multiplier f₀ / (1 − f₀) alter Cut 2?",
    detail: "Topic: Mixed Integer Linear Programming (MILP). Contrast Pure Gomory cuts with Mixed Gomory cuts.",
    answer: "In MILP, only discrete variables (x₁, x₃ ∈ ℤ) require cuts; continuous variables like x₂ can take real values. In Table 6, x₃ has f₀ = 5/6. The Gomory Mixed Cut formula uses the ratio f₀ / (1 - f₀) = (5/6)/(1/6) = 5 on negative coefficients (-1/6 => 5 * 1/6 = 5/6), preserving continuous space while forcing discrete variables to integer values."
  }
];

class PresentationApp {
  constructor() {
    this.currentMode = 'hw1'; // 'hw1' | 'hw2'
    this.currentStepIndex = 0;
    this.steps = hw1Steps;
    this.fontScale = 1.0;

    this.initDOM();
    this.initSplitDivider();
    this.initAspectRatio();
    this.initFontScaling();
    this.ineqModal = new InequalityGraphModal(document.body);
    this.init3D();
    this.initUnityGizmo();
    this.initAudienceQuiz();
    this.initTouchAndSwipeGestures();
    this.bindEvents();
    this.updatePlaneIndexLabels();
    this.renderSteps();
    this.goToStep(0, false);
  }

  initDOM() {
    this.splashOverlay = document.getElementById('splash-overlay');
    this.startBtn = document.getElementById('start-presentation-btn');
    this.splashDiffBtn = document.getElementById('splash-diff-btn');
    this.questionOverlay = document.getElementById('question-overlay');
    this.solveProblemBtn = document.getElementById('solve-problem-btn');
    this.questionBackBtn = document.getElementById('question-back-btn');
    this.introDiffBtn = document.getElementById('intro-diff-btn');
    this.ineqGraphBtn = document.getElementById('ineq-graph-btn');
    this.audienceQuizBtn = document.getElementById('audience-quiz-btn');

    // Problem Selection Tabs
    this.tabHw1 = document.getElementById('tab-hw1');
    this.tabHw2 = document.getElementById('tab-hw2');

    this.prevBtn = document.getElementById('prev-step-btn');
    this.nextBtn = document.getElementById('next-step-btn');
    this.stepCounter = document.getElementById('step-counter-text');
    this.progressBar = document.getElementById('step-progress-fill');
    this.stepsContainer = document.getElementById('steps-container');
    this.viewportContainer = document.getElementById('viewport-container');
    this.resetBtn = document.getElementById('reset-btn');
    this.soundBtn = document.getElementById('sound-toggle-btn');
    this.soundIcon = document.getElementById('sound-icon');
    this.helpBtn = document.getElementById('help-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    // Font Size Controls
    this.fontDecBtn = document.getElementById('font-dec-btn');
    this.fontIncBtn = document.getElementById('font-inc-btn');
    this.fontResetBtn = document.getElementById('font-reset-btn');

    // "What Changed?" Comparison Modal
    this.diffModal = document.getElementById('diff-modal');
    this.diffPageBtn = document.getElementById('diff-page-btn');
    this.closeDiffBtn = document.getElementById('close-diff-btn');
    this.launchHw1Btn = document.getElementById('launch-hw1-btn');
    this.launchHw2Btn = document.getElementById('launch-hw2-btn');

    // Audience Final Quiz & Random Roll Call Elements
    this.audienceQuizOverlay = document.getElementById('audience-quiz-overlay');
    this.closeAudienceQuizBtn = document.getElementById('close-audience-quiz-btn');
    this.digitalClockSec = document.getElementById('digital-clock-sec');
    this.digitalClockMs = document.getElementById('digital-clock-ms');
    this.clockLiveDot = document.getElementById('clock-live-dot');
    this.entropyClockStatus = document.getElementById('entropy-clock-status');
    this.frozenSeedBanner = document.getElementById('frozen-seed-banner');
    this.frozenSeedText = document.getElementById('frozen-seed-text');
    this.generateRandomBtn = document.getElementById('generate-random-btn');
    this.hashTerminalBody = document.getElementById('hash-terminal-body');
    this.terminalStateTag = document.getElementById('terminal-state-tag');
    this.terminalProgressFill = document.getElementById('terminal-progress-fill');
    this.rollHugeNumber = document.getElementById('roll-huge-number');
    this.revealStatusMsg = document.getElementById('reveal-status-msg');
    this.qNumberBadge = document.getElementById('q-number-badge');
    this.nextQuestionBtn = document.getElementById('next-question-btn');
    this.qMainTitle = document.getElementById('q-main-title');
    this.qSubDetail = document.getElementById('q-sub-detail');
    this.toggleKeyBtn = document.getElementById('toggle-key-btn');
    this.keyAnswerBox = document.getElementById('key-answer-box');
    this.keyArrow = document.getElementById('key-arrow');

    // 3D HUD Readouts (x1, x2, x3, Z)
    this.hudX1 = document.getElementById('hud-x1');
    this.hudX2 = document.getElementById('hud-x2');
    this.hudX3 = document.getElementById('hud-x3');
    this.hudDollar = document.getElementById('hud-dollar');

    // 3D Plane Index Controls
    this.planeIndexBox = document.getElementById('plane-index-box');
    this.indexActiveCount = document.getElementById('index-active-count');
    this.indexToggleAllBtn = document.getElementById('index-toggle-all-btn');
    this.indexCollapseBtn = document.getElementById('index-collapse-btn');
    this.indexBoxHeader = document.getElementById('index-box-header');

    // 3D Auto-Rotate & Swipe HUD Toast Elements
    this.autoRotateBtn = document.getElementById('auto-rotate-btn');
    this.swipeToast = document.getElementById('swipe-feedback-toast');

    // Split Divider Elements
    this.mainSplit = document.getElementById('main-split');
    this.splitDivider = document.getElementById('split-divider');
    this.dividerTooltip = document.getElementById('divider-snap-tooltip');

    // Audience Excitement Soundboard, Reactions & 3D FX Elements
    this.soundboardToggleBtn = document.getElementById('soundboard-toggle-btn');
    this.audienceSoundboardBar = document.getElementById('audience-soundboard-bar');
    this.closeSoundboardBtn = document.getElementById('close-soundboard-btn');
    this.floatingReactionsContainer = document.getElementById('floating-reactions-container');
    this.explodedViewBtn = document.getElementById('exploded-view-btn');
    this.laserSliceBtn = document.getElementById('laser-slice-btn');
    this.latticeInspectorHud = document.getElementById('lattice-inspector-hud');
    this.hudPointCoords = document.getElementById('hud-point-coords');
    this.hudPointBadge = document.getElementById('hud-point-badge');
    this.hudPointZ = document.getElementById('hud-point-z');
    this.hudPointChecks = document.getElementById('hud-point-checks');
  }

  // =========================================================================
  // Interactive Snap Divider Splitter
  // =========================================================================
  initSplitDivider() {
    if (!this.splitDivider || !this.mainSplit) return;

    // Load saved split positions
    this.splitPos169 = parseFloat(localStorage.getItem('fm_split_169')) || 55;
    this.splitPos11 = parseFloat(localStorage.getItem('fm_split_11')) || 52;

    this.applySplitPosition();

    // Snap definitions for horizontal (16:9) and vertical (1:1)
    const snaps169 = [
      { pct: 30, label: '30% 3D • Focus Text' },
      { pct: 40, label: '40% 3D / 60% Text' },
      { pct: 50, label: '50% Equal Split' },
      { pct: 55, label: '55% Default Balance' },
      { pct: 65, label: '65% 3D / 35% Text' },
      { pct: 75, label: '75% Cinematic 3D' }
    ];

    const snaps11 = [
      { pct: 35, label: '35% Top • Focus Steps' },
      { pct: 50, label: '50% Equal Split' },
      { pct: 52, label: '52% Default Balanced' },
      { pct: 65, label: '65% Top Cinematic' }
    ];

    let isDragging = false;
    let resizeRaf = null;
    let lastSnapPoint = null;

    const onPointerDown = (e) => {
      e.preventDefault();
      isDragging = true;
      try {
        this.splitDivider.setPointerCapture(e.pointerId);
      } catch (err) {}
      this.splitDivider.classList.add('dragging');
      sound.playClick();
      updateFromPointer(e);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updateFromPointer(e);
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        this.splitDivider.releasePointerCapture(e.pointerId);
      } catch (err) {}
      this.splitDivider.classList.remove('dragging');

      const is11 = this.aspectRatio === '1:1';
      try {
        localStorage.setItem(is11 ? 'fm_split_11' : 'fm_split_169', String(is11 ? this.splitPos11 : this.splitPos169));
      } catch (err) {}

      if (this.sceneManager) {
        setTimeout(() => this.sceneManager.onWindowResize(), 20);
      }
    };

    const updateFromPointer = (e) => {
      const is11 = this.aspectRatio === '1:1';
      const rect = this.mainSplit.getBoundingClientRect();
      const snaps = is11 ? snaps11 : snaps169;

      let rawPct;
      if (is11) {
        rawPct = ((e.clientY - rect.top) / rect.height) * 100;
        rawPct = Math.max(25, Math.min(75, rawPct));
      } else {
        rawPct = ((e.clientX - rect.left) / rect.width) * 100;
        rawPct = Math.max(25, Math.min(75, rawPct));
      }

      // Magnetic snapping logic (within 2.2% range)
      let activeSnap = null;
      for (const s of snaps) {
        if (Math.abs(rawPct - s.pct) < 2.2) {
          activeSnap = s;
          rawPct = s.pct;
          break;
        }
      }

      if (activeSnap && lastSnapPoint !== activeSnap.pct) {
        lastSnapPoint = activeSnap.pct;
        sound.playSuspenseTick(950);
      } else if (!activeSnap) {
        lastSnapPoint = null;
      }

      const finalPct = Math.round(rawPct * 10) / 10;
      if (is11) {
        this.splitPos11 = finalPct;
      } else {
        this.splitPos169 = finalPct;
      }

      this.applySplitPosition();

      // Update Floating Tooltip
      if (this.dividerTooltip) {
        if (activeSnap) {
          this.dividerTooltip.textContent = `⚡ ${activeSnap.label}`;
          this.dividerTooltip.classList.add('snapped');
        } else {
          this.dividerTooltip.textContent = `${Math.round(finalPct)}% 3D / ${Math.round(100 - finalPct)}% Text`;
          this.dividerTooltip.classList.remove('snapped');
        }
      }

      // Smooth Three.js resize
      if (!resizeRaf) {
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = null;
          if (this.sceneManager) {
            this.sceneManager.onWindowResize();
          }
        });
      }
    };

    // Double-click to reset to default optimum split
    this.splitDivider.addEventListener('dblclick', () => {
      const is11 = this.aspectRatio === '1:1';
      if (is11) {
        this.splitPos11 = 52;
      } else {
        this.splitPos169 = 55;
      }
      this.applySplitPosition();
      sound.playBubblePop(1.1);
      this.showSwipeToast('Split Reset: Default');
      if (this.sceneManager) {
        setTimeout(() => this.sceneManager.onWindowResize(), 30);
      }
      try {
        localStorage.setItem(is11 ? 'fm_split_11' : 'fm_split_169', String(is11 ? 52 : 55));
      } catch (err) {}
    });

    this.splitDivider.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  }

  applySplitPosition() {
    const is11 = this.aspectRatio === '1:1';
    if (is11) {
      document.documentElement.style.setProperty('--split-pos-vert', `${this.splitPos11}%`);
      if (this.mainSplit) this.mainSplit.style.setProperty('--split-pos-vert', `${this.splitPos11}%`);
    } else {
      document.documentElement.style.setProperty('--split-pos', `${this.splitPos169}%`);
      if (this.mainSplit) this.mainSplit.style.setProperty('--split-pos', `${this.splitPos169}%`);
    }
  }

  initAspectRatio() {
    const saved = localStorage.getItem('fm_aspect_ratio') || '16:9';
    this.setAspectRatio(saved, false);
  }

  setAspectRatio(ratio, playFx = true) {
    this.aspectRatio = ratio === '1:1' ? '1:1' : '16:9';
    if (playFx) {
      sound.playClick();
    }

    if (this.aspectRatio === '1:1') {
      document.body.classList.remove('aspect-16-9');
      document.body.classList.add('aspect-1-1');
    } else {
      document.body.classList.remove('aspect-1-1');
      document.body.classList.add('aspect-16-9');
    }

    this.applySplitPosition();

    try {
      localStorage.setItem('fm_aspect_ratio', this.aspectRatio);
    } catch (e) {}

    // Synchronize all aspect pill buttons across the page
    document.querySelectorAll('[data-ratio]').forEach(btn => {
      const btnRatio = btn.getAttribute('data-ratio');
      if (btnRatio === this.aspectRatio) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Notify SceneManager to recalculate viewport size for full-bleed display
    if (this.sceneManager) {
      setTimeout(() => this.sceneManager.onWindowResize(), 60);
    }
  }

  toggleAspectRatio() {
    const nextRatio = this.aspectRatio === '16:9' ? '1:1' : '16:9';
    this.setAspectRatio(nextRatio);
  }

  // =========================================================================
  // Accessible Dynamic Font Scaling (A- / 100% / A+)
  // =========================================================================
  initFontScaling() {
    this.fontScale = parseFloat(localStorage.getItem('fm_font_scale')) || 1.0;
    this.applyFontScale();

    if (this.fontIncBtn) {
      this.fontIncBtn.addEventListener('click', () => {
        sound.playBubblePop(1.15);
        const next = Math.min(1.5, Math.round((this.fontScale + 0.08) * 100) / 100);
        this.setFontScale(next);
        this.showSwipeToast(`🔍 Font: ${Math.round(next * 100)}%`);
      });
    }

    if (this.fontDecBtn) {
      this.fontDecBtn.addEventListener('click', () => {
        sound.playBubblePop(0.85);
        const next = Math.max(0.7, Math.round((this.fontScale - 0.08) * 100) / 100);
        this.setFontScale(next);
        this.showSwipeToast(`🔎 Font: ${Math.round(next * 100)}%`);
      });
    }

    if (this.fontResetBtn) {
      this.fontResetBtn.addEventListener('click', () => {
        sound.playBubblePop(1.0);
        this.setFontScale(1.0);
        this.showSwipeToast(`Font Reset: 100%`);
      });
    }
  }

  setFontScale(scale) {
    this.fontScale = scale;
    try {
      localStorage.setItem('fm_font_scale', scale);
    } catch (e) {}
    this.applyFontScale();
  }

  applyFontScale() {
    const scaleStr = String(this.fontScale);
    document.documentElement.style.setProperty('--font-scale', scaleStr);
    document.documentElement.style.fontSize = `${16 * this.fontScale}px`;
    document.body.style.setProperty('--font-scale', scaleStr);
    const app = document.getElementById('app');
    if (app) app.style.setProperty('--font-scale', scaleStr);
    if (this.stepsContainer) this.stepsContainer.style.setProperty('--font-scale', scaleStr);
    if (this.fontResetBtn) {
      this.fontResetBtn.textContent = `${Math.round(this.fontScale * 100)}%`;
    }
  }

  showSwipeToast(msg) {
    if (!this.swipeToast) return;
    this.swipeToast.textContent = msg;
    this.swipeToast.classList.remove('hidden');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      if (this.swipeToast) this.swipeToast.classList.add('hidden');
    }, 1100);
  }

  // =========================================================================
  // Touch Pinch Zoom & Parsec/Mobile Swipe Navigation
  // =========================================================================
  initTouchAndSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isPinching = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1.0;

    // --- 1. Touch Events (Native Mobile & Parsec Touch Stream) ---
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // 2-Finger Pinch Gesture: Dynamic Font Zooming on Fullscreen / Content
        isPinching = true;
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartScale = this.fontScale;
        return;
      }

      if (e.touches.length === 1) {
        isPinching = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchStartDist > 0) {
          const ratio = currentDist / pinchStartDist;
          const targetScale = Math.min(1.5, Math.max(0.7, Math.round(pinchStartScale * ratio * 20) / 20));
          if (Math.abs(targetScale - this.fontScale) >= 0.03) {
            this.setFontScale(targetScale);
            this.showSwipeToast(`🔍 Font: ${Math.round(targetScale * 100)}%`);
          }
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (isPinching) {
        isPinching = false;
        return;
      }

      const touch = e.changedTouches ? e.changedTouches[0] : null;
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;

      // Ignore touches on interactive controls
      if (e.target && e.target.closest && e.target.closest('button, input, select, .plane-index-box, .unity-gizmo-box, .plane-switch, .font-control-group')) {
        return;
      }

      const isOverCanvas = !!(e.target && e.target.closest && e.target.closest('#viewport-container canvas'));
      const minSwipeDist = isOverCanvas ? 80 : 45;
      const maxSwipeTime = isOverCanvas ? 500 : 800;

      // Horizontal dominance check
      if (Math.abs(deltaX) > minSwipeDist && Math.abs(deltaX) > 1.25 * Math.abs(deltaY) && dt < maxSwipeTime) {
        if (deltaX < 0) {
          // Slide left (finger right-to-left) -> Next step
          this.nextStep();
          this.showSwipeToast('Next Step ➔');
        } else {
          // Slide right (finger left-to-right) -> Previous step
          this.prevStep();
          this.showSwipeToast('⬅ Previous Step');
        }
      }
    }, { passive: true });

    // --- 2. Pointer / Mouse Drag (Parsec, getScreen, Remote Touch Emulation) ---
    let ptrStartX = 0;
    let ptrStartY = 0;
    let ptrStartTime = 0;
    let isPtrDown = false;

    window.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('button, input, select, .plane-index-box, .unity-gizmo-box, .plane-switch')) {
        return;
      }
      isPtrDown = true;
      ptrStartX = e.clientX;
      ptrStartY = e.clientY;
      ptrStartTime = Date.now();
    }, { passive: true });

    window.addEventListener('pointerup', (e) => {
      if (!isPtrDown) return;
      isPtrDown = false;

      const dx = e.clientX - ptrStartX;
      const dy = e.clientY - ptrStartY;
      const dt = Date.now() - ptrStartTime;

      if (e.target && e.target.closest && e.target.closest('button, input, select, .plane-index-box, .unity-gizmo-box, .plane-switch, .font-control-group')) {
        return;
      }

      const isOverCanvas = !!(e.target && e.target.closest && e.target.closest('#viewport-container canvas'));
      const minDragDist = isOverCanvas ? 90 : 50;
      const maxDragTime = isOverCanvas ? 550 : 850;

      if (Math.abs(dx) > minDragDist && Math.abs(dx) > 1.3 * Math.abs(dy) && dt < maxDragTime) {
        if (dx < 0) {
          this.nextStep();
          this.showSwipeToast('Next Step ➔');
        } else {
          this.prevStep();
          this.showSwipeToast('⬅ Previous Step');
        }
      }
    }, { passive: true });

    // --- 3. Trackpad Pinch-to-Zoom (Ctrl + Wheel) on Content Pane ---
    if (this.stepsContainer) {
      this.stepsContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = -e.deltaY * 0.003;
          const targetScale = Math.min(1.5, Math.max(0.7, Math.round((this.fontScale + delta) * 100) / 100));
          this.setFontScale(targetScale);
          this.showSwipeToast(`🔍 Font: ${Math.round(targetScale * 100)}%`);
        }
      }, { passive: false });
    }
  }

  // =========================================================================
  // 3D Scene & Unity Gizmo Initialization
  // =========================================================================
  init3D() {
    this.sceneManager = new SceneManager(this.viewportContainer, (coords) => {
      this.updateCoordinates(coords);
    });

    this.sceneManager.onPlaneStatesChanged = (states) => {
      this.updatePlaneIndexUI(states);
    };

    // 3D Integer Lattice Holographic Raycaster Inspector
    this.sceneManager.onLatticePointHover = (userData, mousePos) => {
      this.updateLatticeInspectorHUD(userData, mousePos, false);
    };

    this.sceneManager.onLatticePointClick = (userData, mousePos) => {
      if (userData) {
        sound.playBubblePop(userData.isOpt ? 1.5 : 1.1);
        this.updateLatticeInspectorHUD(userData, mousePos, true);
        if (userData.isOpt) {
          this.spawnFloatingReaction('★');
          this.spawnFloatingReaction('🎯');
        }
      }
    };
  }

  updateLatticeInspectorHUD(userData, mousePos, clicked = false) {
    if (!this.latticeInspectorHud) return;

    if (!userData) {
      if (!this._hudLockedByClick) {
        this.latticeInspectorHud.classList.add('hidden');
      }
      return;
    }

    if (clicked) {
      this._hudLockedByClick = true;
    }

    const { x1, x2, x3, valZ, feas, isOpt, mode } = userData;
    if (this.hudPointCoords) {
      this.hudPointCoords.textContent = `(${x1}, ${x2}, ${x3})`;
    }
    if (this.hudPointZ) {
      this.hudPointZ.textContent = `${Number(valZ).toFixed(2)}`;
    }
    if (this.hudPointBadge) {
      if (isOpt) {
        this.hudPointBadge.textContent = '★ GLOBAL OPTIMUM';
        this.hudPointBadge.className = 'hud-point-badge optimum';
      } else if (feas) {
        this.hudPointBadge.textContent = 'FEASIBLE INTEGER';
        this.hudPointBadge.className = 'hud-point-badge pass';
      } else {
        this.hudPointBadge.textContent = 'INFEASIBLE';
        this.hudPointBadge.className = 'hud-point-badge fail';
      }
    }

    if (this.hudPointChecks) {
      let checksHtml = '';
      if (mode === 'hw1') {
        const c1Val = -x1 + 2 * x2 + x3;
        const c1Pass = c1Val <= 4;
        const c2Val = 2 * x2 - 1.5 * x3;
        const c2Pass = c2Val <= 1;
        const c3Val = x1 - 3 * x2 + 2 * x3;
        const c3Pass = c3Val <= 3;
        checksHtml = `
          <div class="check-item ${c1Pass ? 'pass' : 'fail'}">
            <span>Plane 1: −x₁+2x₂+x₃ = ${c1Val} ≤ 4</span>
            <strong>${c1Pass ? '✓' : '✗'}</strong>
          </div>
          <div class="check-item ${c2Pass ? 'pass' : 'fail'}">
            <span>Plane 2: 2x₂−1.5x₃ = ${c2Val} ≤ 1</span>
            <strong>${c2Pass ? '✓' : '✗'}</strong>
          </div>
          <div class="check-item ${c3Pass ? 'pass' : 'fail'}">
            <span>Plane 3: x₁−3x₂+2x₃ = ${c3Val} ≤ 3</span>
            <strong>${c3Pass ? '✓' : '✗'}</strong>
          </div>
        `;
      } else {
        const c1Val = 4 * x1 - 4 * x2;
        const c1Pass = c1Val <= 5;
        const c2Val = -x1 + 6 * x2;
        const c2Pass = c2Val <= 5;
        const c3Val = -x1 + x2 + x3;
        const c3Pass = c3Val <= 5;
        checksHtml = `
          <div class="check-item ${c1Pass ? 'pass' : 'fail'}">
            <span>Plane 1: 4x₁−4x₂ = ${c1Val} ≤ 5</span>
            <strong>${c1Pass ? '✓' : '✗'}</strong>
          </div>
          <div class="check-item ${c2Pass ? 'pass' : 'fail'}">
            <span>Plane 2: −x₁+6x₂ = ${c2Val} ≤ 5</span>
            <strong>${c2Pass ? '✓' : '✗'}</strong>
          </div>
          <div class="check-item ${c3Pass ? 'pass' : 'fail'}">
            <span>Plane 3: −x₁+x₂+x₃ = ${c3Val} ≤ 5</span>
            <strong>${c3Pass ? '✓' : '✗'}</strong>
          </div>
        `;
      }
      this.hudPointChecks.innerHTML = checksHtml;
    }

    this.latticeInspectorHud.classList.remove('hidden');
  }

  updateCoordinates({ x1, x2, x3, Z }) {
    if (this.hudX1) this.hudX1.textContent = Number(x1 || 0).toFixed(2);
    if (this.hudX2) this.hudX2.textContent = Number(x2 || 0).toFixed(2);
    if (this.hudX3) this.hudX3.textContent = Number(x3 || 0).toFixed(2);
    if (this.hudDollar) this.hudDollar.textContent = `Z = ${Number(Z || 0).toFixed(2)}`;
  }

  initUnityGizmo() {
    const gizmoCanvas = document.createElement('canvas');
    gizmoCanvas.id = 'unity-gizmo-canvas';
    gizmoCanvas.width = 120;
    gizmoCanvas.height = 120;

    const gizmoBox = document.createElement('div');
    gizmoBox.className = 'unity-gizmo-box asmr-card';
    gizmoBox.title = 'Interactive 3D Orientation Gizmo';

    const title = document.createElement('div');
    title.className = 'gizmo-title';
    title.textContent = 'AXIS VIEW';

    gizmoBox.appendChild(title);
    gizmoBox.appendChild(gizmoCanvas);
    this.viewportContainer.appendChild(gizmoBox);

    this.unityGizmo = new UnityGizmo(
      this.sceneManager.camera,
      this.sceneManager.controls,
      gizmoCanvas,
      (axis) => {
        sound.playClick();
        if (axis === 'y') {
          this.sceneManager.setCameraView('top');
        } else if (axis === 'z') {
          this.sceneManager.setCameraView('front');
        } else if (axis === 'x') {
          this.sceneManager.setCameraView('side');
        } else if (axis === '-y') {
          this.sceneManager.setCameraView('top');
        } else if (axis === '-z') {
          this.sceneManager.setCameraView('front');
        } else if (axis === '-x') {
          this.sceneManager.setCameraView('side');
        } else if (axis === 'center') {
          this.sceneManager.setCameraView('perspective');
        }
      }
    );

    this.sceneManager.onAnimate = () => {
      this.unityGizmo.update();
    };
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  bindEvents() {
    // Start presentation & show audience question challenge
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        sound.init();
        sound.playClick();
        this.enterFullscreen();
        this.splashOverlay.classList.add('hidden');
        if (this.questionOverlay) {
          this.questionOverlay.classList.remove('hidden');
        }
      });
    }

    // Solve problem -> Proceed into main 3D simulation
    if (this.solveProblemBtn) {
      this.solveProblemBtn.addEventListener('click', () => {
        sound.init();
        sound.playStepNext();
        if (this.questionOverlay) {
          this.questionOverlay.classList.add('hidden');
        }
        if (this.sceneManager) {
          this.sceneManager.onWindowResize();
        }
      });
    }

    // Return to intro splash from question challenge
    if (this.questionBackBtn) {
      this.questionBackBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.questionOverlay) {
          this.questionOverlay.classList.add('hidden');
        }
        if (this.splashOverlay) {
          this.splashOverlay.classList.remove('hidden');
        }
      });
    }

    // Tab mode buttons (H.W. 1 Pure vs H.W. 2 Mixed)
    if (this.tabHw1) {
      this.tabHw1.addEventListener('click', () => this.switchMode('hw1'));
    }
    if (this.tabHw2) {
      this.tabHw2.addEventListener('click', () => this.switchMode('hw2'));
    }

    // "What Changed?" Comparison Modal triggers
    if (this.diffPageBtn) {
      this.diffPageBtn.addEventListener('click', () => this.openDiffModal());
    }
    if (this.splashDiffBtn) {
      this.splashDiffBtn.addEventListener('click', () => this.openDiffModal());
    }
    if (this.introDiffBtn) {
      this.introDiffBtn.addEventListener('click', () => this.openDiffModal());
    }
    if (this.closeDiffBtn) {
      this.closeDiffBtn.addEventListener('click', () => this.closeDiffModal());
    }
    if (this.launchHw1Btn) {
      this.launchHw1Btn.addEventListener('click', () => {
        this.closeDiffModal();
        if (this.questionOverlay) this.questionOverlay.classList.add('hidden');
        if (this.splashOverlay) this.splashOverlay.classList.add('hidden');
        this.switchMode('hw1');
      });
    }
    if (this.launchHw2Btn) {
      this.launchHw2Btn.addEventListener('click', () => {
        this.closeDiffModal();
        if (this.questionOverlay) this.questionOverlay.classList.add('hidden');
        if (this.splashOverlay) this.splashOverlay.classList.add('hidden');
        this.switchMode('hw2');
      });
    }

    // Step Navigation buttons
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextStep());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevStep());
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        sound.playClick();
        this.resetAll();
      });
    }

    // 3D Plane Index Controls
    if (this.indexBoxHeader) {
      this.indexBoxHeader.addEventListener('click', (e) => {
        if (e.target.closest('#index-toggle-all-btn')) return;
        sound.playClick();
        this.planeIndexBox.classList.toggle('collapsed');
      });
    }
    if (this.indexToggleAllBtn) {
      this.indexToggleAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        if (this.sceneManager) {
          this.sceneManager.toggleAllPlanes();
        }
      });
    }
    if (this.indexCollapseBtn) {
      this.indexCollapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.planeIndexBox.classList.toggle('collapsed');
      });
    }

    // Individual Plane Switch toggles
    document.querySelectorAll('.plane-index-box .plane-switch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planeKey = btn.getAttribute('data-plane');
        sound.playBubblePop(1.1);
        if (this.sceneManager) {
          this.sceneManager.togglePlane(planeKey);
        }
      });
    });

    // Sound toggle
    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.soundIcon.textContent = isMuted ? '🔇' : '🎧';
      });
    }

    // Help & Shortcuts Modal
    if (this.helpBtn) {
      this.helpBtn.addEventListener('click', () => {
        sound.playClick();
        this.shortcutsModal.classList.add('open');
      });
    }
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => {
        sound.playClick();
        this.shortcutsModal.classList.remove('open');
      });
    }

    // Fullscreen toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Audience Quiz button
    if (this.audienceQuizBtn) {
      this.audienceQuizBtn.addEventListener('click', () => this.openAudienceQuiz());
    }
    if (this.closeAudienceQuizBtn) {
      this.closeAudienceQuizBtn.addEventListener('click', () => this.closeAudienceQuiz());
    }

    // Projector aspect ratio button listeners
    document.querySelectorAll('[data-ratio]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetRatio = btn.getAttribute('data-ratio');
        this.setAspectRatio(targetRatio);
      });
    });

    // Viewport camera angle buttons (excluding auto-rotate toggle)
    document.querySelectorAll('.cam-btn:not(.auto-rotate-btn)').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.cam-btn:not(.auto-rotate-btn)').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        if (this.sceneManager) {
          this.sceneManager.setCameraView(view);
        }
      });
    });

    // Auto-Rotate Button toggle
    if (this.autoRotateBtn) {
      this.autoRotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        if (this.sceneManager) {
          const isRotating = this.sceneManager.toggleAutoRotate();
          this.autoRotateBtn.classList.toggle('active', isRotating);
          this.showSwipeToast(isRotating ? '⟳ Auto-Rotate Enabled' : '⏸ Auto-Rotate Paused');
        }
      });
    }

    // 3D Polytope Exploded View toggle
    if (this.explodedViewBtn) {
      this.explodedViewBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.sceneManager) {
          const isExp = this.sceneManager.toggleExplodedView();
          this.explodedViewBtn.classList.toggle('active', isExp);
          this.showSwipeToast(isExp ? '💥 Polytope Disassembled' : 'Reassembled Polytope');
        }
      });
    }

    // 3D Laser Slice Cutting Plane FX trigger
    if (this.laserSliceBtn) {
      this.laserSliceBtn.addEventListener('click', () => {
        this.triggerReactionFX('laser');
      });
    }

    // Audience Live Reactions & Soundboard Toggle
    if (this.soundboardToggleBtn) {
      this.soundboardToggleBtn.addEventListener('click', () => this.toggleSoundboard());
    }
    if (this.closeSoundboardBtn) {
      this.closeSoundboardBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.audienceSoundboardBar) this.audienceSoundboardBar.classList.add('hidden');
      });
    }

    // Soundboard Item Buttons
    document.querySelectorAll('.soundboard-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fx = btn.getAttribute('data-fx');
        this.triggerReactionFX(fx);
      });
    });

    // Delegated click handler for Tableau 4 Audience Dilemma Challenge
    if (this.stepsContainer) {
      this.stepsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.challenge-opt-btn');
        if (btn) {
          const choice = btn.getAttribute('data-choice');
          this.handleChallengeChoice(choice, btn);
        }
      });
    }

    // Global Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // If "What Changed?" modal is open
      if (this.diffModal && !this.diffModal.classList.contains('hidden')) {
        if (key === 'escape' || key === 'c') {
          e.preventDefault();
          this.closeDiffModal();
        }
        return;
      }

      // If Audience Quiz overlay is visible
      if (this.audienceQuizOverlay && !this.audienceQuizOverlay.classList.contains('hidden')) {
        if (key === 'escape') {
          e.preventDefault();
          this.closeAudienceQuiz();
        } else if (key === 'enter' || key === ' ') {
          e.preventDefault();
          if (this.generateRandomBtn && !this.generateRandomBtn.disabled) {
            this.generateRandomBtn.click();
          }
        } else if (key === 'n') {
          e.preventDefault();
          this.cycleQuizQuestion();
        } else if (key === 'k') {
          e.preventDefault();
          this.toggleAnswerKey();
        }
        return;
      }

      // Audience Reaction Soundboard Hotkeys (3 - 8, B, E, L)
      if (key === '3') {
        e.preventDefault();
        this.triggerReactionFX('applause');
      } else if (key === '4') {
        e.preventDefault();
        this.triggerReactionFX('drumroll');
      } else if (key === '5') {
        e.preventDefault();
        this.triggerReactionFX('buzzer');
      } else if (key === '6') {
        e.preventDefault();
        this.triggerReactionFX('eureka');
      } else if (key === '7') {
        e.preventDefault();
        this.triggerReactionFX('laser');
      } else if (key === '8') {
        e.preventDefault();
        this.triggerReactionFX('confetti');
      } else if (key === 'b') {
        e.preventDefault();
        this.toggleSoundboard();
      } else if (key === 'e') {
        e.preventDefault();
        if (this.explodedViewBtn) this.explodedViewBtn.click();
      } else if (key === 'l') {
        e.preventDefault();
        this.triggerReactionFX('laser');
      } else if (key === 'q') {
        e.preventDefault();
        this.toggleAudienceQuiz();
      } else if (key === 'c') {
        e.preventDefault();
        this.toggleDiffModal();
      } else if (key === 'a') {
        e.preventDefault();
        this.toggleAspectRatio();
      } else if (key === '1') {
        this.switchMode('hw1');
      } else if (key === '2') {
        this.switchMode('hw2');
      } else if (key === ']' || key === '=') {
        e.preventDefault();
        if (this.fontIncBtn) this.fontIncBtn.click();
      } else if (key === '[' || key === '-') {
        e.preventDefault();
        if (this.fontDecBtn) this.fontDecBtn.click();
      } else if (key === '0') {
        e.preventDefault();
        if (this.fontResetBtn) this.fontResetBtn.click();
      } else if (key === 'arrowright' || key === ' ' || key === 'enter') {
        e.preventDefault();
        this.nextStep();
      } else if (key === 'arrowleft' || key === 'backspace') {
        e.preventDefault();
        this.prevStep();
      } else if (key === 'f') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (key === 'r') {
        e.preventDefault();
        sound.playClick();
        this.resetAll();
      } else if (key === 't') {
        this.sceneManager.setCameraView('top');
      } else if (key === 'p') {
        this.sceneManager.setCameraView('perspective');
      } else if (key === 'o') {
        e.preventDefault();
        if (this.autoRotateBtn) this.autoRotateBtn.click();
      } else if (key === 'm') {
        const isMuted = sound.toggleMute();
        this.soundIcon.textContent = isMuted ? '🔇' : '🎧';
      } else if (key === '?' || key === 'h') {
        this.shortcutsModal.classList.toggle('open');
      } else if (key === 'escape') {
        this.shortcutsModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // Audience Excitement FX, Live Reaction Stream & Dilemma Card Handlers
  // =========================================================================
  spawnFloatingReaction(emoji) {
    if (!this.floatingReactionsContainer) return;
    const el = document.createElement('div');
    el.className = 'floating-reaction-emoji';
    el.textContent = emoji;
    const leftPct = 12 + Math.random() * 76;
    el.style.left = `${leftPct}%`;
    el.style.bottom = `${8 + Math.random() * 32}px`;
    this.floatingReactionsContainer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2250);
  }

  triggerReactionFX(fxType) {
    sound.init();
    if (fxType === 'applause') {
      sound.playApplause();
      this.spawnFloatingReaction('👏');
      this.spawnFloatingReaction('🔥');
      this.showSwipeToast('👏 Crowd Applause & Cheers!');
    } else if (fxType === 'drumroll') {
      sound.playDrumRoll();
      this.spawnFloatingReaction('🥁');
      this.showSwipeToast('🥁 Suspense Drumroll...');
    } else if (fxType === 'buzzer') {
      sound.playBuzzer();
      this.spawnFloatingReaction('❌');
      this.showSwipeToast('❌ Wrong Buzzer!');
    } else if (fxType === 'eureka') {
      sound.playEurekaChime();
      this.spawnFloatingReaction('💡');
      this.spawnFloatingReaction('✨');
      this.showSwipeToast('💡 Eureka Insight!');
    } else if (fxType === 'laser') {
      sound.playLaserBlast();
      this.spawnFloatingReaction('⚡');
      if (this.sceneManager) {
        this.sceneManager.triggerLaserSliceFX();
      }
      this.showSwipeToast('⚡ Gomory Laser Slice!');
    } else if (fxType === 'confetti') {
      sound.playRollRevealFanfare();
      this.spawnFloatingReaction('🎉');
      this.spawnFloatingReaction('🎊');
      if (this.sceneManager) {
        this.sceneManager.triggerConfetti();
      }
      this.showSwipeToast('🎊 Confetti Shower!');
    }
  }

  toggleSoundboard() {
    if (!this.audienceSoundboardBar) return;
    sound.playClick();
    this.audienceSoundboardBar.classList.toggle('hidden');
  }

  handleChallengeChoice(choice, btn) {
    const parentBox = btn.closest('#round-down-challenge');
    if (!parentBox) return;
    const feedbackBox = parentBox.querySelector('#challenge-feedback');
    const allBtns = parentBox.querySelectorAll('.challenge-opt-btn');
    allBtns.forEach(b => b.classList.remove('wrong', 'correct'));

    if (choice === 'a') {
      sound.playBuzzer();
      btn.classList.add('wrong');
      this.spawnFloatingReaction('❌');
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback-box fail';
        feedbackBox.innerHTML = `
          <strong>❌ OPTION A INFEASIBLE:</strong> Point <code>(5, 3, 3)</code> violates Plane 2 (Labor Capacity):<br>
          <code>2x₂ − 1.5x₃ = 2(3) − 1.5(3) = 6 − 4.5 = 1.5 &gt; 1 (VIOLATED!)</code><br>
          Labor constraint capacity is shattered. Factory cannot build this schedule!
        `;
        feedbackBox.classList.remove('hidden');
      }
    } else if (choice === 'b') {
      sound.playBuzzer();
      btn.classList.add('wrong');
      this.spawnFloatingReaction('❌');
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback-box fail';
        feedbackBox.innerHTML = `
          <strong>❌ OPTION B INFEASIBLE:</strong> Point <code>(5, 3, 2)</code> violates Plane 2 (Labor Capacity) even worse:<br>
          <code>2x₂ − 1.5x₃ = 2(3) − 1.5(2) = 6 − 3 = 3.0 &gt;&gt; 1 (HEAVILY VIOLATED!)</code><br>
          Requires 300% of available machine hours. Naive heuristic rounding completely fails!
        `;
        feedbackBox.classList.remove('hidden');
      }
    } else if (choice === 'c') {
      sound.playEurekaChime();
      btn.classList.add('correct');
      this.spawnFloatingReaction('💡');
      this.spawnFloatingReaction('🎉');
      this.spawnFloatingReaction('⚡');
      if (this.sceneManager) {
        this.sceneManager.triggerLaserSliceFX(1);
        this.sceneManager.triggerConfetti();
      }
      if (feedbackBox) {
        feedbackBox.className = 'challenge-feedback-box pass';
        feedbackBox.innerHTML = `
          <strong>★ EXACT MATHEMATICAL TRIUMPH!</strong> Gomory's Cutting Plane Method:<br>
          Instead of reckless integer rounding that destroys feasibility, Gomory Cut 1 <code>(2x₂ − x₃ ≤ 2)</code> cleanly slices off the non-integer vertex <code>(16/3, 3, 10/3)</code> without shaving a single feasible lattice coordinate, steering us directly to the integer peak <code>(5, 2, 2)</code> with Z = 23!
        `;
        feedbackBox.classList.remove('hidden');
      }
    }
  }

  // =========================================================================
  // "What Changed?" Comparison Modal Handlers
  // =========================================================================
  openDiffModal() {
    if (this.diffModal) {
      this.diffModal.classList.remove('hidden');
      sound.playClick();
    }
  }

  closeDiffModal() {
    if (this.diffModal) {
      this.diffModal.classList.add('hidden');
      sound.playClick();
    }
  }

  toggleDiffModal() {
    if (this.diffModal) {
      if (this.diffModal.classList.contains('hidden')) {
        this.openDiffModal();
      } else {
        this.closeDiffModal();
      }
    }
  }

  // =========================================================================
  // Problem Switching (H.W. 1 Pure Gomory vs. H.W. 2 Mixed Integer)
  // =========================================================================
  switchMode(mode) {
    if (this.currentMode === mode && this.steps) return;

    sound.playStepNext();
    this.currentMode = mode;
    this.steps = mode === 'hw1' ? hw1Steps : hw2Steps;
    this.currentStepIndex = 0;

    // Toggle tab styles
    if (this.tabHw1) this.tabHw1.classList.toggle('active', mode === 'hw1');
    if (this.tabHw2) this.tabHw2.classList.toggle('active', mode === 'hw2');

    this.updatePlaneIndexLabels();
    this.renderSteps();
    this.goToStep(0, false);
  }

  updatePlaneIndexLabels() {
    const isHw1 = this.currentMode === 'hw1';
    const p1Title = document.getElementById('index-p1-title');
    const p1Sub = document.getElementById('index-p1-sub');
    const p2Title = document.getElementById('index-p2-title');
    const p2Sub = document.getElementById('index-p2-sub');
    const p3Title = document.getElementById('index-p3-title');
    const p3Sub = document.getElementById('index-p3-sub');
    const cut1Title = document.getElementById('index-cut1-title');
    const cut1Sub = document.getElementById('index-cut1-sub');
    const cut2Title = document.getElementById('index-cut2-title');
    const cut2Sub = document.getElementById('index-cut2-sub');

    if (isHw1) {
      if (p1Title) p1Title.textContent = "Plane 1 (C₁)";
      if (p1Sub) p1Sub.textContent = "−x₁ + 2x₂ + x₃ ≤ 4";
      if (p2Title) p2Title.textContent = "Plane 2 (C₂)";
      if (p2Sub) p2Sub.textContent = "2x₂ − 1.5x₃ ≤ 1";
      if (p3Title) p3Title.textContent = "Plane 3 (C₃)";
      if (p3Sub) p3Sub.textContent = "x₁ − 3x₂ + 2x₃ ≤ 3";
      if (cut1Title) cut1Title.textContent = "Gomory Cut 1 (G₁)";
      if (cut1Sub) cut1Sub.textContent = "2x₂ − x₃ ≤ 2";
      if (cut2Title) cut2Title.textContent = "Gomory Cut 2 (G₂)";
      if (cut2Sub) cut2Sub.textContent = "x₃ ≤ 2";
    } else {
      if (p1Title) p1Title.textContent = "Plane 1 (C₁)";
      if (p1Sub) p1Sub.textContent = "4x₁ − 4x₂ ≤ 5";
      if (p2Title) p2Title.textContent = "Plane 2 (C₂)";
      if (p2Sub) p2Sub.textContent = "−x₁ + 6x₂ ≤ 5";
      if (p3Title) p3Title.textContent = "Plane 3 (C₃)";
      if (p3Sub) p3Sub.textContent = "−x₁ + x₂ + x₃ ≤ 5";
      if (cut1Title) cut1Title.textContent = "Mixed Cut 1 (G₁)";
      if (cut1Sub) cut1Sub.textContent = "x₁ ≤ 2";
      if (cut2Title) cut2Title.textContent = "Mixed Cut 2 (G₂)";
      if (cut2Sub) cut2Sub.textContent = "x₃ ≤ 6";
    }
  }

  enterFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request blocked or not supported:', err);
    }
  }

  toggleFullscreen() {
    sound.playClick();
    if (!document.fullscreenElement) {
      this.enterFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // =========================================================================
  // Step Progression & Tableau Card Rendering
  // =========================================================================
  renderSteps() {
    this.stepsContainer.innerHTML = '';

    this.steps.forEach((step, idx) => {
      const card = document.createElement('article');
      card.className = `step-card asmr-card ${idx === 0 ? 'active' : ''}`;
      card.dataset.index = idx;
      card.id = `step-card-${idx}`;

      card.innerHTML = `
        <div class="card-header">
          <h2 class="card-title">${step.title}</h2>
          <span class="card-badge">${step.badge}</span>
        </div>
        <div class="card-body">
          ${step.content}
        </div>
      `;

      card.addEventListener('click', () => {
        this.goToStep(idx);
      });

      this.stepsContainer.appendChild(card);
    });
  }

  goToStep(index, playSound = true) {
    if (index < 0 || index >= this.steps.length) return;

    const prevIndex = this.currentStepIndex;
    this.currentStepIndex = index;
    const currentStep = this.steps[index];

    // ASMR Sound effects
    if (playSound) {
      if (index > prevIndex) {
        sound.playStepNext();
      } else if (index < prevIndex) {
        sound.playStepPrev();
      }
    }

    // Update Counter & Progress Bar
    const label = currentStep.stepLabel || (index === 0 ? "Problem Formulation" : `Step ${index} / ${this.steps.length - 1}`);
    this.stepCounter.textContent = label;
    const progressPercent = ((index + 1) / this.steps.length) * 100;
    this.progressBar.style.width = `${progressPercent}%`;

    // Button states
    this.prevBtn.disabled = index === 0;
    this.nextBtn.disabled = index === this.steps.length - 1;

    // Update card states for progressive reveal
    const cards = this.stepsContainer.querySelectorAll('.step-card');
    cards.forEach((card, idx) => {
      card.classList.remove('active', 'past', 'future');
      if (idx === index) {
        card.classList.add('active');
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      } else if (idx < index) {
        card.classList.add('past');
      } else {
        card.classList.add('future');
      }
    });

    // Update 3D visualization
    if (this.sceneManager) {
      this.sceneManager.updateVisualState({
        ...currentStep.visualState,
        problemMode: this.currentMode
      });
    }
  }

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.goToStep(this.currentStepIndex + 1);
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.goToStep(this.currentStepIndex - 1);
    }
  }

  updatePlaneIndexUI(states) {
    if (!states) return;
    const items = document.querySelectorAll('.plane-index-box .index-item');
    let activeCount = 0;
    const totalCount = items.length;

    items.forEach(item => {
      const key = item.getAttribute('data-plane');
      const isActive = !!states[key];
      const switchBtn = item.querySelector('.plane-switch');

      if (isActive) {
        item.classList.add('active');
        if (switchBtn) {
          switchBtn.classList.add('active');
          switchBtn.setAttribute('aria-checked', 'true');
        }
        activeCount++;
      } else {
        item.classList.remove('active');
        if (switchBtn) {
          switchBtn.classList.remove('active');
          switchBtn.setAttribute('aria-checked', 'false');
        }
      }
    });

    if (this.indexActiveCount) {
      this.indexActiveCount.textContent = `${activeCount}/${totalCount}`;
    }
  }

  resetAll() {
    this.currentStepIndex = 0;
    this.stepCounter.textContent = `Tableau 1 / ${this.steps.length - 1}`;
    const progressPercent = (1 / this.steps.length) * 100;
    this.progressBar.style.width = `${progressPercent}%`;
    this.prevBtn.disabled = true;
    this.nextBtn.disabled = false;

    this.stepsContainer.scrollTo({ top: 0, behavior: 'smooth' });
    const cards = this.stepsContainer.querySelectorAll('.step-card');
    cards.forEach((card, idx) => {
      card.classList.remove('active', 'past', 'future');
      if (idx === 0) {
        card.classList.add('active');
      } else {
        card.classList.add('future');
      }
    });

    if (this.sceneManager) {
      this.sceneManager.updateVisualState({
        ...this.steps[0].visualState,
        problemMode: this.currentMode
      });
    }

    const p0 = (this.steps[0].visualState && this.steps[0].visualState.activePoint) ? this.steps[0].visualState.activePoint : [0, 0, 0];
    this.updateCoordinates({ x1: p0[0], x2: p0[1], x3: p0[2], Z: 0 });

    this.currentQuizQuestionIdx = 0;
    this.hasGeneratedRoll = false;
    if (typeof this.updateQuizQuestionUI === 'function') {
      this.updateQuizQuestionUI();
    }
  }

  // =========================================================================
  // Final Audience Question & Random Student Roll-Call (1 to 61)
  // Rigged Sequence: strictly 33, 6, 1, 21 in that exact order
  // =========================================================================
  initAudienceQuiz() {
    this.currentQuizQuestionIdx = 0;
    this.hasGeneratedRoll = false;
    this.isGeneratingRoll = false;
    this.entropyClockRafId = null;

    if (this.generateRandomBtn) {
      this.generateRandomBtn.addEventListener('click', () => {
        this.generateRandomRoll();
      });
    }

    if (this.nextQuestionBtn) {
      this.nextQuestionBtn.addEventListener('click', () => {
        sound.playClick();
        this.cycleQuizQuestion();
      });
    }

    if (this.toggleKeyBtn) {
      this.toggleKeyBtn.addEventListener('click', () => {
        sound.playClick();
        this.toggleAnswerKey();
      });
    }

    this.updateQuizQuestionUI();
    this.startLiveEntropyClock();
  }

  startLiveEntropyClock() {
    const tick = () => {
      if (!this.isGeneratingRoll) {
        const now = new Date();
        const sec = now.getSeconds();
        const ms = now.getMilliseconds();

        if (this.digitalClockSec) {
          this.digitalClockSec.textContent = String(sec).padStart(2, '0');
        }
        if (this.digitalClockMs) {
          this.digitalClockMs.textContent = String(ms).padStart(3, '0');
        }
      }
      this.entropyClockRafId = requestAnimationFrame(tick);
    };
    this.entropyClockRafId = requestAnimationFrame(tick);
  }

  openAudienceQuiz() {
    if (!this.audienceQuizOverlay) return;
    this.audienceQuizOverlay.classList.remove('hidden');
    sound.playClick();
    if (!this.isGeneratingRoll) {
      if (this.clockLiveDot) this.clockLiveDot.classList.remove('frozen');
      if (this.entropyClockStatus) this.entropyClockStatus.textContent = 'LIVE HARDWARE CLOCK';
      if (this.frozenSeedBanner) this.frozenSeedBanner.classList.add('hidden');
    }
  }

  closeAudienceQuiz() {
    if (!this.audienceQuizOverlay) return;
    this.audienceQuizOverlay.classList.add('hidden');
    sound.playClick();
  }

  toggleAudienceQuiz() {
    if (!this.audienceQuizOverlay) return;
    if (this.audienceQuizOverlay.classList.contains('hidden')) {
      this.openAudienceQuiz();
    } else {
      this.closeAudienceQuiz();
    }
  }

  calculateStrongHash(sec, ms) {
    const seed = (sec * 1000) + ms;
    // High-entropy 32-bit avalanche mixing (Murmur3 / xxHash style bit-mixing)
    let h = Math.imul(sec, 0x9E3779B1) ^ Math.imul(ms, 0x85EBCA6B) ^ 0x27D4EB2F;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D);
    h = Math.imul(h ^ (h >>> 15), 0x846CA68B);
    h = (h ^ (h >>> 16)) >>> 0;

    // Rigged roll mapped strictly to current quiz question:
    // Q1 -> 33, Q2 -> 6, Q3 -> 1, Q4 -> 21
    const currentQ = AUDIENCE_QUESTIONS[this.currentQuizQuestionIdx] || AUDIENCE_QUESTIONS[0];
    const targetRoll = currentQ.roll;

    // Formulate 32-bit digest whose modular reduction matches targetRoll exactly:
    // u32 mod 61 + 1 === targetRoll (mathematically airtight on live calculation terminal)
    const targetRemainder = targetRoll - 1;
    let adjustedH = (Math.floor(h / 61) * 61) + targetRemainder;
    if (adjustedH > 0xFFFFFFFF) {
      adjustedH -= 61;
    }
    adjustedH = adjustedH >>> 0;

    const remainder = adjustedH % 61;
    const rollNumber = remainder + 1; // Exactly targetRoll
    return {
      sec,
      ms,
      seed,
      u32: adjustedH,
      hex: '0x' + adjustedH.toString(16).toUpperCase().padStart(8, '0'),
      remainder,
      rollNumber
    };
  }

  generateRandomRoll() {
    if (this.isGeneratingRoll) return;
    this.isGeneratingRoll = true;

    // Automatically move to next question if current question was already rolled
    if (this.hasGeneratedRoll) {
      this.currentQuizQuestionIdx = (this.currentQuizQuestionIdx + 1) % AUDIENCE_QUESTIONS.length;
      this.updateQuizQuestionUI();
    }
    this.hasGeneratedRoll = true;

    // 1. Capture exact clock instant
    const now = new Date();
    const sec = now.getSeconds();
    const ms = now.getMilliseconds();

    // 2. Compute deterministic strong hash mapped to current question
    const hash = this.calculateStrongHash(sec, ms);

    // 3. Update Clock UI to FROZEN state
    if (this.digitalClockSec) this.digitalClockSec.textContent = String(sec).padStart(2, '0');
    if (this.digitalClockMs) this.digitalClockMs.textContent = String(ms).padStart(3, '0');
    if (this.clockLiveDot) this.clockLiveDot.classList.add('frozen');
    if (this.entropyClockStatus) this.entropyClockStatus.textContent = 'HARDWARE SEED FROZEN';
    if (this.frozenSeedText) {
      this.frozenSeedText.textContent = `SEED CAPTURED AT: ${String(sec).padStart(2, '0')}s . ${String(ms).padStart(3, '0')}ms (Entropy: ${hash.seed})`;
    }
    if (this.frozenSeedBanner) this.frozenSeedBanner.classList.remove('hidden');

    // 4. Button & Terminal State
    if (this.generateRandomBtn) this.generateRandomBtn.disabled = true;
    if (this.terminalStateTag) {
      this.terminalStateTag.textContent = 'COMPUTING...';
      this.terminalStateTag.className = 'panel-state-tag active';
    }
    if (this.revealStatusMsg) {
      this.revealStatusMsg.textContent = 'Evaluating cryptographic avalanche pipeline...';
      this.revealStatusMsg.className = 'reveal-status-msg';
    }

    sound.playClick();

    // 5. Build letter-by-letter calculation lines
    const lines = [
      `>>> [T+0.00s] SYSTEM CLOCK ENTROPY CAPTURED:`,
      `    Second (S) = ${sec}s  |  Millisecond (M) = ${ms}ms`,
      `    Input Seed Formulation: S_seed = (${sec} × 1000) + ${ms} = ${hash.seed}`,
      ``,
      `>>> [T+0.70s] CRYPTOGRAPHIC AVALANCHE BIT-MIXING H(S, M):`,
      `    Seed Vector:  0x9E3779B1 ⊕ (${sec} × 0x85EBCA6B) ⊕ (${ms} × 0x27D4EB2F)`,
      `    Round 1 (XOR-Shift):  h₁ = (h₀ ⊕ (h₀ >>> 16)) × 0x7FEB352D`,
      `    Round 2 (Avalanche):  h₂ = (h₁ ⊕ (h₁ >>> 15)) × 0x846CA68B`,
      `    Round 3 (Finalizer):  h_final = (h₂ ⊕ (h₂ >>> 16)) >>> 0`,
      `    32-Bit Unsigned Hash Digest = ${hash.u32.toLocaleString()} (${hash.hex})`,
      ``,
      `>>> [T+1.90s] UNIFORM MAPPING OVER REGISTER SET [1 .. 61]:`,
      `    Target Domain:  Register Number ∈ {1, 2, 3, ..., 61}`,
      `    Modulo Reduction:  ${hash.u32.toLocaleString()} mod 61 = ${hash.remainder}`,
      `    Unbiased Mapping:  Roll Number = ${hash.remainder} + 1 = ${hash.rollNumber}`,
      ``,
      `>>> [T+2.85s] COMPLETE! REGISTER NUMBER VERIFIED: #${hash.rollNumber}`
    ];
    const fullText = lines.join('\n');
    const totalChars = fullText.length;
    const duration = 3000; // Exactly 3.0 seconds
    const startTime = performance.now();

    // 6. Suspense Tumbler on the giant number box (ASMR tick)
    const tumblerInterval = setInterval(() => {
      const randVal = Math.floor(Math.random() * 61) + 1;
      if (this.rollHugeNumber) {
        this.rollHugeNumber.innerHTML = `<span class="digit-holder glitch">${String(randVal).padStart(2, '0')}</span>`;
      }
      sound.playSuspenseTick(700 + Math.random() * 300);
    }, 85);

    // 7. RequestAnimationFrame letter-by-letter typing loop
    const typeLoop = (nowTime) => {
      const elapsed = nowTime - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const charsToShow = Math.floor(progress * totalChars);

      if (this.hashTerminalBody) {
        this.hashTerminalBody.textContent = fullText.slice(0, charsToShow);
        this.hashTerminalBody.scrollTop = this.hashTerminalBody.scrollHeight;
      }
      if (this.terminalProgressFill) {
        this.terminalProgressFill.style.width = `${progress * 100}%`;
      }

      if (progress < 1.0) {
        requestAnimationFrame(typeLoop);
      } else {
        clearInterval(tumblerInterval);
        this.finalizeRollReveal(hash);
      }
    };

    requestAnimationFrame(typeLoop);
  }

  finalizeRollReveal(hash) {
    if (this.rollHugeNumber) {
      this.rollHugeNumber.innerHTML = `<span class="digit-holder winner">${String(hash.rollNumber).padStart(2, '0')}</span>`;
    }
    if (this.revealStatusMsg) {
      this.revealStatusMsg.textContent = `★ REGISTER #${hash.rollNumber} SELECTED FOR QUESTION ${this.currentQuizQuestionIdx + 1}! ★`;
      this.revealStatusMsg.className = 'reveal-status-msg winner';
    }
    if (this.terminalStateTag) {
      this.terminalStateTag.textContent = 'VERIFIED ✓';
      this.terminalStateTag.className = 'panel-state-tag success';
    }

    sound.playRollRevealFanfare();

    if (this.sceneManager) {
      this.sceneManager.triggerConfetti();
    }

    if (this.qMainTitle) {
      this.qMainTitle.classList.add('highlight-pulse');
      setTimeout(() => this.qMainTitle?.classList.remove('highlight-pulse'), 1500);
    }

    if (this.generateRandomBtn) {
      this.generateRandomBtn.disabled = false;
    }
    this.isGeneratingRoll = false;
  }

  cycleQuizQuestion() {
    this.currentQuizQuestionIdx = (this.currentQuizQuestionIdx + 1) % AUDIENCE_QUESTIONS.length;
    this.hasGeneratedRoll = false;
    this.updateQuizQuestionUI();
  }

  toggleAnswerKey() {
    if (!this.keyAnswerBox) return;
    this.keyAnswerBox.classList.toggle('hidden');
    if (this.keyArrow) {
      this.keyArrow.textContent = this.keyAnswerBox.classList.contains('hidden') ? '▼' : '▲';
    }
  }

  updateQuizQuestionUI() {
    const q = AUDIENCE_QUESTIONS[this.currentQuizQuestionIdx];
    if (!q) return;

    if (this.qNumberBadge) {
      this.qNumberBadge.textContent = `QUESTION ${q.id} OF ${AUDIENCE_QUESTIONS.length}`;
    }
    if (this.qMainTitle) {
      this.qMainTitle.textContent = `"${q.title}"`;
      this.qMainTitle.classList.remove('highlight-pulse');
      void this.qMainTitle.offsetWidth; // Trigger reflow for smooth re-animation
      this.qMainTitle.classList.add('highlight-pulse');
      setTimeout(() => this.qMainTitle?.classList.remove('highlight-pulse'), 800);
    }
    if (this.qSubDetail) {
      this.qSubDetail.textContent = q.detail;
    }
    if (this.keyAnswerBox) {
      this.keyAnswerBox.innerHTML = `<p><strong>Official Model Answer:</strong> ${q.answer}</p>`;
      this.keyAnswerBox.classList.add('hidden');
    }
    if (this.keyArrow) {
      this.keyArrow.textContent = '▼';
    }
  }
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PresentationApp();
});
