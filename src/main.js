import { SceneManager } from './sceneManager.js';
import { UnityGizmo } from './unityGizmo.js';
import { sound } from './sound.js';
import { simplexSteps, gomorySteps } from './presentationData.js';
import { InequalityGraphModal } from './inequalityGraph.js';

class PresentationApp {
  constructor() {
    this.currentMode = 'simplex'; // 'simplex' | 'gomory'
    this.currentStepIndex = 0;
    this.steps = simplexSteps;

    this.initDOM();
    this.ineqModal = new InequalityGraphModal(document.body);
    this.init3D();
    this.initUnityGizmo();
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

    // Delegate clicks on any button inside step cards to open 2D Graph
    document.addEventListener('click', (e) => {
      if (e.target.closest('.open-2d-graph-btn')) {
        sound.playClick();
        this.ineqModal.open();
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
        }
        return;
      }

      if (key === '1' || key === 's') {
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

    // Update 3D visualization
    if (this.sceneManager) {
      this.sceneManager.clearPlaneOverrides();
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
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new PresentationApp();
});
