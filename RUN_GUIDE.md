# Running the 3D Presentation on Any Device

A complete cross-platform guide for setting up, running, and deploying the **Furniture Maker 3D Optimization Engine** on Windows, macOS, Linux, Android, iOS, tablets, and web hosting platforms.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Quick Start (Local Computer)](#2-quick-start-local-computer)
3. [Running on Mobile & Tablet (Over Local Wi-Fi)](#3-running-on-mobile--tablet-over-local-wi-fi)
4. [Building for Production](#4-building-for-production)
5. [Free Online Deployment (Access Anywhere via URL)](#5-free-online-deployment-access-anywhere-via-url)
   * [Option A: GitHub Pages (Recommended)](#option-a-github-pages-recommended)
   * [Option B: Vercel (1-Click)](#option-b-vercel-1-click)
   * [Option C: Netlify (Drag & Drop)](#option-c-netlify-drag--drop)
6. [Device Controls & Gesture Reference](#6-device-controls--gesture-reference)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. Prerequisites

Before running the application locally, ensure your computer has:
* **Node.js**: Version `18.0.0` or higher ([Download Node.js](https://nodejs.org/)).
* **npm**: Included automatically with Node.js.
* **Modern Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, or Safari with WebGL 2.0 enabled.

To verify your Node.js installation, open your terminal (Command Prompt, PowerShell, or Bash) and run:
```bash
node -v
npm -v
```

---

## 2. Quick Start (Local Computer)

### Step 1: Clone or Download the Repository
```bash
git clone https://github.com/YOUR_USERNAME/furniture-maker-optimization.git
cd furniture-maker-optimization
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Open your browser and navigate to:
```
http://localhost:5173/
```
Press **START PRESENTATION** to begin!

---

## 3. Running on Mobile & Tablet (Over Local Wi-Fi)

You can present or interact with the 3D scene directly on your **iPhone, iPad, Android phone, or tablet** using your computer as the local server.

### Step 1: Start Dev Server with Network Host
Run:
```bash
npm run dev -- --host
```
Vite will output two URLs in your terminal:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XX:5173/
```

### Step 2: Connect Your Mobile Device
1. Make sure your mobile device or tablet is connected to the **same Wi-Fi network** as your computer.
2. Open Safari or Chrome on your phone/tablet.
3. Type the **Network URL** shown in your terminal (e.g. `http://192.168.1.XX:5173/`).
4. Full touch gestures (1-finger orbit, 2-finger pinch zoom, pan) will work immediately on mobile!

> **Tip:** If the page does not load on your phone, check that your computer's firewall allows incoming connections on port `5173`.

---

## 4. Building for Production

To generate an optimized, minified production build:
```bash
npm run build
```
This produces a `dist/` directory containing static HTML, CSS, and JS bundles ready for deployment.

To test the production build locally before uploading:
```bash
npm run preview
```
Open `http://localhost:4173/` in your browser.

---

## 5. Free Online Deployment (Access Anywhere via URL)

To make your project accessible to anyone worldwide on any device without running a local server, deploy it to one of the following free platforms:

### Option A: GitHub Pages (Recommended)

1. Push your repository to GitHub.
2. Go to your repository on GitHub $\to$ **Settings** $\to$ **Pages**.
3. Under **Build and deployment** $\to$ **Source**, select **GitHub Actions**.
4. In your repository, create a file at `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ] # or master

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. Commit and push:
```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```
6. Your 3D presentation will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`!

---

### Option B: Vercel (1-Click Deployment)

1. Sign up for a free account at [vercel.com](https://vercel.com).
2. Click **Add New Project** $\to$ **Import** your GitHub repository.
3. Framework Preset: **Vite** (detected automatically).
4. Click **Deploy**.
5. Your presentation will be live at `https://your-project.vercel.app` in under 60 seconds.

---

### Option C: Netlify (Drag & Drop)

1. Run `npm run build` locally to generate the `dist` folder.
2. Sign up at [netlify.com](https://netlify.com).
3. Drag and drop the `dist` folder into the Netlify Drop area.
4. Your presentation will be published immediately with a custom Netlify URL.

---

## 6. Device Controls & Gesture Reference

### Mouse Controls (Desktop / Laptop)
| Action | Mouse Gesture |
| :--- | :--- |
| **Orbit Camera** | Left-Click and Drag |
| **Pan Camera** | Right-Click and Drag |
| **Zoom In / Out** | Mouse Scroll Wheel |
| **Snap Camera Views** | Click Orientation Gizmo Cones (Top Right) |

### Touch Controls (Smartphones & Tablets)
| Action | Touch Gesture |
| :--- | :--- |
| **Rotate Scene** | One-Finger Drag |
| **Pan Scene** | Two-Finger Drag |
| **Pinch to Zoom** | Two-Finger Pinch / Spread |
| **Toggle Planes** | Tap any row or switch in the **3D Plane Index** box |

### Keyboard Shortcuts
| Key | Function |
| :--- | :--- |
| <kbd>1</kbd> or <kbd>S</kbd> | Switch to **Simplex Method (Continuous LP)** |
| <kbd>2</kbd> or <kbd>C</kbd> | Switch to **Gomory's Cutting Plane (ILP)** |
| <kbd>→</kbd> or <kbd>Space</kbd> or <kbd>Enter</kbd> | **Next Step** |
| <kbd>←</kbd> or <kbd>Backspace</kbd> | **Previous Step** |
| <kbd>R</kbd> | **Reset to State 0** (Preserves active mode) |
| <kbd>G</kbd> or <kbd>I</kbd> | Toggle **2D Inequality Graph Modal** |
| <kbd>T</kbd> | Top-Down 2D Camera View |
| <kbd>P</kbd> | Default Perspective Camera View |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>M</kbd> | Toggle Procedural Sound Effects (SFX) |
| <kbd>?</kbd> or <kbd>H</kbd> | Open Keyboard Shortcuts Cheat Sheet |
| <kbd>Esc</kbd> | Close Active Modals |

---

## 7. Troubleshooting & FAQs

### Problem: The 3D canvas is black or does not render.
* **Solution:** Ensure your browser has **Hardware Acceleration** and **WebGL** enabled.
  * In Chrome: Go to `chrome://settings/system` and enable *"Use graphics acceleration when available"*.
  * Verify WebGL support by visiting [get.webgl.org](https://get.webgl.org/).

### Problem: Cannot access from mobile phone on the same network.
* **Solution 1:** Make sure you ran `npm run dev -- --host` (not plain `npm run dev`).
* **Solution 2:** Check that your computer and phone are connected to the exact same Wi-Fi router (avoid guest Wi-Fi networks that isolate client devices).
* **Solution 3:** Temporarily allow port `5173` through Windows Defender Firewall or macOS Security Preferences.

### Problem: Assets fail to load after deploying to GitHub Pages.
* **Solution:** Ensure `vite.config.js` contains `base: './'`, which guarantees relative asset resolution regardless of repository subpath naming.
