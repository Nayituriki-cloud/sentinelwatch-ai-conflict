import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Shield,
  Home,
  Zap,
  Navigation,
  Crosshair,
  Filter,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Compass,
} from 'lucide-react';
import { Incident, Shelter, InfrastructureNode, EmergencyAlert, SeverityLevel } from '../types';

interface GoogleMapDashboardProps {
  apiKey: string;
  incidents: Incident[];
  shelters: Shelter[];
  infrastructure: InfrastructureNode[];
  alerts: EmergencyAlert[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  onOpenReportModal: () => void;
}

// Controller component to smoothly pan/zoom and draw SVG overlays / zones on the Google Map
function MapOverlaysController({
  incidents,
  shelters,
  infrastructure,
  selectedIncident,
  showEvacCorridors,
  privacyZoneMode,
}: {
  incidents: Incident[];
  shelters: Shelter[];
  infrastructure: InfrastructureNode[];
  selectedIncident: Incident | null;
  showEvacCorridors: boolean;
  privacyZoneMode: boolean;
}) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Fly to selected incident
  useEffect(() => {
    if (!map || !selectedIncident) return;
    map.panTo({
      lat: selectedIncident.coordinates.lat,
      lng: selectedIncident.coordinates.lng,
    });
    map.setZoom(13);
  }, [map, selectedIncident]);

  // Render Google Maps Circles (Threat privacy buffers) and Polylines (Evacuation Corridors)
  useEffect(() => {
    if (!map) return;

    // Clear old shapes
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    // Draw Privacy Zones / Threat Circles
    if (privacyZoneMode) {
      incidents.forEach((inc) => {
        const severityColors: Record<SeverityLevel, { stroke: string; fill: string }> = {
          critical: { stroke: '#ef4444', fill: '#ef4444' },
          warning: { stroke: '#f59e0b', fill: '#f59e0b' },
          advisory: { stroke: '#3b82f6', fill: '#3b82f6' },
          information: { stroke: '#64748b', fill: '#64748b' },
        };
        const colors = severityColors[inc.severity];
        const radiusMeters = (inc.radiusKm || 3.0) * 1000;

        const circle = new google.maps.Circle({
          strokeColor: colors.stroke,
          strokeOpacity: 0.85,
          strokeWeight: inc.severity === 'critical' ? 2.5 : 1.5,
          fillColor: colors.fill,
          fillOpacity: 0.22,
          map,
          center: { lat: inc.coordinates.lat, lng: inc.coordinates.lng },
          radius: radiusMeters,
          clickable: false,
        });

        circlesRef.current.push(circle);
      });
    }

    // Draw Evacuation Corridors
    if (showEvacCorridors) {
      // Safe Highway 12 corridor
      const safeLine = new google.maps.Polyline({
        path: [
          { lat: 34.523, lng: 43.682 },
          { lat: 34.505, lng: 43.705 },
          { lat: 34.48, lng: 43.71 },
          { lat: 34.43, lng: 43.69 },
        ],
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current.push(safeLine);

      // Blocked Highway 7 corridor
      const blockedLine = new google.maps.Polyline({
        path: [
          { lat: 34.53, lng: 43.66 },
          { lat: 34.515, lng: 43.67 },
          { lat: 34.49, lng: 43.685 },
        ],
        geodesic: true,
        strokeColor: '#ef4444',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current.push(blockedLine);
    }

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, incidents, showEvacCorridors, privacyZoneMode]);

  return null;
}

export const GoogleMapDashboard: React.FC<GoogleMapDashboardProps> = ({
  apiKey,
  incidents,
  shelters,
  infrastructure,
  alerts,
  selectedIncident,
  onSelectIncident,
  onOpenReportModal,
}) => {
  // Layer Toggles
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showInfrastructure, setShowInfrastructure] = useState<boolean>(true);
  const [showEvacCorridors, setShowEvacCorridors] = useState<boolean>(true);
  const [privacyZoneMode, setPrivacyZoneMode] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Popups / InfoWindows state
  const [activeIncidentPopup, setActiveIncidentPopup] = useState<Incident | null>(null);
  const [activeShelterPopup, setActiveShelterPopup] = useState<Shelter | null>(null);
  const [activeInfraPopup, setActiveInfraPopup] = useState<InfrastructureNode | null>(null);

  // User location detection (Google geolocation)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    return true;
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation lookup notice:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <APIProvider apiKey={apiKey} libraries={['places', 'geometry', 'marker']}>
        <Map
          defaultCenter={{ lat: 34.49, lng: 43.71 }}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapTypeId}
          disableDefaultUI={false}
          clickableIcons={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Overlays (Circles, Corridor Polylines, Pan-To) */}
          <MapOverlaysController
            incidents={filteredIncidents}
            shelters={shelters}
            infrastructure={infrastructure}
            selectedIncident={selectedIncident}
            showEvacCorridors={showEvacCorridors}
            privacyZoneMode={privacyZoneMode}
          />

          {/* User Current Location Marker */}
          {userLocation && (
            <AdvancedMarker
              position={userLocation}
              title="Your Current Location (Geolocation)"
            >
              <div className="flex items-center justify-center h-8 w-8 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* 1. Incidents Advanced Markers */}
          {showIncidents &&
            filteredIncidents.map((inc) => {
              const severityPinColor = {
                critical: '#ef4444',
                warning: '#f59e0b',
                advisory: '#3b82f6',
                information: '#64748b',
              }[inc.severity];

              return (
                <AdvancedMarker
                  key={inc.id}
                  position={{ lat: inc.coordinates.lat, lng: inc.coordinates.lng }}
                  onClick={() => {
                    setActiveIncidentPopup(inc);
                    onSelectIncident(inc);
                  }}
                  title={inc.title}
                >
                  <Pin
                    background={severityPinColor}
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                    scale={inc.severity === 'critical' ? 1.15 : 0.95}
                  />
                </AdvancedMarker>
              );
            })}

          {/* Incident InfoWindow */}
          {activeIncidentPopup && (
            <InfoWindow
              position={{
                lat: activeIncidentPopup.coordinates.lat,
                lng: activeIncidentPopup.coordinates.lng,
              }}
              onCloseClick={() => setActiveIncidentPopup(null)}
            >
              <div className="p-1 min-w-[240px] text-slate-900">
                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className="font-mono uppercase font-bold px-1.5 py-0.5 rounded text-white"
                    style={{
                      backgroundColor:
                        activeIncidentPopup.severity === 'critical'
                          ? '#ef4444'
                          : activeIncidentPopup.severity === 'warning'
                          ? '#f59e0b'
                          : '#3b82f6',
                    }}
                  >
                    {activeIncidentPopup.severity.toUpperCase()}
                  </span>
                  <span className="text-slate-600 capitalize font-medium">
                    {activeIncidentPopup.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 mt-1 leading-snug">
                  {activeIncidentPopup.title}
                </h4>

                <p className="text-[11px] text-slate-600 mt-1">
                  Zone: <strong className="text-slate-800">{activeIncidentPopup.zoneName}</strong>
                </p>

                <div className="mt-2 text-[11px] flex items-center justify-between text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  <span>Confidence: <strong className="text-emerald-700">{activeIncidentPopup.confidenceScore}%</strong></span>
                  <span>Reports: <strong>{activeIncidentPopup.reportCount}</strong></span>
                </div>

                <div className="mt-2 text-[11px] text-amber-800 border-l-2 border-amber-600 pl-2 py-0.5 italic">
                  "{activeIncidentPopup.recommendedCivilianAction}"
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => onSelectIncident(activeIncidentPopup)}
                    className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
                  >
                    AI Verification Engine &rarr;
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* 2. Safe Shelters Markers */}
          {showShelters &&
            shelters.map((shl) => (
              <AdvancedMarker
                key={shl.id}
                position={{ lat: shl.coordinates.lat, lng: shl.coordinates.lng }}
                onClick={() => setActiveShelterPopup(shl)}
                title={shl.name}
              >
                <div className="bg-emerald-700 text-white font-bold p-1 rounded-full border-2 border-white shadow-md text-[10px] w-6 h-6 flex items-center justify-center">
                  ⌂
                </div>
              </AdvancedMarker>
            ))}

          {/* Shelter InfoWindow */}
          {activeShelterPopup && (
            <InfoWindow
              position={{
                lat: activeShelterPopup.coordinates.lat,
                lng: activeShelterPopup.coordinates.lng,
              }}
              onCloseClick={() => setActiveShelterPopup(null)}
            >
              <div className="p-1 min-w-[220px] text-slate-900">
                <div className="text-[10px] text-emerald-700 font-mono uppercase font-bold">
                  Designated Safe Shelter
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                  {activeShelterPopup.name}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{activeShelterPopup.address}</p>
                <div className="mt-2 text-[11px] bg-slate-100 p-1.5 rounded space-y-1">
                  <div className="flex justify-between">
                    <span>Occupancy:</span>
                    <strong className="text-emerald-700 font-mono">
                      {activeShelterPopup.currentOccupancy} / {activeShelterPopup.capacity}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hotline:</span>
                    <strong className="font-mono text-slate-800">{activeShelterPopup.contactPhone}</strong>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* 3. Infrastructure Markers */}
          {showInfrastructure &&
            infrastructure.map((inf) => {
              const statusColor = {
                operational: '#10b981',
                degraded: '#f59e0b',
                offline: '#ef4444',
                threatened: '#8b5cf6',
              }[inf.operationalStatus];

              return (
                <AdvancedMarker
                  key={inf.id}
                  position={{ lat: inf.coordinates.lat, lng: inf.coordinates.lng }}
                  onClick={() => setActiveInfraPopup(inf)}
                  title={inf.name}
                >
                  <div
                    style={{ backgroundColor: statusColor }}
                    className="w-4 h-4 rounded-md border border-white shadow-md"
                  />
                </AdvancedMarker>
              );
            })}

          {/* Infrastructure InfoWindow */}
          {activeInfraPopup && (
            <InfoWindow
              position={{
                lat: activeInfraPopup.coordinates.lat,
                lng: activeInfraPopup.coordinates.lng,
              }}
              onCloseClick={() => setActiveInfraPopup(null)}
            >
              <div className="p-1 min-w-[200px] text-slate-900">
                <div className="text-[10px] text-slate-500 font-mono uppercase">
                  {activeInfraPopup.type.replace('_', ' ')}
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-0.5">{activeInfraPopup.name}</h4>
                <div className="mt-1 text-[11px] flex justify-between">
                  <span>Status:</span>
                  <strong className="uppercase font-mono">{activeInfraPopup.operationalStatus}</strong>
                </div>
                <div className="mt-0.5 text-[11px] flex justify-between">
                  <span>Backup Power:</span>
                  <span>{activeInfraPopup.backupAvailable ? 'Available' : 'None'}</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        {/* Left: Google Maps Brand & Early-Warning Badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Google Location Intelligence</span>
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

        {/* Right: Layer Toggles & Mode Selection */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg text-xs shadow-lg">
          {/* Map Type: Roadmap vs Satellite Hybrid */}
          <button
            onClick={() => setMapTypeId(mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              mapTypeId === 'hybrid'
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch Google Maps satellite hybrid vs vector roadmap view"
          >
            <Compass className="h-3 w-3" />
            <span>{mapTypeId === 'hybrid' ? 'Satellite View' : 'Roadmap'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Privacy Zone Mode */}
          <button
            onClick={() => setPrivacyZoneMode(!privacyZoneMode)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              privacyZoneMode
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Aggregates coordinates into protective Google Maps zone buffers"
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

          {/* Locate User Button */}
          <button
            onClick={handleLocateMe}
            className={`p-1.5 rounded transition-colors ${
              userLocation ? 'bg-blue-900 text-blue-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Detect My Location via Google Geolocation"
          >
            <MapPin className={`h-3.5 w-3.5 ${isLocating ? 'animate-bounce text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Severity Filter */}
      <div className="absolute bottom-3 left-3 pointer-events-auto z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg text-xs">
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
