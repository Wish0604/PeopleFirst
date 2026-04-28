import { evaluateIntelligentRisk } from '../risk/riskEngine';
import { AggregatedZoneSignal } from './types';

export interface ZoneRiskDocument {
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
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskPriority: 'ROUTINE' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  riskReason: string;
  riskIntelligenceScore: number;
  riskIntelligenceReason: string;
  externalConfidence: number;
  externalSources: Array<'IMD' | 'SENSOR' | 'SATELLITE' | 'API'>;
  externalSourceCount: number;
  externalSourceTimestamp: string;
}

export function mapZoneToRiskDocument(zone: AggregatedZoneSignal): ZoneRiskDocument {
  const intelligentRisk = evaluateIntelligentRisk({
    alertType: zone.alertType,
    rainfallMm: zone.rainfallMm,
    windSpeedKph: zone.windSpeedKph,
    earthquakeMagnitude: zone.earthquakeMagnitude,
    floodRisk: zone.floodRisk,
    cycloneWarning: zone.cycloneWarning,
    evacuationRequired: zone.evacuationRequired,
    riskScore: zone.riskScore,
    confidence: zone.confidence,
    sourcesCount: zone.sources.length,
    zoneName: zone.zoneName,
  });

  return {
    zoneName: zone.zoneName,
    latitude: zone.latitude,
    longitude: zone.longitude,
    alertType: zone.alertType,
    rainfallMm: zone.rainfallMm,
    windSpeedKph: zone.windSpeedKph,
    earthquakeMagnitude: zone.earthquakeMagnitude,
    floodRisk: zone.floodRisk,
    cycloneWarning: zone.cycloneWarning,
    evacuationRequired: zone.evacuationRequired,
    riskScore: intelligentRisk.score,
    riskLevel: intelligentRisk.level,
    riskPriority: intelligentRisk.priority,
    riskReason: intelligentRisk.reason,
    riskIntelligenceScore: intelligentRisk.intelligenceScore,
    riskIntelligenceReason: intelligentRisk.intelligenceReason,
    externalConfidence: zone.confidence,
    externalSources: zone.sources,
    externalSourceCount: zone.sources.length,
    externalSourceTimestamp: zone.latestSourceTimestamp.toISOString(),
  };
}