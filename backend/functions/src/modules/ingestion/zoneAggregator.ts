import { AggregatedZoneSignal, NormalizedExternalSignal } from './types';

interface MutableAccumulator {
  zoneId: string;
  zoneName: string;
  latitudeSum: number;
  longitudeSum: number;
  coordinateCount: number;
  alertTypeVotes: Map<string, number>;
  rainfallSum: number;
  windSum: number;
  quakeSum: number;
  riskScoreSum: number;
  riskScoreCount: number;
  confidenceSum: number;
  count: number;
  floodRisk: boolean;
  cycloneWarning: boolean;
  evacuationRequired: boolean;
  latestSourceTimestamp: Date;
  sources: Set<AggregatedZoneSignal['sources'][number]>;
}

function dominantAlertType(votes: Map<string, number>): string {
  let selected = 'GENERAL';
  let maxVotes = -1;

  votes.forEach((value, key) => {
    if (value > maxVotes) {
      selected = key;
      maxVotes = value;
    }
  });

  return selected;
}

export function aggregateSignalsByZone(signals: NormalizedExternalSignal[]): AggregatedZoneSignal[] {
  const buckets = new Map<string, MutableAccumulator>();

  for (const signal of signals) {
    const existing = buckets.get(signal.zoneId);
    const bucket: MutableAccumulator = existing ?? {
      zoneId: signal.zoneId,
      zoneName: signal.zoneName,
      latitudeSum: 0,
      longitudeSum: 0,
      coordinateCount: 0,
      alertTypeVotes: new Map<string, number>(),
      rainfallSum: 0,
      windSum: 0,
      quakeSum: 0,
      riskScoreSum: 0,
      riskScoreCount: 0,
      confidenceSum: 0,
      count: 0,
      floodRisk: false,
      cycloneWarning: false,
      evacuationRequired: false,
      latestSourceTimestamp: signal.sourceTimestamp,
      sources: new Set<AggregatedZoneSignal['sources'][number]>(),
    };

    bucket.zoneName = signal.zoneName;
    if (signal.latitude !== undefined && signal.longitude !== undefined) {
      bucket.latitudeSum += signal.latitude;
      bucket.longitudeSum += signal.longitude;
      bucket.coordinateCount += 1;
    }
    bucket.rainfallSum += signal.rainfallMm;
    bucket.windSum += signal.windSpeedKph;
    bucket.quakeSum += signal.earthquakeMagnitude;
    bucket.confidenceSum += signal.confidence;
    bucket.count += 1;
    bucket.floodRisk = bucket.floodRisk || signal.floodRisk;
    bucket.cycloneWarning = bucket.cycloneWarning || signal.cycloneWarning;
    bucket.evacuationRequired = bucket.evacuationRequired || signal.evacuationRequired;
    bucket.sources.add(signal.source);

    if (signal.riskScore !== undefined) {
      bucket.riskScoreSum += signal.riskScore;
      bucket.riskScoreCount += 1;
    }

    bucket.alertTypeVotes.set(signal.alertType, (bucket.alertTypeVotes.get(signal.alertType) ?? 0) + 1);

    if (signal.sourceTimestamp.valueOf() > bucket.latestSourceTimestamp.valueOf()) {
      bucket.latestSourceTimestamp = signal.sourceTimestamp;
    }

    buckets.set(signal.zoneId, bucket);
  }

  return Array.from(buckets.values()).map((bucket) => ({
    zoneId: bucket.zoneId,
    zoneName: bucket.zoneName,
    latitude: bucket.coordinateCount > 0 ? Number((bucket.latitudeSum / bucket.coordinateCount).toFixed(6)) : undefined,
    longitude: bucket.coordinateCount > 0 ? Number((bucket.longitudeSum / bucket.coordinateCount).toFixed(6)) : undefined,
    alertType: dominantAlertType(bucket.alertTypeVotes),
    rainfallMm: Number((bucket.rainfallSum / bucket.count).toFixed(2)),
    windSpeedKph: Number((bucket.windSum / bucket.count).toFixed(2)),
    earthquakeMagnitude: Number((bucket.quakeSum / bucket.count).toFixed(2)),
    floodRisk: bucket.floodRisk,
    cycloneWarning: bucket.cycloneWarning,
    evacuationRequired: bucket.evacuationRequired,
    riskScore:
      bucket.riskScoreCount > 0
        ? Number((bucket.riskScoreSum / bucket.riskScoreCount).toFixed(2))
        : undefined,
    confidence: Number((bucket.confidenceSum / bucket.count).toFixed(2)),
    latestSourceTimestamp: bucket.latestSourceTimestamp,
    sources: Array.from(bucket.sources.values()),
  }));
}
