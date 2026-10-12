# Furniture Maker Optimization: 3D Simplex & Gomory Cutting Plane

An interactive, pedagogical 3D presentation engine for Operations Research and Linear Programming. It brings to life the geometric relationship between the **Continuous Simplex Method (LP)** and **Gomory's Cutting Plane Method (ILP)** in a real-time, WebGL-powered 3D coordinate space.

---

## 📚 Documentation Links
* 📐 **[How It Works (Mathematical & Technical Architecture)](./HOW_IT_WORKS.md)** — In-depth breakdown of the linear program formulation, 3D coordinate mapping ($x_1, x_2, Z$), simplex tableau pivots, Gomory cut algebraic derivation, and Three.js visual engine.
* 🚀 **[Run on Any Device (Cross-Platform & Deployment Guide)](./RUN_GUIDE.md)** — Step-by-step instructions for running locally (Windows, macOS, Linux), mobile & tablet access via Wi-Fi (`--host`), and 1-click free deployment to **GitHub Pages**, **Vercel**, or **Netlify**.

---

## ✨ Key Features

* **Real 3D Geometric Space:** Elevates the classical 2D production problem into full 3D:
  * **$x_1$ (Desks):** Red horizontal axis
  * **$x_2$ (Chairs):** Cyan depth axis
  * **$Z$ (Profit Elevation):** Green vertical axis measuring $Z = 2x_1 + 3x_2$
* **The 9 Interactive Geometric Planes:**
  * Foundational 1st-Octant Chamber ($x_1 \ge 0$, $x_2 \ge 0$, $Z \ge 0$)
  * Raw Wood Supply Boundary ($2x_1 + 1x_2 = 5$)
  * Assembly Labor Boundary ($1x_1 + 2x_2 = 5$)
  * Feasible Solution Polyhedron (Translucent Emerald 3D Crystal)
  * Maximum Profit Objective Ceiling ($Z = 2x_1 + 3x_2$)
  * Gomory Slicing Plane ($1x_1 + 1x_2 \le 3$)
  * Integer Lattice ($\mathbb{Z}^2$ golden sphere pillars)
* **3D Plane Index & Toggle Controls:**
  * Real-time layer control panel on top-left of the viewport.
  * Individual iOS-style toggle switches to turn any constraint plane ON/OFF dynamically.
  * Master "Toggle All" and collapse button (`▾`).
* **Continuous Simplex Edge Traversal:**
  * Real-time 3D tracer climbing along polytope edges from $(0, 0, 0)$ to Vertex $C(0, 2.5) \mid \$750$ to Continuous Optimum $B(1.67, 1.67) \mid \$833.33$.
  * Interactive step-by-step Simplex Tableaus with pivot element highlighting and Gaussian row operation steps.
* **Gomory's Cutting Plane Slice Animation:**
  * Derives the valid inequality $x_1 + x_2 \le 3$ from the continuous tableau.
  * Hot-pink laser plane slices away the fractional tip, leaving the true integer optimum at **$(1, 2) \mid \$800$**.
* **Smart Mode-Aware Reset (`↺ Reset` / <kbd>R</kbd>):**
  * Resets narrative scroll to top, restores camera to default perspective, resets tracer, and clears temporary trail markers while preserving the active mode (Gomory stays in Gomory, Simplex stays in Simplex).
* **2D Inequality Graph Modal (<kbd>G</kbd>):**
  * Interactive 2D Cartesian coordinate graph with live mouse probe and half-plane shading.
* **Unity-Style Orientation Gizmo:**
  * Interactive 3D coordinate cube in the top-right corner; click cones to snap to Top (2D), Front, Side, or Perspective view.
* **Procedural Web Audio FX:**
  * Synthesizer-generated clicks, chimes, and slicing sounds using pure Web Audio API (zero audio files to download).

---

## ⚡ Quick Start

### 1. Install & Run Locally
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/furniture-maker-optimization.git
cd furniture-maker-optimization

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **`http://localhost:5173/`** in any web browser.

### 2. Run on Mobile / Tablet (Same Wi-Fi)
```bash
npm run dev -- --host
```
Open the printed `http://192.168.X.X:5173/` network URL on your phone or tablet.

### 3. Build for Production
```bash
npm run build
```
Outputs static files to `dist/`, ready for GitHub Pages, Vercel, or Netlify.

---

## 🎮 Controls Summary

| Control | Action |
| :--- | :--- |
| **Left-Click + Drag** / **1-Finger Drag** | Orbit 3D Camera |
| **Right-Click + Drag** / **2-Finger Drag** | Pan Camera |
| **Scroll Wheel** / **Pinch Gesture** | Zoom In / Out |
| <kbd>→</kbd> / <kbd>Space</kbd> / <kbd>Enter</kbd> | Next Step |
| <kbd>←</kbd> / <kbd>Backspace</kbd> | Previous Step |
| <kbd>1</kbd> / <kbd>S</kbd> | Switch to Simplex (Continuous LP) |
| <kbd>2</kbd> / <kbd>C</kbd> | Switch to Gomory's Cutting Plane (ILP) |
| <kbd>R</kbd> | Reset to State 0 (Preserves current mode) |
| <kbd>G</kbd> / <kbd>I</kbd> | Open 2D Inequality Graph |
| <kbd>T</kbd> / <kbd>P</kbd> | Top-Down (2D) / Perspective Camera View |
| <kbd>F</kbd> | Fullscreen Toggle |
| <kbd>M</kbd> | Audio SFX Toggle |
| <kbd>?</kbd> / <kbd>H</kbd> | Keyboard Shortcuts Help |

---

## 🛠️ Technology Stack
* **Vite** — High-performance frontend build tool and dev server.
* **Three.js** (`r174`) — 3D WebGL rendering, custom materials, lighting, and BufferGeometry manipulation.
* **Vanilla JavaScript (ES Modules)** — Clean, zero-framework reactive state architecture.
* **HTML5 & CSS3** — Responsive glassmorphic layout with custom CSS tokens.
* **Web Audio API** — Procedural sound synthesis.

---

## 📄 License
MIT License. Free for educational, academic, and commercial use.
