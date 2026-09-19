# Viva & Demonstration Cheatsheet
### Emergency Evacuation Planning System — Using the Principle of Inclusion–Exclusion
**Candidate:** Ameya | B.Tech CSE (AI-Driven DevOps), JAIN (Deemed-to-be University)

---

## ⏱️ 2-Minute Pitch (Spoken Script for Evaluator)

> *"Good morning / afternoon professors. My project addresses a critical flaw in traditional emergency evacuation planning: **inaccurate occupancy counting and overly complex routing.**
>
> In real buildings, rooms, transition foyers, and corridors physically overlap. Traditional systems simply add up room populations naively. If Room A has 50 people, Room B has 40, and the corridor has 35, a naive sum says 125 people. But people co-located in shared doorways and corridor intersections get counted two or three times! In our model, applying the **Principle of Inclusion–Exclusion (PIE)** proves the true count is actually 93. Without PIE, exit safety systems over-allocate 32 phantom evacuees, triggering false bottleneck alarms and directing panicking crowds into longer, dangerous detours.
>
> Second, most evacuation algorithms hunt for the shortest theoretical path on paper, even if it requires 3 or 4 sharp turns through secondary service passages. Grounded in **Hick's Law**, our system adopts a **UX-First Routing Strategy**: we favor straight lines of sight and 1-turn routes that a stressed person can follow without hesitation. We only accept a more complex route if it beats the simple route by more than our configurable **Optimality Margin Threshold** (e.g. 15%).
>
> On our live dashboard, you can see the real-time floor plan, the mathematical proof trace, dynamic exit load meters, and adjust the threshold slider live to see the routing decision switch in real time."*

---

## 🎯 30-Second Live Demo Flow

1. **Open the Dashboard**: Point out the architectural floor plan and the real-time active monitoring status.
2. **Click "Scenario 1: Central Spine Smoke (PIE Test)"**:
   - Show the **Inclusion–Exclusion Panel**: Highlight the **Naive Raw Sum (200)** vs **PIE True Count (156)**.
   - Show that **44 double-counted individuals (22.0% error)** were prevented from falsely overloading the exits.
3. **Show the Route Panel**:
   - Point to the **UX-First Route (West Emergency Fire Door)** with 1 turn and low cognitive load (3.3/10).
   - Point out that the 3-turn shortcut was rejected because it only saved 7.8%, which does not meet the 15% threshold.
4. **Move the Optimality Threshold Slider down to 5%**:
   - Watch the badge instantly switch from **UX-First** to **Optimal Route (Override)**!
   - Explain: *"When the operator drops the threshold below 7%, the system determines the time savings now justifies the extra turns."*

---

## ❓ Top 10 Viva Questions & Model Answers

### Q1: What is the Principle of Inclusion–Exclusion (PIE)?
**Answer:** It is a counting technique in discrete mathematics to compute the size of the union of multiple sets by summing the sizes of individual sets, subtracting pairwise intersections to remove double counting, adding back 3-way intersections to correct over-subtraction, and alternating signs up to $n$ sets:
$$|\bigcup_{i=1}^n A_i| = \sum_{k=1}^n (-1)^{k-1} \sum_{1 \le i_1 < \dots < i_k \le n} |\bigcap_{j=1}^k A_{i_j}|$$

### Q2: Why is PIE necessary in a spatial evacuation model?
**Answer:** Rooms and corridors are not mutually exclusive. A student standing in a doorway or transit corridor belongs to both the room zone and the corridor zone. Without PIE, naive summation overestimates crowd size by 20% to 35%, causing false congestion alerts at exits.

### Q3: What is Hick's Law and how is it used here?
**Answer:** Hick's Law ($T = b \log_2(n + 1)$) states that human decision latency increases logarithmically with the number of choices. In high-panic emergencies, every intersection or turn forces evacuees to process directional choices, causing crowd hesitation and potential stampedes. Our UX-First algorithm penalizes paths with multiple turns.

### Q4: How does your system choose between the UX-First route and the Optimal route?
**Answer:** We calculate the theoretical time difference: $\Delta\% = \frac{T_{\text{UX}} - T_{\text{Optimal}}}{T_{\text{UX}}} \times 100$. If $\Delta\%$ exceeds the operator's configured threshold (e.g. 15%), the Optimal route overrides. Otherwise, the simpler UX-First route is chosen.

### Q5: Why not use Dijkstra's shortest path algorithm directly?
**Answer:** Pure Dijkstra only minimizes physical edge weights (distance). It does not account for cognitive turn penalties, visual line of sight, or the human panic factor. A path that is 2 meters shorter but has 3 sharp turns is practically inferior to a straight corridor route.

### Q6: How does PIE affect the Exit Load Meters?
**Answer:** Exit queue time is calculated as $\text{Queue Time} = \frac{\text{Assigned Evacuees}}{\text{Exit Flow Rate}}$. If the assigned evacuee count is inflated by 30% due to double counting, the estimated queue time is artificially inflated, causing the system to misjudge which exit is the real bottleneck.

### Q7: What are the inputs and outputs of your simulation engine?
**Answer:**
- **Inputs:** Building graph (zones, overlaps, exits, capacities), hazard location and severity, origin zone, and optimality threshold.
- **Outputs:** PIE-corrected affected headcount, mathematical proof trace, ranked route candidates (UX-First vs Optimal), exit load meters, and clear evacuee broadcast instructions.

### Q8: What if all exits are blocked or compromised?
**Answer:** The route optimizer filters out exits located inside the hazard zone or marked as blocked. If all exits are compromised, the system issues a critical alarm stating no safe egress path exists and logs an emergency containment dispatch event.

### Q9: What technologies did you use to build this?
**Answer:** 
- **Core Engine:** Node.js & Python reference modules implementing generalized PIE combinations and graph route evaluation.
- **Frontend & Visualization:** Modern HTML5, vanilla CSS3 design system with cyber-safety command-center styling, interactive SVG floor plan with animated particle flows, and RESTful API integration.

### Q10: How could this system be extended for DevOps / AI deployment in the real world?
**Answer:** In an AI-Driven DevOps pipeline, this system can ingest live streaming computer vision occupancy feeds (via RTSP/MQTT), containerized in Docker, and deployed across edge gateways with automated CI/CD canary deployments for emergency infrastructure updates.
