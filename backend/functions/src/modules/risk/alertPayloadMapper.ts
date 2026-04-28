import { AlertRiskLevel, IntelligentRiskAssessment } from './riskEngine';

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function shouldRaiseAlert(level: AlertRiskLevel): boolean {
  return level === 'HIGH' || level === 'CRITICAL';
}

export function buildAlertTitle(zoneName: string, level: AlertRiskLevel): string {
  return `Emergency ${level} for ${zoneName}`;
}

export function buildAlertMessage(zoneName: string, level: AlertRiskLevel, reason: string, actions: string[]): string {
  const actionText = actions.length > 0 ? ` Actions: ${actions.join('; ')}.` : '';
  return `${zoneName} is now at ${level} risk. ${reason}${actionText}`;
}

export interface BuildRiskAlertPayloadInput {
  zoneId: string;
  zone: Record<string, unknown>;
  assessment: IntelligentRiskAssessment;
}

export function buildRiskAlertPayload({ zoneId, zone, assessment }: BuildRiskAlertPayloadInput): Record<string, unknown> {
  const zoneName = readString(zone.zoneName ?? zone.name ?? zone.title) ?? `Zone ${zoneId}`;
  const alertType = readString(zone.alertType ?? zone.type)?.toUpperCase() ?? 'GENERAL';
  const targetPhone = readString(zone.targetPhone);
  const preferredChannel = readString(zone.preferredChannel)?.toLowerCase();

  return {
    title: buildAlertTitle(zoneName, assessment.level),
    message: buildAlertMessage(zoneName, assessment.level, assessment.reason, assessment.recommendedActions),
    riskLevel: assessment.level,
    riskPriority: assessment.priority,
    type: alertType,
    source: 'zone-risk',
    sourceZoneId: zoneId,
    sourceZoneName: zoneName,
    riskScore: assessment.score,
    riskIntelligenceScore: assessment.intelligenceScore,
    riskIntelligenceReason: assessment.intelligenceReason,
    recommendedActions: assessment.recommendedActions,
    preferredChannel,
    targetPhone,
  };
}