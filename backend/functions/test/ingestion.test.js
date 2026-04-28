const test = require('node:test');
const assert = require('node:assert/strict');

const { fetchAllExternalSignals } = require('../lib/modules/ingestion/sourceAdapters.js');
const { resolveZoneMapping } = require('../lib/modules/ingestion/zoneResolver.js');
const { normalizeExternalSignal } = require('../lib/modules/ingestion/normalizer.js');
const { aggregateSignalsByZone } = require('../lib/modules/ingestion/zoneAggregator.js');
const { mapZoneToRiskDocument } = require('../lib/modules/ingestion/zoneRiskMapper.js');

test('resolveZoneMapping derives a geo zone from coordinates', () => {
  const zone = resolveZoneMapping({ latitude: 12.345, longitude: 77.987, zoneName: 'South Zone' });

  assert.ok(zone);
  assert.equal(zone.zoneName, 'South Zone');
  assert.equal(zone.zoneId.startsWith('geo_'), true);
});

test('normalizeExternalSignal preserves explicit zone identifiers', () => {
  const normalized = normalizeExternalSignal({
    source: 'IMD',
    sourceTimestamp: '2026-04-27T10:00:00.000Z',
    zoneId: 'zone-9',
    zoneName: 'Zone Nine',
    rainfallMm: 44,
    windSpeedKph: 22,
    floodRisk: true,
    confidence: 0.8,
  });

  assert.ok(normalized);
  assert.equal(normalized.zoneId, 'zone-9');
  assert.equal(normalized.zoneName, 'Zone Nine');
  assert.equal(normalized.rainfallMm, 44);
});

test('aggregateSignalsByZone merges multiple source readings into one zone record', () => {
  const aggregated = aggregateSignalsByZone([
    normalizeExternalSignal({
      source: 'IMD',
      sourceTimestamp: '2026-04-27T10:00:00.000Z',
      zoneId: 'zone-1',
      zoneName: 'Zone One',
      alertType: 'FLOOD',
      rainfallMm: 80,
      floodRisk: true,
      confidence: 0.9,
    }),
    normalizeExternalSignal({
      source: 'SENSOR',
      sourceTimestamp: '2026-04-27T10:05:00.000Z',
      zoneId: 'zone-1',
      zoneName: 'Zone One',
      alertType: 'FLOOD',
      rainfallMm: 100,
      windSpeedKph: 14,
      floodRisk: true,
      confidence: 0.7,
    }),
  ].filter(Boolean));

  assert.equal(aggregated.length, 1);
  assert.equal(aggregated[0].zoneId, 'zone-1');
  assert.equal(aggregated[0].sources.length, 2);
  assert.equal(aggregated[0].rainfallMm, 90);
});

test('fetchAllExternalSignals fans in multi-source payloads', async () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    IMD_API_URL: process.env.IMD_API_URL,
    SENSOR_API_URL: process.env.SENSOR_API_URL,
    SATELLITE_API_URL: process.env.SATELLITE_API_URL,
    GENERAL_API_URL: process.env.GENERAL_API_URL,
  };

  process.env.IMD_API_URL = 'https://imd.example/api';
  process.env.SENSOR_API_URL = 'https://sensor.example/api';
  process.env.SATELLITE_API_URL = 'https://sat.example/api';
  process.env.GENERAL_API_URL = 'https://api.example/api';

  global.fetch = async (url) => {
    const body =
      url === 'https://imd.example/api'
        ? [{ zoneId: 'zone-a', zoneName: 'Zone A', rainfallMm: 12 }]
        : url === 'https://sensor.example/api'
          ? [{ zoneId: 'zone-b', zoneName: 'Zone B', floodRisk: true }]
          : url === 'https://sat.example/api'
            ? [{ zoneId: 'zone-c', zoneName: 'Zone C', cycloneWarning: true }]
            : [{ zoneId: 'zone-d', zoneName: 'Zone D', riskScore: 72 }];

    return {
      ok: true,
      json: async () => body,
    };
  };

  try {
    const signals = await fetchAllExternalSignals();
    assert.equal(signals.length, 4);
    assert.equal(signals.some((signal) => signal.zoneId === 'zone-a'), true);
    assert.equal(signals.some((signal) => signal.zoneId === 'zone-d'), true);
  } finally {
    global.fetch = originalFetch;
    process.env.IMD_API_URL = originalEnv.IMD_API_URL;
    process.env.SENSOR_API_URL = originalEnv.SENSOR_API_URL;
    process.env.SATELLITE_API_URL = originalEnv.SATELLITE_API_URL;
    process.env.GENERAL_API_URL = originalEnv.GENERAL_API_URL;
  }
});

test('mapZoneToRiskDocument emits intelligence metadata for alert pipeline', () => {
  const [zone] = aggregateSignalsByZone([
    normalizeExternalSignal({
      source: 'IMD',
      sourceTimestamp: '2026-04-27T10:00:00.000Z',
      zoneId: 'zone-risk-1',
      zoneName: 'Zone Risk One',
      latitude: 12.91,
      longitude: 77.6,
      alertType: 'CYCLONE',
      rainfallMm: 95,
      windSpeedKph: 118,
      cycloneWarning: true,
      floodRisk: true,
      confidence: 0.9,
    }),
    normalizeExternalSignal({
      source: 'SATELLITE',
      sourceTimestamp: '2026-04-27T10:05:00.000Z',
      zoneId: 'zone-risk-1',
      zoneName: 'Zone Risk One',
      latitude: 12.92,
      longitude: 77.61,
      alertType: 'CYCLONE',
      windSpeedKph: 124,
      cycloneWarning: true,
      confidence: 0.92,
    }),
  ].filter(Boolean));

  const riskDoc = mapZoneToRiskDocument(zone);

  assert.equal(riskDoc.zoneName, 'Zone Risk One');
  assert.equal(riskDoc.externalSourceCount, 2);
  assert.ok(['HIGH', 'CRITICAL'].includes(riskDoc.riskLevel));
  assert.ok(['WARNING', 'EMERGENCY'].includes(riskDoc.riskPriority));
  assert.equal(typeof riskDoc.riskIntelligenceScore, 'number');
  assert.equal(typeof riskDoc.riskIntelligenceReason, 'string');
  assert.equal(typeof riskDoc.externalSourceTimestamp, 'string');
});
