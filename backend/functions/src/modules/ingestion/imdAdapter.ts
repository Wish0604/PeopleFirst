import * as logger from 'firebase-functions/logger';

import { RawExternalSignal } from './types';

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
    throw new Error(`IMD API request failed with ${response.status}`);
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

function buildMockSignals(nowIso: string): RawExternalSignal[] {
  return [
    {
      source: 'IMD',
      sourceTimestamp: nowIso,
      zoneId: 'zone-001',
      zoneName: 'Coastal Sector A',
      alertType: 'CYCLONE',
      rainfallMm: 86,
      windSpeedKph: 112,
      cycloneWarning: true,
      floodRisk: true,
      evacuationRequired: false,
      confidence: 0.82,
    },
    {
      source: 'IMD',
      sourceTimestamp: nowIso,
      zoneId: 'zone-002',
      zoneName: 'River Belt B',
      alertType: 'FLOOD',
      rainfallMm: 128,
      windSpeedKph: 45,
      floodRisk: true,
      evacuationRequired: true,
      confidence: 0.88,
    },
  ];
}

export async function fetchImdSignals(): Promise<RawExternalSignal[]> {
  const apiUrl = readString(process.env.IMD_API_URL);
  const nowIso = new Date().toISOString();

  if (!apiUrl) {
    logger.info('IMD_API_URL not configured. Using mock IMD payload for ingestion run.');
    return buildMockSignals(nowIso);
  }

  try {
    const rawItems = await fetchJsonArray(apiUrl);
    const mappedSignals = rawItems.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        source: 'IMD',
        sourceTimestamp: row.timestamp ?? row.observedAt ?? nowIso,
        zoneId: row.zoneId ?? row.zone_code ?? row.zone,
        zoneName: row.zoneName ?? row.zone_name ?? row.name,
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

    logger.info('IMD API ingestion completed', { sourceCount: mappedSignals.length });
    return mappedSignals;
  } catch (error) {
    logger.error('IMD API ingestion failed. Falling back to mock payload.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildMockSignals(nowIso);
  }
}
