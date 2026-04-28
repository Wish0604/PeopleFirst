import { ExternalSource, NormalizedExternalSignal, RawExternalSignal } from './types';
import { resolveZoneMapping } from './zoneResolver';

const KNOWN_SOURCES: ExternalSource[] = ['IMD', 'SENSOR', 'SATELLITE', 'API'];

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'y', 'on', 'high', 'severe'].includes(value.trim().toLowerCase());
  }

  return false;
}

function toString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeSource(value: unknown): ExternalSource {
  const candidate = toString(value).toUpperCase();
  if (KNOWN_SOURCES.includes(candidate as ExternalSource)) {
    return candidate as ExternalSource;
  }

  return 'API';
}

function normalizeTimestamp(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  const candidate = toString(value);
  if (candidate.length > 0) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }

  return new Date();
}

function sanitizeAlertType(value: unknown): string {
  const candidate = toString(value).toUpperCase();
  return candidate.length > 0 ? candidate : 'GENERAL';
}

function sanitizeZoneId(value: unknown): string {
  const candidate = toString(value);
  return candidate.length > 0 ? candidate : '';
}

function clampConfidence(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 100) / 100;
}

export function normalizeExternalSignal(raw: RawExternalSignal): NormalizedExternalSignal | null {
  const zoneMapping = resolveZoneMapping(raw as Record<string, unknown>);
  if (!zoneMapping) {
    return null;
  }

  const zoneId = sanitizeZoneId(zoneMapping.zoneId);
  const zoneName = zoneMapping.zoneName || `Zone ${zoneId}`;
  const riskScoreValue = toNumber(raw.riskScore, Number.NaN);

  return {
    source: normalizeSource(raw.source),
    sourceTimestamp: normalizeTimestamp(raw.sourceTimestamp),
    zoneId,
    zoneName,
    latitude: zoneMapping.latitude,
    longitude: zoneMapping.longitude,
    alertType: sanitizeAlertType(raw.alertType),
    rainfallMm: toNumber(raw.rainfallMm),
    windSpeedKph: toNumber(raw.windSpeedKph),
    earthquakeMagnitude: toNumber(raw.earthquakeMagnitude),
    floodRisk: toBoolean(raw.floodRisk),
    cycloneWarning: toBoolean(raw.cycloneWarning),
    evacuationRequired: toBoolean(raw.evacuationRequired),
    riskScore: Number.isFinite(riskScoreValue) ? riskScoreValue : undefined,
    confidence: clampConfidence(toNumber(raw.confidence, 0.7)),
  };
}
