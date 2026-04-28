const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateIntelligentRisk } = require('../lib/modules/risk/riskEngine.js');
const {
  shouldRaiseAlert,
  buildRiskAlertPayload,
} = require('../lib/modules/risk/alertPayloadMapper.js');

test('shouldRaiseAlert only returns true for HIGH/CRITICAL', () => {
  assert.equal(shouldRaiseAlert('LOW'), false);
  assert.equal(shouldRaiseAlert('MEDIUM'), false);
  assert.equal(shouldRaiseAlert('HIGH'), true);
  assert.equal(shouldRaiseAlert('CRITICAL'), true);
});

test('buildRiskAlertPayload includes enriched intelligent risk metadata', () => {
  const zoneId = 'zone-onrisk-1';
  const zone = {
    zoneName: 'Zone OnRisk One',
    alertType: 'FLOOD',
    preferredChannel: 'SMS',
    targetPhone: '+919900000000',
    rainfallMm: 120,
    floodRisk: true,
  };

  const assessment = evaluateIntelligentRisk({
    zoneName: zone.zoneName,
    alertType: zone.alertType,
    rainfallMm: zone.rainfallMm,
    floodRisk: zone.floodRisk,
    confidence: 0.9,
    sourcesCount: 3,
  });

  const payload = buildRiskAlertPayload({ zoneId, zone, assessment });

  assert.equal(payload.source, 'zone-risk');
  assert.equal(payload.sourceZoneId, zoneId);
  assert.equal(payload.sourceZoneName, 'Zone OnRisk One');
  assert.equal(payload.type, 'FLOOD');
  assert.equal(payload.preferredChannel, 'sms');
  assert.equal(payload.targetPhone, '+919900000000');
  assert.equal(payload.riskLevel, assessment.level);
  assert.equal(payload.riskPriority, assessment.priority);
  assert.equal(payload.riskScore, assessment.score);
  assert.equal(payload.riskIntelligenceScore, assessment.intelligenceScore);
  assert.equal(payload.riskIntelligenceReason, assessment.intelligenceReason);
  assert.equal(Array.isArray(payload.recommendedActions), true);

  if (assessment.level === 'HIGH' || assessment.level === 'CRITICAL') {
    assert.equal(shouldRaiseAlert(assessment.level), true);
  }
});
