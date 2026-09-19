/**
 * FloorPlanView Component
 * Renders an architectural SVG floor plan with real-time hazard visuals,
 * overlap intersection areas, exit indicators, and animated evacuation routes.
 */

class FloorPlanView {
  constructor(containerId, onZoneClick) {
    this.container = document.getElementById(containerId);
    this.onZoneClick = onZoneClick;
  }

  render(model) {
    if (!this.container || !model) return;

    const { zones, exits, overlaps, activeHazard, activeOriginZoneId, latestSimulation } = model;
    const recRoute = latestSimulation?.routing?.recommendedRoute;
    const optRoute = latestSimulation?.routing?.optimalRoute;
    const selectedStrategy = latestSimulation?.routing?.selectedStrategy;

    // Helper to format points for SVG polyline/path
    const formatPoints = (pts) => pts.map(p => `${p[0]},${p[1]}`).join(' ');

    let svgHtml = `
      <svg class="floor-plan-svg" viewBox="0 0 1020 660" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Grid Pattern -->
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          </pattern>

          <!-- Hazard Fire Glow -->
          <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#f97316" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
          </radialGradient>

          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <!-- Marker Arrow for UX Route -->
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <!-- Marker Arrow for Optimal Route -->
          <marker id="arrowCyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
          </marker>
        </defs>

        <!-- Floor Background Grid -->
        <rect width="1020" height="660" fill="#0b111e" />
        <rect width="1020" height="660" fill="url(#grid)" />

        <!-- Architectural Boundary Walls -->
        <rect x="40" y="40" width="940" height="570" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4" rx="8" />

        <!-- 1. CORRIDOR SPINE (ZONE C) -->
        <g id="zone-corridor-c" class="zone-group" data-zone-id="zone_c">
          <rect x="340" y="70" width="320" height="510" rx="6" 
                class="svg-corridor-rect ${activeHazard?.zoneId === 'zone_c' ? 'svg-zone-hazard' : ''}" />
          <!-- Corridor Label -->
          <text x="500" y="325" fill="rgba(255,255,255,0.6)" font-family="Inter, sans-serif" font-size="13" font-weight="600" text-anchor="middle" letter-spacing="1">
            CENTRAL SPINE CORRIDOR (C)
          </text>
          <text x="500" y="345" fill="rgba(148,163,184,0.7)" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle">
            Occ: ${zones.find(z => z.id === 'zone_c')?.current_occupancy || 0} / 90
          </text>
        </g>

        <!-- 2. OVERLAP INTERSECTION REGIONS (Where PIE applies!) -->
        <!-- Pairwise Overlaps: A-C, B-C, D-C, E-C, A-B, D-E -->
        <!-- Overlap A-C -->
        <rect x="320" y="110" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="345" y="105" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">A ∩ C (14)</text>

        <!-- Overlap B-C -->
        <rect x="320" y="445" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="345" y="550" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">B ∩ C (12)</text>

        <!-- Overlap A-B (West Vestibule) -->
        <rect x="165" y="275" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="190" y="325" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">A ∩ B (6)</text>

        <!-- 3-Way Overlap A-B-C (West Hub Junction) -->
        <rect x="320" y="285" width="50" height="70" class="svg-overlap-area" rx="4" style="stroke: #facc15; stroke-dasharray: 4,2;" />
        <text x="345" y="325" fill="#fef08a" font-family="JetBrains Mono" font-size="8.5" font-weight="700" text-anchor="middle">A∩B∩C (5)</text>

        <!-- Overlap D-C -->
        <rect x="635" y="110" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="660" y="105" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">D ∩ C (9)</text>

        <!-- Overlap E-C -->
        <rect x="635" y="445" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="660" y="550" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">E ∩ C (15)</text>

        <!-- Overlap D-E (East Vestibule) -->
        <rect x="785" y="275" width="50" height="90" class="svg-overlap-area" rx="4" />
        <text x="810" y="325" fill="#c4b5fd" font-family="JetBrains Mono" font-size="9" text-anchor="middle">D ∩ E (5)</text>

        <!-- 3-Way Overlap C-D-E (East Hub Junction) -->
        <rect x="635" y="285" width="50" height="70" class="svg-overlap-area" rx="4" style="stroke: #facc15; stroke-dasharray: 4,2;" />
        <text x="660" y="325" fill="#fef08a" font-family="JetBrains Mono" font-size="8.5" font-weight="700" text-anchor="middle">C∩D∩E (4)</text>

        <!-- 3. ROOM ZONES -->
    `;

    // Render rooms
    zones.filter(z => z.id !== 'zone_c').forEach(zone => {
      const isHazard = activeHazard?.zoneId === zone.id;
      const isOrigin = activeOriginZoneId === zone.id;
      const isWarning = zone.risk_level === 'warning';
      const c = zone.coords;

      let zoneClass = 'svg-zone-rect';
      if (isHazard) zoneClass += ' svg-zone-hazard';
      else if (isWarning) zoneClass += ' svg-zone-warning';
      else if (isOrigin) zoneClass += ' svg-zone-safe';

      svgHtml += `
        <g id="zone-${zone.id}" class="zone-group" style="cursor: pointer;" data-zone-id="${zone.id}">
          <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="6" class="${zoneClass}" />
          
          <!-- Room Title -->
          <text x="${c.x + 18}" y="${c.y + 32}" fill="#f8fafc" font-family="Outfit, sans-serif" font-size="14" font-weight="700">
            ${zone.name}
          </text>
          
          <!-- Occupancy Pill -->
          <g transform="translate(${c.x + 18}, ${c.y + 44})">
            <rect width="95" height="22" rx="11" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <circle cx="12" cy="11" r="4" fill="${isHazard ? '#ef4444' : isOrigin ? '#10b981' : '#38bdf8'}" />
            <text x="24" y="15" fill="#e2e8f0" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600">
              Occ: ${zone.current_occupancy}
            </text>
          </g>

          <!-- Origin Badge if active -->
          ${isOrigin ? `
            <g transform="translate(${c.x + c.w - 95}, ${c.y + 14})">
              <rect width="80" height="20" rx="4" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="1"/>
              <text x="40" y="14" fill="#6ee7b7" font-family="Inter, sans-serif" font-size="10" font-weight="700" text-anchor="middle">ORIGIN</text>
            </g>
          ` : ''}

          <!-- Door Marker -->
          <circle cx="${zone.door.x}" cy="${zone.door.y}" r="6" class="svg-door" />
        </g>
      `;
    });

    // 4. HAZARD ANIMATION OVERLAY (if active)
    if (activeHazard) {
      const hZone = zones.find(z => z.id === activeHazard.zoneId);
      if (hZone) {
        const center = hZone.center || { x: hZone.coords.x + hZone.coords.w / 2, y: hZone.coords.y + hZone.coords.h / 2 };
        svgHtml += `
          <g class="hazard-fire-overlay">
            <circle cx="${center.x}" cy="${center.y}" r="80" fill="url(#hazardGlow)">
              <animate attributeName="r" values="70;95;70" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <!-- Flame Icon Badge -->
            <g transform="translate(${center.x - 36}, ${center.y - 36})">
              <circle cx="36" cy="36" r="28" fill="#ef4444" filter="drop-shadow(0 0 10px #ef4444)"/>
              <text x="36" y="44" font-size="24" text-anchor="middle">🔥</text>
            </g>
            <text x="${center.x}" y="${center.y + 55}" fill="#fca5a5" font-family="Outfit, sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="1">
              HAZARD ORIGIN
            </text>
          </g>
        `;
      }
    }

    // 5. EXITS
    exits.forEach(exit => {
      const c = exit.coords;
      const isTarget = recRoute?.exitId === exit.id;
      const isBlocked = activeHazard && (exit.zone_id === activeHazard.zoneId || exit.status === 'blocked');

      svgHtml += `
        <g id="exit-${exit.id}" class="exit-group" data-exit-id="${exit.id}">
          <!-- Door Box -->
          <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="4" 
                class="svg-exit-door ${isBlocked ? 'blocked' : ''}" />
          
          <!-- Exit Label Badge -->
          <text x="${c.x + c.w / 2}" y="${c.y + c.h / 2 + 4}" 
                fill="#ffffff" font-family="Outfit, sans-serif" font-size="11" font-weight="800" text-anchor="middle">
            ${isBlocked ? 'BLOCKED' : 'EXIT'}
          </text>

          <!-- Target Pulse if this exit is recommended -->
          ${isTarget ? `
            <circle cx="${exit.target.x}" cy="${exit.target.y}" r="16" fill="none" stroke="#10b981" stroke-width="2">
              <animate attributeName="r" values="12;28;12" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
          ` : ''}

          <!-- Exit Name Marker -->
          <text x="${c.x + c.w / 2}" y="${c.y > 300 ? c.y + c.h + 16 : c.y - 8}" 
                fill="#94a3b8" font-family="Inter, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
            ${exit.name}
          </text>
        </g>
      `;
    });

    // 6. ROUTE PATH OVERLAYS
    // Render Optimal path (Cyan) if it exists and is different from UX path
    if (optRoute && recRoute && optRoute.id !== recRoute.id && optRoute.svgPoints) {
      const optPoints = formatPoints(optRoute.svgPoints);
      svgHtml += `
        <g class="route-optimal-layer">
          <polyline points="${optPoints}" class="svg-route-optimal" marker-end="url(#arrowCyan)" />
          <text x="${optRoute.svgPoints[1][0] + 10}" y="${optRoute.svgPoints[1][1] - 10}" 
                fill="#67e8f9" font-family="JetBrains Mono" font-size="10" font-weight="600">
            Optimal Path (${optRoute.theoreticalTime} s, ${optRoute.turns} turns)
          </text>
        </g>
      `;
    }

    // Render Recommended Path (Emerald for UX-First, Cyan for Optimal)
    if (recRoute && recRoute.svgPoints) {
      const recPoints = formatPoints(recRoute.svgPoints);
      const isOpt = selectedStrategy === 'optimal';
      const strokeColor = isOpt ? '#06b6d4' : '#10b981';
      const markerId = isOpt ? 'url(#arrowCyan)' : 'url(#arrowGreen)';
      const strategyLabel = isOpt ? 'OPTIMAL ROUTE (OVERRIDE)' : 'RECOMMENDED ROUTE (UX-FIRST)';

      svgHtml += `
        <g class="route-rec-layer">
          <!-- Flowing Path -->
          <polyline points="${recPoints}" class="svg-route-ux" 
                    style="stroke: ${strokeColor};" 
                    marker-end="${markerId}" />
          
          <!-- Animated Flow Particles along path -->
          <circle r="4" class="svg-particle" fill="${strokeColor}">
            <animateMotion path="M ${recRoute.svgPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')}" 
                           dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle r="4" class="svg-particle" fill="${strokeColor}">
            <animateMotion path="M ${recRoute.svgPoints.map(p => `${p[0]} ${p[1]}`).join(' L ')}" 
                           dur="2.5s" begin="1.2s" repeatCount="indefinite" />
          </circle>

          <!-- Label at midpoint -->
          <g transform="translate(${recRoute.svgPoints[0][0]}, ${recRoute.svgPoints[0][1] - 20})">
            <rect width="180" height="20" rx="4" fill="rgba(0,0,0,0.7)" stroke="${strokeColor}" stroke-width="1"/>
            <text x="90" y="14" fill="${strokeColor}" font-family="Outfit" font-size="10" font-weight="700" text-anchor="middle">
              ${strategyLabel}
            </text>
          </g>
        </g>
      `;
    }

    svgHtml += `</svg>`;
    this.container.innerHTML = svgHtml;

    // Attach click handlers to rooms for interactive hazard/origin selection
    this.container.querySelectorAll('.zone-group').forEach(el => {
      el.addEventListener('click', (e) => {
        const zoneId = el.getAttribute('data-zone-id');
        if (this.onZoneClick) {
          this.onZoneClick(zoneId);
        }
      });
    });
  }
}

window.FloorPlanView = FloorPlanView;
