import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Eye,
  EyeOff,
  Navigation,
  Shield,
  Home,
  Zap,
  Droplet,
  Radio,
  Crosshair,
  Filter,
} from 'lucide-react';
import { Incident, Shelter, InfrastructureNode, EmergencyAlert, SeverityLevel } from '../types';

interface MapDashboardProps {
  incidents: Incident[];
  shelters: Shelter[];
  infrastructure: InfrastructureNode[];
  alerts: EmergencyAlert[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  onOpenReportModal: () => void;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({
  incidents,
  shelters,
  infrastructure,
  alerts,
  selectedIncident,
  onSelectIncident,
  onOpenReportModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer Toggles
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showInfrastructure, setShowInfrastructure] = useState<boolean>(true);
  const [showEvacCorridors, setShowEvacCorridors] = useState<boolean>(true);
  const [privacyZoneMode, setPrivacyZoneMode] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around the operational valley
    const map = L.map(mapContainerRef.current, {
      center: [34.49, 43.71],
      zoom: 11,
      minZoom: 9,
      maxZoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap dark-themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Layers whenever data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Evacuation Corridors
    if (showEvacCorridors) {
      // Safe Green Corridor (Highway 12)
      const safeCoords: [number, number][] = [
        [34.523, 43.682],
        [34.505, 43.705],
        [34.48, 43.71],
        [34.43, 43.69],
      ];
      const safePoly = L.polyline(safeCoords, {
        color: '#10b981',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(group);
      safePoly.bindTooltip('<b>Green Evacuation Corridor</b>: Highway 12 South (Patrolled & Safe)', {
        direction: 'top',
        className: 'bg-slate-900 text-slate-100 text-xs px-2 py-1 border border-slate-700 rounded shadow',
      });

      // Blocked / Impacted Corridor (Highway 7)
      const blockedCoords: [number, number][] = [
        [34.53, 43.66],
        [34.515, 43.67],
        [34.49, 43.685],
      ];
      const blockedPoly = L.polyline(blockedCoords, {
        color: '#ef4444',
        weight: 5,
        opacity: 0.85,
        dashArray: '4, 8',
      }).addTo(group);
      blockedPoly.bindTooltip('<b>BLOCKED TRANSIT ROUTE</b>: Highway 7 (Kinetic Shelling Hazard)', {
        direction: 'top',
        className: 'bg-red-950 text-red-200 text-xs px-2 py-1 border border-red-800 rounded shadow',
      });
    }

    // 2. Infrastructure Nodes
    if (showInfrastructure) {
      infrastructure.forEach((node) => {
        const statusColors = {
          operational: '#10b981',
          degraded: '#f59e0b',
          offline: '#ef4444',
          threatened: '#8b5cf6',
        };
        const color = statusColors[node.operationalStatus];

        const iconHtml = `
          <div style="background-color: ${color}25; border: 2px solid ${color}; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${color}; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
          </div>
        `;

        const infraIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-infra-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([node.coordinates.lat, node.coordinates.lng], { icon: infraIcon }).addTo(group);
        marker.bindPopup(`
          <div class="p-2 min-w-[200px]">
            <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">${node.type.replace('_', ' ')}</div>
            <h4 class="font-bold text-sm text-slate-100 mt-0.5">${node.name}</h4>
            <div class="mt-2 text-xs flex items-center justify-between">
              <span class="text-slate-400">Status:</span>
              <span class="font-semibold uppercase" style="color: ${color}">${node.operationalStatus}</span>
            </div>
            <div class="mt-1 text-xs flex items-center justify-between">
              <span class="text-slate-400">Civilian Impact:</span>
              <span class="text-slate-200 capitalize font-medium">${node.civilianImpact}</span>
            </div>
            <div class="mt-1 text-xs text-slate-400">
              Backup Generator: ${node.backupAvailable ? 'Active' : 'None'}
            </div>
          </div>
        `);
      });
    }

    // 3. Safe Shelters
    if (showShelters) {
      shelters.forEach((shelter) => {
        const occupancyPct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
        const shelterIcon = L.divIcon({
          html: `
            <div style="background-color: #065f46; border: 2px solid #34d399; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
              ⌂
            </div>
          `,
          className: 'custom-shelter-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([shelter.coordinates.lat, shelter.coordinates.lng], { icon: shelterIcon }).addTo(group);
        marker.bindPopup(`
          <div class="p-2 min-w-[220px]">
            <div class="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Designated Safe Shelter</div>
            <h4 class="font-bold text-sm text-slate-100 mt-0.5">${shelter.name}</h4>
            <p class="text-xs text-slate-400 mt-1">${shelter.address}</p>
            <div class="mt-2.5 bg-slate-800 p-2 rounded text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Capacity:</span>
                <span class="font-medium text-slate-200">${shelter.currentOccupancy} / ${shelter.capacity} (${occupancyPct}%)</span>
              </div>
              <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: ${Math.min(100, occupancyPct)}%"></div>
              </div>
              <div class="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Emergency Contact:</span>
                <span class="font-mono text-emerald-300">${shelter.contactPhone}</span>
              </div>
            </div>
          </div>
        `);
      });
    }

    // 4. Incidents & Privacy Zones
    if (showIncidents) {
      const filteredIncidents = incidents.filter((inc) => {
        if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
        return true;
      });

      filteredIncidents.forEach((inc) => {
        const severityColors: Record<SeverityLevel, { stroke: string; fill: string; dot: string }> = {
          critical: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.25)', dot: '#ef4444' },
          warning: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.22)', dot: '#f59e0b' },
          advisory: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.18)', dot: '#3b82f6' },
          information: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.15)', dot: '#94a3b8' },
        };

        const colors = severityColors[inc.severity];

        // Draw geographic zone / circle buffer (safeguards citizen privacy)
        const radiusMeters = (inc.radiusKm || 3.0) * 1000;
        const circle = L.circle([inc.coordinates.lat, inc.coordinates.lng], {
          radius: radiusMeters,
          color: colors.stroke,
          weight: inc.severity === 'critical' ? 2 : 1.5,
          fillColor: colors.fill,
          fillOpacity: 0.35,
          dashArray: inc.status === 'unverified' ? '4, 6' : undefined,
        }).addTo(group);

        // Marker center icon
        const iconHtml = `
          <div style="background-color: ${colors.dot}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${colors.stroke};"></div>
        `;
        const centerIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-incident-center',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: centerIcon }).addTo(group);

        const popupContent = `
          <div class="p-2 min-w-[240px]">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono uppercase font-bold px-1.5 py-0.5 rounded" style="background: ${colors.stroke}25; color: ${colors.stroke};">
                ${inc.severity.toUpperCase()}
              </span>
              <span class="text-slate-400 capitalize">${inc.status.replace('_', ' ')}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-100 mt-1 leading-snug">${inc.title}</h4>
            <p class="text-xs text-slate-400 mt-1">Zone: <span class="text-slate-200">${inc.zoneName}</span></p>
            <div class="mt-2 text-xs flex items-center justify-between text-slate-300 bg-slate-800/80 px-2 py-1 rounded">
              <span>Confidence: <strong class="text-emerald-400">${inc.confidenceScore}%</strong></span>
              <span>Reports: <strong>${inc.reportCount}</strong></span>
            </div>
            <div class="mt-2 text-xs text-slate-400 border-l-2 border-amber-500/80 pl-2 py-0.5 italic">
              "${inc.recommendedCivilianAction}"
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800 flex justify-end">
              <button id="btn-inspect-${inc.id}" class="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors">
                Inspect AI Verification &rarr;
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        circle.bindPopup(popupContent);

        // Bind click event inside popup
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${inc.id}`);
          if (btn) {
            btn.onclick = () => onSelectIncident(inc);
          }
        });
      });
    }
  }, [
    incidents,
    shelters,
    infrastructure,
    alerts,
    showIncidents,
    showShelters,
    showInfrastructure,
    showEvacCorridors,
    privacyZoneMode,
    severityFilter,
    onSelectIncident,
  ]);

  // Center on selected incident if provided
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
        13,
        { duration: 1.2 }
      );
    }
  }, [selectedIncident]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([34.49, 43.71], 11);
    }
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-[1000]">
        {/* Left: Quick Legend & Stats Badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Geospatial Early-Warning</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              Critical ({incidents.filter((i) => i.severity === 'critical').length})
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Warning ({incidents.filter((i) => i.severity === 'warning').length})
            </span>
          </div>
        </div>

        {/* Right: Layer Toggles & Privacy Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg text-xs shadow-lg">
          {/* Privacy Zone Mode */}
          <button
            onClick={() => setPrivacyZoneMode(!privacyZoneMode)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              privacyZoneMode
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Aggregates coordinates into protective zone buffers to conceal exact citizen homes"
          >
            {privacyZoneMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{privacyZoneMode ? 'Privacy Zones Active' : 'Exact GPS'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Shelters toggle */}
          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
              showShelters ? 'bg-slate-800 text-emerald-300 font-medium' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Home className="h-3 w-3" />
            <span>Shelters</span>
          </button>

          {/* Infrastructure toggle */}
          <button
            onClick={() => setShowInfrastructure(!showInfrastructure)}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
              showInfrastructure ? 'bg-slate-800 text-blue-300 font-medium' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Lifelines</span>
          </button>

          {/* Corridors toggle */}
          <button
            onClick={() => setShowEvacCorridors(!showEvacCorridors)}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
              showEvacCorridors ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Navigation className="h-3 w-3" />
            <span>Corridors</span>
          </button>

          {/* Reset center */}
          <button
            onClick={handleResetView}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            title="Reset Map Center"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Severity Filter */}
      <div className="absolute bottom-3 left-3 pointer-events-auto z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg text-xs">
        <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        {(['all', 'critical', 'warning', 'advisory', 'information'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
              severityFilter === sev
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>
    </div>
  );
};
