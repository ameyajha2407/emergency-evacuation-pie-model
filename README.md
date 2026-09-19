# Emergency Evacuation Planning System — Using the Principle of Inclusion–Exclusion

**Experiential Learning Project**  
**Prepared for:** Ameya — B.Tech CSE (AI-Driven DevOps), JAIN (Deemed-to-be University)  
**Version:** 1.0  

---

## 📌 Project Overview

Traditional evacuation systems either ignore overlapping room/corridor headcounts or calculate theoretical shortest paths with complex, multi-turn maneuvers that panicking crowds cannot follow. 

This working model demonstrates two core engineering and mathematical principles:
1. **The Principle of Inclusion–Exclusion (PIE)** from discrete mathematics: Eliminates the double-counting of evacuees co-located in shared corridors, transitional foyers, and doorway thresholds.
2. **UX-First Routing grounded in Hick's Law**: Prioritizes routes with minimal direction changes and clear lines of sight over mathematically optimal shortcuts, unless the shortcut surpasses a configurable **Optimality Margin Threshold** (e.g. >15%).

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js** (v18+ or v26+) and **npm**

### Run Locally
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run unit tests to verify mathematical correctness
npm test

# 3. Start the live simulation server
npm start
```
Then open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🧮 How Inclusion–Exclusion (PIE) is Used

For overlapping zones $A$ (Lab A), $B$ (Hall B), and $C$ (Central Corridor):

$$|A \cup B \cup C| = (|A| + |B| + |C|) - (|A \cap B| + |A \cap C| + |B \cap C|) + |A \cap B \cap C|$$

- **Naive Sum:** Simply adding $|A| + |B| + |C|$ overcounts shared corridor occupants by 20% to 35%.
- **PIE Correction:** Subtracts pairwise shared spaces and adds back triple intersections.
- **Safety Impact:** Prevents emergency dispatchers from falsely assuming exits are congested, eliminating dangerous crowd diversions.

---

## 🧭 UX-First Routing & Hick's Law

Under emergency panic, human cognitive latency follows **Hick's Law**:
$$T_{\text{decision}} = b \cdot \log_2(n + 1)$$
Each direction change or branching corridor increases crowd hesitation, wrong turns, and stampede risk.

- **UX-First Strategy:** Favors single-turn, intuitive routes directly toward emergency exits.
- **Pure Optimal Strategy:** Minimizes paper distance, but may zig-zag through 3–4 turns in narrow service corridors.
- **Decision Rule:** The system recommends UX-First unless:
  $$\frac{T_{\text{UX}} - T_{\text{Optimal}}}{T_{\text{UX}}} > \text{Threshold}\%$$
  You can dynamically drag the **Optimality Threshold Slider** on the dashboard (0% to 50%) to demonstrate live route switching to examiners!

---

## 📂 Project Structure

```
emergency evacuation planning/
├── backend/
│   ├── app.js / server.js       # Express server & static host
│   ├── engine/
│   │   ├── pie_calculator.js    # Inclusion-Exclusion engine (JavaScript)
│   │   ├── route_optimizer.js   # Hick's Law & threshold router (JavaScript)
│   │   ├── pie_calculator.py    # Python reference implementation for viva
│   │   └── route_optimizer.py   # Python reference implementation for viva
│   ├── models/building_model.js # State and scenario coordinator
│   ├── data/default_layout.json # Building layout, overlaps, exits, coordinates
│   ├── routes/api.js            # REST API endpoints
│   └── tests/test_pie.js        # Mathematical verification test suite
├── frontend/
│   ├── index.html               # Main dashboard UI
│   ├── styles/                  # Design system & dark-mode command center CSS
│   └── src/
│       ├── components/          # SVG Floor Plan, PIE Math, Route Panel, Exit Meters
│       ├── admin/               # Presets, Threshold Slider, Hazard Controls, Zone Editor
│       └── api/                 # Backend API client
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   ├── report/
│   │   └── experiential_learning_report.md # Academic Project Report
│   └── viva_notes.md            # 2-minute pitch & top 10 viva Q&As
└── package.json
```

---

## 🎓 Viva & Presentation Checklist

1. Review [viva_notes.md](file:///Users/ameyajha/Desktop/emergency%20evacuation%20planning/docs/viva_notes.md) for the 2-minute examiner pitch script.
2. Read [experiential_learning_report.md](file:///Users/ameyajha/Desktop/emergency%20evacuation%20planning/docs/report/experiential_learning_report.md) for the full academic write-up.
3. Test all 3 evaluator scenarios live on the dashboard during presentation.
