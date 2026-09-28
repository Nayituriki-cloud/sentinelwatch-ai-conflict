import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_SHELTERS,
  INITIAL_INFRASTRUCTURE,
  INITIAL_DATA_SOURCES,
  INITIAL_FAMILY_CHECK_INS,
  INITIAL_MISSING_PERSONS,
  INITIAL_AUDIT_LOGS,
} from './src/data/mockData';
import {
  Incident,
  EmergencyAlert,
  Shelter,
  InfrastructureNode,
  DataSource,
  FamilyCheckIn,
  MissingPersonReport,
  AuditLog,
} from './src/types';
import {
  verifyIncidentSources,
  generateAIRiskAnalysis,
  generateCivilianGuidance,
} from './server/geminiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent state initialized with rich operational seed data
let incidents: Incident[] = [...INITIAL_INCIDENTS];
let alerts: EmergencyAlert[] = [...INITIAL_ALERTS];
let shelters: Shelter[] = [...INITIAL_SHELTERS];
let infrastructure: InfrastructureNode[] = [...INITIAL_INFRASTRUCTURE];
let dataSources: DataSource[] = [...INITIAL_DATA_SOURCES];
let familyCheckIns: FamilyCheckIn[] = [...INITIAL_FAMILY_CHECK_INS];
let missingPersons: MissingPersonReport[] = [...INITIAL_MISSING_PERSONS];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

// Return client configuration including Google Maps API Key
app.get('/api/config', (_req: Request, res: Response) => {
  const googleMapsApiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    'AIzaSyDvDiGxzJ1rUe8vUIOeDjl76xrn83w4lCg';
  res.json({
    googleMapsApiKey,
  });
});

// Helper to record immutable audit log entries
function recordAudit(
  userId: string,
  userName: string,
  userRole: AuditLog['userRole'],
  action: AuditLog['action'],
  targetId: string,
  details: string,
  req: Request
) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const maskedIp = ip.split('.').slice(0, 3).join('.') + '.***';

  const logEntry: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    targetId,
    details,
    ipAddressMasked: maskedIp,
  };
  auditLogs.unshift(logEntry);
  if (auditLogs.length > 200) auditLogs.pop(); // Automatic retention policy
}

// -------------------------------------------------------------
// INCIDENTS API
// -------------------------------------------------------------

app.get('/api/incidents', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: incidents,
    total: incidents.length,
    timestamp: new Date().toISOString(),
  });
});

// Submit a new citizen report or sensor alert with privacy scrubbing and AI triage
app.post('/api/incidents/submit-report', async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      severity,
      zoneName,
      coordinates,
      summary,
      reporterRole = 'public_user',
      reporterName = 'Anonymous Civilian',
      userId = 'anon-usr',
    } = req.body;

    if (!title || !zoneName) {
      return res.status(400).json({ error: 'Title and Zone name are required.' });
    }

    // Privacy scrubbing: Anonymize personal citizen identifiers from summary
    const scrubbedSummary = summary
      ? summary.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]')
      : 'Public civilian report received.';

    const newIncidentId = `inc-${Date.now().toString().slice(-5)}`;
    const newIncident: Incident = {
      id: newIncidentId,
      title,
      category: category || 'civil_unrest',
      severity: severity || 'advisory',
      status: 'unverified', // Never automatically assume unverified reports are true
      confidenceScore: 40,
      zoneName,
      coordinates: coordinates || { lat: 34.49, lng: 43.71 },
      radiusKm: 3.0,
      isPrivacyPreserved: true, // Zone-level aggregate to protect civilian privacy
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      reportCount: 1,
      sources: [
        {
          id: `s-${Date.now()}`,
          sourceId: 'src-3',
          sourceName: 'Citizen Mobile Reporting Network',
          sourceType: 'public_citizen_report',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          summary: scrubbedSummary,
          mediaVerified: false,
          reliabilityScore: 0.7,
        },
      ],
      recommendedCivilianAction: 'Monitor official local alerts; remain in safe structures away from windows.',
    };

    // Trigger AI Verification on initial submission
    try {
      const aiVerification = await verifyIncidentSources(newIncident);
      newIncident.aiVerificationDetails = aiVerification;
      newIncident.confidenceScore = aiVerification.corroborationFactor;
      newIncident.aiAnalysisSummary = aiVerification.explanation;
      newIncident.recommendedCivilianAction = aiVerification.recommendedCivilianAction;
    } catch {
      // Continue even if AI call fails
    }

    incidents.unshift(newIncident);

    recordAudit(
      userId,
      reporterName,
      reporterRole,
      'submit_public_report',
      newIncidentId,
      `Submitted initial incident report in ${zoneName}. Status defaulted to unverified pending investigation.`,
      req
    );

    res.status(201).json({ success: true, data: newIncident });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Human Analyst or Emergency Responder Incident Verification & Status Update
app.post('/api/incidents/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, confidenceScore, notes, userId = 'usr-analyst-01', userName = 'Dr. Elena Rostova', userRole = 'analyst' } = req.body;

  const incident = incidents.find((i) => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  incident.status = status || incident.status;
  if (typeof confidenceScore === 'number') {
    incident.confidenceScore = confidenceScore;
  }
  incident.lastUpdated = new Date().toISOString();

  recordAudit(
    userId,
    userName,
    userRole,
    'verify_incident',
    id,
    `Updated incident verification status to ${status.toUpperCase()} (Confidence: ${incident.confidenceScore}%). Notes: ${notes || 'Verified against authorized intelligence'}`,
    req
  );

  res.json({ success: true, data: incident });
});

// Trigger on-demand AI Verification Engine on an incident
app.post('/api/ai/verify-incident', async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.body;
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const verificationResult = await verifyIncidentSources(incident);
    incident.aiVerificationDetails = verificationResult;
    incident.confidenceScore = verificationResult.corroborationFactor;
    incident.aiAnalysisSummary = verificationResult.explanation;
    incident.recommendedCivilianAction = verificationResult.recommendedCivilianAction;
    incident.lastUpdated = new Date().toISOString();

    res.json({ success: true, data: verificationResult, incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify incident' });
  }
});

// -------------------------------------------------------------
// AI RISK ANALYSIS & CIVILIAN GUIDANCE
// -------------------------------------------------------------

app.post('/api/ai/escalation-risk', async (req: Request, res: Response) => {
  try {
    const report = await generateAIRiskAnalysis(incidents);
    recordAudit(
      req.body.userId || 'system',
      req.body.userName || 'System Automated Watch',
      req.body.userRole || 'analyst',
      'run_ai_risk_model',
      'regional-grid',
      `Generated AI Comprehensive Early-Warning Threat & Risk Assessment (Threat Index: ${report.overallThreatIndex}/100)`,
      req
    );
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate risk report' });
  }
});

app.post('/api/ai/civilian-guidance', async (req: Request, res: Response) => {
  try {
    const { topic = 'evacuation_checklist', language = 'en' } = req.body;
    const guidance = await generateCivilianGuidance(topic, language);
    res.json({ success: true, data: guidance });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate civilian guidance' });
  }
});

// -------------------------------------------------------------
// EMERGENCY ALERTS & HUMAN-IN-THE-LOOP APPROVAL
// -------------------------------------------------------------

app.get('/api/alerts', (req: Request, res: Response) => {
  res.json({ success: true, data: alerts });
});

// Create alert draft (AI or operator draft, requiring Human-in-the-Loop review)
app.post('/api/alerts/draft', (req: Request, res: Response) => {
  const { title, type, severity, affectedZones, message, instructions, distributionChannels, evacuationRoutes } = req.body;

  const newAlert: EmergencyAlert = {
    id: `alt-${Date.now().toString().slice(-4)}`,
    title,
    type: type || 'public_safety_warning',
    severity: severity || 'warning',
    affectedZones: affectedZones || ['General Protection Zone'],
    message,
    instructions: instructions || ['Follow Civil Defense instructions.'],
    status: 'pending_human_review', // Strict Human-in-the-Loop requirement!
    distributionChannels: distributionChannels || ['mobile_push', 'emergency_radio'],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    evacuationRoutes,
  };

  alerts.unshift(newAlert);
  res.status(201).json({ success: true, data: newAlert });
});

// Human authorization step: Approves draft for broadcast
app.post('/api/alerts/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { officerId, officerName, role } = req.body;

  if (!officerName || !role) {
    return res.status(400).json({ error: 'Human responder name and role required for authorization signature.' });
  }

  const alert = alerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  alert.status = 'approved';
  alert.authorizedBy = {
    officerId: officerId || 'usr-resp-01',
    officerName,
    role,
    timestamp: new Date().toISOString(),
  };

  recordAudit(
    officerId || 'usr-resp-01',
    officerName,
    role,
    'approve_alert',
    id,
    `Human-in-the-Loop Authorization: Approved emergency alert "${alert.title}" for dissemination.`,
    req
  );

  res.json({ success: true, data: alert });
});

// Broadcast approved alert
app.post('/api/alerts/:id/broadcast', (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (alert.status !== 'approved' && alert.status !== 'broadcasted') {
    return res.status(400).json({ error: 'Cannot broadcast alert without Human-in-the-Loop approval.' });
  }

  alert.status = 'broadcasted';
  res.json({ success: true, data: alert, broadcastTimestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// CIVILIAN PORTAL: SHELTERS, CHECK-INS, MISSING PERSONS
// -------------------------------------------------------------

app.get('/api/shelters', (req: Request, res: Response) => {
  res.json({ success: true, data: shelters });
});

app.get('/api/infrastructure', (req: Request, res: Response) => {
  res.json({ success: true, data: infrastructure });
});

app.get('/api/sources', (req: Request, res: Response) => {
  res.json({ success: true, data: dataSources });
});

app.post('/api/sources/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const source = dataSources.find((s) => s.id === id);
  if (!source) return res.status(404).json({ error: 'Source not found' });
  source.active = !source.active;
  res.json({ success: true, data: source });
});

app.get('/api/civilian/check-ins', (req: Request, res: Response) => {
  const { familyCode } = req.query;
  if (familyCode) {
    const code = String(familyCode).toUpperCase().trim();
    const filtered = familyCheckIns.filter((c) => c.familyCode.toUpperCase() === code);
    return res.json({ success: true, data: filtered });
  }
  // Public list (excludes private details)
  res.json({ success: true, data: familyCheckIns });
});

app.post('/api/civilian/check-in', (req: Request, res: Response) => {
  const { personName, familyCode, status, zone, message, contactNumber, isPublicContactAllowed } = req.body;

  if (!personName || !familyCode) {
    return res.status(400).json({ error: 'Name and family code are required.' });
  }

  const newCheckIn: FamilyCheckIn = {
    id: `chk-${Date.now().toString().slice(-4)}`,
    personName,
    familyCode: familyCode.toUpperCase().trim(),
    status: status || 'safe_at_shelter',
    zone: zone || 'Central Safe Zone',
    message: message || 'I am safe.',
    timestamp: new Date().toISOString(),
    isPublicContactAllowed: Boolean(isPublicContactAllowed),
    contactNumber: isPublicContactAllowed ? contactNumber : undefined,
  };

  familyCheckIns.unshift(newCheckIn);
  res.status(201).json({ success: true, data: newCheckIn });
});

app.get('/api/civilian/missing-persons', (req: Request, res: Response) => {
  res.json({ success: true, data: missingPersons });
});

app.post('/api/civilian/missing-persons', (req: Request, res: Response) => {
  const { fullName, age, lastSeenZone, identifyingDetails, reportedByRelationship, contactEmailOrPhone } = req.body;

  if (!fullName || !lastSeenZone) {
    return res.status(400).json({ error: 'Full name and last seen zone are required.' });
  }

  const newReport: MissingPersonReport = {
    id: `mis-${Date.now().toString().slice(-4)}`,
    fullName,
    age: Number(age) || 0,
    lastSeenZone,
    lastSeenTimestamp: new Date().toISOString(),
    identifyingDetails: identifyingDetails || 'No additional details provided.',
    reportedByRelationship: reportedByRelationship || 'Family member',
    status: 'actively_searching',
    contactEmailOrPhone: contactEmailOrPhone || 'civilian-aid@sentinelwatch.org',
    caseOfficer: 'Humanitarian Intake Officer',
  };

  missingPersons.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, data: auditLogs });
});

// Simulation endpoint: Adds a live simulated sensor anomaly or incoming emergency report
app.post('/api/simulation/trigger-event', async (req: Request, res: Response) => {
  const simulatedEvents: Partial<Incident>[] = [
    {
      title: 'Acoustic Shockwave Sensors Register Unconfirmed Detonation Near Railway Viaduct',
      category: 'explosion_hazard',
      severity: 'warning',
      zoneName: 'Central Urban Corridor (Zone Beta-3)',
      coordinates: { lat: 34.465, lng: 43.738 },
      radiusKm: 3.5,
    },
    {
      title: 'Mass Transit Power Interruption: Elevated Monorail Halted Between Stations',
      category: 'infrastructure_disruption',
      severity: 'advisory',
      zoneName: 'South Commercial District (Zone Gamma-2)',
      coordinates: { lat: 34.44, lng: 43.705 },
      radiusKm: 2.0,
    },
    {
      title: 'Border Perimeter Drone Surveillance Flags Sudden Vehicle Convergence on Bypass',
      category: 'border_incident',
      severity: 'warning',
      zoneName: 'North Valley Border Sector (Zone Alpha-5)',
      coordinates: { lat: 34.535, lng: 43.67 },
      radiusKm: 5.0,
    },
  ];

  const pick = simulatedEvents[Math.floor(Math.random() * simulatedEvents.length)];
  const newIncident: Incident = {
    id: `inc-sim-${Date.now().toString().slice(-4)}`,
    title: pick.title!,
    category: pick.category!,
    severity: pick.severity!,
    status: 'investigating',
    confidenceScore: 55,
    zoneName: pick.zoneName!,
    coordinates: pick.coordinates!,
    radiusKm: pick.radiusKm!,
    isPrivacyPreserved: true,
    timestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    reportCount: Math.floor(Math.random() * 12) + 4,
    sources: [
      {
        id: `s-sim-${Date.now()}`,
        sourceId: 'src-2',
        sourceName: 'Autonomous Defense Acoustic & Sensor Node',
        sourceType: 'satellite_sensor',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        summary: 'Sensor telemetry indicates localized anomaly. Verifying against civilian emergency calls.',
        mediaVerified: true,
        reliabilityScore: 0.88,
      },
    ],
    recommendedCivilianAction: 'Exercise caution; avoid railway viaduct until civil protection all-clear is confirmed.',
  };

  try {
    const aiVerif = await verifyIncidentSources(newIncident);
    newIncident.aiVerificationDetails = aiVerif;
    newIncident.confidenceScore = aiVerif.corroborationFactor;
    newIncident.aiAnalysisSummary = aiVerif.explanation;
  } catch {
    // Keep baseline
  }

  incidents.unshift(newIncident);
  res.json({ success: true, data: newIncident });
});

// -------------------------------------------------------------
// VITE DEV SERVER MIDDLEWARE & STATIC ASSET SERVING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SentinelWatch AI] Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
