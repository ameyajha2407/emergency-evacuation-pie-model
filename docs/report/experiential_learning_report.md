# Experiential Learning Academic Project Report
## Emergency Evacuation Planning System — Using the Principle of Inclusion–Exclusion

**Student Name:** Ameya  
**Program:** B.Tech Computer Science and Engineering (AI-Driven DevOps)  
**Institution:** JAIN (Deemed-to-be University)  
**Course:** Experiential Learning — Working Model  
**Date:** September 2026  

---

## 1. Abstract

Emergency evacuation routing systems traditionally face two major challenges: (1) inaccurate headcount estimation due to overlapping spatial zones, and (2) excessive algorithmic complexity that produces routes with too many turns for panicking evacuees to follow. Naive summation of room and corridor populations introduces substantial double-counting (frequently 20% to 35% error), which falsely triggers exit bottleneck alerts and diverts crowds into longer escape paths.

This project introduces a mathematically grounded evacuation planning system combining discrete mathematics and human-centered design. We implement the **Principle of Inclusion–Exclusion (PIE)** to calculate exact, non-overcounted evacuee counts across intersecting rooms and shared corridors. Furthermore, we develop a **UX-First Routing Strategy** grounded in **Hick's Law**, which minimizes direction changes and cognitive hesitation during evacuation. A configurable **Optimality Margin Threshold** ensures that mathematically shorter paths are only selected if their clearance time beats the simpler intuitive path by a significant margin (e.g. >15%). The working model includes an interactive command-center dashboard, real-time SVG floor plan simulation, mathematical proof breakdown, dynamic exit load gauges, and scenario test presets.

---

## 2. Problem Statement & Motivation

During structural hazards (such as chemical leaks, electrical fires, or smoke propagation), traditional static emergency signage fails to adapt to real-time danger zones or crowd congestion. Classroom evacuation models usually either:
1. Skip discrete mathematical modeling entirely and draw arbitrary shortest paths.
2. Optimize strictly for theoretical clearance time (e.g. via Dijkstra’s or max-flow min-cut algorithms) that require complex multi-turn maneuvers, group splitting, or mid-evacuation rerouting.

Under emergency conditions, human behavior does not follow pure mathematical optimality. Panic elevates stress hormones, impairs spatial working memory, and magnifies hesitation at decision junctions. Grounded in **Hick's Law** ($T = b \log_2(n + 1)$), each direction change or branching hallway introduces cognitive latency and increases the probability of crowd panic and stampedes. 

Simultaneously, estimating exit demand requires accurate occupancy figures. Corridors, lobbies, and classroom doorways are not disjoint sets; they overlap physically and functionally. Naive summation $\sum |A_i|$ double-counts individuals co-located in transitional areas, leading to false capacity alarms.

---

## 3. Mathematical Formulation: Principle of Inclusion–Exclusion (PIE)

### 3.1 Theorem Formulation
Let $A_1, A_2, \dots, A_n$ be finite sets representing the occupancies of zones and intersecting corridors. The total number of unique individuals requiring evacuation is given by the cardinality of their union:

$$|\bigcup_{i=1}^n A_i| = \sum_{k=1}^n (-1)^{k-1} \sum_{1 \le i_1 < i_2 < \dots < i_k \le n} |\bigcap_{j=1}^k A_{i_j}|$$

### 3.2 Two-Zone Overlap (Pairwise Correction)
For a room $A$ and adjacent corridor $B$:
$$|A \cup B| = |A| + |B| - |A \cap B|$$

### 3.3 Three-Zone Overlap (Pairwise and 3-Way Correction)
For Room $A$, Room $B$, and shared corridor spine $C$:
$$|A \cup B \cup C| = (|A| + |B| + |C|) - (|A \cap B| + |A \cap C| + |B \cap C|) + |A \cap B \cap C|$$

- **Level 1 Terms ($k=1$):** Individual headcounts. Naive summation causes overcounting.
- **Level 2 Terms ($k=2$):** Pairwise intersections subtracted to eliminate double-counted individuals.
- **Level 3 Terms ($k=3$):** 3-way intersection added back because individuals standing in the triple intersection were subtracted three times during pairwise correction.

### 3.4 Numerical Demonstration from System Simulation
Consider the following verified test scenario:
- Computer Vision Lab $A$: $|A| = 50$
- AI & Robotics Arena $B$: $|B| = 40$
- Central Spine Corridor $C$: $|C| = 35$
- Overlaps: $|A \cap B| = 15$, $|A \cap C| = 10$, $|B \cap C| = 12$, $|A \cap B \cap C| = 5$

**Naive Sum:**
$$\text{Raw Sum} = 50 + 40 + 35 = 125 \text{ people}$$

**PIE Corrected Sum:**
$$|A \cup B \cup C| = 125 - (15 + 10 + 12) + 5 = 125 - 37 + 5 = 93 \text{ people}$$

$$\text{Overcounting Error Prevented} = 125 - 93 = 32 \text{ evacuees } (25.6\% \text{ false load averted})$$

---

## 4. Algorithmic Routing Strategy: UX-First vs. Pure Optimal

### 4.1 Hick's Law & Cognitive Ergonomics
Hick's Law models decision reaction time $T_{\text{decision}}$:
$$T_{\text{decision}} = b \cdot \log_2(n + 1)$$
where $n$ is the number of alternative movement choices and $b$ is an empirical constant. Under emergency panic, each turn or non-intuitive hallway bend introduces a substantial hesitation penalty ($\approx 2.5 - 3.5$ seconds per turn for a crowd).

### 4.2 Route Formulations
1. **Pure Optimal Strategy ($R_{\text{optimal}}$):**
   $$T_{\text{optimal}} = \frac{d}{v_{\text{walk}}} + \frac{N_{\text{evacuees}}}{\text{FlowRate}_{\text{exit}}}$$
   Minimizes physical meters $d$, but may select a 3- or 4-turn path through narrow secondary service passages.

2. **UX-First Strategy ($R_{\text{UX}}$):**
   $$T_{\text{UX, realistic}} = \frac{d}{v_{\text{walk}}} + (N_{\text{turns}} \times T_{\text{turn\_penalty}}) + \frac{N_{\text{evacuees}}}{\text{FlowRate}_{\text{exit}}}$$
   Prioritizes straight sightlines, minimal direction changes ($0$ or $1$ turn), and single unambiguous instructions.

### 4.3 The Optimality Margin Threshold Rule
Let $\tau$ be the configured optimality threshold percentage (default 15%, dynamic range 0%–50%).
$$\Delta\% = \frac{T_{\text{UX}} - T_{\text{optimal}}}{T_{\text{UX}}} \times 100$$

- **If $\Delta\% > \tau$:** The optimal path is significantly faster on paper, overriding the simpler route.
- **If $\Delta\% \le \tau$:** The UX-First route is recommended, eliminating cognitive confusion and hesitation.

---

## 5. System Architecture & Implementation

The application is structured into modular layers adhering to DevOps and software engineering principles:

```
├── backend/
│   ├── engine/
│   │   ├── pie_calculator.js / .py    # Generalized PIE discrete math engine
│   │   ├── route_optimizer.js / .py   # Hick's Law & threshold routing engine
│   ├── models/building_model.js       # Graph state manager and scenario coordinator
│   ├── data/default_layout.json       # Architectural layout, overlaps, exits, coordinates
│   ├── routes/api.js                  # REST endpoints for live interaction
│   ├── server.js                      # High-performance server
│   └── tests/test_pie.js              # Automated mathematical verification suite
└── frontend/
    ├── index.html                     # Semantic HTML5 command center
    ├── styles/ (main, dashboard, components.css) # Custom design system
    └── src/
        ├── components/FloorPlanView.js       # Interactive SVG floor plan with particle trails
        ├── components/OccupancyComparison.js # PIE math proof & Venn visualizer
        ├── components/RoutePanel.js          # Side-by-side strategy comparison
        ├── components/ExitLoadMeter.js       # Dynamic exit flow & capacity bars
        └── admin/ (ScenarioPresets, ThresholdSlider, HazardTrigger, ZoneEditor)
```

---

## 6. Experimental Results & Verification

Three evaluation scenarios were executed and verified:

| Scenario | Hazard Zone | Origin | Raw Sum | PIE Count | Overcount Prevented | Chosen Route | Justification |
|---|---|---|---|---|---|---|---|
| **1. Corridor Smoke (PIE Test)** | Central Corridor C | Lab A | 200 | 156 | 44 (22.0%) | UX-First (West Door) | 1 turn direct exit; avoids congested spine |
| **2. Fire & Exit Load Diversion** | Lab A | Arena B | 147 | 115 | 32 (21.7%) | UX-First (West Exit) | Evacuates clear sector; load balanced |
| **3. Hick's Law Threshold Test** | Classroom D | Auditorium E | 170 | 126 | 44 (25.9%) | UX-First ($\tau=15\%$) <br> Optimal ($\tau \le 7\%$) | Dynamic threshold demonstration |

All unit tests in `backend/tests/test_pie.js` passed with 100% mathematical precision.

---

## 7. Conclusion & Future Work

This project demonstrates how a foundational discrete mathematics theorem—the **Principle of Inclusion–Exclusion**—solves a tangible safety crisis in emergency management. By marrying mathematical rigor with cognitive ergonomics (Hick's Law), the system produces evacuation recommendations that are both numerically sound and realistically actionable under stress.

**Future Scope:**
1. Integration with IoT BLE beacons and vision-based crowd sensors for automated real-time occupancy feeds.
2. Multi-floor extension modeling vertical egress delays and stairwell flow bottlenecks.
3. Mobile PWA interface providing personalized turn-by-turn vibrating alerts for evacuees.
