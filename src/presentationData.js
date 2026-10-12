/**
 * Mathematical presentation data for Simplex Method & Gomory's Cutting Plane Method
 * Features introductory 3D area creation section and explicit plane equation correlations.
 */

export const simplexSteps = [
  {
    id: "sp-0",
    title: "0. Anatomy of the 3D Optimization Graph",
    badge: "3D Space Setup",
    content: `
      <div class="problem-card">
        <h3>The 3D Coordinate Space</h3>
        <p>Before introducing constraints or costs, Linear Programming begins in a <strong>continuous 3-dimensional coordinate space</strong>:</p>
        
        <div class="math-block">
          <div class="math-formula highlight" style="color: #ef4444;"><strong>1. Desk Axis (x₁)</strong>: Red axis extending horizontally (quantity of Desks to produce).</div>
          <div class="math-formula highlight" style="color: #06b6d4;"><strong>2. Chair Axis (x₂)</strong>: Cyan axis extending into the depth (quantity of Chairs to produce).</div>
          <div class="math-formula highlight" style="color: #10b981;"><strong>3. Profit Elevation Axis (Z)</strong>: Vertical green axis measuring total profit generated (Z = 2x₁ + 3x₂).</div>
        </div>

        <div class="insight-box" style="margin-top: 10px; padding: 10px 14px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; border-radius: 4px;">
          <strong>Unconstrained 3D Space:</strong><br>
          Notice the empty coordinate axes and grid floor at <code>Z = 0</code>. Without constraints, decision variables could take any arbitrary value.<br>
          <em>Click <strong>Next</strong> or press <kbd>→</kbd> to see how physical manufacturing rules (non-negativity: x₁ ≥ 0, x₂ ≥ 0, Z ≥ 0) bound our world!</em>
        </div>

        <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 0.88em; opacity: 0.85;">Left-drag to orbit around the axes • Right-drag to pan • Scroll to zoom</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 0,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: false,
      showLaborPlane: false,
      showObjectiveCeiling: false,
      showPrism: false,
      showNonNeg: false,
      showCutPlane: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-1",
    title: "1. Foundational Constraints: x₁ ≥ 0, x₂ ≥ 0, Z ≥ 0",
    badge: "1st Octant (Non-Negativity)",
    content: `
      <div class="problem-card">
        <h3>Foundational Domain: The Non-Negative 1st Octant</h3>
        <p>In Linear Programming, before resource limits (Wood & Labor), all physical manufacturing obeys <strong>non-negativity constraints</strong>:</p>
        
        <div class="math-block">
          <div class="math-formula highlight" style="color: #38bdf8;"><strong>1. Desk Non-Negativity: x₁ ≥ 0</strong> (Boundary: x₁ = 0 plane) — cannot manufacture negative desks!</div>
          <div class="math-formula highlight" style="color: #f43f5e;"><strong>2. Chair Non-Negativity: x₂ ≥ 0</strong> (Boundary: x₂ = 0 plane) — cannot manufacture negative chairs!</div>
          <div class="math-formula highlight" style="color: #10b981;"><strong>3. Profit Elevation Floor: Z ≥ 0</strong> (Boundary: Z = 0 ground floor) — minimum profit baseline is $0 at origin!</div>
        </div>

        <div class="insight-box" style="margin-top: 10px; padding: 10px 14px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; border-radius: 4px;">
          <strong>Why is it called a "Half-Space"?</strong><br>
          In geometry, a flat boundary plane (like <code>x₁ = 0</code>) cuts infinite 3D space into <strong>two equal halves</strong>: negative (<code>x₁ &lt; 0</code>) and positive (<code>x₁ ≥ 0</code>).<br>
          By enforcing <code>x₁ ≥ 0</code>, <code>x₂ ≥ 0</code>, and <code>Z ≥ 0</code>, we discard all negative regions and retain only the <strong>positive First Octant</strong>.<br>
          <em>These 3 boundary walls are permanent — when you click Next, resource constraints will cut across them to form an enclosed room!</em>
        </div>

        <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="open-2d-graph-btn" style="padding: 8px 14px; background: rgba(0, 240, 255, 0.15); border: 1px solid #00f0ff; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>📈 View 2D Non-Negativity Graph</span>
            <kbd style="font-family: var(--font-mono); font-size: 10px; background: rgba(0, 240, 255, 0.25); padding: 2px 5px; border-radius: 3px;">G</kbd>
          </button>
          <span style="font-size: 0.88em; opacity: 0.85;">Orbit the camera in 3D to inspect the 3 boundary walls!</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 1,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: false,
      showLaborPlane: false,
      showObjectiveCeiling: false,
      showPrism: false,
      showNonNeg: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-2",
    title: "2. Constructing Plane 1: Wood Constraint",
    badge: "Wood Plane",
    content: `
      <div class="problem-card">
        <h3>Plane 1: Wood Supply Constraint</h3>
        <p>The craftsman only has <strong>5 units of raw wood</strong> available in storage.</p>
        
        <div class="math-block">
          <div class="math-row"><strong>Resource Requirements:</strong></div>
          <div class="math-formula">Each Desk (x₁) consumes: <strong>2 units of wood</strong></div>
          <div class="math-formula">Each Chair (x₂) consumes: <strong>1 unit of wood</strong></div>
          <div class="math-formula highlight large">Wood Plane: 2x₁ + 1x₂ = 5  (Inequality: 2x₁ + 1x₂ ≤ 5)</div>
        </div>

        <div class="insight-box" style="margin-top: 10px; padding: 10px 14px; background: rgba(0, 229, 255, 0.08); border-left: 3px solid #00e5ff; border-radius: 4px;">
          <strong>Enclosed Chamber with Non-Negativity:</strong><br>
          Notice how the cyan Wood wall connects directly with the <strong>permanent non-negativity walls</strong> (x₁ = 0 on the side, x₂ = 0 on the back, and Z = 0 floor) to form a <strong>closed 3-sided room</strong>!<br>
          The top edge is horizontal at constant height because decision variable Z is unconstrained by the wood equation.
        </div>
        <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="open-2d-graph-btn" style="padding: 8px 14px; background: rgba(0, 240, 255, 0.15); border: 1px solid #00f0ff; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>📈 View 2D Inequality Graph</span>
            <kbd style="font-family: var(--font-mono); font-size: 10px; background: rgba(0, 240, 255, 0.25); padding: 2px 5px; border-radius: 3px;">G</kbd>
          </button>
          <span style="font-size: 0.88em; opacity: 0.85;">or press <kbd>T</kbd> for Top 2D camera!</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 2,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: false,
      showObjectiveCeiling: false,
      showPrism: false,
      showCutPlane: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-3",
    title: "3. Constructing Plane 2: Labor Constraint",
    badge: "Labor Plane",
    content: `
      <div class="problem-card">
        <h3>Plane 2: Workshop Labor Constraint</h3>
        <p>The craftsman has a maximum of <strong>5 labor hours</strong> available to assemble furniture.</p>
        
        <div class="math-block">
          <div class="math-row"><strong>Labor Requirements:</strong></div>
          <div class="math-formula">Each Desk (x₁) requires: <strong>1 hour of labor</strong></div>
          <div class="math-formula">Each Chair (x₂) requires: <strong>2 hours of labor</strong></div>
          <div class="math-formula highlight large">Labor Plane: 1x₁ + 2x₂ = 5  (Inequality: 1x₁ + 2x₂ ≤ 5)</div>
        </div>

        <div class="insight-box" style="margin-top: 10px; padding: 10px 14px; background: rgba(179, 136, 255, 0.08); border-left: 3px solid #b388ff; border-radius: 4px;">
          <strong>Intersection on the Axis Plane:</strong><br>
          Like Wood, this is a 2D line on the ground plane connecting <code>(5, 0)</code> and <code>(0, 2.5)</code>, extruded vertically.<br>
          Notice where the two vertical walls cross: <strong>(x₁ = 5/3, x₂ = 5/3) ≈ (1.67, 1.67)</strong>. On the floor, this marks the critical corner vertex!
        </div>
        <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="open-2d-graph-btn" style="padding: 8px 14px; background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>📈 View 2D Inequality Graph</span>
            <kbd style="font-family: var(--font-mono); font-size: 10px; background: rgba(168, 85, 247, 0.25); padding: 2px 5px; border-radius: 3px;">G</kbd>
          </button>
          <span style="font-size: 0.88em; opacity: 0.85;">or press <kbd>T</kbd> for Top 2D camera!</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 3,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: false,
      showPrism: false,
      showCutPlane: false,
      showLattice: false,
      hideTracer: true,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-4",
    title: "4. Forming the 3D Feasible Polyhedron & Profit Ceiling",
    badge: "Feasible Region",
    content: `
      <div class="problem-card">
        <h3>The Feasible Crystal & Objective Plane</h3>
        <p>Combining Wood, Labor, and non-negativity (<code>x₁ ≥ 0, x₂ ≥ 0</code>) encloses our <strong>Feasible Polyhedron</strong>.</p>
        
        <div class="math-block">
          <div class="math-row"><strong>Objective Function Ceiling:</strong></div>
          <div class="math-formula highlight large">Profit Plane: Z = 2x₁ + 3x₂</div>
          <div class="math-formula">Origin (0,0): Z = $0</div>
          <div class="math-formula">Vertex A (2.5, 0): Z = $500</div>
          <div class="math-formula">Vertex C (0, 2.5): Z = $750</div>
          <div class="math-formula">Vertex B (1.67, 1.67): Z = $833.33</div>
        </div>

        <p class="method-rule"><strong>Simplex Goal:</strong> Start at the origin <code>(0, 0, 0)</code> and walk along the outer edges of this crystal prism to reach the highest mountain peak!</p>
      </div>
    `,
    visualState: {
      stepIndex: 4,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-5",
    title: "5. Continuous LP vs. Discrete Integer Lattice",
    badge: "Discrete Lattice",
    content: `
      <div class="explanation-card">
        <h3>Continuous Space vs. Real Factory Products</h3>
        <p>In standard Linear Programming, any continuous point inside the green crystal is valid. But in manufacturing, we cannot produce fractional furniture!</p>
        
        <div class="math-block">
          <div class="math-formula"><strong>Golden Spheres:</strong> Integer lattice points where x₁, x₂ ∈ {0, 1, 2, ...}</div>
          <div class="math-formula highlight">Feasible Integer Set: (0,0), (1,0), (2,0), (0,1), (1,1), (2,1), (0,2), (1,2)</div>
        </div>

        <p class="tip-note">Watch closely: The continuous simplex method will climb to the fractional peak <code>(1.67, 1.67)</code> first. Later, Gomory's Cutting Plane will slice away the fractional tip to reach the true integer peak <code>(1, 2)</code>!</p>
      </div>
    `,
    visualState: {
      stepIndex: 5,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-6",
    title: "6. Convert to Standard Form with Slack Variables",
    badge: "Standard Form",
    content: `
      <div class="explanation-card">
        <p>To set up the Simplex tableau, convert inequalities into linear equations by introducing non-negative <strong>slack variables</strong>:</p>
        <ul class="var-list">
          <li><strong>s₁ ≥ 0:</strong> Unused Wood capacity (units)</li>
          <li><strong>s₂ ≥ 0:</strong> Unused Labor capacity (hours)</li>
        </ul>

        <div class="math-block">
          <div class="math-formula">2x₁ + 1x₂ + 1s₁ + 0s₂ = 5</div>
          <div class="math-formula">1x₁ + 2x₂ + 0s₁ + 1s₂ = 5</div>
          <div class="math-formula highlight">Z - 2x₁ - 3x₂ + 0s₁ + 0s₂ = 0</div>
        </div>
        <p class="tip-note">Initial Basic Feasible Solution begins at the origin <code>(x₁ = 0, x₂ = 0)</code> with basic variables <code>s₁ = 5</code>, <code>s₂ = 5</code>, Profit <code>Z = $0</code>.</p>
      </div>
    `,
    visualState: {
      stepIndex: 6,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-7",
    title: "7. Initial Simplex Tableau",
    badge: "Initial Tableau",
    content: `
      <div class="tableau-card">
        <p>Initial table with <strong>s₁</strong> and <strong>s₂</strong> as basic variables at the origin <code>(0, 0)</code>, Profit <code>Z = 0</code>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
                <th rowspan="2">Ratio</th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th>x₁</th>
                <th class="col-highlight">x₂</th>
                <th>s₁</th>
                <th>s₂</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>s₁</td>
                <td>2</td>
                <td class="col-highlight">1</td>
                <td>1</td>
                <td>0</td>
                <td>5</td>
                <td>5 / 1 = 5</td>
              </tr>
              <tr class="row-highlight">
                <td>0</td>
                <td>s₂ (Leaving)</td>
                <td>1</td>
                <td class="pivot-cell">2</td>
                <td>0</td>
                <td>1</td>
                <td>5</td>
                <td class="ratio-min">5 / 2 = 2.5 →</td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td><strong>Z = 0</strong></td>
                <td>—</td>
              </tr>
              <tr class="cj-zj-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td>2</td>
                <td class="max-pos">3 ↑</td>
                <td>0</td>
                <td>0</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pivot-decision">
          <div class="decision-item">
            <span class="decision-label">Entering Variable:</span>
            <span class="decision-val"><strong>x₂</strong> (Max positive C<sub>j</sub> − Z<sub>j</sub> = 3, or most negative Z<sub>j</sub> − C<sub>j</sub> = -3)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Leaving Variable:</span>
            <span class="decision-val"><strong>s₂</strong> (Minimum ratio = 5 / 2 = 2.5)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Pivot Element:</span>
            <span class="decision-val pivot-val"><strong>2</strong> (Row 2, Column x₂)</span>
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 7,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      highlightPivot: { row: 's2', col: 'x2', val: 2 },
      sliceCut: false
    }
  },
  {
    id: "sp-8",
    title: "8. Iteration 1: Row Operations & Vertex Move",
    badge: "Iteration 1 Row Ops",
    content: `
      <div class="rowops-card">
        <p>Gaussian row operations normalize pivot element <code>2</code> to <code>1</code>, and clear column <code>x₂</code>:</p>
        
        <div class="rowop-steps">
          <div class="op-box">
            <span class="op-title">1. New x₂ Row (Row 2):</span>
            <div class="op-formula">Divide old s₂ row by <strong>2</strong></div>
            <div class="op-result"><code>[1/2, 1, 0, 1/2 | 5/2]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">2. New s₁ Row (Row 1):</span>
            <div class="op-formula">Old s₁ row − (1 × New x₂ Row)</div>
            <div class="op-result"><code>[3/2, 0, 1, -1/2 | 5/2]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">3. New Z Row:</span>
            <div class="op-formula">Old Z row − (-3 × New x₂ Row)</div>
            <div class="op-result"><code>[-1/2, 0, 0, 3/2 | 15/2]</code></div>
          </div>
        </div>

        <div class="geom-transition">
          <span class="transition-badge">3D Trajectory:</span>
          <span>Traveling along x₂ boundary from <strong>(0, 0)</strong> to <strong>(0, 2.5)</strong>. Current Profit <strong>Z = 15/2 = $750</strong>.</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 8,
      activePoint: [0, 7.5, 2.5],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-9",
    title: "9. Iteration 1 Tableau & Pivot Selection",
    badge: "Iteration 1 Tableau",
    content: `
      <div class="tableau-card">
        <p>Tableau after bringing <strong>x₂</strong> into basis. Current basic point: <code>(0, 2.5)</code> with <code>Z = $750</code>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
                <th rowspan="2">Ratio</th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th class="col-highlight">x₁</th>
                <th>x₂</th>
                <th>s₁</th>
                <th>s₂</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-highlight">
                <td>0</td>
                <td>s₁ (Leaving)</td>
                <td class="pivot-cell">3/2</td>
                <td>0</td>
                <td>1</td>
                <td>-1/2</td>
                <td>5/2</td>
                <td class="ratio-min">(5/2) / (3/2) = 5/3 →</td>
              </tr>
              <tr>
                <td>3</td>
                <td>x₂</td>
                <td>1/2</td>
                <td>1</td>
                <td>0</td>
                <td>1/2</td>
                <td>5/2</td>
                <td>(5/2) / (1/2) = 5</td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>3/2</td>
                <td>3</td>
                <td>0</td>
                <td>3/2</td>
                <td><strong>Z = 15/2</strong></td>
                <td>—</td>
              </tr>
              <tr class="cj-zj-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td class="max-pos">1/2 ↑</td>
                <td>0</td>
                <td>0</td>
                <td>-3/2</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pivot-decision">
          <div class="decision-item">
            <span class="decision-label">Optimality Test:</span>
            <span class="decision-val error-text">Not optimal! C<sub>j</sub> − Z<sub>j</sub> has +1/2 for x₁.</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Entering Variable:</span>
            <span class="decision-val"><strong>x₁</strong> (Max positive C<sub>j</sub> − Z<sub>j</sub> = 1/2)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Leaving Variable:</span>
            <span class="decision-val"><strong>s₁</strong> (Minimum ratio = 5/3 ≈ 1.67)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Pivot Element:</span>
            <span class="decision-val pivot-val"><strong>3/2</strong> (Row 1, Column x₁)</span>
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 9,
      activePoint: [0, 7.5, 2.5],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5]],
      highlightPivot: { row: 's1', col: 'x1', val: '3/2' },
      sliceCut: false
    }
  },
  {
    id: "sp-10",
    title: "10. Second Iteration: Row Operations",
    badge: "Iteration 2 Row Ops",
    content: `
      <div class="rowops-card">
        <p>Row operations to normalize pivot element <code>3/2</code> to <code>1</code> and clear column <code>x₁</code>:</p>
        
        <div class="rowop-steps">
          <div class="op-box">
            <span class="op-title">1. New x₁ Row (Row 1):</span>
            <div class="op-formula">Multiply old s₁ row by <strong>2/3</strong></div>
            <div class="op-result"><code>[1, 0, 2/3, -1/3 | 5/3]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">2. New x₂ Row (Row 2):</span>
            <div class="op-formula">Old x₂ row − (1/2 × New x₁ Row)</div>
            <div class="op-result"><code>[0, 1, -1/3, 2/3 | 5/3]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">3. New Z Row:</span>
            <div class="op-formula">Old Z row − (-1/2 × New x₁ Row)</div>
            <div class="op-result"><code>[0, 0, 1/3, 4/3 | 25/3]</code></div>
          </div>
        </div>

        <div class="geom-transition">
          <span class="transition-badge">3D Trajectory:</span>
          <span>Climbing to the apex intersection <strong>(5/3, 5/3) = (1.67, 1.67)</strong>. Peak Continuous Profit <strong>Z = 25/3 = $833.33</strong>.</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 10,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: false,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-11",
    title: "11. Iteration 2: Optimal Continuous LP Tableau",
    badge: "Optimal LP Tableau",
    content: `
      <div class="tableau-card">
        <p>Pivoting on <code>3/2</code> yields the <strong>continuous optimal solution</strong>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
                <th rowspan="2">Ratio</th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th>x₁</th>
                <th>x₂</th>
                <th>s₁</th>
                <th>s₂</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2</td>
                <td>x₁</td>
                <td>1</td>
                <td>0</td>
                <td>2/3</td>
                <td>-1/3</td>
                <td><strong>5/3</strong></td>
                <td>—</td>
              </tr>
              <tr>
                <td>3</td>
                <td>x₂</td>
                <td>0</td>
                <td>1</td>
                <td>-1/3</td>
                <td>2/3</td>
                <td><strong>5/3</strong></td>
                <td>—</td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>2</td>
                <td>3</td>
                <td>1/3</td>
                <td>4/3</td>
                <td><strong>Z = 25/3</strong></td>
                <td>—</td>
              </tr>
              <tr class="cj-zj-row optimal-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td>0</td>
                <td>0</td>
                <td>-1/3</td>
                <td>-4/3</td>
                <td><strong>OPTIMAL</strong></td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="optimal-summary">
          <h4>Continuous Optimal Values:</h4>
          <div class="res-grid">
            <div class="res-item">
              <span class="res-k">Desks (x₁):</span>
              <span class="res-v">5/3 ≈ <strong>1.67 units</strong></span>
            </div>
            <div class="res-item">
              <span class="res-k">Chairs (x₂):</span>
              <span class="res-v">5/3 ≈ <strong>1.67 units</strong></span>
            </div>
            <div class="res-item full">
              <span class="res-k">Continuous Profit Peak:</span>
              <span class="res-v profit-highlight">Z = 25/3 = $833.33</span>
            </div>
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 11,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "sp-12",
    title: "12. The Manufacturing Reality & Transition to Cutting Plane",
    badge: "Evaluation",
    content: `
      <div class="conclusion-card">
        <h3>Manufacturing Physical Reality Check</h3>
        <p class="warning-alert">
          <span class="alert-icon">⚠️</span>
          <strong>Critical Dilemma:</strong> A craftsman cannot sell <code>1.67 desks</code> and <code>1.67 chairs</code>. Solutions must be integers!
        </p>

        <div class="comparison-card">
          <h4>Why Heuristic Rounding Fails:</h4>
          <ul>
            <li><strong>Round Up (2, 2):</strong> Wood = 2(2)+2 = 6 > 5 (INFEASIBLE! Violates Wood constraint).</li>
            <li><strong>Round Down (1, 1):</strong> Profit Z = 2(1)+3(1) = 5 ($500), losing $300+ of available value.</li>
            <li><strong>The Real Integer Optimum:</strong> Switch to Gomory's Cutting Plane to see how adding a slicing plane carves out the exact integer answer!</li>
          </ul>
        </div>

        <div class="next-action-prompt">
          <p>Press <strong>[2]</strong> or click <strong>Gomory's Cutting Plane (ILP)</strong> tab to see the cutting plane in action!</p>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 12,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  }
];

export const gomorySteps = [
  {
    id: "gm-0",
    title: "0. Understanding the 3D ILP Space & Integer Lattice",
    badge: "3D Space Setup",
    content: `
      <div class="problem-card">
        <h3>Integer Linear Programming: 3D Geometry</h3>
        <p>In Integer Programming, decisions are strictly whole numbers. Let's inspect the 3D space:</p>
        
        <div class="math-block">
          <div class="math-formula highlight"><strong>X-Axis (Red):</strong> x₁ = Desks ($200 profit)</div>
          <div class="math-formula highlight"><strong>Z-Axis (Blue):</strong> x₂ = Chairs ($300 profit)</div>
          <div class="math-formula highlight"><strong>Height (Z):</strong> Profit = 2x₁ + 3x₂</div>
          <div class="math-formula"><strong>Integrality Constraint:</strong> x₁, x₂ ∈ ℤ (Only whole furniture!)</div>
        </div>

        <p class="method-rule"><strong>Gomory's Two-Stage Strategy:</strong> 
          1. Solve continuous LP relaxation first.<br>
          2. If peak is fractional, introduce a <strong>Cutting Plane</strong> that slices away the fractional peak while keeping every integer point intact!
        </p>
      </div>
    `,
    visualState: {
      stepIndex: 0,
      activePoint: [0, 0, 0],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "gm-1",
    title: "1. LP Relaxation Phase (Simplex Convergence)",
    badge: "Relaxation Solution",
    content: `
      <div class="explanation-card">
        <p>Temporarily ignoring the integer requirement, the continuous Simplex climbs the edges of the crystal to the continuous peak:</p>
        
        <div class="trajectory-summary">
          <div class="traj-step">
            <span class="traj-num">0</span>
            <span class="traj-coord">(0, 0)</span>
            <span class="traj-val">Z = 0</span>
          </div>
          <div class="traj-arrow">➔</div>
          <div class="traj-step">
            <span class="traj-num">1</span>
            <span class="traj-coord">(0, 2.5)</span>
            <span class="traj-val">Z = 7.5</span>
          </div>
          <div class="traj-arrow">➔</div>
          <div class="traj-step active">
            <span class="traj-num">2</span>
            <span class="traj-coord">(5/3, 5/3)</span>
            <span class="traj-val">Z = 8.33</span>
          </div>
        </div>

        <p class="highlight-info">Continuous relaxation peaks at <code>(x₁ = 5/3, x₂ = 5/3)</code> with profit <code>Z = 25/3 = $833.33</code>.</p>
      </div>
    `,
    visualState: {
      stepIndex: 1,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "gm-2",
    title: "2. Optimal LP Relaxation Tableau",
    badge: "Continuous Tableau",
    content: `
      <div class="tableau-card">
        <p>Optimal tableau of the continuous relaxation. All <code>C<sub>j</sub> − Z<sub>j</sub> ≤ 0</code>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
                <th rowspan="2">Ratio</th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th>x₁</th>
                <th>x₂</th>
                <th>s₁</th>
                <th>s₂</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-highlight">
                <td>2</td>
                <td>x₁ (Generating Row)</td>
                <td>1</td>
                <td>0</td>
                <td>2/3</td>
                <td>-1/3</td>
                <td class="ratio-min">5/3</td>
                <td>—</td>
              </tr>
              <tr>
                <td>3</td>
                <td>x₂</td>
                <td>0</td>
                <td>1</td>
                <td>-1/3</td>
                <td>2/3</td>
                <td>5/3</td>
                <td>—</td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>2</td>
                <td>3</td>
                <td>1/3</td>
                <td>4/3</td>
                <td><strong>Z = 25/3</strong></td>
                <td>—</td>
              </tr>
              <tr class="cj-zj-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td>0</td>
                <td>0</td>
                <td>-1/3</td>
                <td>-4/3</td>
                <td>Optimal (Cont.)</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="fraction-check">
          <span class="warning-badge">Fractional Check:</span>
          <span><code>x₁ = 5/3 = 1.667</code> and <code>x₂ = 5/3 = 1.667</code> are fractional. We must generate a <strong>Gomory Fractional Cut</strong>.</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 2,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "gm-3",
    title: "3. Generating the Gomory Cut from x₁ Row",
    badge: "Cut Derivation",
    content: `
      <div class="derivation-card">
        <p>We choose the <strong>x₁ row</strong> to generate the fractional cut since its solution value (<code>5/3</code>) is fractional.</p>
        
        <div class="math-block">
          <div class="math-row"><strong>1. Row Equation from Tableau:</strong></div>
          <div class="math-formula highlight">x₁ + (2/3)s₁ − (1/3)s₂ = 5/3</div>
        </div>

        <p>Decompose every coefficient into an <strong>integer part (a<sub>ij</sub>)</strong> plus a <strong>strictly positive fraction (f<sub>ij</sub> ∈ [0, 1))</strong>:</p>

        <div class="decomp-breakdown">
          <div class="decomp-item">
            <span class="decomp-coef">For x₁:</span>
            <span class="decomp-math">1 = 1 + 0</span>
          </div>
          <div class="decomp-item">
            <span class="decomp-coef">For s₁:</span>
            <span class="decomp-math">2/3 = 0 + 2/3</span>
          </div>
          <div class="decomp-item alert">
            <span class="decomp-coef">For s₂:</span>
            <span class="decomp-math">−1/3 = −1 + 2/3  <em>(Must be positive fraction: 2/3 > 0)</em></span>
          </div>
          <div class="decomp-item">
            <span class="decomp-coef">For Solution:</span>
            <span class="decomp-math">5/3 = 1 + 2/3</span>
          </div>
        </div>

        <div class="math-block" style="margin-top: 14px;">
          <div class="math-row"><strong>2. Decomposed Equation:</strong></div>
          <div class="math-formula">x₁ + (0 + 2/3)s₁ + (−1 + 2/3)s₂ = 1 + 2/3</div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 3,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: false,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "gm-4",
    title: "4. Mathematical Isolation of the Gomory Cut",
    badge: "Cut Equation",
    content: `
      <div class="derivation-card">
        <p>Rearranging the decomposed equation, group integer parts on left, fractions on right:</p>

        <div class="math-block">
          <div class="math-formula">x₁ − s₂ − 1 = 2/3 − (2/3)s₁ − (2/3)s₂</div>
        </div>

        <div class="logic-box">
          <p>Since decision variables and slacks must be integers at any integer feasible point, the Left-Hand Side <code>(x₁ − s₂ − 1)</code> must be an <strong>integer</strong>.</p>
          <p>Because fractional parts satisfy <code>0 ≤ f<sub>ij</sub> < 1</code>, the Right-Hand Side must strictly be <strong>≤ 0</strong>:</p>
          <div class="math-formula highlight">2/3 − (2/3)s₁ − (2/3)s₂ ≤ 0</div>
          <div class="math-formula">⟹ −(2/3)s₁ − (2/3)s₂ ≤ −2/3</div>
        </div>

        <p>Introducing a new non-negative slack variable <strong>s₃ ≥ 0</strong> converts the inequality into an equality:</p>

        <div class="gomory-cut-box">
          <div class="cut-title">Official Gomory Cut Equation:</div>
          <div class="cut-equation">−(2/3)s₁ − (2/3)s₂ + s₃ = −2/3</div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 4,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: false
    }
  },
  {
    id: "gm-5",
    title: "5. Geometric Interpretation: Cutting Plane in Decision Space",
    badge: "3D Geometric Slice",
    content: `
      <div class="geometric-card">
        <h3>Converting the Cut to Original Variables (x₁, x₂)</h3>
        <p>Expressing slack variables <code>s₁ = 5 − 2x₁ − x₂</code> and <code>s₂ = 5 − x₁ − 2x₂</code> back into original coordinates:</p>

        <div class="math-block">
          <div class="math-formula">−(2/3)(5 − 2x₁ − x₂) − (2/3)(5 − x₁ − 2x₂) ≤ −2/3</div>
          <p class="calc-note">Multiply entire inequality by <code>−(3/2)</code> (flips inequality sign):</p>
          <div class="math-formula">(5 − 2x₁ − x₂) + (5 − x₁ − 2x₂) ≥ 1</div>
          <div class="math-formula">10 − 3x₁ − 3x₂ ≥ 1  ⟹  3x₁ + 3x₂ ≤ 9</div>
          <div class="math-formula highlight large">Gomory Cut Plane: 1x₁ + 1x₂ = 3 (≤ 3)</div>
        </div>

        <div class="slice-impact">
          <h4>3D Slicing Impact:</h4>
          <ul>
            <li>At continuous peak <code>(5/3, 5/3)</code>: <code>5/3 + 5/3 = 10/3 = 3.33 > 3</code> <strong>(SLICED OFF!)</strong></li>
            <li>At integer point <code>(1, 2)</code>: <code>1 + 2 = 3 ≤ 3</code> <strong>(FEASIBLE & RETAINED!)</strong></li>
            <li>At integer point <code>(2, 1)</code>: <code>2 + 1 = 3 ≤ 3</code> <strong>(FEASIBLE & RETAINED!)</strong></li>
          </ul>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 5,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: null,
      sliceCut: true // Activates laser cutting animation!
    }
  },
  {
    id: "gm-6",
    title: "6. Dual Simplex Initial Tableau (Iteration 3)",
    badge: "Dual Simplex Setup",
    content: `
      <div class="tableau-card">
        <p>Append the new Gomory Cut as a new row to the optimal tableau. The negative Right-Hand Side (<code>Solution = -2/3</code>) makes the current state <strong>primal infeasible</strong>, requiring the <strong>Dual Simplex method</strong>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
                <th rowspan="2">Ratio<br><small>(C<sub>j</sub>−Z<sub>j</sub>)/s₃</small></th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th>x₁</th>
                <th>x₂</th>
                <th class="col-highlight">s₁</th>
                <th>s₂</th>
                <th>s₃</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2</td>
                <td>x₁</td>
                <td>1</td>
                <td>0</td>
                <td class="col-highlight">2/3</td>
                <td>-1/3</td>
                <td>0</td>
                <td>5/3</td>
                <td>—</td>
              </tr>
              <tr>
                <td>3</td>
                <td>x₂</td>
                <td>0</td>
                <td>1</td>
                <td class="col-highlight">-1/3</td>
                <td>2/3</td>
                <td>0</td>
                <td>5/3</td>
                <td>—</td>
              </tr>
              <tr class="row-highlight">
                <td>0</td>
                <td>s₃ (Leaving)</td>
                <td>0</td>
                <td>0</td>
                <td class="pivot-cell">-2/3</td>
                <td>-2/3</td>
                <td>1</td>
                <td class="ratio-min">-2/3 →</td>
                <td>—</td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>2</td>
                <td>3</td>
                <td>1/3</td>
                <td>4/3</td>
                <td>0</td>
                <td><strong>Z = 25/3</strong></td>
                <td>—</td>
              </tr>
              <tr class="cj-zj-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td>0</td>
                <td>0</td>
                <td>-1/3</td>
                <td>-4/3</td>
                <td>0</td>
                <td>—</td>
                <td>—</td>
              </tr>
              <tr class="ratio-row">
                <td colspan="2">Ratio</td>
                <td>—</td>
                <td>—</td>
                <td class="ratio-min">1/2 ↑</td>
                <td>2</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pivot-decision">
          <div class="decision-item">
            <span class="decision-label">Leaving Variable:</span>
            <span class="decision-val"><strong>s₃</strong> (Most negative in Solution column: <code>-2/3</code>)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Entering Variable:</span>
            <span class="decision-val"><strong>s₁</strong> (Minimum ratio: <code>(-1/3) / (-2/3) = 1/2</code>)</span>
          </div>
          <div class="decision-item">
            <span class="decision-label">Pivot Element:</span>
            <span class="decision-val pivot-val"><strong>−2/3</strong> (Row s₃, Column s₁)</span>
          </div>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 6,
      activePoint: [5/3, 25/3, 5/3],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3]],
      highlightPivot: { row: 's3', col: 's1', val: '-2/3' },
      sliceCut: true
    }
  },
  {
    id: "gm-7",
    title: "7. Dual Simplex Pivoting & Restoration of Feasibility",
    badge: "Dual Simplex Pivot",
    content: `
      <div class="rowops-card">
        <p>Pivoting on <code>−2/3</code> restores primal feasibility while maintaining optimality:</p>
        
        <div class="rowop-steps">
          <div class="op-box">
            <span class="op-title">1. New s₁ Row (Pivot Row):</span>
            <div class="op-formula">Divide old s₃ row by <strong>(−2/3)</strong></div>
            <div class="op-result"><code>[0, 0, 1, 1, -3/2 | 1]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">2. New x₁ Row:</span>
            <div class="op-formula">Old x₁ row − (2/3 × New s₁ Row)</div>
            <div class="op-result"><code>[1, 0, 0, -1, 1 | 1]</code></div>
          </div>

          <div class="op-box">
            <span class="op-title">3. New x₂ Row:</span>
            <div class="op-formula">Old x₂ row − (-1/3 × New s₁ Row)</div>
            <div class="op-result"><code>[0, 1, 0, 1, -1/2 | 2]</code></div>
          </div>
        </div>

        <div class="geom-transition">
          <span class="transition-badge">3D Shift:</span>
          <span>Dual pivot transitions solution from sliced fractional point <strong>(5/3, 5/3)</strong> to integer vertex <strong>(1, 2)</strong>!</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 7,
      activePoint: [1, 8, 2],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3], [1, 8, 2]],
      highlightPivot: null,
      sliceCut: true
    }
  },
  {
    id: "gm-8",
    title: "8. Final Optimal Integer Tableau",
    badge: "Integer Optimal Tableau",
    content: `
      <div class="tableau-card">
        <p>Pivoting on <code>−2/3</code> restores feasibility and yields our <strong>pure integer solution</strong>.</p>
        
        <div class="table-wrapper">
          <table class="simplex-table">
            <thead>
              <tr class="header-c">
                <th rowspan="2">CB<sub>i</sub></th>
                <th>C<sub>j</sub> →</th>
                <th>2</th>
                <th>3</th>
                <th>0</th>
                <th>0</th>
                <th>0</th>
                <th rowspan="2">Solution</th>
              </tr>
              <tr class="header-vars">
                <th>Basic Variable</th>
                <th>x₁</th>
                <th>x₂</th>
                <th>s₁</th>
                <th>s₂</th>
                <th>s₃</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2</td>
                <td>x₁</td>
                <td>1</td>
                <td>0</td>
                <td>0</td>
                <td>-1</td>
                <td>1</td>
                <td class="integer-val"><strong>1</strong></td>
              </tr>
              <tr>
                <td>3</td>
                <td>x₂</td>
                <td>0</td>
                <td>1</td>
                <td>0</td>
                <td>1</td>
                <td>-1/2</td>
                <td class="integer-val"><strong>2</strong></td>
              </tr>
              <tr>
                <td>0</td>
                <td>s₁</td>
                <td>0</td>
                <td>0</td>
                <td>1</td>
                <td>1</td>
                <td>-3/2</td>
                <td class="integer-val"><strong>1</strong></td>
              </tr>
              <tr class="z-row">
                <td colspan="2">Z<sub>j</sub></td>
                <td>2</td>
                <td>3</td>
                <td>0</td>
                <td>1</td>
                <td>1/2</td>
                <td><strong>Z = 8</strong></td>
              </tr>
              <tr class="cj-zj-row optimal-row">
                <td colspan="2">C<sub>j</sub> − Z<sub>j</sub></td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>-1</td>
                <td>-1/2</td>
                <td><strong>INTEGER OPTIMAL</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="optimal-verdict">
          <span class="success-icon">✓</span>
          <span>All <code>C<sub>j</sub> − Z<sub>j</sub> ≤ 0</code> and all values in the Solution column are <strong>non-negative integers</strong>. Optimal integer solution achieved!</span>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 8,
      activePoint: [1, 8, 2],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3], [1, 8, 2]],
      highlightPivot: null,
      sliceCut: true,
      celebrate: true // Triggers victory chime and confetti!
    }
  },
  {
    id: "gm-9",
    title: "9. Final Result, Conclusion & Resource Utilization",
    badge: "Executive Summary",
    content: `
      <div class="conclusion-card">
        <div class="strategy-banner">
          <div class="banner-title">Optimal Production Strategy</div>
          <div class="banner-items">
            <div class="banner-metric">
              <span class="metric-num">1</span>
              <span class="metric-label">Desks (x₁)</span>
            </div>
            <div class="banner-metric">
              <span class="metric-num">2</span>
              <span class="metric-label">Chairs (x₂)</span>
            </div>
            <div class="banner-metric profit">
              <span class="metric-num">$800</span>
              <span class="metric-label">Total Profit (Z = 8)</span>
            </div>
          </div>
        </div>

        <div class="resource-breakdown">
          <h4>Factory Resource Utilization:</h4>
          
          <div class="res-bar-group">
            <div class="res-bar-label">
              <span>Wood Utilization: 2(1) + 1(2) = <strong>4 / 5 units</strong></span>
              <span class="res-slack">Slack s₁ = 1 unit unused</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill wood-fill" style="width: 80%;">80%</div>
            </div>
          </div>

          <div class="res-bar-group" style="margin-top: 14px;">
            <div class="res-bar-label">
              <span>Labor Utilization: 1(1) + 2(2) = <strong>5 / 5 hours</strong></span>
              <span class="res-slack full">Slack s₂ = 0 hours (100% Bottleneck!)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill labor-fill" style="width: 100%;">100%</div>
            </div>
          </div>
        </div>

        <div class="monetary-restoration">
          <p>Restoring to actual monetary values from the original problem ($200 per desk, $300 per chair):</p>
          <div class="monetary-box">
            <code>Total Profit = ($200 × 1) + ($300 × 2) = $800</code>
          </div>
          <p class="final-note">Gomory's Cutting Plane guaranteed the exact integer optimum without heuristic approximation!</p>
        </div>
      </div>
    `,
    visualState: {
      stepIndex: 9,
      activePoint: [1, 8, 2],
      cameraPosition: [14.5, 11.0, 15.5],
      cameraTarget: [3.8, 2.4, 3.8],
      showWoodPlane: true,
      showLaborPlane: true,
      showObjectiveCeiling: true,
      showPrism: true,
      showCutPlane: true,
      showLattice: true,
      hideTracer: false,
      simplexPath: [[0, 0, 0], [0, 7.5, 2.5], [5/3, 25/3, 5/3], [1, 8, 2]],
      highlightPivot: null,
      sliceCut: true,
      celebrate: true
    }
  }
];
