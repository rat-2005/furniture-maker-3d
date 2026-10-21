/**
 * Complete Mathematical Presentation Data for:
 * 1. H.W. 1: Pure Gomory's Cutting Plane Method (Max z = 3x₁ + x₂ + 3x₃)
 * 2. H.W. 2: Mixed Integer Algorithm (Max z = 4x₁ + 6x₂ + 2x₃)
 * Formatted with clean, crisp Unicode typography without raw LaTeX artifacts.
 * Includes progressive 3D Graph Construction Phase before Simplex Tableaus.
 */

// Helper to generate elegant ASMR Simplex Tableau tables
function renderTableauHTML({
  tableNum,
  title,
  headers, // ['x₁', 'x₂', 'x₃', 'S₁', ...]
  cj,      // [3, 1, 3, 0, 0, ...]
  rows,    // [{ b: 'S₁', cb: 0, vals: [...], p0: 4, theta: '−ve' }, ...]
  zjCj,    // [0, −10, ...]
  p0Total, // 9
  pivotRowIdx = null,
  pivotColIdx = null,
  notes = '',
  entering = '',
  leaving = '',
  fractionalNote = ''
}) {
  let headerHtml = `
    <tr class="tbl-header-cj">
      <th colspan="2" class="tbl-corner">Cⱼ</th>
      ${cj.map(c => `<th class="tbl-cj-val">${c}</th>`).join('')}
      <th class="tbl-p0-col"></th>
      <th class="tbl-theta-col"></th>
    </tr>
    <tr class="tbl-header-vars">
      <th class="tbl-b-col">B</th>
      <th class="tbl-cb-col">C_B</th>
      ${headers.map((h, idx) => `<th class="${idx === pivotColIdx ? 'col-pivot-header' : ''}">${h}</th>`).join('')}
      <th class="tbl-p0-col">P₀ (RHS)</th>
      <th class="tbl-theta-col">θ Ratio</th>
    </tr>
  `;

  let rowsHtml = rows.map((r, rIdx) => {
    const isPivotRow = rIdx === pivotRowIdx;
    return `
      <tr class="tbl-data-row ${isPivotRow ? 'row-pivot-highlight' : ''}">
        <td class="tbl-b-val"><strong>${r.b}</strong></td>
        <td class="tbl-cb-val">${r.cb}</td>
        ${r.vals.map((v, cIdx) => {
          const isPivot = isPivotRow && cIdx === pivotColIdx;
          return `<td class="tbl-val-cell ${isPivot ? 'cell-pivot-element' : ''} ${cIdx === pivotColIdx ? 'col-pivot-cell' : ''}">${v}</td>`;
        }).join('')}
        <td class="tbl-p0-cell"><strong>${r.p0}</strong></td>
        <td class="tbl-theta-cell ${isPivotRow ? 'theta-selected' : ''}">${r.theta || '—'}</td>
      </tr>
    `;
  }).join('');

  let zjHtml = `
    <tr class="tbl-zj-row">
      <td colspan="2" class="tbl-zj-label"><strong>Zⱼ − Cⱼ</strong></td>
      ${zjCj.map((z, idx) => `<td class="tbl-zj-val ${idx === pivotColIdx ? 'zj-pivot-col' : ''}">${z}</td>`).join('')}
      <td class="tbl-p0-total"><strong>${p0Total}</strong></td>
      <td class="tbl-theta-empty">—</td>
    </tr>
  `;

  return `
    <div class="tableau-card-wrapper asmr-card">
      <div class="tableau-header-strip">
        <div class="tableau-title-group">
          <span class="tableau-badge">Tableau ${tableNum}</span>
          <span class="tableau-heading">${title}</span>
        </div>
        ${entering ? `<div class="pivot-indicator-badge">Entering (E): <strong>${entering}</strong> | Leaving (L): <strong>${leaving}</strong></div>` : ''}
      </div>

      <div class="tableau-table-scroll">
        <table class="simplex-tableau-table">
          <thead>${headerHtml}</thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>${zjHtml}</tfoot>
        </table>
      </div>

      ${notes ? `<div class="tableau-analysis-note"><span class="note-bullet">✦</span> ${notes}</div>` : ''}
      ${fractionalNote ? `<div class="fractional-cut-formula"><span class="cut-icon">✂️</span> ${fractionalNote}</div>` : ''}
    </div>
  `;
}

// Helper to generate elegant 3D Graph Creation Cards
function renderGraphStepHTML({
  stepNumber,
  title,
  subtitle,
  formulaBadge,
  normalVector,
  intercepts,
  halfSpaceTest,
  geometryInsight,
  colorDotClass = 'p1'
}) {
  return `
    <div class="problem-card asmr-card">
      <div class="problem-header-bar">
        <span class="model-type-pill">3D Spatial Construction • Step ${stepNumber}</span>
        <span class="opt-goal-pill" style="border-color: #00f0ff; color: #a5f3fc;">Hyperplane Geometry</span>
      </div>

      <div class="diff-title-wrap" style="margin-bottom: 12px;">
        <h3 style="font-size: 1.25rem; color: #ffffff; margin: 4px 0;">${title}</h3>
        <p class="diff-subtitle" style="font-size: 0.88rem; color: #94a3b8; margin: 0;">${subtitle}</p>
      </div>

      <div class="math-block">
        <div class="math-formula highlight">
          <span class="c-dot ${colorDotClass}"></span>
          <strong>Hyperplane Boundary:</strong> ${formulaBadge}
        </div>
        <div class="math-sub-grid" style="grid-template-columns: 1fr 1fr; margin-top: 8px;">
          <div class="sub-constraint"><strong>Normal Vector (n):</strong> ${normalVector}</div>
          <div class="sub-constraint"><strong>Axis Intercepts:</strong> ${intercepts}</div>
        </div>
        <div class="sub-constraint" style="margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <strong>Feasibility Test Point (0,0,0):</strong> ${halfSpaceTest}
        </div>
      </div>

      <div class="asmr-insight-callout" style="margin-top: 14px;">
        <span class="asmr-sparkle">📐</span>
        <div>
          <strong>Spatial Geometry Insight:</strong><br>
          ${geometryInsight}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// H.W. 1: Pure Gomory Cutting Plane Method
// Max z = 3x₁ + x₂ + 3x₃
// s.t. −x₁ + 2x₂ + x₃ ≤ 4, 2x₂ − 1.5x₃ ≤ 1, x₁ − 3x₂ + 2x₃ ≤ 3; x₁..x₃ ∈ ℤ₊
// ============================================================================
export const hw1Steps = [
  // -------------------------------------------------------------------------
  // Step 0: Formulation Overview
  // -------------------------------------------------------------------------
  {
    id: "hw1-0",
    stepLabel: "Problem Definition",
    title: "0. H.W. 1 Problem Formulation & Mathematical Model",
    badge: "Problem Definition",
    content: `
      <div class="problem-card asmr-card">
        <div class="problem-header-bar">
          <span class="model-type-pill">H.W. 1: Pure Integer Linear Programming</span>
          <span class="opt-goal-pill">Maximize Z</span>
        </div>
        
        <h3>Pure Gomory Cutting Plane Method</h3>
        <p>A true 3-dimensional optimization problem over continuous crystal space, seeking the maximal discrete integer lattice point (x₁, x₂, x₃) ∈ ℤ³₊:</p>

        <div class="math-block">
          <div class="math-formula highlight"><strong>Objective:</strong> Max z = 3x₁ + x₂ + 3x₃</div>
          <div class="math-sub-grid">
            <div class="sub-constraint"><span class="c-dot p1"></span> <strong>Plane 1 (C₁):</strong> −x₁ + 2x₂ + x₃ ≤ 4</div>
            <div class="sub-constraint"><span class="c-dot p2"></span> <strong>Plane 2 (C₂):</strong> 2x₂ − 1.5x₃ ≤ 1 &nbsp; (or 4x₂ − 3x₃ ≤ 2)</div>
            <div class="sub-constraint"><span class="c-dot p3"></span> <strong>Plane 3 (C₃):</strong> x₁ − 3x₂ + 2x₃ ≤ 3</div>
            <div class="sub-constraint"><span class="c-dot int"></span> <strong>Integrality:</strong> x₁, x₂, x₃ ≥ 0 &nbsp; (All variables discrete integers!)</div>
          </div>
        </div>

        <div class="math-block" style="margin-top: 10px;">
          <div class="math-formula"><strong>Standard Form (Add Slack Variables S₁, S₂, S₃ ≥ 0):</strong></div>
          <div style="font-family: var(--font-mono); font-size: 0.9em; line-height: 1.6; color: #a5f3fc;">
            ① −x₁ + 2x₂ + 1x₃ + S₁ = 4<br>
            ② 0x₁ + 2x₂ − (3/2)x₃ + S₂ = 1<br>
            ③ 1x₁ − 3x₂ + 2x₃ + S₃ = 3
          </div>
        </div>

        <div class="asmr-insight-callout">
          <span class="asmr-sparkle">✨</span>
          <div>
            <strong>Interactive 3D Graph Construction:</strong><br>
            Click <strong>Next</strong> or press <kbd>→</kbd> to watch each constraint hyperplane plotted step-by-step to form the 3D crystal polytope before solving!
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 0,
      activePoint: [0, 0, 0],
      cameraPosition: [16, 12, 16],
      cameraTarget: [2.5, 1.5, 2.5],
      showOctant: true,
      showPlane1: false,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  // -------------------------------------------------------------------------
  // Graph Creation Steps (1 to 5)
  // -------------------------------------------------------------------------
  {
    id: "hw1-g1",
    stepLabel: "3D Graph: 1st Octant Domain",
    title: "1. Graph Creation: 1st Octant Non-Negativity Domain",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 1,
      title: "Non-Negativity Domain: x₁ ≥ 0, x₂ ≥ 0, x₃ ≥ 0",
      subtitle: "Restricting the decision variables to the physically feasible positive coordinate space.",
      formulaBadge: "x₁ ≥ 0, &nbsp; x₂ ≥ 0, &nbsp; x₃ ≥ 0 &nbsp; (1st Octant in ℝ³)",
      normalVector: "Orthogonal unit basis vectors e₁, e₂, e₃",
      intercepts: "Origin anchor point at (0, 0, 0)",
      halfSpaceTest: "(0, 0, 0) satisfies 0 ≥ 0 on all 3 coordinate walls ✓",
      geometryInsight: "In ℝ³, the 3 coordinate planes (x₁=0 side wall, x₂=0 back wall, x₃=0 ground floor) bound the infinite positive cone. All production solutions must reside strictly within this 1st octant.",
      colorDotClass: "p1"
    }),
    visualState: {
      stepIndex: 1,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 11, 15],
      cameraTarget: [2.5, 1.5, 2.0],
      showOctant: true,
      showPlane1: false,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-g2",
    stepLabel: "3D Graph: Plotting Plane 1 (C₁)",
    title: "2. Graph Creation: Plotting Plane 1 (C₁)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 2,
      title: "Resource Hyperplane 1: −x₁ + 2x₂ + x₃ ≤ 4",
      subtitle: "First primary resource boundary cutting across the 1st octant.",
      formulaBadge: "−x₁ + 2x₂ + x₃ = 4 &nbsp; (Cyan Hyperplane)",
      normalVector: "n₁ = (−1, 2, 1)",
      intercepts: "x₂-intercept: (0, 2, 0) | x₃-intercept: (0, 0, 4)",
      halfSpaceTest: "−(0) + 2(0) + 0 = 0 ≤ 4 ✓ (Half-space containing origin is feasible)",
      geometryInsight: "Because x₁ has a negative coefficient (−1), increasing x₁ allows x₂ and x₃ to expand further. The plane slopes upwards from the x₂-x₃ wall into the interior.",
      colorDotClass: "p1"
    }),
    visualState: {
      stepIndex: 2,
      activePoint: [0, 0, 0],
      cameraPosition: [14, 10, 16],
      cameraTarget: [2.5, 2.0, 2.0],
      showOctant: false,
      showPlane1: true,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-g3",
    stepLabel: "3D Graph: Plotting Plane 2 (C₂)",
    title: "3. Graph Creation: Plotting Plane 2 (C₂)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 3,
      title: "Resource Hyperplane 2: 2x₂ − 1.5x₃ ≤ 1",
      subtitle: "Multiplying by 2 yields integer form 4x₂ − 3x₃ ≤ 2. Parallel along x₁ axis.",
      formulaBadge: "2x₂ − 1.5x₃ = 1 &nbsp; (or 4x₂ − 3x₃ = 2) &nbsp; (Purple Hyperplane)",
      normalVector: "n₂ = (0, 4, −3)",
      intercepts: "x₂-intercept: (0, 0.5, 0) &nbsp; [extends infinitely along x₁]",
      halfSpaceTest: "4(0) − 3(0) = 0 ≤ 2 ✓ (Origin is feasible)",
      geometryInsight: "Because x₁ has coefficient 0, Plane 2 is an extruded prism surface running perfectly parallel along the x₁ axis, intersecting Plane 1 along a 3D spatial ridge.",
      colorDotClass: "p2"
    }),
    visualState: {
      stepIndex: 3,
      activePoint: [0, 0, 0],
      cameraPosition: [16, 11, 14],
      cameraTarget: [3.0, 2.0, 2.0],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-g4",
    stepLabel: "3D Graph: Plotting Plane 3 (C₃)",
    title: "4. Graph Creation: Plotting Plane 3 (C₃)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 4,
      title: "Resource Hyperplane 3: x₁ − 3x₂ + 2x₃ ≤ 3",
      subtitle: "Third bounding hyperplane that caps the x₁ axis and encloses the feasible volume.",
      formulaBadge: "x₁ − 3x₂ + 2x₃ = 3 &nbsp; (Amber Hyperplane)",
      normalVector: "n₃ = (1, −3, 2)",
      intercepts: "x₁-intercept: (3, 0, 0) | x₃-intercept: (0, 0, 1.5)",
      halfSpaceTest: "(0) − 3(0) + 2(0) = 0 ≤ 3 ✓ (Origin is feasible)",
      geometryInsight: "Plane 3 provides the upper boundary cap on x₁, terminating at intercept (3, 0, 0) on the ground floor. Together with Planes 1 & 2, it fully closes the open domain into a finite crystal.",
      colorDotClass: "p3"
    }),
    visualState: {
      stepIndex: 4,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 12, 15],
      cameraTarget: [3.0, 2.0, 2.0],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-g5",
    stepLabel: "3D Graph: Polytope & Integer Lattice",
    title: "5. Graph Creation: 3D Feasible Polytope & Integer Lattice",
    badge: "3D Spatial Assembly",
    content: `
      <div class="problem-card asmr-card">
        <div class="problem-header-bar">
          <span class="model-type-pill">3D Spatial Construction • Complete</span>
          <span class="opt-goal-pill" style="border-color: #10b981; color: #34d399;">Bounded Polyhedron</span>
        </div>

        <h3>3D Continuous Polytope & Discrete Lattice Formed</h3>
        <p>The simultaneous intersection of Planes 1, 2, and 3 inside the 1st octant seals the feasible space into an 8-vertex continuous convex crystal:</p>

        <div class="math-block">
          <div class="math-formula highlight">
            <strong>Continuous LP Vertices (8 Extremes):</strong>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.86em; line-height: 1.7; color: #a5f3fc;">
            • V₀: (0, 0, 0) &nbsp; [Origin, Z = 0]<br>
            • V₁: (0, 0, 1.5) &nbsp; [Z = 4.5]<br>
            • V₂: (0, 0.5, 0) &nbsp; [Z = 0.5]<br>
            • V₃: (0, 1.4, 1.2) &nbsp; [Z = 5.0]<br>
            • V₄: (0, 0.71, 2.57) &nbsp; [Z = 8.43]<br>
            • V₅: (3, 0, 0) &nbsp; [Tableau 2 Pivot, Z = 9]<br>
            • V₆: (4.5, 0.5, 0) &nbsp; [Tableau 3 Pivot, Z = 14]<br>
            • <strong>V₇: (16/3, 3, 10/3) = (5.33, 3, 3.33) &nbsp; [Continuous LP Optimum, Z = 29!]</strong>
          </div>
        </div>

        <div class="asmr-insight-callout" style="border-left-color: #ffd700;">
          <span class="asmr-sparkle">★</span>
          <div>
            <strong>19 Feasible Integer Points on Lattice:</strong><br>
            Observe the glowing cyan grid points. The true discrete champion is <strong style="color: #ffd700;">(5, 2, 2) with Z = 23</strong>.
            Click <strong>Next</strong> to start the Simplex & Dual Simplex algorithm on Tableau 1!
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 5,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 12, 16],
      cameraTarget: [3.0, 2.0, 2.5],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  // -------------------------------------------------------------------------
  // Simplex Phase (Tableaus 1 to 8)
  // -------------------------------------------------------------------------
  {
    id: "hw1-t1",
    stepLabel: "Tableau 1 / 8: Initial BFS",
    title: "6. Table 1: Initial Simplex Tableau",
    badge: "Simplex Phase 1",
    content: `
      ${renderTableauHTML({
        tableNum: 1,
        title: "Initial Basic Feasible Solution (Origin)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [3, 1, 3, 0, 0, 0],
        rows: [
          { b: 'S₁', cb: 0, vals: ['−1', '2', '1', '1', '0', '0'], p0: '4', theta: '−ve' },
          { b: 'S₂', cb: 0, vals: ['0', '2', '−3/2', '0', '1', '0'], p0: '1', theta: '—' },
          { b: 'S₃', cb: 0, vals: ['1', '−3', '2', '0', '0', '1'], p0: '3', theta: '3 (Min)' }
        ],
        zjCj: ['−3', '−1', '−3', '0', '0', '0'],
        p0Total: '0',
        pivotRowIdx: 2,
        pivotColIdx: 0,
        entering: 'x₁',
        leaving: 'S₃',
        notes: "Most negative Zⱼ − Cⱼ = −3. Tie between x₁ and x₃ broken by choosing <strong>x₁</strong> as entering variable. Key row is S₃ with θ = 3/1 = 3."
      })}
    `,
    visualState: {
      stepIndex: 6,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 11, 15],
      cameraTarget: [1.5, 0.5, 1.5],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t2",
    stepLabel: "Tableau 2 / 8: Simplex Step 2",
    title: "7. Table 2: Second Simplex Tableau",
    badge: "Simplex Phase 2",
    content: `
      ${renderTableauHTML({
        tableNum: 2,
        title: "x₁ Enters Basis, S₃ Leaves | Solution at (3, 0, 0)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [3, 1, 3, 0, 0, 0],
        rows: [
          { b: 'S₁', cb: 0, vals: ['0', '−1', '3', '1', '0', '1'], p0: '7', theta: '—' },
          { b: 'S₂', cb: 0, vals: ['0', '2', '−3/2', '0', '1', '0'], p0: '1', theta: '1/2 (Min)' },
          { b: 'x₁', cb: 3, vals: ['1', '−3', '2', '0', '0', '1'], p0: '3', theta: '—' }
        ],
        zjCj: ['0', '−10', '3', '0', '0', '3'],
        p0Total: '9',
        pivotRowIdx: 1,
        pivotColIdx: 1,
        entering: 'x₂',
        leaving: 'S₂',
        notes: "Most negative Zⱼ − Cⱼ = −10 at column x₂. Minimum ratio is θ = 1/2 in row S₂. Boxed pivot element is <strong>2</strong>."
      })}
    `,
    visualState: {
      stepIndex: 7,
      activePoint: [3, 0, 0],
      cameraPosition: [14, 10, 14],
      cameraTarget: [3, 0, 0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t3",
    stepLabel: "Tableau 3 / 8: Simplex Step 3",
    title: "8. Table 3: Third Simplex Tableau",
    badge: "Simplex Phase 3",
    content: `
      ${renderTableauHTML({
        tableNum: 3,
        title: "x₂ Enters Basis, S₂ Leaves | Solution at (4.5, 0.5, 0)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [3, 1, 3, 0, 0, 0],
        rows: [
          { b: 'S₁', cb: 0, vals: ['0', '0', '9/4', '1', '1/2', '1'], p0: '15/2', theta: '10/3 (Min)' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '−3/4', '0', '1/2', '0'], p0: '1/2', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '−1/4', '0', '3/2', '1'], p0: '9/2', theta: '—' }
        ],
        zjCj: ['0', '0', '−9/2', '0', '5', '3'],
        p0Total: '14',
        pivotRowIdx: 0,
        pivotColIdx: 2,
        entering: 'x₃',
        leaving: 'S₁',
        notes: "Most negative entry is Z₃ − C₃ = −9/2. x₃ enters. Minimum positive ratio is θ = (15/2) / (9/4) = 10/3 in row S₁. Pivot element is <strong>9/4</strong>."
      })}
    `,
    visualState: {
      stepIndex: 8,
      activePoint: [4.5, 0.5, 0],
      cameraPosition: [13, 9, 13],
      cameraTarget: [4.5, 0.5, 0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t4",
    stepLabel: "Tableau 4 / 8: Continuous LP Optimum",
    title: "9. Table 4: Continuous LP Optimum & Cut 1 Generation",
    badge: "LP Optimum (Fractional)",
    content: `
      ${renderTableauHTML({
        tableNum: 4,
        title: "LP Optimum Reached (All Zⱼ − Cⱼ ≥ 0), but Non-Integer!",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [3, 1, 3, 0, 0, 0],
        rows: [
          { b: 'x₃', cb: 3, vals: ['0', '0', '1', '4/9', '2/9', '4/9'], p0: '10/3', theta: '—' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '0', '1/3', '2/3', '1/3'], p0: '3', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '0', '1/9', '14/9', '10/9'], p0: '16/3', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '2', '6', '5'],
        p0Total: '29',
        notes: "All Zⱼ − Cⱼ ≥ 0. Continuous LP optimum is Z = 29. However, x₁ = 16/3 = 5.33 and x₃ = 10/3 = 3.33 are fractional! Both have fractional part f₀ = 1/3.",
        fractionalNote: "<strong>Deriving Gomory Cut 1 from Row x₁:</strong><br>" +
          "Row equation: x₁ + (1/9)S₁ + (14/9)S₂ + (10/9)S₃ = 16/3<br>" +
          "Fractional parts: f_S₁ = 1/9, &nbsp; f_S₂ = 5/9, &nbsp; f_S₃ = 1/9, &nbsp; f₀ = 1/3<br>" +
          "<strong>Cut 1:</strong> −(1/9)S₁ − (5/9)S₂ − (1/9)S₃ + G₁ = −1/3 &nbsp; (or in coordinates: 2x₂ − x₃ ≤ 2)"
      })}

      <div class="audience-challenge-box asmr-card" id="round-down-challenge" style="margin-top: 14px; border: 1.5px solid rgba(245, 158, 11, 0.5); background: rgba(18, 22, 34, 0.95); padding: 14px; border-radius: 12px;">
        <div class="challenge-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 24px;">🤔</span>
          <div>
            <h4 style="color: #ffd700; margin: 0; font-size: 15px; font-weight: 800;">AUDIENCE LIVE DILEMMA: "Can We Just Round Down to Integer?"</h4>
            <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0 0;">Continuous Simplex peak is (16/3, 3, 10/3) = (5.33, 3, 3.33). Test what happens if we round down:</p>
          </div>
        </div>
        <div class="challenge-options-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
          <button class="challenge-opt-btn asmr-btn" data-choice="a" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 10px; color: #fff; text-align: left; cursor: pointer;">
            <strong style="color: #f87171; display: block; font-size: 11px;">OPTION A</strong>
            <span style="font-size: 12px;">Round to <strong>(5, 3, 3)</strong></span>
          </button>
          <button class="challenge-opt-btn asmr-btn" data-choice="b" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 10px; color: #fff; text-align: left; cursor: pointer;">
            <strong style="color: #f87171; display: block; font-size: 11px;">OPTION B</strong>
            <span style="font-size: 12px;">Round to <strong>(5, 3, 2)</strong></span>
          </button>
          <button class="challenge-opt-btn asmr-btn" data-choice="c" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 8px 10px; color: #34d399; text-align: left; cursor: pointer;">
            <strong style="color: #34d399; display: block; font-size: 11px;">OPTION C (GOMORY)</strong>
            <span style="font-size: 12px;">Generate <strong>Gomory Cut 1</strong></span>
          </button>
        </div>
        <div class="challenge-feedback-box hidden" id="challenge-feedback" style="margin-top: 10px; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; line-height: 1.5;"></div>
      </div>
    `,
    visualState: {
      stepIndex: 9,
      activePoint: [5.333, 3.0, 3.333],
      cameraPosition: [14, 11, 14],
      cameraTarget: [5.33, 3.0, 3.33],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0], [5.333, 3.0, 3.333]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t5",
    stepLabel: "Tableau 5 / 8: Dual Simplex on Cut 1",
    title: "10. Table 5: Dual Simplex on Cut 1 (G₁)",
    badge: "Dual Simplex Cut 1",
    content: `
      ${renderTableauHTML({
        tableNum: 5,
        title: "Introduce Cut G₁ (P₀ = −1/3 is Negative → Dual Simplex)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁'],
        cj: [3, 1, 3, 0, 0, 0, 0],
        rows: [
          { b: 'x₃', cb: 3, vals: ['0', '0', '1', '4/9', '2/9', '4/9', '0'], p0: '10/3', theta: '—' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '0', '1/3', '2/3', '1/3', '0'], p0: '3', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '0', '1/9', '14/9', '10/9', '0'], p0: '16/3', theta: '—' },
          { b: 'G₁', cb: 0, vals: ['0', '0', '0', '−1/9', '−5/9', '−1/9', '1'], p0: '−1/3', theta: 'PR' }
        ],
        zjCj: ['0', '0', '0', '2', '6', '5', '0'],
        p0Total: '29',
        pivotRowIdx: 3,
        pivotColIdx: 4,
        entering: 'S₂',
        leaving: 'G₁',
        notes: "Dual Simplex ratio test: min { (Zⱼ − Cⱼ) / |a_rj| } for negative row entries a_rj < 0:<br>" +
          "S₁: 2 / (1/9) = 18, &nbsp; S₂: 6 / (5/9) = 54/5 = 10.8 (Smallest!), &nbsp; S₃: 5 / (1/9) = 45.<br>" +
          "Boxed pivot element is <strong>−5/9</strong>. G₁ leaves basis, S₂ enters."
      })}
    `,
    visualState: {
      stepIndex: 10,
      activePoint: [5.333, 3.0, 3.333],
      cameraPosition: [14, 11, 14],
      cameraTarget: [5.33, 3.0, 3.33],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0], [5.333, 3.0, 3.333]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t6",
    stepLabel: "Tableau 6 / 8: After Cut 1",
    title: "11. Table 6: Tableau After Cut 1 & Cut 2 Generation",
    badge: "Dual Simplex Phase",
    content: `
      ${renderTableauHTML({
        tableNum: 6,
        title: "Solution at (22/5, 13/5, 16/5) | Still Non-Integer!",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁'],
        cj: [3, 1, 3, 0, 0, 0, 0],
        rows: [
          { b: 'x₃', cb: 3, vals: ['0', '0', '1', '2/5', '0', '2/5', '2/5'], p0: '16/5', theta: '—' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '0', '1/5', '0', '1/5', '6/5'], p0: '13/5', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '0', '−1/5', '0', '4/5', '14/5'], p0: '22/5', theta: '—' },
          { b: 'S₂', cb: 0, vals: ['0', '0', '0', '1/5', '1', '1/5', '−9/5'], p0: '3/5', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '4/5', '0', '19/5', '54/5'],
        p0Total: '127/5',
        notes: "Current solution is x₁ = 22/5 = 4.4, x₂ = 13/5 = 2.6, x₃ = 16/5 = 3.2. Profit is Z = 127/5 = 25.4. All are still fractional with f₀ = 1/5 or 3/5. Maximum fraction is in row x₃ (f₀ = 1/5) or x₂ (f₀ = 3/5).",
        fractionalNote: "<strong>Deriving Gomory Cut 2 from Row x₃:</strong><br>" +
          "Row equation: x₃ + (2/5)S₁ + (2/5)S₃ + (2/5)G₁ = 16/5<br>" +
          "Fractional parts: f_S₁ = 2/5, &nbsp; f_S₃ = 2/5, &nbsp; f_G₁ = 2/5, &nbsp; f₀ = 1/5 (or from x₂: f₀ = 3/5)<br>" +
          "<strong>Cut 2:</strong> −(1/5)S₁ − (1/5)S₃ − (1/5)G₁ + G₂ = −3/5 &nbsp; (or in coordinates: x₃ ≤ 2)"
      })}
    `,
    visualState: {
      stepIndex: 11,
      activePoint: [4.4, 2.6, 3.2],
      cameraPosition: [13, 10, 13],
      cameraTarget: [4.4, 2.6, 3.2],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0], [5.333, 3.0, 3.333], [4.4, 2.6, 3.2]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t7",
    stepLabel: "Tableau 7 / 8: Dual Simplex on Cut 2",
    title: "12. Table 7: Dual Simplex on Cut 2 (G₂)",
    badge: "Dual Simplex Cut 2",
    content: `
      ${renderTableauHTML({
        tableNum: 7,
        title: "Introduce Cut G₂ (P₀ = −3/5 is Negative → Dual Simplex)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁', 'G₂'],
        cj: [3, 1, 3, 0, 0, 0, 0, 0],
        rows: [
          { b: 'x₃', cb: 3, vals: ['0', '0', '1', '2/5', '0', '2/5', '2/5', '0'], p0: '16/5', theta: '—' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '0', '1/5', '0', '1/5', '6/5', '0'], p0: '13/5', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '0', '−1/5', '0', '4/5', '14/5', '0'], p0: '22/5', theta: '—' },
          { b: 'S₂', cb: 0, vals: ['0', '0', '0', '1/5', '1', '1/5', '−9/5', '0'], p0: '3/5', theta: '—' },
          { b: 'G₂', cb: 0, vals: ['0', '0', '0', '−1/5', '0', '−1/5', '−1/5', '1'], p0: '−3/5', theta: 'PR' }
        ],
        zjCj: ['0', '0', '0', '4/5', '0', '19/5', '54/5', '0'],
        p0Total: '127/5',
        pivotRowIdx: 4,
        pivotColIdx: 3,
        entering: 'S₁',
        leaving: 'G₂',
        notes: "Dual Simplex ratios: S₁ = (4/5)/(1/5) = 4 (Smallest!), &nbsp; S₃ = (19/5)/(1/5) = 19, &nbsp; G₁ = (54/5)/(1/5) = 54.<br>" +
          "Boxed pivot element is <strong>−1/5</strong>. G₂ leaves basis, S₁ enters."
      })}
    `,
    visualState: {
      stepIndex: 12,
      activePoint: [4.4, 2.6, 3.2],
      cameraPosition: [13, 10, 13],
      cameraTarget: [4.4, 2.6, 3.2],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0], [5.333, 3.0, 3.333], [4.4, 2.6, 3.2]],
      problemMode: 'hw1'
    }
  },

  {
    id: "hw1-t8",
    stepLabel: "Tableau 8 / 8: Final Integer Optimum",
    title: "13. Table 8: FINAL Integer Optimal Solution!",
    badge: "Integer Optimum Reached",
    content: `
      ${renderTableauHTML({
        tableNum: 8,
        title: "All Zⱼ − Cⱼ ≥ 0 AND All P₀ are Non-Negative Integers! 🎉",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁', 'G₂'],
        cj: [3, 1, 3, 0, 0, 0, 0, 0],
        rows: [
          { b: 'x₃', cb: 3, vals: ['0', '0', '1', '0', '0', '0', '0', '2'], p0: '2', theta: '—' },
          { b: 'x₂', cb: 1, vals: ['0', '1', '0', '0', '0', '0', '1', '1'], p0: '2', theta: '—' },
          { b: 'x₁', cb: 3, vals: ['1', '0', '0', '0', '0', '1', '3', '−1'], p0: '5', theta: '—' },
          { b: 'S₂', cb: 0, vals: ['0', '0', '0', '0', '1', '0', '−2', '1'], p0: '0', theta: '—' },
          { b: 'S₁', cb: 0, vals: ['0', '0', '0', '1', '0', '1', '1', '−5'], p0: '3', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '0', '0', '3', '10', '4'],
        p0Total: '23',
        notes: "<strong>FINAL INTEGER SOLUTION VERIFIED:</strong><br>" +
          "<strong>x₁ = 5, &nbsp; x₂ = 2, &nbsp; x₃ = 2</strong><br>" +
          "<strong>Max z = 3(5) + 1(2) + 3(2) = 15 + 2 + 6 = 23</strong><br>" +
          "Check Constraints:<br>" +
          "C₁: −5 + 2(2) + 2 = 1 ≤ 4 &nbsp; (Slack S₁ = 3)<br>" +
          "C₂: 2(2) − 1.5(2) = 1 ≤ 1 &nbsp; (Slack S₂ = 0, Binding Bottleneck!)<br>" +
          "C₃: 5 − 3(2) + 2(2) = 3 ≤ 3 &nbsp; (Slack S₃ = 0, Binding Bottleneck!)"
      })}
    `,
    visualState: {
      stepIndex: 13,
      activePoint: [5.0, 2.0, 2.0],
      cameraPosition: [12, 8, 12],
      cameraTarget: [5.0, 2.0, 2.0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      celebrate: true,
      simplexPath: [[0, 0, 0], [3, 0, 0], [4.5, 0.5, 0], [5.333, 3.0, 3.333], [4.4, 2.6, 3.2], [5.0, 2.0, 2.0]],
      problemMode: 'hw1'
    }
  }
];

// ============================================================================
// H.W. 2: Mixed Integer Linear Programming (MILP)
// Max z = 4x₁ + 6x₂ + 2x₃
// s.t. 4x₁ − 4x₂ ≤ 5, −x₁ + 6x₂ ≤ 5, −x₁ + x₂ + x₃ ≤ 5; x₁, x₃ ∈ ℤ₊, x₂ ∈ ℝ₊
// ============================================================================
export const hw2Steps = [
  // -------------------------------------------------------------------------
  // Step 0: Formulation Overview
  // -------------------------------------------------------------------------
  {
    id: "hw2-0",
    stepLabel: "Problem Definition",
    title: "0. H.W. 2 Problem Formulation & Mathematical Model",
    badge: "Problem Definition",
    content: `
      <div class="problem-card asmr-card">
        <div class="problem-header-bar">
          <span class="model-type-pill" style="background: rgba(168, 85, 247, 0.2); border-color: #a855f7; color: #d8b4fe;">H.W. 2: Mixed Integer Linear Programming (MILP)</span>
          <span class="opt-goal-pill">Maximize Z</span>
        </div>
        
        <h3>Mixed Integer Algorithm (Gomory Mixed Cut)</h3>
        <p>A sophisticated model where some variables must be discrete integers, while others are allowed to remain continuous fractions:</p>

        <div class="math-block">
          <div class="math-formula highlight"><strong>Objective:</strong> Max z = 4x₁ + 6x₂ + 2x₃</div>
          <div class="math-sub-grid">
            <div class="sub-constraint"><span class="c-dot p1"></span> <strong>Plane 1 (C₁):</strong> 4x₁ − 4x₂ ≤ 5</div>
            <div class="sub-constraint"><span class="c-dot p2"></span> <strong>Plane 2 (C₂):</strong> −x₁ + 6x₂ ≤ 5</div>
            <div class="sub-constraint"><span class="c-dot p3"></span> <strong>Plane 3 (C₃):</strong> −x₁ + x₂ + x₃ ≤ 5</div>
            <div class="sub-constraint"><span class="c-dot int"></span> <strong>Integrality:</strong> x₁, x₃ ∈ ℤ₊ (Discrete Integers), &nbsp; <strong>x₂ ∈ ℝ₊</strong> <em>(Continuous Fraction Allowed!)</em></div>
          </div>
        </div>

        <div class="math-block" style="margin-top: 10px;">
          <div class="math-formula"><strong>Slacks Formulation (Slacks depend on x₂, so treated as continuous):</strong></div>
          <div style="font-family: var(--font-mono); font-size: 0.9em; line-height: 1.6; color: #e9d5ff;">
            ① 4x₁ − 4x₂ + S₁ = 5<br>
            ② −x₁ + 6x₂ + S₂ = 5<br>
            ③ −x₁ + x₂ + x₃ + S₃ = 5
          </div>
        </div>

        <div class="asmr-insight-callout" style="border-left-color: #a855f7;">
          <span class="asmr-sparkle">🔮</span>
          <div>
            <strong>Interactive 3D Graph Construction:</strong><br>
            Click <strong>Next</strong> or press <kbd>→</kbd> to observe the 3 hyperplanes and mixed lattice plotted step-by-step!
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 0,
      activePoint: [0, 0, 0],
      cameraPosition: [16, 12, 16],
      cameraTarget: [1.5, 1.5, 3.5],
      showOctant: true,
      showPlane1: false,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  // -------------------------------------------------------------------------
  // Graph Creation Steps (1 to 5)
  // -------------------------------------------------------------------------
  {
    id: "hw2-g1",
    stepLabel: "3D Graph: 1st Octant Domain",
    title: "1. Graph Creation: 1st Octant Non-Negativity Domain",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 1,
      title: "Non-Negativity Domain: x₁ ≥ 0, x₂ ≥ 0, x₃ ≥ 0",
      subtitle: "Physical feasibility boundaries for continuous and discrete decision variables.",
      formulaBadge: "x₁, x₃ ∈ ℤ₊ &nbsp; | &nbsp; x₂ ∈ ℝ₊ &nbsp; (1st Octant in ℝ³)",
      normalVector: "Standard unit basis vectors e₁, e₂, e₃",
      intercepts: "Origin anchor at (0, 0, 0)",
      halfSpaceTest: "All variables non-negative ✓",
      geometryInsight: "While x₁ and x₃ will eventually be restricted to integer grid lines, the underlying feasible polyhedron is formed in continuous 3D space.",
      colorDotClass: "p1"
    }),
    visualState: {
      stepIndex: 1,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 11, 15],
      cameraTarget: [1.5, 1.0, 3.0],
      showOctant: true,
      showPlane1: false,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-g2",
    stepLabel: "3D Graph: Plotting Plane 1 (C₁)",
    title: "2. Graph Creation: Plotting Plane 1 (C₁)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 2,
      title: "Constraint Hyperplane 1: 4x₁ − 4x₂ ≤ 5",
      subtitle: "First vertical constraint wall, independent of height variable x₃.",
      formulaBadge: "4x₁ − 4x₂ = 5 &nbsp; (or x₁ − x₂ = 1.25) &nbsp; (Cyan Wall)",
      normalVector: "n₁ = (4, −4, 0)",
      intercepts: "x₁-intercept: (1.25, 0, 0) &nbsp; [extends vertically along x₃]",
      halfSpaceTest: "4(0) − 4(0) = 0 ≤ 5 ✓ (Origin is feasible)",
      geometryInsight: "Since x₃ has coefficient 0, Plane 1 is a vertical wall extending straight up along the x₃ height axis from line x₁ − x₂ = 1.25 on the floor.",
      colorDotClass: "p1"
    }),
    visualState: {
      stepIndex: 2,
      activePoint: [0, 0, 0],
      cameraPosition: [14, 10, 16],
      cameraTarget: [1.5, 1.0, 3.0],
      showOctant: false,
      showPlane1: true,
      showPlane2: false,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-g3",
    stepLabel: "3D Graph: Plotting Plane 2 (C₂)",
    title: "3. Graph Creation: Plotting Plane 2 (C₂)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 3,
      title: "Constraint Hyperplane 2: −x₁ + 6x₂ ≤ 5",
      subtitle: "Second vertical constraint wall, bounding x₂ expansion.",
      formulaBadge: "−x₁ + 6x₂ = 5 &nbsp; (Purple Wall)",
      normalVector: "n₂ = (−1, 6, 0)",
      intercepts: "x₂-intercept: (0, 5/6, 0) = (0, 0.833, 0)",
      halfSpaceTest: "−(0) + 6(0) = 0 ≤ 5 ✓ (Origin is feasible)",
      geometryInsight: "Planes 1 & 2 intersect along a vertical column at (x₁, x₂) = (2.5, 1.25), creating the floor footprint of the feasible region.",
      colorDotClass: "p2"
    }),
    visualState: {
      stepIndex: 3,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 11, 14],
      cameraTarget: [1.8, 1.2, 3.5],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: false,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-g4",
    stepLabel: "3D Graph: Plotting Plane 3 (C₃)",
    title: "4. Graph Creation: Plotting Plane 3 (C₃)",
    badge: "Graph Construction",
    content: renderGraphStepHTML({
      stepNumber: 4,
      title: "Constraint Hyperplane 3: −x₁ + x₂ + x₃ ≤ 5",
      subtitle: "Upper ceiling hyperplane capping height variable x₃.",
      formulaBadge: "−x₁ + x₂ + x₃ = 5 &nbsp; (Amber Roof Hyperplane)",
      normalVector: "n₃ = (−1, 1, 1)",
      intercepts: "x₃-intercept: (0, 0, 5.0) | Peak at (2.5, 1.25, 6.25)",
      halfSpaceTest: "−(0) + 0 + 0 = 0 ≤ 5 ✓ (Origin is feasible)",
      geometryInsight: "Plane 3 acts as the roof of the crystal. At corner (2.5, 1.25), the ceiling height reaches x₃ = 5 + 2.5 − 1.25 = 6.25, forming the continuous relaxation peak!",
      colorDotClass: "p3"
    }),
    visualState: {
      stepIndex: 4,
      activePoint: [0, 0, 0],
      cameraPosition: [14, 11, 15],
      cameraTarget: [2.0, 1.5, 4.0],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: false,
      showCut1: false,
      showCut2: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-g5",
    stepLabel: "3D Graph: Polytope & Mixed Lattice",
    title: "5. Graph Creation: 3D Feasible Region & Mixed Lattice Grid",
    badge: "3D Spatial Assembly",
    content: `
      <div class="problem-card asmr-card">
        <div class="problem-header-bar">
          <span class="model-type-pill" style="border-color: #a855f7; color: #d8b4fe;">3D Spatial Construction • Complete</span>
          <span class="opt-goal-pill" style="border-color: #a855f7; color: #d8b4fe;">MILP Geometry</span>
        </div>

        <h3>3D Continuous Region & Mixed Disjunctions Formed</h3>
        <p>The 3 intersecting hyperplanes enclose an 8-vertex continuous polyhedron with fractional relaxation peak at (2.5, 1.25, 6.25):</p>

        <div class="math-block">
          <div class="math-formula highlight">
            <strong>Continuous LP Vertices:</strong>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.86em; line-height: 1.7; color: #d8b4fe;">
            • V₀: (0, 0, 0) &nbsp; [Z = 0]<br>
            • V₁: (0, 0, 5.0) &nbsp; [Z = 10]<br>
            • V₂: (0, 0.833, 0) &nbsp; [Z = 5.0]<br>
            • V₃: (0, 0.833, 4.167) &nbsp; [Z = 13.33]<br>
            • V₄: (1.25, 0, 0) &nbsp; [Z = 5.0]<br>
            • V₅: (1.25, 0, 6.25) &nbsp; [Z = 17.5]<br>
            • V₆: (2.5, 1.25, 0) &nbsp; [Z = 17.5]<br>
            • <strong>V₇: (2.5, 1.25, 6.25) &nbsp; [Continuous Relaxation Optimum, Z = 30!]</strong>
          </div>
        </div>

        <div class="asmr-insight-callout" style="border-left-color: #ffd700;">
          <span class="asmr-sparkle">★</span>
          <div>
            <strong>Mixed Integer Target:</strong><br>
            Only x₁ and x₃ must be integers; x₂ remains continuous. The optimal mixed point is <strong style="color: #ffd700;">(2, 1, 6) with Z = 26</strong>.
            Click <strong>Next</strong> to start the Simplex & Mixed Gomory Cut algorithm on Tableau 1!
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 5,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 12, 16],
      cameraTarget: [1.8, 1.2, 3.5],
      showOctant: false,
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  // -------------------------------------------------------------------------
  // Simplex Phase (Tableaus 1 to 8)
  // -------------------------------------------------------------------------
  {
    id: "hw2-t1",
    stepLabel: "Tableau 1 / 8: Initial BFS",
    title: "6. Table 1: Initial Simplex Tableau",
    badge: "Simplex Phase 1",
    content: `
      ${renderTableauHTML({
        tableNum: 1,
        title: "Initial Tableau | Basis: {S₁, S₂, S₃}",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [4, 6, 2, 0, 0, 0],
        rows: [
          { b: 'S₁', cb: 0, vals: ['4', '−4', '0', '1', '0', '0'], p0: '5', theta: '−ve' },
          { b: 'S₂', cb: 0, vals: ['−1', '6', '0', '0', '1', '0'], p0: '5', theta: '5/6 (Min)' },
          { b: 'S₃', cb: 0, vals: ['−1', '1', '1', '0', '0', '1'], p0: '5', theta: '5' }
        ],
        zjCj: ['−4', '−6', '−2', '0', '0', '0'],
        p0Total: '0',
        pivotRowIdx: 1,
        pivotColIdx: 1,
        entering: 'x₂',
        leaving: 'S₂',
        notes: "Most negative Zⱼ − Cⱼ = −6 (column x₂). Minimum non-negative ratio θ = 5/6 in row S₂. Pivot element is <strong>6</strong>."
      })}
    `,
    visualState: {
      stepIndex: 6,
      activePoint: [0, 0, 0],
      cameraPosition: [15, 11, 15],
      cameraTarget: [1.5, 1.0, 3.0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t2",
    stepLabel: "Tableau 2 / 8: Simplex Step 2",
    title: "7. Table 2: Second Simplex Tableau",
    badge: "Simplex Phase 2",
    content: `
      ${renderTableauHTML({
        tableNum: 2,
        title: "x₂ Enters, S₂ Leaves | Solution at (0, 5/6, 0)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [4, 6, 2, 0, 0, 0],
        rows: [
          { b: 'S₁', cb: 0, vals: ['10/3', '0', '0', '1', '2/3', '0'], p0: '25/3', theta: '5/2 (Min)' },
          { b: 'x₂', cb: 6, vals: ['−1/6', '1', '0', '0', '1/6', '0'], p0: '5/6', theta: '−ve' },
          { b: 'S₃', cb: 0, vals: ['−5/6', '0', '1', '0', '−1/6', '1'], p0: '25/6', theta: '−ve' }
        ],
        zjCj: ['−5', '0', '−2', '0', '1', '0'],
        p0Total: '5',
        pivotRowIdx: 0,
        pivotColIdx: 0,
        entering: 'x₁',
        leaving: 'S₁',
        notes: "Most negative Zⱼ − Cⱼ = −5 at x₁. Minimum ratio θ = (25/3) / (10/3) = 5/2 = 2.5 in row S₁. Pivot element is <strong>10/3</strong>."
      })}
    `,
    visualState: {
      stepIndex: 7,
      activePoint: [0, 0.833, 0],
      cameraPosition: [14, 10, 14],
      cameraTarget: [0, 0.833, 0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t3",
    stepLabel: "Tableau 3 / 8: Simplex Step 3",
    title: "8. Table 3: Third Simplex Tableau",
    badge: "Simplex Phase 3",
    content: `
      ${renderTableauHTML({
        tableNum: 3,
        title: "x₁ Enters, S₁ Leaves | Solution at (5/2, 5/4, 0)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [4, 6, 2, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '3/10', '1/5', '0'], p0: '5/2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '1/20', '1/5', '0'], p0: '5/4', theta: '—' },
          { b: 'S₃', cb: 0, vals: ['0', '0', '1', '1/4', '0', '1'], p0: '25/4', theta: '25/4 (Min)' }
        ],
        zjCj: ['0', '0', '−2', '3/2', '2', '0'],
        p0Total: '35/2',
        pivotRowIdx: 2,
        pivotColIdx: 2,
        entering: 'x₃',
        leaving: 'S₃',
        notes: "Most negative entry Z₃ − C₃ = −2 at column x₃. S₃ is only positive entry. Ratio θ = 25/4. Pivot element is <strong>1</strong>."
      })}
    `,
    visualState: {
      stepIndex: 8,
      activePoint: [2.5, 1.25, 0],
      cameraPosition: [14, 10, 14],
      cameraTarget: [2.5, 1.25, 0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: false,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t4",
    stepLabel: "Tableau 4 / 8: Continuous Relaxation",
    title: "9. Table 4: Continuous LP Relaxation Optimum & Mixed Cut 1",
    badge: "Continuous LP Optimum",
    content: `
      ${renderTableauHTML({
        tableNum: 4,
        title: "All Zⱼ − Cⱼ ≥ 0 | Continuous Optimum Z = 30",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃'],
        cj: [4, 6, 2, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '3/10', '1/5', '0'], p0: '5/2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '1/20', '1/5', '0'], p0: '5/4', theta: '—' },
          { b: 'x₃', cb: 2, vals: ['0', '0', '1', '1/4', '0', '1'], p0: '25/4', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '2', '2', '2'],
        p0Total: '30',
        notes: "Continuous LP solution: x₁ = 5/2 = 2.5, x₂ = 5/4 = 1.25, x₃ = 25/4 = 6.25 (Z = 30). Since x₁ and x₃ must be discrete integers, x₁ = 2.5 is non-integer (f₀ = 1/2).",
        fractionalNote: "<strong>Gomory Mixed Cut 1 from Row x₁:</strong><br>" +
          "Row equation: x₁ + (3/10)S₁ + (1/5)S₂ = 5/2. Since f₀ = 1/2 and continuous slacks S₁, S₂ ≥ 0:<br>" +
          "f_S₁ = 3/10, &nbsp; f_S₂ = 1/5 &nbsp; (both positive $\\implies$ coefficient = f_j)<br>" +
          "<strong>Mixed Cut 1:</strong> −(3/10)S₁ − (1/5)S₂ + G₁ = −1/2 &nbsp; (or in coordinates: x₁ ≤ 2)"
      })}
    `,
    visualState: {
      stepIndex: 9,
      activePoint: [2.5, 1.25, 6.25],
      cameraPosition: [14, 11, 15],
      cameraTarget: [2.5, 1.25, 6.25],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0], [2.5, 1.25, 6.25]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t5",
    stepLabel: "Tableau 5 / 8: Dual Simplex on Mixed Cut 1",
    title: "10. Table 5: Dual Simplex on Mixed Cut 1 (G₁)",
    badge: "Dual Simplex Cut 1",
    content: `
      ${renderTableauHTML({
        tableNum: 5,
        title: "Introduce Mixed Cut G₁ (P₀ = −1/2 is Negative → Dual Simplex)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁'],
        cj: [4, 6, 2, 0, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '3/10', '1/5', '0', '0'], p0: '5/2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '1/20', '1/5', '0', '0'], p0: '5/4', theta: '—' },
          { b: 'x₃', cb: 2, vals: ['0', '0', '1', '1/4', '0', '1', '0'], p0: '25/4', theta: '—' },
          { b: 'G₁', cb: 0, vals: ['0', '0', '0', '−3/10', '−1/5', '0', '1'], p0: '−1/2', theta: 'PR' }
        ],
        zjCj: ['0', '0', '0', '2', '2', '0', '0'],
        p0Total: '30',
        pivotRowIdx: 3,
        pivotColIdx: 3,
        entering: 'S₁',
        leaving: 'G₁',
        notes: "Dual Simplex ratio test: min { (Zⱼ − Cⱼ) / |a_rj| } for a_rj < 0:<br>" +
          "S₁: 2 / (3/10) = 20/3 ≈ 6.67 (Smallest!), &nbsp; S₂: 2 / (1/5) = 10.<br>" +
          "Boxed pivot element is <strong>−3/10</strong>. G₁ leaves, S₁ enters."
      })}
    `,
    visualState: {
      stepIndex: 10,
      activePoint: [2.5, 1.25, 6.25],
      cameraPosition: [14, 11, 15],
      cameraTarget: [2.5, 1.25, 6.25],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0], [2.5, 1.25, 6.25]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t6",
    stepLabel: "Tableau 6 / 8: After Cut 1",
    title: "11. Table 6: Tableau After Cut 1 & Mixed Cut 2 Generation",
    badge: "Dual Simplex Phase",
    content: `
      ${renderTableauHTML({
        tableNum: 6,
        title: "x₁ = 2 (Integer!), but x₃ = 35/6 = 5.83 (Non-Integer!)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁'],
        cj: [4, 6, 2, 0, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '0', '0', '0', '1'], p0: '2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '0', '1/6', '0', '1/6'], p0: '7/6', theta: '—' },
          { b: 'x₃', cb: 2, vals: ['0', '0', '1', '0', '−1/6', '1', '5/6'], p0: '35/6', theta: '—' },
          { b: 'S₁', cb: 0, vals: ['0', '0', '0', '1', '2/3', '0', '−10/3'], p0: '5/3', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '0', '2/3', '0', '20/3'],
        p0Total: '80/3',
        notes: "Now x₁ = 2 is an integer! x₂ = 7/6 ≈ 1.167 is continuous (allowed). However, x₃ = 35/6 = 5 + 5/6 is non-integer (f₀ = 5/6). We must generate Mixed Cut 2 from row x₃.",
        fractionalNote: "<strong>Gomory Mixed Cut 2 Formula (Multiplier f₀ / (1 − f₀) applied on negative a_rj):</strong><br>" +
          "In row x₃: a_S₂ = −1/6 < 0. Multiplier is f₀ / (1 − f₀) = (5/6)/(1/6) = 5.<br>" +
          "Coefficient for S₂ becomes: (f₀ / (1 − f₀)) * |a_S₂| = 5 * (1/6) = 5/6.<br>" +
          "<strong>Mixed Cut 2:</strong> −(5/6)S₂ − (5/6)G₁ + G₂ = −5/6 &nbsp; (or in coordinates: x₃ ≤ 6)"
      })}
    `,
    visualState: {
      stepIndex: 11,
      activePoint: [2.0, 1.167, 5.833],
      cameraPosition: [13, 10, 14],
      cameraTarget: [2.0, 1.167, 5.833],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0], [2.5, 1.25, 6.25], [2.0, 1.167, 5.833]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t7",
    stepLabel: "Tableau 7 / 8: Dual Simplex on Mixed Cut 2",
    title: "12. Table 7: Dual Simplex on Mixed Cut 2 (G₂)",
    badge: "Dual Simplex Cut 2",
    content: `
      ${renderTableauHTML({
        tableNum: 7,
        title: "Introduce Mixed Cut G₂ (P₀ = −5/6 is Negative → Dual Simplex)",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁', 'G₂'],
        cj: [4, 6, 2, 0, 0, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '0', '0', '0', '1', '0'], p0: '2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '0', '1/6', '0', '1/6', '0'], p0: '7/6', theta: '—' },
          { b: 'x₃', cb: 2, vals: ['0', '0', '1', '0', '−1/6', '1', '5/6', '0'], p0: '35/6', theta: '—' },
          { b: 'S₁', cb: 0, vals: ['0', '0', '0', '1', '2/3', '0', '−10/3', '0'], p0: '5/3', theta: '—' },
          { b: 'G₂', cb: 0, vals: ['0', '0', '0', '0', '−5/6', '0', '−5/6', '1'], p0: '−5/6', theta: 'PR' }
        ],
        zjCj: ['0', '0', '0', '0', '2/3', '0', '20/3', '0'],
        p0Total: '80/3',
        pivotRowIdx: 4,
        pivotColIdx: 4,
        entering: 'S₂',
        leaving: 'G₂',
        notes: "Dual Simplex ratio test: min { (2/3)/(5/6), (20/3)/(5/6) } = min { 4/5, 8 } = 4/5 (column S₂).<br>" +
          "Boxed pivot element is <strong>−5/6</strong>. G₂ leaves basis, S₂ enters."
      })}
    `,
    visualState: {
      stepIndex: 12,
      activePoint: [2.0, 1.167, 5.833],
      cameraPosition: [13, 10, 14],
      cameraTarget: [2.0, 1.167, 5.833],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0], [2.5, 1.25, 6.25], [2.0, 1.167, 5.833]],
      problemMode: 'hw2'
    }
  },

  {
    id: "hw2-t8",
    stepLabel: "Tableau 8 / 8: Final Mixed Optimum",
    title: "13. Table 8: FINAL Mixed Integer Optimal Solution!",
    badge: "Mixed Optimum Reached",
    content: `
      ${renderTableauHTML({
        tableNum: 8,
        title: "x₁ = 2 ∈ ℤ, &nbsp; x₂ = 1 ∈ ℝ, &nbsp; x₃ = 6 ∈ ℤ | Optimal Z = 26! 🎉",
        headers: ['x₁', 'x₂', 'x₃', 'S₁', 'S₂', 'S₃', 'G₁', 'G₂'],
        cj: [4, 6, 2, 0, 0, 0, 0, 0],
        rows: [
          { b: 'x₁', cb: 4, vals: ['1', '0', '0', '0', '0', '0', '1', '0'], p0: '2', theta: '—' },
          { b: 'x₂', cb: 6, vals: ['0', '1', '0', '0', '0', '0', '0', '1/5'], p0: '1', theta: '—' },
          { b: 'x₃', cb: 2, vals: ['0', '0', '1', '0', '0', '1', '1', '−1/5'], p0: '6', theta: '—' },
          { b: 'S₁', cb: 0, vals: ['0', '0', '0', '1', '0', '0', '−4', '4/5'], p0: '1', theta: '—' },
          { b: 'S₂', cb: 0, vals: ['0', '0', '0', '0', '1', '0', '1', '−6/5'], p0: '1', theta: '—' }
        ],
        zjCj: ['0', '0', '0', '0', '0', '0', '6', '4/5'],
        p0Total: '26',
        notes: "<strong>FINAL MIXED INTEGER SOLUTION VERIFIED:</strong><br>" +
          "<strong>x₁ = 2 &nbsp; (Integer ✓)</strong><br>" +
          "<strong>x₂ = 1 &nbsp; (Continuous Real ✓)</strong><br>" +
          "<strong>x₃ = 6 &nbsp; (Integer ✓)</strong><br>" +
          "<strong>Max z = 4(2) + 6(1) + 2(6) = 8 + 6 + 12 = 26</strong><br>" +
          "Check Constraints:<br>" +
          "C₁: 4(2) − 4(1) = 4 ≤ 5 &nbsp; (Slack S₁ = 1)<br>" +
          "C₂: −2 + 6(1) = 4 ≤ 5 &nbsp; (Slack S₂ = 1)<br>" +
          "C₃: −2 + 1 + 6 = 5 ≤ 5 &nbsp; (Slack S₃ = 0, 100% Binding Bottleneck!)"
      })}
    `,
    visualState: {
      stepIndex: 13,
      activePoint: [2.0, 1.0, 6.0],
      cameraPosition: [12, 8, 14],
      cameraTarget: [2.0, 1.0, 6.0],
      showPlane1: true,
      showPlane2: true,
      showPlane3: true,
      showPolyhedron: true,
      showCut1: true,
      showCut2: true,
      showLattice: true,
      hideTracer: false,
      celebrate: true,
      simplexPath: [[0, 0, 0], [0, 0.833, 0], [2.5, 1.25, 0], [2.5, 1.25, 6.25], [2.0, 1.167, 5.833], [2.0, 1.0, 6.0]],
      problemMode: 'hw2'
    }
  }
];
