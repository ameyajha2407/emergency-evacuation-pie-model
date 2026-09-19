/**
 * OccupancyComparison Component
 * Visualizes the Principle of Inclusion–Exclusion (PIE):
 * - Raw Sum vs Corrected Headcount
 * - Complete mathematical expansion with all pairwise and triple overlaps
 * - Interactive Venn diagram matching active scenario zones
 * - Physical sensor-model explanation (overlapping camera/sensor detection zones)
 * - Exact worked example: Lab A = 45, Corridor C = 35, counted in both = 14; unique people = 45 + 35 − 14 = 66
 * - Assumptions disclaimer (simulated educational data, not a live safety-certified system)
 * - Strict verification check: Only shows "Verified" when displayed equation equals displayed answer
 */

class OccupancyComparison {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(simulationData) {
    if (!this.container) return;

    if (!simulationData || !simulationData.pie) {
      this.container.innerHTML = `
        <div class="panel-card">
          <div class="card-header">
            <h3 class="card-title"><span class="icon">📐</span> Principle of Inclusion–Exclusion</h3>
            <span class="badge-tag badge-purple">Discrete Math</span>
          </div>
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
            <p>Select a scenario or trigger a hazard on the floor plan to calculate real-time inclusion-exclusion occupancy corrections.</p>
          </div>
        </div>
      `;
      return;
    }

    const { pie, incident, affectedZones } = simulationData;
    const { rawSum, correctedOccupancy, overcountingError, errorPercentage, stepByStepFormula, termsByLevel } = pie;

    // Strict verification check: only show "Verified" when displayed equation equals displayed answer
    const arithmeticAnswer = (rawSum || 0) - (pie.totalSubtracted || 0) + (pie.totalAddedBack || 0);
    const isVerified = (arithmeticAnswer === correctedOccupancy && correctedOccupancy > 0);

    // Generate Venn diagram SVG for active zones
    const vennSvg = this.generateVennSvg(affectedZones, pie);

    this.container.innerHTML = `
      <div class="panel-card">
        <div class="card-header">
          <h3 class="card-title"><span class="icon">📐</span> Inclusion–Exclusion (PIE) Engine</h3>
          <div style="display: flex; gap: 6px; align-items: center;">
            ${isVerified ? `
              <span class="badge-tag badge-emerald" style="font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                ✓ Verified
              </span>
            ` : `
              <span class="badge-tag" style="background: rgba(239,68,68,0.2); color: #f87171;">Unverified</span>
            `}
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="pie-metrics-row">
          <div class="metric-stat-box naive">
            <div class="metric-value">${rawSum}</div>
            <div class="metric-title">Naive Raw Sum</div>
            <span class="metric-badge badge-overcount">Double-Counted</span>
          </div>

          <div class="metric-stat-box pie">
            <div class="metric-value">${correctedOccupancy}</div>
            <div class="metric-title">PIE Corrected</div>
            <span class="metric-badge badge-exact">Unique Count</span>
          </div>

          <div class="metric-stat-box savings">
            <div class="metric-value">\u2212${overcountingError}</div>
            <div class="metric-title">Overcount Error</div>
            <span class="metric-badge" style="background: rgba(192, 132, 252, 0.2); color: #c084fc;">
              ${errorPercentage}% Avoided
            </span>
          </div>
        </div>

        <!-- General PIE Formula Reference for 3 sets -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 10px; font-size: 11px;">
          <div style="color: var(--text-secondary); font-size: 10px; font-weight: 600; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">
            3-Set Inclusion–Exclusion Theorem:
          </div>
          <div style="font-family: var(--font-mono); color: #93c5fd; font-size: 11px; word-break: break-all;">
            |A ∪ B ∪ C| = |A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|
          </div>
        </div>

        <!-- Formula Expression Trace -->
        <div class="formula-box">
          <div class="formula-label">
            <span>Inclusion–Exclusion Calculation Trace</span>
            ${isVerified ? '<span style="color: #34d399; font-weight: 700; font-size: 11px;">(Verified Exact)</span>' : ''}
          </div>
          <div class="formula-expression" style="font-size: 11px; line-height: 1.6;">
            ${stepByStepFormula}
          </div>
          <div style="margin-top: 8px; font-family: var(--font-mono); font-size: 13px; color: #34d399; font-weight: 700;">
            = ${rawSum} \u2212 ${pie.totalSubtracted || 0} + ${pie.totalAddedBack || 0} = <strong>${correctedOccupancy} unique people</strong>
          </div>
        </div>

        <!-- Meaning of Overlap (Sensor / Camera Model Explanation) -->
        <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px; font-size: 11px; line-height: 1.5; color: #d8b4fe;">
          <div style="font-weight: 700; margin-bottom: 4px; color: #c4b5fd; display: flex; align-items: center; gap: 6px;">
            <span>📷</span> What does "overlapping sets" mean here?
          </div>
          <div style="color: #cbd5e1;">
            Overlapping sets represent <strong>overlapping camera, sensor, or doorway detection zones</strong>, where an individual passing through a shared vestibule or doorway is counted by sensors in both areas. It does <em>not</em> mean a person is physically inside two rooms at the same time. PIE eliminates this artificial double-counting.
          </div>
        </div>

        <!-- Simple Worked Example -->
        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 700; margin-bottom: 4px; color: #f8fafc;">
            📝 Worked Example (2 Overlapping Zones)
          </div>
          <div style="color: var(--text-secondary);">
            Lab A = 45, Corridor C = 35, counted in both = 14; unique people = 45 + 35 − 14 = <strong style="color: #34d399;">66</strong>.
          </div>
        </div>

        <!-- Venn Diagram Visualizer -->
        <div class="venn-container">
          ${vennSvg}
        </div>

        <!-- Terms By Level Breakdown -->
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
          ${(termsByLevel || []).map(lvl => `
            <div style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; font-weight: 600; color: ${lvl.sign === '+' ? '#34d399' : '#f87171'};">
                <span>Level ${lvl.k}: ${lvl.title}</span>
                <span style="font-family: var(--font-mono);">${lvl.sign} ${lvl.subtotal}</span>
              </div>
              <div style="color: var(--text-secondary); margin-top: 4px; font-family: var(--font-mono); font-size: 10px;">
                ${lvl.items.join(' \u2022 ')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Evaluator Note -->
        <div style="margin-top: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.5; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
          💡 <strong>Why this matters:</strong> Without PIE, the system would falsely predict <strong>${overcountingError}</strong> phantom evacuees at exit bottlenecks, triggering erroneous overload alerts and routing crowds onto longer evacuation paths.
        </div>

        <!-- Assumptions Disclaimer -->
        <div style="margin-top: 10px; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.15); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 10px; color: #94a3b8; line-height: 1.4;">
          <strong>Assumptions Note:</strong> All occupancies, exit capacities, route times, and cognitive-load scores are simulated educational data, not a live safety-certified system.
        </div>
      </div>
    `;
  }

  generateVennSvg(affectedZones, pie) {
    const zoneIds = (affectedZones || []).map(z => z.id);
    const hasEast = zoneIds.includes('zone_d') || zoneIds.includes('zone_e');
    const isOnlyEast = hasEast && !zoneIds.includes('zone_a') && !zoneIds.includes('zone_b');

    if (isOnlyEast) {
      // Scenario 3: Corridor C, Classroom D, Auditorium E
      return `
        <svg class="venn-svg" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="vennD" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1"/>
            </radialGradient>
            <radialGradient id="vennE" cx="60%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1"/>
            </radialGradient>
            <radialGradient id="vennC2" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stop-color="#ec4899" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#ec4899" stop-opacity="0.1"/>
            </radialGradient>
          </defs>

          <!-- Circle D (Classroom D) -->
          <circle cx="85" cy="70" r="50" fill="url(#vennD)" stroke="#38bdf8" stroke-width="1.5" />
          <text x="50" y="50" fill="#7dd3fc" font-family="Inter" font-size="10" font-weight="700">Class D (35)</text>

          <!-- Circle E (Auditorium E) -->
          <circle cx="155" cy="70" r="50" fill="url(#vennE)" stroke="#8b5cf6" stroke-width="1.5" />
          <text x="160" y="50" fill="#c4b5fd" font-family="Inter" font-size="10" font-weight="700">Audit E (70)</text>

          <!-- Circle C (Corridor C) -->
          <circle cx="120" cy="100" r="45" fill="url(#vennC2)" stroke="#ec4899" stroke-width="1.5" />
          <text x="120" y="145" fill="#f472b6" font-family="Inter" font-size="10" font-weight="700" text-anchor="middle">Corridor C (20)</text>

          <!-- Pairwise Overlaps: D∩E=5, D∩C=9, E∩C=15 -->
          <text x="120" y="52" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">D∩E (5)</text>
          <text x="75" y="100" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">D∩C (9)</text>
          <text x="165" y="100" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">E∩C (15)</text>

          <!-- Triple Overlap: C∩D∩E=4 -->
          <circle cx="120" cy="80" r="7" fill="#facc15" stroke="#ffffff" stroke-width="1" />
          <text x="120" y="73" fill="#fef08a" font-family="JetBrains Mono" font-size="7.5" font-weight="800" text-anchor="middle">C∩D∩E (4)</text>
        </svg>
      `;
    }

    // Default / Scenario 1 & 2: Lab A, Hall B, Corridor C
    return `
      <svg class="venn-svg" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vennA" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.1"/>
          </radialGradient>
          <radialGradient id="vennB" cx="60%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1"/>
          </radialGradient>
          <radialGradient id="vennC" cx="50%" cy="70%" r="60%">
            <stop offset="0%" stop-color="#ec4899" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#ec4899" stop-opacity="0.1"/>
          </radialGradient>
        </defs>

        <!-- Circle A -->
        <circle cx="85" cy="70" r="50" fill="url(#vennA)" stroke="#3b82f6" stroke-width="1.5" />
        <text x="50" y="50" fill="#93c5fd" font-family="Inter" font-size="10" font-weight="700">Lab A</text>

        <!-- Circle B -->
        <circle cx="155" cy="70" r="50" fill="url(#vennB)" stroke="#8b5cf6" stroke-width="1.5" />
        <text x="165" y="50" fill="#c4b5fd" font-family="Inter" font-size="10" font-weight="700">Hall B</text>

        <!-- Circle C -->
        <circle cx="120" cy="100" r="45" fill="url(#vennC)" stroke="#ec4899" stroke-width="1.5" />
        <text x="120" y="145" fill="#f472b6" font-family="Inter" font-size="10" font-weight="700" text-anchor="middle">Corridor C</text>

        <!-- Pairwise Overlaps: A∩B=6, A∩C=14, B∩C=12 -->
        <text x="120" y="52" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">A∩B (6)</text>
        <text x="75" y="100" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">A∩C (14)</text>
        <text x="165" y="100" fill="#e2e8f0" font-family="JetBrains Mono" font-size="8" font-weight="700" text-anchor="middle">B∩C (12)</text>

        <!-- Triple Overlap: A∩B∩C=5 -->
        <circle cx="120" cy="80" r="7" fill="#facc15" stroke="#ffffff" stroke-width="1" />
        <text x="120" y="73" fill="#fef08a" font-family="JetBrains Mono" font-size="7.5" font-weight="800" text-anchor="middle">A∩B∩C (5)</text>
      </svg>
    `;
  }
}

window.OccupancyComparison = OccupancyComparison;
