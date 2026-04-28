import * as logger from 'firebase-functions/logger';

import { ExternalSource, RawExternalSignal } from './types';
import { fetchImdSignals } from './imdAdapter';

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function fetchJsonArray(url: string): Promise<unknown[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`External API request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }

  return [];
}

function buildMockSignals(source: ExternalSource, zoneId: string, zoneName: string): RawExternalSignal[] {
  const timestamp = new Date().toISOString();

  switch (source) {
    case 'IMD':
      return [
        {
          source,
          sourceTimestamp: timestamp,
          zoneId,
          zoneName,
          alertType: 'CYCLONE',
          rainfallMm: 96,
          windSpeedKph: 108,
          floodRisk: true,
          cycloneWarning: true,
          evacuationRequired: false,
          confidence: 0.84,
        },
      ];
    case 'SENSOR':
      return [
        {
          source,
          sourceTimestamp: timestamp,
          zoneId,
          zoneName,
          alertType: 'FLOOD',
          rainfallMm: 74,
          floodRisk: true,
          confidence: 0.71,
        },
      ];
    case 'SATELLITE':
      return [
        {
          source,
          sourceTimestamp: timestamp,
          zoneId,
          zoneName,
          alertType: 'CYCLONE',
          windSpeedKph: 123,
          cycloneWarning: true,
          confidence: 0.9,
        },
      ];
    case 'API':
    default:
      return [
        {
          source,
          sourceTimestamp: timestamp,
          zoneId,
          zoneName,
          alertType: 'GENERAL',
          confidence: 0.55,
        },
      ];
  }
}

function buildSignalsFromRows(source: ExternalSource, rows: unknown[]): RawExternalSignal[] {
  return rows.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      source,
      sourceTimestamp: row.timestamp ?? row.observedAt ?? row.time ?? new Date().toISOString(),
      zoneId: row.zoneId ?? row.zone_code ?? row.zone,
      zoneName: row.zoneName ?? row.zone_name ?? row.name,
      latitude: row.latitude ?? row.lat,
      longitude: row.longitude ?? row.lng ?? row.lon,
      alertType: row.alertType ?? row.type ?? row.event,
      rainfallMm: row.rainfallMm ?? row.rainfall,
      windSpeedKph: row.windSpeedKph ?? row.windSpeed,
      earthquakeMagnitude: row.earthquakeMagnitude ?? row.magnitude,
      floodRisk: row.floodRisk ?? row.flood,
      cycloneWarning: row.cycloneWarning ?? row.cyclone,
      evacuationRequired: row.evacuationRequired ?? row.evacuation,
      riskScore: row.riskScore,
      confidence: row.confidence,
    } as RawExternalSignal;
  });
}

async function fetchAdapterSignals(
  source: ExternalSource,
  envKey: string,
  fallbackZoneId: string,
  fallbackZoneName: string,
): Promise<RawExternalSignal[]> {
  const apiUrl = readString(process.env[envKey]);
  if (!apiUrl) {
    logger.info(`${envKey} not configured. Using mock payload for ${source}.`);
    return buildMockSignals(source, fallbackZoneId, fallbackZoneName);
  }

  try {
    const rawItems = await fetchJsonArray(apiUrl);
    const mappedSignals = buildSignalsFromRows(source, rawItems);
    logger.info(`${source} API ingestion completed`, { sourceCount: mappedSignals.length });
    return mappedSignals;
  } catch (error) {
    logger.error(`${source} API ingestion failed. Falling back to mock payload.`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildMockSignals(source, fallbackZoneId, fallbackZoneName);
  }
}

export async function fetchAllExternalSignals(): Promise<RawExternalSignal[]> {
  const [imdSignals, sensorSignals, satelliteSignals, apiSignals] = await Promise.all([
    fetchImdSignals(),
    fetchAdapterSignals('SENSOR', 'SENSOR_API_URL', 'sensor-001', 'Sensor Cluster Alpha'),
    fetchAdapterSignals('SATELLITE', 'SATELLITE_API_URL', 'satellite-001', 'Satellite Watch Delta'),
    fetchAdapterSignals('API', 'GENERAL_API_URL', 'api-001', 'External API Omega'),
  ]);

  return [...imdSignals, ...sensorSignals, ...satelliteSignals, ...apiSignals];
}