// =============================================================================
// Interactive 2D Cartesian Inequality Graph Module
// Renders 2D inequalities: Wood (2x₁ + x₂ ≤ 5), Labor (x₁ + 2x₂ ≤ 5),
// Feasible Region, Gomory Cut (x₁ + x₂ ≤ 3), and Integer Lattice with live probe.
// =============================================================================

export class InequalityGraphModal {
  constructor(container, onSelectPoint = null) {
    this.container = container;
    this.onSelectPoint = onSelectPoint;
    this.isOpen = false;

    this.filters = {
      wood: true,
      labor: true,
      feasible: true,
      cut: true,
      lattice: true
    };

    this.mouseCoord = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'inequality-graph-modal';
    this.modalEl.className = 'ineq-modal';
    this.modalEl.innerHTML = `
      <div class="ineq-modal-backdrop"></div>
      <div class="ineq-modal-dialog">
        <header class="ineq-modal-header">
          <div class="ineq-header-title">
            <span class="ineq-icon">📈</span>
            <div>
              <h2>2D Inequality Coordinate Graph (x₁, x₂)</h2>
              <p class="ineq-subtitle">Decision space floor plane: Half-plane shading, boundary lines, and intersection</p>
            </div>
          </div>
          <button class="ineq-close-btn" id="ineq-close-btn" title="Close (Esc or G)">✕</button>
        </header>

        <div class="ineq-modal-body">
          <!-- Left side: 2D Canvas Graph -->
          <div class="ineq-canvas-container">
            <canvas id="ineq-canvas" width="620" height="580"></canvas>
            <div class="ineq-canvas-tooltip" id="ineq-tooltip"></div>
          </div>

          <!-- Right side: Mathematical Breakdown & Filter Toggles -->
          <aside class="ineq-sidebar">
            <div class="ineq-controls-panel">
              <span class="ineq-panel-label">Toggle Constraints & Regions:</span>
              <div class="ineq-toggles">
                <label class="ineq-toggle-item wood">
                  <input type="checkbox" id="toggle-wood" checked>
                  <span class="ineq-badge ineq-badge-wood"></span>
                  <span><strong>Wood:</strong> 2x₁ + 1x₂ ≤ 5</span>
                </label>
                <label class="ineq-toggle-item labor">
                  <input type="checkbox" id="toggle-labor" checked>
                  <span class="ineq-badge ineq-badge-labor"></span>
                  <span><strong>Labor:</strong> 1x₁ + 2x₂ ≤ 5</span>
                </label>
                <label class="ineq-toggle-item feasible">
                  <input type="checkbox" id="toggle-feasible" checked>
                  <span class="ineq-badge ineq-badge-feasible"></span>
                  <span><strong>Feasible Region:</strong> Overlap (≤ both)</span>
                </label>
                <label class="ineq-toggle-item cut">
                  <input type="checkbox" id="toggle-cut" checked>
                  <span class="ineq-badge ineq-badge-cut"></span>
                  <span><strong>Gomory Cut:</strong> 1x₁ + 1x₂ ≤ 3</span>
                </label>
                <label class="ineq-toggle-item lattice">
                  <input type="checkbox" id="toggle-lattice" checked>
                  <span class="ineq-badge ineq-badge-lattice"></span>
                  <span><strong>Integer Points:</strong> (x₁, x₂) ∈ ℤ²</span>
                </label>
              </div>
            </div>

            <!-- Live Point Inspector -->
            <div class="ineq-inspector-panel">
              <div class="ineq-inspector-header">
                <span>📍 Live Point Inspector</span>
                <span class="ineq-coords-badge" id="ineq-probe-coords">Hover over graph</span>
              </div>
              <div class="ineq-eval-list" id="ineq-eval-list">
                <div class="ineq-eval-row">Hover graph to test point evaluation against inequalities</div>
              </div>
            </div>

            <!-- Step-by-Step Math Guide -->
            <div class="ineq-math-guide">
              <h4>📐 How to Graph an Inequality:</h4>
              <ol>
                <li><strong>Draw Boundary Line:</strong> Replace ≤ with = to plot line.
                  <div class="ineq-math-sub">
                    Wood: Set x₂=0 → (2.5, 0). Set x₁=0 → (0, 5).<br>
                    Labor: Set x₂=0 → (5, 0). Set x₁=0 → (0, 2.5).
                  </div>
                </li>
                <li><strong>Test Origin (0,0):</strong>
                  <div class="ineq-math-sub">
                    Wood: 2(0) + 1(0) = 0 ≤ 5 <span class="math-true">✓ TRUE</span> → shade toward (0,0)<br>
                    Labor: 1(0) + 2(0) = 0 ≤ 5 <span class="math-true">✓ TRUE</span> → shade toward (0,0)
                  </div>
                </li>
                <li><strong>Corner Crossing:</strong>
                  <div class="ineq-math-sub">
                    Solve 2x₁ + x₂ = 5 and x₁ + 2x₂ = 5 → <strong>(5/3, 5/3) ≈ (1.67, 1.67)</strong>
                  </div>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    this.canvas = document.getElementById('ineq-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.tooltip = document.getElementById('ineq-tooltip');
    this.probeCoords = document.getElementById('ineq-probe-coords');
    this.evalList = document.getElementById('ineq-eval-list');
    this.closeBtn = document.getElementById('ineq-close-btn');

    // Toggles
    this.toggleWood = document.getElementById('toggle-wood');
    this.toggleLabor = document.getElementById('toggle-labor');
    this.toggleFeasible = document.getElementById('toggle-feasible');
    this.toggleCut = document.getElementById('toggle-cut');
    this.toggleLattice = document.getElementById('toggle-lattice');
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modalEl.querySelector('.ineq-modal-backdrop').addEventListener('click', () => this.close());

    // Filter toggles
    this.toggleWood.addEventListener('change', (e) => {
      this.filters.wood = e.target.checked;
      this.render();
    });
    this.toggleLabor.addEventListener('change', (e) => {
      this.filters.labor = e.target.checked;
      this.render();
    });
    this.toggleFeasible.addEventListener('change', (e) => {
      this.filters.feasible = e.target.checked;
      this.render();
    });
    this.toggleCut.addEventListener('change', (e) => {
      this.filters.cut = e.target.checked;
      this.render();
    });
    this.toggleLattice.addEventListener('change', (e) => {
      this.filters.lattice = e.target.checked;
      this.render();
    });

    // Canvas Mouse interaction
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const pixelX = e.clientX - rect.left;
      const pixelY = e.clientY - rect.top;
      const math = this.pixelToMath(pixelX, pixelY);

      if (math.x1 >= -0.5 && math.x1 <= 6.5 && math.x2 >= -0.5 && math.x2 <= 6.5) {
        this.mouseCoord = math;
        this.updateInspector(math);
      } else {
        this.mouseCoord = null;
      }
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseCoord = null;
      this.render();
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.mouseCoord && this.onSelectPoint) {
        this.onSelectPoint(this.mouseCoord.x1, this.mouseCoord.x2);
      }
    });
  }

  // Coordinate transformation: Math (x1, x2) in [0..6] <--> Canvas Pixels
  mathToPixel(x1, x2) {
    const padLeft = 65;
    const padBottom = 65;
    const padTop = 35;
    const padRight = 35;

    const w = this.canvas.width - padLeft - padRight;
    const h = this.canvas.height - padTop - padBottom;

    // x1 from 0 to 6
    const px = padLeft + (x1 / 6.0) * w;
    // x2 from 0 to 6 (inverted y)
    const py = (this.canvas.height - padBottom) - (x2 / 6.0) * h;

    return { x: px, y: py };
  }

  pixelToMath(px, py) {
    const padLeft = 65;
    const padBottom = 65;
    const padTop = 35;
    const padRight = 35;

    const w = this.canvas.width - padLeft - padRight;
    const h = this.canvas.height - padTop - padBottom;

    const x1 = ((px - padLeft) / w) * 6.0;
    const x2 = (((this.canvas.height - padBottom) - py) / h) * 6.0;

    return {
      x1: Math.max(0, Math.min(6, parseFloat(x1.toFixed(2)))),
      x2: Math.max(0, Math.min(6, parseFloat(x2.toFixed(2))))
    };
  }

  updateInspector(p) {
    const { x1, x2 } = p;
    this.probeCoords.textContent = `(${x1.toFixed(2)}, ${x2.toFixed(2)})`;

    const woodVal = 2 * x1 + 1 * x2;
    const laborVal = 1 * x1 + 2 * x2;
    const cutVal = 1 * x1 + 1 * x2;
    const profit = 200 * x1 + 300 * x2;

    const woodOk = woodVal <= 5.0001;
    const laborOk = laborVal <= 5.0001;
    const cutOk = cutVal <= 3.0001;
    const overallFeasible = woodOk && laborOk && x1 >= 0 && x2 >= 0;

    this.evalList.innerHTML = `
      <div class="ineq-eval-item ${woodOk ? 'status-ok' : 'status-fail'}">
        <span class="eval-name">Wood Constraint (2x₁ + 1x₂ ≤ 5):</span>
        <span class="eval-math">2(${x1.toFixed(1)}) + 1(${x2.toFixed(1)}) = <strong>${woodVal.toFixed(2)}</strong> ${woodOk ? '≤ 5 ✓ Feasible' : '> 5 ✕ Violates'}</span>
      </div>
      <div class="ineq-eval-item ${laborOk ? 'status-ok' : 'status-fail'}">
        <span class="eval-name">Labor Constraint (1x₁ + 2x₂ ≤ 5):</span>
        <span class="eval-math">1(${x1.toFixed(1)}) + 2(${x2.toFixed(1)}) = <strong>${laborVal.toFixed(2)}</strong> ${laborOk ? '≤ 5 ✓ Feasible' : '> 5 ✕ Violates'}</span>
      </div>
      <div class="ineq-eval-item ${cutOk ? 'status-ok' : 'status-cut'}">
        <span class="eval-name">Gomory Cut (1x₁ + 1x₂ ≤ 3):</span>
        <span class="eval-math">1(${x1.toFixed(1)}) + 1(${x2.toFixed(1)}) = <strong>${cutVal.toFixed(2)}</strong> ${cutOk ? '≤ 3 ✓ Valid' : '> 3 ✂ Sliced'}</span>
      </div>
      <div class="ineq-eval-item eval-profit">
        <span class="eval-name">Profit (Z = 2x₁ + 3x₂):</span>
        <span class="eval-math">2(${x1.toFixed(1)}) + 3(${x2.toFixed(1)}) = <strong>${(profit/100).toFixed(2)}</strong> (<strong>$${Math.round(profit)}</strong>)</span>
      </div>
      <div class="ineq-verdict ${overallFeasible ? 'verdict-ok' : 'verdict-fail'}">
        ${overallFeasible ? '🟢 FEASIBLE SOLUTION POINT' : '🔴 INFEASIBLE: OUTSIDE BOUNDS'}
      </div>
    `;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0f131c';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid & Axes
    this.drawGrid(ctx);

    // 1. Shaded Half-Planes
    if (this.filters.wood) {
      this.drawWoodHalfPlane(ctx);
    }
    if (this.filters.labor) {
      this.drawLaborHalfPlane(ctx);
    }

    // 2. Overlapping Feasible Region Polygon
    if (this.filters.feasible) {
      this.drawFeasiblePolygon(ctx);
    }

    // 3. Gomory Cut Slice
    if (this.filters.cut) {
      this.drawGomoryCut(ctx);
    }

    // 4. Boundary Lines & Direction Arrows
    if (this.filters.wood) {
      this.drawWoodBoundary(ctx);
    }
    if (this.filters.labor) {
      this.drawLaborBoundary(ctx);
    }

    // 5. Integer Lattice Points
    if (this.filters.lattice) {
      this.drawIntegerLattice(ctx);
    }

    // 6. Corner Vertices
    this.drawCornerVertices(ctx);

    // 7. Mouse probe
    if (this.mouseCoord) {
      this.drawProbeCrosshair(ctx, this.mouseCoord);
    }
  }

  drawGrid(ctx) {
    const origin = this.mathToPixel(0, 0);
    const maxBound = this.mathToPixel(6, 6);

    ctx.lineWidth = 1;
    // Sub-grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= 6; i += 0.5) {
      const pBottom = this.mathToPixel(i, 0);
      const pTop = this.mathToPixel(i, 6);
      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.stroke();

      const pLeft = this.mathToPixel(0, i);
      const pRight = this.mathToPixel(6, i);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();
    }

    // Integer Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i <= 6; i++) {
      const pBottom = this.mathToPixel(i, 0);
      const pTop = this.mathToPixel(i, 6);
      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.stroke();

      const pLeft = this.mathToPixel(0, i);
      const pRight = this.mathToPixel(6, i);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();

      // Tick numbers
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i.toString(), pBottom.x, origin.y + 22);

      if (i > 0) {
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), origin.x - 12, pLeft.y + 4);
      }
    }

    // Main Axes
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f0ff';
    // X1 axis (Desks)
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(maxBound.x + 20, origin.y);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    // X2 axis (Chairs)
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, maxBound.y - 20);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText('x₁ (Desks Produced)', maxBound.x - 30, origin.y + 42);

    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'left';
    ctx.fillText('x₂ (Chairs Produced)', origin.x - 55, maxBound.y - 12);

    // Origin label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('(0,0)', origin.x - 10, origin.y + 18);
  }

  // Shaded region for Wood: 2x1 + x2 <= 5
  drawWoodHalfPlane(ctx) {
    const o = this.mathToPixel(0, 0);
    const pA = this.mathToPixel(2.5, 0);
    const pExt = this.mathToPixel(0, 5);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(pA.x, pA.y);
    ctx.lineTo(pExt.x, pExt.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Shaded region for Labor: x1 + 2x2 <= 5
  drawLaborHalfPlane(ctx) {
    const o = this.mathToPixel(0, 0);
    const pExt = this.mathToPixel(5, 0);
    const pC = this.mathToPixel(0, 2.5);

    ctx.save();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(pExt.x, pExt.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Feasible region polygon: (0,0) -> (2.5,0) -> (5/3, 5/3) -> (0, 2.5)
  drawFeasiblePolygon(ctx) {
    const o = this.mathToPixel(0, 0);
    const pA = this.mathToPixel(2.5, 0);
    const pB = this.mathToPixel(5/3, 5/3);
    const pC = this.mathToPixel(0, 2.5);

    ctx.save();
    // Glowing emerald gradient
    const grad = ctx.createLinearGradient(o.x, o.y, pB.x, pB.y);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.45)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Feasible Region Badge in center
    const center = this.mathToPixel(0.85, 0.95);
    ctx.fillStyle = 'rgba(10, 25, 20, 0.85)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.roundRect(center.x - 55, center.y - 12, 110, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FEASIBLE REGION', center.x, center.y + 4);

    ctx.restore();
  }

  // Gomory Cut: x1 + x2 <= 3
  drawGomoryCut(ctx) {
    const pCutX = this.mathToPixel(3, 0);
    const pCutY = this.mathToPixel(0, 3);
    const pCut1 = this.mathToPixel(2, 1);
    const pB = this.mathToPixel(5/3, 5/3);
    const pCut2 = this.mathToPixel(1, 2);

    ctx.save();
    // Sliced fractional wedge
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.beginPath();
    ctx.moveTo(pCut1.x, pCut1.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pCut2.x, pCut2.y);
    ctx.closePath();
    ctx.fill();

    // Cut dashed line
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(pCutX.x, pCutX.y);
    ctx.lineTo(pCutY.x, pCutY.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cut label
    const cutMid = this.mathToPixel(1.5, 1.5);
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Gomory Cut: x₁ + x₂ = 3', cutMid.x + 35, cutMid.y - 25);

    ctx.restore();
  }

  drawWoodBoundary(ctx) {
    const pA = this.mathToPixel(2.5, 0);
    const pExt = this.mathToPixel(0, 5);

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pExt.x, pExt.y);
    ctx.stroke();

    // Direction arrows towards (0,0)
    this.drawConstraintArrow(ctx, 1.25, 2.5, -0.4, -0.2, '#00f0ff');
    this.drawConstraintArrow(ctx, 0.5, 4.0, -0.4, -0.2, '#00f0ff');
    this.drawConstraintArrow(ctx, 2.0, 1.0, -0.4, -0.2, '#00f0ff');

    // Formula label on line
    const mid = this.mathToPixel(1.4, 2.3);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Wood: 2x₁ + 1x₂ = 5 (≤ 5)', mid.x + 12, mid.y - 8);

    ctx.restore();
  }

  drawLaborBoundary(ctx) {
    const pExt = this.mathToPixel(5, 0);
    const pC = this.mathToPixel(0, 2.5);

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(pExt.x, pExt.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.stroke();

    // Direction arrows towards (0,0)
    this.drawConstraintArrow(ctx, 2.5, 1.25, -0.2, -0.4, '#a855f7');
    this.drawConstraintArrow(ctx, 4.0, 0.5, -0.2, -0.4, '#a855f7');
    this.drawConstraintArrow(ctx, 1.0, 2.0, -0.2, -0.4, '#a855f7');

    // Formula label on line
    const mid = this.mathToPixel(3.2, 0.9);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Labor: 1x₁ + 2x₂ = 5 (≤ 5)', mid.x + 10, mid.y - 8);

    ctx.restore();
  }

  drawConstraintArrow(ctx, x1, x2, dx, dy, color) {
    const start = this.mathToPixel(x1, x2);
    const end = this.mathToPixel(x1 + dx, x2 + dy);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLen = 7;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawIntegerLattice(ctx) {
    ctx.save();
    for (let x1 = 0; x1 <= 5; x1++) {
      for (let x2 = 0; x2 <= 5; x2++) {
        const p = this.mathToPixel(x1, x2);
        const woodOk = 2 * x1 + 1 * x2 <= 5;
        const laborOk = 1 * x1 + 2 * x2 <= 5;
        const isFeasible = woodOk && laborOk;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isFeasible ? 4.5 : 2.5, 0, Math.PI * 2);

        if (x1 === 1 && x2 === 2) {
          // Integer Optimum
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();

          // Star label
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('★ Integer Opt (1,2) $800', p.x + 8, p.y - 8);
        } else if (isFeasible) {
          ctx.fillStyle = '#ffd700';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  drawCornerVertices(ctx) {
    const vertices = [
      { x1: 0, x2: 0, label: 'O(0, 0) | $0', align: 'left', offX: 8, offY: -8, color: '#94a3b8' },
      { x1: 2.5, x2: 0, label: 'A(2.5, 0) | $500', align: 'left', offX: 8, offY: -10, color: '#00f0ff' },
      { x1: 5/3, x2: 5/3, label: 'B(1.67, 1.67) | $833.33 (Cont. Opt)', align: 'left', offX: 12, offY: -12, color: '#10b981', highlight: true },
      { x1: 0, x2: 2.5, label: 'C(0, 2.5) | $750', align: 'left', offX: 8, offY: -10, color: '#a855f7' },
      { x1: 0, x2: 5, label: 'Wood Bound (0, 5)', align: 'left', offX: 8, offY: 4, color: '#00f0ff' },
      { x1: 5, x2: 0, label: 'Labor Bound (5, 0)', align: 'left', offX: 8, offY: -8, color: '#a855f7' }
    ];

    ctx.save();
    vertices.forEach(v => {
      const p = this.mathToPixel(v.x1, v.x2);

      // Vertex dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, v.highlight ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = v.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Vertex label
      ctx.font = v.highlight ? 'bold 12px Inter, sans-serif' : '11px JetBrains Mono, monospace';
      ctx.fillStyle = v.color;
      ctx.textAlign = v.align;
      ctx.fillText(v.label, p.x + v.offX, p.y + v.offY);
    });
    ctx.restore();
  }

  drawProbeCrosshair(ctx, coord) {
    const p = this.mathToPixel(coord.x1, coord.x2);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';

    // Vertical dashed guide to x1 axis
    const origin = this.mathToPixel(0, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, origin.y);
    ctx.stroke();

    // Horizontal dashed guide to x2 axis
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(origin.x, p.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing crosshair ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();
  }

  open() {
    this.isOpen = true;
    this.modalEl.classList.add('open');
    this.render();
  }

  close() {
    this.isOpen = false;
    this.modalEl.classList.remove('open');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}
