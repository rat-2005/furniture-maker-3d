# How It Works: Mathematical & Technical Architecture

An in-depth explanation of the mathematical formulation, geometric interpretation, 3D visualization engine, and algorithms powering the **Furniture Maker Optimization** presentation.

---

## Table of Contents
1. [Mathematical Formulation](#1-mathematical-formulation)
2. [3D Coordinate System & Geometric Mapping](#2-3d-coordinate-system--geometric-mapping)
3. [The 9 Geometric Planes & Layers](#3-the-9-geometric-planes--layers)
4. [Continuous Simplex Method (LP)](#4-continuous-simplex-method-lp)
5. [Gomory's Cutting Plane Method (ILP)](#5-gomorys-cutting-plane-method-ilp)
6. [3D Engine Architecture & Implementation](#6-3d-engine-architecture--implementation)
7. [Interactive Systems & State Management](#7-interactive-systems--state-management)

---

## 1. Mathematical Formulation

The presentation models a classic manufacturing production problem: **The Furniture Maker**.

### Decision Variables
* $x_1 \ge 0$: Quantity of **Desks** produced (Profit: \$200 per desk).
* $x_2 \ge 0$: Quantity of **Chairs** produced (Profit: \$300 per chair).

### Objective Function
Maximize total profit (scaled in hundreds of dollars for numerical stability):
$$\max Z = 2x_1 + 3x_2$$
*(where $Z = 5$ represents $\$500$, $Z = 8.33$ represents $\$833.33$)*

### Resource Constraints
1. **Raw Wood Supply Limit:**
   $$2x_1 + 1x_2 \le 5$$
   * Each desk requires $2$ units of wood; each chair requires $1$ unit.
   * Total available raw wood is $5$ units.
   * Intercepts on floor plane: $(2.5, 0)$ and $(0, 5)$.

2. **Workshop Labor Hours Limit:**
   $$1x_1 + 2x_2 \le 5$$
   * Each desk requires $1$ hour of assembly labor; each chair requires $2$ hours.
   * Total available labor is $5$ hours.
   * Intercepts on floor plane: $(5, 0)$ and $(0, 2.5)$.

3. **Foundational Non-Negativity Chamber:**
   $$x_1 \ge 0, \quad x_2 \ge 0, \quad Z \ge 0$$
   * Production quantities and baseline profit cannot be negative.
   * Restricts all feasible solutions to the **First Octant** of 3D space.

4. **Integer Restriction (Integer Linear Programming):**
   $$x_1, x_2 \in \mathbb{Z}_{\ge 0}$$
   * Desks and chairs must be completed whole units (cannot sell fractional furniture).

---

## 2. 3D Coordinate System & Geometric Mapping

Unlike standard 2D graphs that plot only $(x_1, x_2)$, this application elevates the problem into a full **3D Geometric Space**:

| Physical Concept | Math Variable | Three.js World Axis | Color Indicator | Extent / Scale |
| :--- | :--- | :--- | :--- | :--- |
| **Desks** | $x_1$ | **$+X$ Axis** (Right) | Red (`#ff7070`) | $0$ to $5.5$ units |
| **Profit Elevation** | $Z$ | **$+Y$ Axis** (Up) | Green (`#00f5d4`) | $0$ to $9.5$ units ($0$ to $\$950$) |
| **Chairs** | $x_2$ | **$+Z$ Axis** (Depth) | Cyan / Blue (`#70a4ff`) | $0$ to $5.5$ units |

### Key Coordinate Transformation:
All mathematical coordinates $(x_1, Z, x_2)$ are mapped to Three.js world space via:
$$\text{World}(X, Y, Z) = (x_1, Z, x_2)$$

---

## 3. The 9 Geometric Planes & Layers

The 3D scene visualizes nine distinct geometric boundaries and surfaces, fully controllable via the **3D Plane Index** toggle panel:

### Chamber Boundaries (1st Octant)
1. **$x_1 \ge 0$ Blue Wall ($x_1 = 0$):**
   * Spans the $(x_2, Z)$ plane along the left edge ($[0, 5] \times [0, 8.5]$).
   * Prevents negative desk production.
2. **$x_2 \ge 0$ Red Wall ($x_2 = 0$):**
   * Spans the $(x_1, Z)$ plane along the back edge ($[0, 5] \times [0, 8.5]$).
   * Prevents negative chair production.
3. **$Z \ge 0$ Green Floor ($Z = 0$):**
   * Horizontal ground plane reflector on $[0, 5] \times [0, 5]$ at $Y = 0$.
   * Represents the $\$0$ baseline profit.

### Constraints & Polytope
4. **Wood Constraint Plane ($2x_1 + 1x_2 = 5$):**
   * Vertical boundary plane (Cyan) rising from floor intercepts $(2.5, 0)$ to $(0, 5)$ up to height $Z = 8.5$.
   * Top edge is level because $Z$ is unconstrained by the wood equation.
5. **Labor Constraint Plane ($1x_1 + 2x_2 = 5$):**
   * Vertical boundary plane (Purple) rising from floor intercepts $(5, 0)$ to $(0, 2.5)$ up to height $Z = 8.5$.
   * Intersects the Wood plane at the floor corner $(5/3, 5/3) \approx (1.67, 1.67)$.
6. **Feasible Polyhedron (Emerald 3D Crystal):**
   * The closed 3D prism formed by the intersection of all half-spaces:
     $$\mathcal{P} = \left\{(x_1, x_2, Z) \in \mathbb{R}^3 \;\middle|\; 2x_1 + x_2 \le 5,\; x_1 + 2x_2 \le 5,\; x_1 \ge 0,\; x_2 \ge 0,\; 0 \le Z \le 2x_1 + 3x_2\right\}$$
   * Bounded by 4 floor vertices: $O(0,0)$, $A(2.5, 0)$, $B(1.67, 1.67)$, $C(0, 2.5)$.
7. **Objective Ceiling Surface ($Z = 2x_1 + 3x_2$):**
   * Tilted top surface (Mint Green) connecting the maximum profit ceiling above the feasible polygon.

### Integer Programming (ILP)
8. **Gomory Cutting Plane ($1x_1 + 1x_2 \le 3$):**
   * Hot-pink laser plane slicing across the crystal at $x_1 + x_2 = 3$.
   * Passes through $(2, 1) \mid Z = \$700$ and $(1, 2) \mid Z = \$800$.
   * Slices off the non-integer tip $B(1.67, 1.67)$ while preserving every integer point!
9. **Integer Lattice ($\mathbb{Z}^2$ Grid):**
   * Discrete golden spheres with vertical laser pillars representing factory-feasible whole-number solutions:
     $$\{(0,0), (1,0), (2,0), (0,1), (1,1), (2,1), (0,2), (1,2)\}$$
   * Displays the true integer optimum at $(1, 2) \mid \$800$.

---

## 4. Continuous Simplex Method (LP)

The presentation walks through the algebraic Simplex algorithm alongside real-time 3D edge traversal:

### Standard Form with Slack Variables
Convert inequalities to equalities using non-negative slack variables $s_1, s_2 \ge 0$:
$$\begin{aligned}
2x_1 + 1x_2 + s_1 &= 5 \quad (\text{Unused Wood}) \\
1x_1 + 2x_2 + s_2 &= 5 \quad (\text{Unused Labor}) \\
Z - 2x_1 - 3x_2 &= 0 \quad (\text{Profit Equation})
\end{aligned}$$

### Iteration Trace
1. **Initial Tableau (Step 7):**
   * Basic variables: $s_1 = 5, s_2 = 5$ at Origin $(0, 0, 0) \mid Z = \$0$.
   * Entering variable: $x_2$ (most positive $C_j - Z_j = 3$).
   * Leaving variable: $s_2$ (minimum ratio $5/2 = 2.5$).
   * Pivot element: $2$ (Row $s_2$, Column $x_2$).
2. **Iteration 1 (Steps 8–9):**
   * Tracer moves along the chair axis edge to Vertex $C(0, 2.5) \mid Z = \$750$.
   * Entering variable: $x_1$ ($C_1 - Z_1 = 0.5$).
   * Leaving variable: $s_1$ (ratio: $(5/2) / (3/2) = 5/3$).
   * Pivot element: $1.5$ (Row $s_1$, Column $x_1$).
3. **Iteration 2 — Continuous Optimal (Steps 10–11):**
   * Tracer travels along the top ridge to Vertex $B(1.67, 1.67) \mid Z = \$833.33$.
   * All $C_j - Z_j \le 0$ $\implies$ Continuous LP Optimal!

---

## 5. Gomory's Cutting Plane Method (ILP)

### The Fractional Problem
At the continuous optimum $B$, both variables are fractional:
$$x_1 = 5/3 = 1\tfrac{2}{3}, \quad x_2 = 5/3 = 1\tfrac{2}{3}$$
A craftsman cannot produce $1.67$ chairs or desks. Heuristic rounding fails:
* Rounding up $(2, 2)$: Wood required $2(2) + 1(2) = 6 > 5$ (**Infeasible!**).
* Rounding down $(1, 1)$: Profit $Z = \$500$ (sacrifices over $\$300$ of value).

### Generating Gomory's Cut
From the final simplex row for $x_1$:
$$x_1 + \tfrac{2}{3}s_1 - \tfrac{1}{3}s_2 = \tfrac{5}{3}$$
Decompose coefficients into integer and fractional parts ($c = \lfloor c \rfloor + f$, where $0 \le f < 1$):
$$x_1 + (0 + \tfrac{2}{3})s_1 + (-1 + \tfrac{2}{3})s_2 = 1 + \tfrac{2}{3}$$
Rearranging isolates the fractional remainder:
$$\tfrac{2}{3}s_1 + \tfrac{2}{3}s_2 - \tfrac{2}{3} = 1 - x_1 + s_2$$
Because all variables must be integers in the final solution, the right-hand side is an integer $\le 0$. Hence:
$$\tfrac{2}{3}s_1 + \tfrac{2}{3}s_2 \ge \tfrac{2}{3} \implies s_1 + s_2 \ge 1$$
Substituting slack definitions $s_1 = 5 - 2x_1 - x_2$ and $s_2 = 5 - x_1 - 2x_2$:
$$(5 - 2x_1 - x_2) + (5 - x_1 - 2x_2) \ge 1 \implies 10 - 3(x_1 + x_2) \ge 1$$
$$3(x_1 + x_2) \le 9 \implies \mathbf{x_1 + x_2 \le 3}$$

### Visual Cut & Separation
* The cutting plane $x_1 + x_2 \le 3$ slices through the emerald polytope.
* The fractional tip containing $(1.67, 1.67)$ is severed and drifts away.
* The remaining integer polytope has integer peak at **$(1, 2) \mid \$800$** (1 Desk, 2 Chairs), which satisfies all physical constraints!

---

## 6. 3D Engine Architecture & Implementation

### Three.js Pipeline (`src/sceneManager.js`)
* **Camera & Controls:** Perspective camera ($60^\circ$ FOV) with smooth spherical lerp transitions and OrbitControls.
* **Lighting System:** Multi-point studio lighting with key cyan light, magenta rim light, warm fill light, and hemispheric ambient illumination.
* **Geometry Engine:**
  * Dynamic BufferGeometry quads with double-sided materials (`depthWrite: false`) for translucent glass blending without z-fighting.
  * Cubic ease-out morphing: `progress = 1 - Math.pow(1 - t, 3)`.
* **Dynamic High-DPI Text Sprite Engine:**
  * Auto-measures text dimensions via 2D canvas context:
    $$W = \text{textWidth} + 2 \times \text{padX}, \quad H = \text{fontSize} + 2 \times \text{padY}$$
  * Employs $2\times$ pixel ratio backing store with linear filtering mipmaps.
  * Ensures zero label clipping and razor-sharp legibility at all camera zoom distances.

---

## 7. Interactive Systems & State Management

1. **3D Plane Index Panel (`#plane-index-box`):**
   * Real-time layer toggles for all 9 geometric boundaries.
   * "Toggle All" master switch and minimize chevron (`▾`).
   * Live active plane counter badge (`X/9`).
2. **2D Inequality Graph Modal (`src/inequalityGraph.js`):**
   * Accessible via button or hotkey <kbd>G</kbd>.
   * High-resolution 2D canvas showing boundary lines, shaded half-planes, and real-time mouse coordinate inspector with inequality feasibility testing.
3. **Unity Scene View Orientation Gizmo (`src/unityGizmo.js`):**
   * 3D coordinate cube in the top-right corner.
   * Clickable cones snap camera to Top (2D), Front ($x_1-Z$), Side ($x_2-Z$), or Perspective view.
4. **Complete State 0 Reset System:**
   * Accessible via `↺ Reset` button or hotkey <kbd>R</kbd>.
   * Preserves current mode (Gomory stays in Gomory, Simplex stays in Simplex).
   * Resets narrative scroll to top, restores camera to default perspective, resets coordinates, and clears temporary trail markers.
5. **Synthesized Audio System (`src/sound.js`):**
   * Pure Web Audio API procedural synthesizer (zero external audio assets).
   * Generates custom chimes, laser slicing sounds, clicks, and celebratory tones.
