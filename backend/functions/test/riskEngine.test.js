const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateRiskLevel, evaluateIntelligentRisk } = require('../lib/modules/risk/riskEngine.js');

test('evaluateRiskLevel escalates strong flood conditions', () => {
  const assessment = evaluateRiskLevel({
    alertType: 'FLOOD',
    rainfallMm: 110,
    floodRisk: true,
    sourcesCount: 3,
  });

  assert.ok(['HIGH', 'CRITICAL'].includes(assessment.level));
  assert.ok(assessment.score >= 65);
  assert.equal(Array.isArray(assessment.recommendedActions), true);
});

test('evaluateIntelligentRisk returns priority and intelligence metadata', () => {
  const assessment = evaluateIntelligentRisk({
    alertType: 'CYCLONE',
    windSpeedKph: 120,
    cycloneWarning: true,
    confidence: 0.88,
    sourcesCount: 4,
  });

  assert.ok(['WARNING', 'EMERGENCY'].includes(assessment.priority));
  assert.ok(assessment.intelligenceScore >= assessment.score);
  assert.equal(typeof assessment.intelligenceReason, 'string');
});
