# Product Requirements Document
### Emergency Evacuation Planning System — using the Principle of Inclusion–Exclusion

| | |
|---|---|
| **Project type** | Experiential Learning — working model |
| **Prepared for** | Ameya — B.Tech CSE (AI-Driven DevOps), JAIN (Deemed-to-be University) |
| **Document version** | v1.1 |

---

## 1. Overview

The project demonstrates how a simple counting rule from discrete mathematics — the **Principle of Inclusion–Exclusion (PIE)** — can solve a real safety problem: figuring out exactly how many people actually need to evacuate through which exits when danger zones, corridors, and rooms overlap. Naively adding up "people per zone" double-counts anyone standing in more than one zone at once (e.g. a shared corridor). PIE corrects for that, giving an accurate occupancy figure that the evacuation routing can be built on.

## 2. Problem Statement

Existing evacuation signage is static — it points the same direction regardless of where a hazard actually is or how many people are stuck behind it. Most classroom-level "evacuation planning" projects either (a) skip the math and just draw arrows on a floor plan, or (b) chase pure algorithmic optimality (e.g. shortest path) that is mathematically best but confusing for a panicking person to actually follow. This project sits in between: mathematically justified *and* usable under stress.

## 3. Goals & Objectives

| Goal | Success looks like |
|---|---|
| Demonstrate Inclusion–Exclusion in a real-world counting problem | Dashboard shows raw sum vs. corrected (PIE) occupancy for overlapping zones, and the difference is visibly explained |
| Recommend evacuation routes, not just occupancy counts | Given a hazard input, system outputs a ranked list of exits/routes with load per route |
| Make it explainable to a non-technical evaluator | A judge with no CS background can watch the demo and understand what's happening within ~2 minutes |
| Prioritize usability of the final route shown to evacuees over raw optimality | See Section 4 — UX-first strategy |

## 4. Strategy: "Best" Route vs. Most Usable Route

A core design decision: **the system does not always output the mathematically fastest evacuation route — it outputs the best route that a stressed person can actually follow correctly.**

| Pure "best" strategy (optimal) | UX-first strategy (chosen for this project) |
|---|---|
| Minimizes total evacuation time using shortest-path / max-flow across all exits, even if that means splitting a group, routing through multiple turns, or reassigning people mid-evacuation. | Picks the route that is *close to optimal* but favors: fewest direction changes, one instruction per person, and no re-routing once movement starts. |
| Can shave a few seconds off total clearance time on paper. | Reduces real-world hesitation and wrong turns, which usually costs far more time than the few seconds saved by the "optimal" route (grounded in Hick's Law — more decision points under stress means slower, less accurate decisions). |

**Rule of thumb used in the algorithm:** only accept a more "optimal" route over a simpler one if it's faster by more than a set threshold (e.g. 15%). Otherwise, default to the simpler route. This threshold should be a configurable value in the admin panel, not hardcoded, so you can show judges the trade-off live by adjusting it.

## 5. How Inclusion–Exclusion Is Actually Used

For overlapping zones A, B, C (e.g. Room A, Room B, and a shared corridor C that overlaps both):

```
Total people needing evacuation
  = |A| + |B| + |C|
  − |A∩B| − |A∩C| − |B∩C|
  + |A∩B∩C|
```

Without the correction terms, anyone standing in an overlap (like the shared corridor) gets counted twice, which would make the system over-allocate exit capacity and misjudge which exit is actually most congested. This same formula is reused to calculate real exit load once a route is assigned, so no evacuee is double-planned for two exits at once.

## 6. Users & Roles

- **Admin/Operator** — configures the building layout, zones, exits, manual occupancy inputs; runs simulations; adjusts the optimality-vs-simplicity threshold.
- **Evaluator/Viewer** — watches the live dashboard during the demo; read-only.
- **Simulated Evacuee (in-model)** — not a real user, but represented as data points/occupancy counts feeding the model.

## 7. Core Features

### 7.1 Simulation Engine
- Define zones, exits, and their overlaps (graph of nodes/edges)
- Set occupancy per zone (manual entry or randomized for demo)
- Trigger a hazard event in a chosen zone
- Compute true affected occupancy via PIE
- Generate ranked route recommendations (optimal vs. UX-first, side by side)

### 7.2 Dashboard
- Floor-plan style view of zones, colored by risk level
- Side-by-side comparison: "raw count" vs "PIE-corrected count"
- Recommended route panel with reasoning shown in plain language
- Exit load meter (how many people routed through each exit)

### 7.3 Admin Panel
- CRUD for zones, exits, overlaps, and capacity limits
- Slider to set the "optimality threshold" described in Section 4
- Manual hazard trigger (pick a zone, click "simulate fire/hazard")
- Reset/replay controls for repeatable demos
- Simple activity log (what was triggered, when, what route was recommended)

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend / Dashboard | React + plain CSS (or plain HTML/CSS/JS if you want zero build tooling for the demo laptop) | Easy to demo offline, no complex setup on exhibition day |
| Visualization | SVG or Canvas for the floor-plan view; Chart.js for load/occupancy bars | Lightweight, no heavy dependencies |
| Backend | Python (Flask or FastAPI) | PIE calculations and route logic are just math — Python keeps this readable for your report/viva |
| Database | SQLite | Zero-config, file-based, fine for a demo, easy to reset between runs |

## 9. Folder Structure

```
evacuation-planning-model/
├── backend/
│   ├── app.py                  # Flask/FastAPI entry point
│   ├── engine/
│   │   ├── pie_calculator.py   # Inclusion-Exclusion logic
│   │   ├── route_optimizer.py  # optimal vs UX-first route logic
│   │   └── threshold_config.py
│   ├── models/                 # DB models (Zone, Exit, Overlap, Incident, Route)
│   ├── routes/                 # API endpoints
│   └── database.db
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FloorPlanView/
│   │   │   ├── OccupancyComparison/
│   │   │   ├── RoutePanel/
│   │   │   └── ExitLoadMeter/
│   │   ├── admin/
│   │   │   ├── ZoneEditor/
│   │   │   ├── ThresholdSlider/
│   │   │   └── HazardTrigger/
│   │   ├── api/                # calls to backend
│   │   └── App.jsx
│   └── public/
│
├── docs/
│   ├── PRD.md                  # this document
│   ├── report/                 # for the experiential learning writeup
│   └── viva_notes.md
│
└── README.md
```

## 10. Data Model

| Entity | Key Fields | Notes |
|---|---|---|
| **Zone** | id, name, capacity, current_occupancy, risk_level | Rooms, corridors, stairwells |
| **Overlap** | id, zone_ids[], shared_occupancy | Represents an intersection between 2+ zones (e.g. shared corridor) — this is what PIE corrects for |
| **Exit** | id, name, max_flow_rate, current_load, status | Exits defined in the model |
| **Route** | id, incident_id, zone_sequence[], exit_id, type (optimal / ux-first), estimated_time | type field lets the dashboard show both side by side |
| **Incident** | id, zone_id, triggered_at, severity, resolved_at | A simulated hazard event |
| **ThresholdConfig** | id, optimality_margin_percent | The Section 4 "how much faster must optimal be to override simple" setting |
| **User** | id, name, role (admin/viewer) | For login on the admin panel, can be minimal for a demo |
| **ActivityLog** | id, action, timestamp, related_incident_id | For the admin panel's activity log |

## 11. High-Level Flow

```
Admin triggers hazard in Zone A (via panel)
        │
        ▼
Backend: pie_calculator computes true affected occupancy
   (corrects for overlaps with adjacent zones/corridors)
        │
        ▼
Backend: route_optimizer generates 2 candidate routes
   → "optimal" (fastest on paper)
   → "ux-first" (fewest decisions, default output)
        │
        ▼
Dashboard updates: occupancy comparison,
route panel, exit load meters
```

## 12. Success Metrics (for evaluation/report)

- Correct PIE calculation verified against manual calculation for at least 3 test overlap scenarios
- Dashboard clearly shows the gap between raw sum and corrected occupancy
- A person unfamiliar with the project can explain, after watching one demo run, why the "UX-first" route was chosen over the "optimal" one

## 13. Risks & Assumptions

- **Scope creep:** it's tempting to model an entire multi-floor building; start with a single floor with a handful of overlapping zones, then expand if time allows.
- **Assumption:** occupancy figures are manually entered or randomized for the demo rather than pulled from live sensors, since this is a software/algorithmic demonstration.

## 14. Future Scope (optional, if you want to mention it in the report)

- Real sensor input (motion/occupancy sensors) instead of manually entered occupancy
- Mobile app view for an "evacuee" role showing just their recommended exit
- Multi-floor support with vertical overlap (stairwells) in the PIE calculation
