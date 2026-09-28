export type SeverityLevel = 'information' | 'advisory' | 'warning' | 'critical';

export type IncidentCategory =
  | 'armed_conflict'
  | 'civil_unrest'
  | 'violence'
  | 'explosion_hazard'
  | 'infrastructure_disruption'
  | 'border_incident'
  | 'natural_disaster'
  | 'missing_persons'
  | 'unexplained_gathering'
  | 'telecom_blackout';

export type VerificationStatus =
  | 'unverified'
  | 'investigating'
  | 'corroborated'
  | 'verified'
  | 'discredited_misinformation';

export type UserRole =
  | 'public_user'
  | 'emergency_responder'
  | 'analyst'
  | 'humanitarian_org'
  | 'government_admin'
  | 'system_admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  organization: string;
  badgeNumber?: string;
  clearanceLevel: 'unrestricted' | 'restricted' | 'confidential' | 'operational';
}

export interface DataSource {
  id: string;
  name: string;
  type: 'public_citizen_report' | 'emergency_dispatch' | 'news_agency' | 'satellite_sensor' | 'humanitarian_ngo' | 'telecom_monitor';
  reliabilityRating: number; // 0 to 1.0
  trustLevel: 'high' | 'medium' | 'low' | 'unverified';
  active: boolean;
  lastPing: string;
}

export interface SourceReport {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: DataSource['type'];
  timestamp: string;
  summary: string;
  rawTextExcerpt?: string;
  mediaVerified: boolean;
  reliabilityScore: number;
}

export interface Incident {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  status: VerificationStatus;
  confidenceScore: number; // 0 - 100
  zoneName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  isPrivacyPreserved: boolean; // Zone-level aggregate instead of exact GPS
  timestamp: string;
  lastUpdated: string;
  reportCount: number;
  sources: SourceReport[];
  aiAnalysisSummary?: string;
  aiVerificationDetails?: {
    independentSourcesCount: number;
    corroborationFactor: number; // 0 - 100
    misinformationProbability: number; // 0 - 100
    duplicateDetected: boolean;
    escalationRisk: 'low' | 'moderate' | 'high' | 'extreme';
    explanation: string;
  };
  impactedCivilianEstimate?: number;
  infrastructureAffected?: string[];
  recommendedCivilianAction: string;
  assignedResponderUnit?: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  type: 'public_safety_warning' | 'evacuation_notice' | 'shelter_advisory' | 'road_closure' | 'humanitarian_aid' | 'comms_outage';
  severity: SeverityLevel;
  affectedZones: string[];
  message: string;
  instructions: string[];
  authorizedBy?: {
    officerId: string;
    officerName: string;
    role: UserRole;
    timestamp: string;
  };
  status: 'draft' | 'pending_human_review' | 'approved' | 'broadcasted' | 'revoked';
  distributionChannels: ('mobile_push' | 'sms_cell_broadcast' | 'emergency_radio' | 'humanitarian_corridor_radio')[];
  createdAt: string;
  expiresAt: string;
  evacuationRoutes?: {
    name: string;
    status: 'safe' | 'caution' | 'closed';
    details: string;
  }[];
}

export interface Shelter {
  id: string;
  name: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  currentOccupancy: number;
  amenities: ('potable_water' | 'medical_staff' | 'backup_power' | 'child_care' | 'food_rations' | 'wheelchair_accessible')[];
  status: 'open_accepting' | 'near_capacity' | 'full' | 'evacuating';
  contactPhone: string;
  address: string;
  securityStatus: 'secure' | 'monitored' | 'vulnerable';
}

export interface FamilyCheckIn {
  id: string;
  personName: string;
  familyCode: string; // for private lookup
  status: 'safe_at_shelter' | 'evacuating' | 'sheltered_at_home' | 'needs_medical_aid' | 'out_of_area';
  zone: string;
  message: string;
  timestamp: string;
  isPublicContactAllowed: boolean;
  contactNumber?: string;
}

export interface MissingPersonReport {
  id: string;
  fullName: string;
  age: number;
  lastSeenZone: string;
  lastSeenTimestamp: string;
  identifyingDetails: string;
  reportedByRelationship: string;
  status: 'actively_searching' | 'located_safe' | 'transferred_to_redcross';
  contactEmailOrPhone: string;
  caseOfficer?: string;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  type: 'power_grid' | 'water_facility' | 'hospital' | 'telecom_tower' | 'bridge_crossing' | 'fuel_depot';
  zone: string;
  coordinates: { lat: number; lng: number };
  operationalStatus: 'operational' | 'degraded' | 'offline' | 'threatened';
  backupAvailable: boolean;
  lastReported: string;
  civilianImpact: 'critical' | 'moderate' | 'low';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'verify_incident' | 'approve_alert' | 'reject_alert' | 'run_ai_risk_model' | 'export_data' | 'update_zone_privacy' | 'submit_public_report';
  targetId: string;
  details: string;
  ipAddressMasked: string;
}

export interface AIRiskReport {
  timestamp: string;
  overallThreatIndex: number; // 0 - 100
  securitySituationSummary: string;
  emergingClusters: {
    zone: string;
    incidentCount: number;
    dominantCategory: string;
    escalationTrend: 'accelerating' | 'stable' | 'de-escalating';
  }[];
  infrastructureRisks: {
    nodeType: string;
    vulnerabilityLevel: 'critical' | 'moderate' | 'low';
    recommendation: string;
  }[];
  humanitarianConcerns: string[];
  escalationIndicators: string[];
  recommendedCivilianProtectionActions: string[];
  disclaimer: string;
}
