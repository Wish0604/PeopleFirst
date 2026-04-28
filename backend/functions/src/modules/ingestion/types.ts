export type ExternalSource = 'IMD' | 'SENSOR' | 'SATELLITE' | 'API';

export interface RawExternalSignal {
  source?: unknown;
  sourceTimestamp?: unknown;
  zoneId?: unknown;
  zoneName?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  alertType?: unknown;
  rainfallMm?: unknown;
  windSpeedKph?: unknown;
  earthquakeMagnitude?: unknown;
  floodRisk?: unknown;
  cycloneWarning?: unknown;
  evacuationRequired?: unknown;
  riskScore?: unknown;
  confidence?: unknown;
}

export interface NormalizedExternalSignal {
  source: ExternalSource;
  sourceTimestamp: Date;
  zoneId: string;
  zoneName: string;
  latitude?: number;
  longitude?: number;
  alertType: string;
  rainfallMm: number;
  windSpeedKph: number;
  earthquakeMagnitude: number;
  floodRisk: boolean;
  cycloneWarning: boolean;
  evacuationRequired: boolean;
  riskScore?: number;
  confidence: number;
}

export interface ZoneMappingResult {
  zoneId: string;
  zoneName: string;
  latitude?: number;
  longitude?: number;
}

export interface AggregatedZoneSignal {
  zoneId: string;
  zoneName: string;
  latitude?: number;
  longitude?: number;
  alertType: string;
  rainfallMm: number;
  windSpeedKph: number;
  earthquakeMagnitude: number;
  floodRisk: boolean;
  cycloneWarning: boolean;
  evacuationRequired: boolean;
  riskScore?: number;
  confidence: number;
  latestSourceTimestamp: Date;
  sources: ExternalSource[];
}
