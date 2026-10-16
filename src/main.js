import { SceneManager } from './sceneManager.js';
import { UnityGizmo } from './unityGizmo.js';
import { sound } from './sound.js';
import { simplexSteps, gomorySteps } from './presentationData.js';
import { InequalityGraphModal } from './inequalityGraph.js';

const AUDIENCE_QUESTIONS = [
  {
    id: 1,
    roll: 33,
    title: "Why did blind rounding (1.67, 1.67) down to (1, 1) yield only $500, while Gomory found (1, 2) giving $800?",
    detail: "Topic: Discrete Feasibility vs LP Relaxation. Why does naive rounding waste precious wood and artisan labor?",
    answer: "Blind rounding down moves inward away from active constraint boundaries, leaving 1 unit of lumber and 2 hours of labor wasted ($500 profit). Point (1, 2) utilizes 4 wood and 5 labor (100% labor bottleneck), capturing $800. Integer programming finds vertices that simple rounding cannot see."
  },
  {
    id: 2,
    roll: 6,
    title: "In Gomory's cutting plane (1x₁ + 1x₂ ≤ 3), why is this cut guaranteed NOT to eliminate any valid integer solution?",
    detail: "Topic: Hyperplane Validity & Integer Lattice. How does modular arithmetic ensure no integer lattice points are sliced away?",
    answer: "Gomory's cut is derived strictly from the fractional row of the optimal Simplex tableau using floor functions. Because all integer points satisfy the congruence condition, the cut strictly slices through continuous fractional space without touching any point on the integer lattice (x₁, x₂ ∈ ℤ²)."
  },
  {
    id: 3,
    roll: 1,
    title: "At the final integer optimal point (1 Desk, 2 Chairs), which factory resource is fully exhausted, and which has slack?",
    detail: "Topic: Resource Bottlenecks & Slack Analysis. Evaluate 2x₁ + 1x₂ ≤ 5 (Wood) and 1x₁ + 2x₂ ≤ 5 (Labor).",
    answer: "Wood usage: 2(1) + 1(2) = 4 / 5 units (Slack s₁ = 1 unit of lumber remaining). Labor usage: 1(1) + 2(2) = 5 / 5 hours (Slack s₂ = 0, 100% bottleneck!). Artisan assembly hours strictly cap any further production."
  },
  {
    id: 4,
    roll: 21,
    title: "What does the 3D Objective Ceiling plane (Z = 200x₁ + 300x₂) represent geometrically, and why is it tilted?",
    detail: "Topic: Objective Geometry & Simplex Gradient. Why does the plane incline steeper along the Chair axis (x₂)?",
    answer: "Height represents profit Z in dollars. Because chairs yield $300 profit while desks yield $200, the ceiling plane climbs steeper along the chair axis (x₂). The simplex algorithm ascends along the edges of the polyhedron until it touches the highest elevation in the feasible polytope."
  }
];

class PresentationApp {
  constructor() {
    this.currentMode = 'simplex'; // 'simplex' | 'gomory'
    this.currentStepIndex = 0;
    this.steps = simplexSteps;

    this.initDOM();
    this.initAspectRatio();
    this.ineqModal = new InequalityGraphModal(document.body);
    this.init3D();
    this.initUnityGizmo();
    this.initAudienceQuiz();
    this.bindEvents();
    this.renderSteps();
    this.goToStep(0, false);
  }

  initDOM() {
    this.splashOverlay = document.getElementById('splash-overlay');
    this.startBtn = document.getElementById('start-presentation-btn');
    this.questionOverlay = document.getElementById('question-overlay');
    this.solveProblemBtn = document.getElementById('solve-problem-btn');
    this.questionBackBtn = document.getElementById('question-back-btn');
    this.ineqGraphBtn = document.getElementById('ineq-graph-btn');
    this.audienceQuizBtn = document.getElementById('audience-quiz-btn');
    this.tabSimplex = document.getElementById('tab-simplex');
    this.tabGomory = document.getElementById('tab-gomory');
    this.prevBtn = document.getElementById('prev-step-btn');
    this.nextBtn = document.getElementById('next-step-btn');
    this.stepCounter = document.getElementById('step-counter-text');
    this.progressBar = document.getElementById('step-progress-fill');
    this.stepsContainer = document.getElementById('steps-container');
    this.viewportContainer = document.getElementById('viewport-container');
    this.guideBtn = document.getElementById('guide-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.soundBtn = document.getElementById('sound-toggle-btn');
    this.soundIcon = document.getElementById('sound-icon');
    this.helpBtn = document.getElementById('help-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

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

    // HUD Readouts
    this.hudX1 = document.getElementById('hud-x1');
    this.hudX2 = document.getElementById('hud-x2');
    this.hudZ = document.getElementById('hud-z');
    this.hudDollar = document.getElementById('hud-dollar');

    // 3D Plane Index Controls
    this.planeIndexBox = document.getElementById('plane-index-box');
    this.indexActiveCount = document.getElementById('index-active-count');
    this.indexToggleAllBtn = document.getElementById('index-toggle-all-btn');
    this.indexCollapseBtn = document.getElementById('index-collapse-btn');
    this.indexBoxHeader = document.getElementById('index-box-header');
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

    // Notify SceneManager to recalculate viewport size
    setTimeout(() => {
      if (this.sceneManager) {
        this.sceneManager.onWindowResize();
      }
    }, 40);
  }

  toggleAspectRatio() {
    const next = this.aspectRatio === '16:9' ? '1:1' : '16:9';
    this.setAspectRatio(next, true);
  }

  init3D() {
    this.sceneManager = new SceneManager(this.viewportContainer, (coords) => {
      if (this.hudX1) this.hudX1.textContent = coords.x1;
      if (this.hudX2) this.hudX2.textContent = coords.x2;
      if (this.hudZ) this.hudZ.textContent = coords.Z;
      if (this.hudDollar) this.hudDollar.textContent = `$${coords.dollar}`;
    });

    this.sceneManager.onPlaneStatesChanged = (states) => {
      this.updatePlaneIndexUI(states);
    };
  }

  initUnityGizmo() {
    const gizmoCanvas = document.getElementById('unity-gizmo-canvas');
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

    // Hook gizmo update into the render loop
    this.sceneManager.onAnimate = () => {
      this.unityGizmo.update();
    };
  }

  bindEvents() {
    // Start presentation & show audience question challenge
    this.startBtn.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.enterFullscreen();
      this.splashOverlay.classList.add('hidden');
      if (this.questionOverlay) {
        this.questionOverlay.classList.remove('hidden');
      }
    });

    // Solve problem -> Proceed into main 3D simulation
    if (this.solveProblemBtn) {
      this.solveProblemBtn.addEventListener('click', () => {
        sound.init();
        sound.playOptimalChime();
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

    // Tab mode buttons
    this.tabSimplex.addEventListener('click', () => this.switchMode('simplex'));
    this.tabGomory.addEventListener('click', () => this.switchMode('gomory'));

    // Navigation buttons
    this.nextBtn.addEventListener('click', () => this.nextStep());
    this.prevBtn.addEventListener('click', () => this.prevStep());
    this.resetBtn.addEventListener('click', () => {
      sound.playClick();
      this.resetAll();
    });
    if (this.guideBtn) {
      this.guideBtn.addEventListener('click', () => {
        sound.playClick();
        this.goToStep(0);
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

    // Projector Aspect Ratio Buttons (16:9 vs 1:1)
    document.querySelectorAll('[data-ratio]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ratio = e.currentTarget.getAttribute('data-ratio');
        if (ratio) {
          this.setAspectRatio(ratio);
        }
      });
    });
    const indexBody = document.getElementById('index-box-body');
    if (indexBody) {
      indexBody.addEventListener('click', (e) => {
        const item = e.target.closest('.index-item');
        if (!item) return;
        const planeKey = item.getAttribute('data-plane');
        if (planeKey && this.sceneManager) {
          sound.playClick();
          this.sceneManager.togglePlane(planeKey);
        }
      });
    }

    // 2D Inequality Graph Modal Trigger
    if (this.ineqGraphBtn) {
      this.ineqGraphBtn.addEventListener('click', () => {
        sound.playClick();
        this.ineqModal.toggle();
      });
    }

    // Audience Quiz & Random Roll Call Triggers
    if (this.audienceQuizBtn) {
      this.audienceQuizBtn.addEventListener('click', () => {
        sound.playClick();
        this.toggleAudienceQuiz();
      });
    }
    if (this.closeAudienceQuizBtn) {
      this.closeAudienceQuizBtn.addEventListener('click', () => {
        sound.playClick();
        this.closeAudienceQuiz();
      });
    }

    // Delegate clicks on any button inside step cards to open 2D Graph or Audience Quiz
    document.addEventListener('click', (e) => {
      if (e.target.closest('.open-2d-graph-btn')) {
        sound.playClick();
        this.ineqModal.open();
      } else if (e.target.closest('.open-audience-quiz-btn')) {
        sound.playClick();
        this.openAudienceQuiz();
      }
    });

    // Sound FX Toggle
    this.soundBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Fullscreen Toggle
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

    // Shortcuts Modal
    this.helpBtn.addEventListener('click', () => {
      sound.playClick();
      this.shortcutsModal.classList.add('open');
    });
    this.modalCloseBtn.addEventListener('click', () => {
      sound.playClick();
      this.shortcutsModal.classList.remove('open');
    });
    this.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === this.shortcutsModal) {
        this.shortcutsModal.classList.remove('open');
      }
    });

    // Camera preset buttons in HUD
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sound.playClick();
        const view = e.target.getAttribute('data-view');
        this.sceneManager.setCameraView(view);
      });
    });

    // Global Keyboard Hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // If splash overlay is currently visible
      if (this.splashOverlay && !this.splashOverlay.classList.contains('hidden')) {
        if (key === 'enter' || key === ' ') {
          e.preventDefault();
          this.startBtn.click();
        } else if (key === 'a') {
          e.preventDefault();
          this.toggleAspectRatio();
        }
        return;
      }

      // If question challenge overlay is currently visible
      if (this.questionOverlay && !this.questionOverlay.classList.contains('hidden')) {
        if (key === 'enter' || key === ' ') {
          e.preventDefault();
          if (this.solveProblemBtn) this.solveProblemBtn.click();
        } else if (key === 'escape' || key === 'backspace') {
          e.preventDefault();
          if (this.questionBackBtn) this.questionBackBtn.click();
        } else if (key === 'a') {
          e.preventDefault();
          this.toggleAspectRatio();
        }
        return;
      }

      // If Audience Quiz overlay is currently visible
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

      if (key === 'q') {
        e.preventDefault();
        this.toggleAudienceQuiz();
      } else if (key === 'a') {
        e.preventDefault();
        this.toggleAspectRatio();
      } else if (key === '1' || key === 's') {
        this.switchMode('simplex');
      } else if (key === '2' || key === 'c') {
        this.switchMode('gomory');
      } else if (key === 'g' || key === 'i') {
        e.preventDefault();
        sound.playClick();
        this.ineqModal.toggle();
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
      } else if (key === 'm') {
        const isMuted = sound.toggleMute();
        this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      } else if (key === '?' || key === 'h') {
        this.shortcutsModal.classList.toggle('open');
      } else if (key === 'escape') {
        this.shortcutsModal.classList.remove('open');
        this.ineqModal.close();
      }
    });

    // Track fullscreen change to update icon
    document.addEventListener('fullscreenchange', () => {
      const isFull = !!document.fullscreenElement;
      document.getElementById('fullscreen-icon').textContent = isFull ? '🗗' : '⛶';
    });
  }

  enterFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
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

  switchMode(mode) {
    if (this.currentMode === mode) return;

    sound.playModeSwitch();
    this.currentMode = mode;
    this.steps = mode === 'simplex' ? simplexSteps : gomorySteps;
    this.currentStepIndex = 0;

    // Toggle Tab styling
    if (mode === 'simplex') {
      this.tabSimplex.classList.add('active');
      this.tabGomory.classList.remove('active');
    } else {
      this.tabGomory.classList.add('active');
      this.tabSimplex.classList.remove('active');
    }

    if (this.sceneManager) {
      this.sceneManager.clearPlaneOverrides();
    }

    this.renderSteps();
    this.goToStep(0, false);
  }

  renderSteps() {
    this.stepsContainer.innerHTML = '';

    this.steps.forEach((step, idx) => {
      const card = document.createElement('article');
      card.className = `step-card ${idx === 0 ? 'active' : ''}`;
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

    // Sound effects
    if (playSound) {
      if (index > prevIndex) {
        sound.playStepNext();
      } else if (index < prevIndex) {
        sound.playStepPrev();
      }

      // Check special sound triggers
      const nextVisual = currentStep.visualState || {};
      const prevVisual = this.steps[prevIndex]?.visualState || {};
      const planeTurnedOn =
        (nextVisual.showNonNeg && !prevVisual.showNonNeg) ||
        (nextVisual.showWoodPlane && !prevVisual.showWoodPlane) ||
        (nextVisual.showLaborPlane && !prevVisual.showLaborPlane) ||
        (nextVisual.showObjectiveCeiling && !prevVisual.showObjectiveCeiling) ||
        (nextVisual.showCutPlane && !prevVisual.showCutPlane);

      if (planeTurnedOn) {
        setTimeout(() => sound.playPlaneShape(), 90);
      }

      if (nextVisual.sliceCut && !prevVisual.sliceCut) {
        setTimeout(() => sound.playCutLaser(), 150);
      }
      if (nextVisual.celebrate) {
        setTimeout(() => sound.playOptimalChime(), 200);
      }
    }

    // Update Counter & Progress Bar
    this.stepCounter.textContent = `Step ${index + 1} / ${this.steps.length}`;
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
        // Smoothly scroll active card into view
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      } else if (idx < index) {
        card.classList.add('past');
      } else {
        card.classList.add('future');
      }
    });

    // Update 3D visualization (preserve user-selected plane toggle overrides)
    if (this.sceneManager) {
      this.sceneManager.updateVisualState({
        ...currentStep.visualState,
        mode: this.currentMode
      });
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
    // 1. Preserve active mode (Simplex stays in Simplex, Gomory stays in Gomory)
    this.currentStepIndex = 0;
    this.stepCounter.textContent = `Step 1 / ${this.steps.length}`;
    const progressPercent = (1 / this.steps.length) * 100;
    this.progressBar.style.width = `${progressPercent}%`;
    this.prevBtn.disabled = true;
    this.nextBtn.disabled = false;

    // 2. Reset Right Narrative container scroll & cards
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

    // 3. Reset Left 3D Viewport to Step 0 of current mode
    if (this.sceneManager) {
      this.sceneManager.resetToStateZero();
      this.sceneManager.updateVisualState({
        ...this.steps[0].visualState,
        mode: this.currentMode
      });
    }

    // 4. Reset HUD Readouts based on step 0 coordinates
    const p0 = (this.steps[0].visualState && this.steps[0].visualState.activePoint) ? this.steps[0].visualState.activePoint : [0, 0, 0];
    const x1 = (Math.round(p0[0] * 100) / 100).toFixed(2);
    const Z = (Math.round(p0[1] * 100) / 100).toFixed(2);
    const x2 = (Math.round(p0[2] * 100) / 100).toFixed(2);
    const dollar = Math.round(p0[1] * 100);

    if (this.hudX1) this.hudX1.textContent = x1;
    if (this.hudX2) this.hudX2.textContent = x2;
    if (this.hudZ) this.hudZ.textContent = Z;
    if (this.hudDollar) this.hudDollar.textContent = `$${dollar}`;
    this.currentQuizQuestionIdx = 0;
    this.hasGeneratedRoll = false;
    if (typeof this.updateQuizQuestionUI === 'function') {
      this.updateQuizQuestionUI();
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

  // =========================================================================
  // Final Audience Question & Random Student Roll-Call (1 to 61)
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

    // 6. Suspense Tumbler on the giant number box
    const tumblerInterval = setInterval(() => {
      const randVal = Math.floor(Math.random() * 61) + 1;
      if (this.rollHugeNumber) {
        this.rollHugeNumber.innerHTML = `<span class="digit-holder glitch">${String(randVal).padStart(2, '0')}</span>`;
      }
      sound.playSuspenseTick(750 + Math.random() * 350);
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
        // 8. Climax Reveal at exactly 3.0 seconds!
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
  new PresentationApp();
});
