import { ZoneMappingResult } from './types';

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function buildGeoZoneId(latitude: number, longitude: number): string {
  const latBucket = Math.round(latitude * 10) / 10;
  const lngBucket = Math.round(longitude * 10) / 10;
  return `geo_${latBucket.toFixed(1).replace('-', 'm').replace('.', '_')}_${lngBucket
    .toFixed(1)
    .replace('-', 'm')
    .replace('.', '_')}`;
}

export function resolveZoneMapping(raw: Record<string, unknown>): ZoneMappingResult | null {
  const zoneId = readString(raw.zoneId);
  const zoneName = readString(raw.zoneName) ?? readString(raw.name);
  const latitude = toNumber(raw.latitude ?? raw.lat);
  const longitude = toNumber(raw.longitude ?? raw.lng ?? raw.lon);

  if (zoneId) {
    return {
      zoneId,
      zoneName: zoneName ?? `Zone ${zoneId}`,
      latitude,
      longitude,
    };
  }

  if (latitude !== undefined && longitude !== undefined) {
    return {
      zoneId: buildGeoZoneId(latitude, longitude),
      zoneName: zoneName ?? `Geo Zone ${latitude.toFixed(1)}, ${longitude.toFixed(1)}`,
      latitude,
      longitude,
    };
  }

  return null;
}