const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateRiskLevel, evaluateIntelligentRisk, predictHazardProbs } = require('../lib/modules/risk/riskEngine.js');

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

test('predictHazardProbs returns multi-hazard probability vector', () => {
  const probs = predictHazardProbs({
    alertType: 'FLOOD',
    rainfallMm: 100,
    windSpeedKph: 30,
    earthquakeMagnitude: 0,
    floodRisk: true,
    cycloneWarning: false,
    evacuationRequired: true,
    confidence: 0.9,
    sourcesCount: 2,
  });

  // All probabilities should be between 0 and 1
  Object.values(probs).forEach((p) => {
    assert.ok(p >= 0 && p <= 1, `Probability ${p} should be in [0,1]`);
  });

  // Flood should be the highest probability given the inputs
  assert.ok(probs.flood > 0.3, `Flood probability ${probs.flood} should be significant`);
  assert.ok(probs.flood >= probs.cyclone, 'Flood should dominate over cyclone');
});

test('predictHazardProbs detects cyclone hazard', () => {
  const probs = predictHazardProbs({
    alertType: 'CYCLONE',
    rainfallMm: 50,
    windSpeedKph: 150,
    earthquakeMagnitude: 0,
    cycloneWarning: true,
    confidence: 0.95,
    sourcesCount: 3,
  });

  assert.ok(probs.cyclone > 0.5, `Cyclone probability ${probs.cyclone} should be high`);
});

test('predictHazardProbs detects earthquake hazard', () => {
  const probs = predictHazardProbs({
    alertType: 'EARTHQUAKE',
    rainfallMm: 0,
    windSpeedKph: 0,
    earthquakeMagnitude: 7.2,
    confidence: 0.99,
    sourcesCount: 4,
  });

  assert.ok(probs.earthquake > 0.7, `Earthquake probability ${probs.earthquake} should be high`);
});

test('evaluateIntelligentRisk includes hazardProbabilities in output', () => {
  const assessment = evaluateIntelligentRisk({
    alertType: 'FLOOD',
    rainfallMm: 80,
    floodRisk: true,
    confidence: 0.85,
    sourcesCount: 2,
  });

  assert.ok(assessment.hazardProbabilities, 'hazardProbabilities should be present');
  assert.equal(typeof assessment.hazardProbabilities.flood, 'number');
  assert.equal(typeof assessment.hazardProbabilities.cyclone, 'number');
  assert.equal(typeof assessment.hazardProbabilities.earthquake, 'number');
});
