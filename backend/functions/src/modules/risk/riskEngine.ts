export type AlertRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAssessmentInput {
	riskLevel?: unknown;
	riskScore?: unknown;
	hazardScore?: unknown;
	confidence?: unknown;
	sourcesCount?: unknown;
	rainfallMm?: unknown;
	windSpeedKph?: unknown;
	floodRisk?: unknown;
	cycloneWarning?: unknown;
	earthquakeMagnitude?: unknown;
	evacuationRequired?: unknown;
	type?: unknown;
	alertType?: unknown;
	name?: unknown;
	zoneName?: unknown;
}

export interface RiskAssessment {
	level: AlertRiskLevel;
	score: number;
	reason: string;
	recommendedActions: string[];
}

export type RiskPriority = 'ROUTINE' | 'WATCH' | 'WARNING' | 'EMERGENCY';

export interface IntelligentRiskAssessment extends RiskAssessment {
	priority: RiskPriority;
	intelligenceScore: number;
	intelligenceReason: string;
	hazardProbabilities?: Record<string, number>;
}

const KNOWN_RISK_LEVELS: AlertRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function clampScore(score: number): number {
	if (score < 0) return 0;
	if (score > 100) return 100;
	return Math.round(score);
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

function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'string') {
		return ['true', 'yes', '1', 'y', 'on', 'high', 'severe'].includes(value.trim().toLowerCase());
	}

	return false;
}

function readString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeRiskLevel(value: unknown): AlertRiskLevel | undefined {
	const candidate = readString(value)?.toUpperCase();
	return candidate && KNOWN_RISK_LEVELS.includes(candidate as AlertRiskLevel)
		? (candidate as AlertRiskLevel)
		: undefined;
}

function scoreFromInputs(input: RiskAssessmentInput): number {
	const explicitScore = toNumber(input.riskScore ?? input.hazardScore);
	if (explicitScore !== undefined) {
		return clampScore(explicitScore);
	}

	let score = 0;
	const rainfallMm = toNumber(input.rainfallMm) ?? 0;
	const windSpeedKph = toNumber(input.windSpeedKph) ?? 0;
	const earthquakeMagnitude = toNumber(input.earthquakeMagnitude) ?? 0;
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';

	score += Math.min(rainfallMm, 120) * 0.4;
	score += Math.min(windSpeedKph, 160) * 0.35;
	score += Math.min(earthquakeMagnitude * 18, 60);

	if (toBoolean(input.floodRisk)) {
		score += 25;
	}

	if (toBoolean(input.cycloneWarning) || type === 'CYCLONE') {
		score += 20;
	}

	if (toBoolean(input.evacuationRequired) || type === 'EVACUATION') {
		score += 30;
	}

	if (type === 'EARTHQUAKE') {
		score += 15;
	}

	const confidence = toNumber(input.confidence);
	if (confidence !== undefined) {
		score += Math.max(0, Math.min(confidence, 1)) * 12;
	}

	const sourcesCount = toNumber(input.sourcesCount);
	if (sourcesCount !== undefined) {
		score += Math.min(sourcesCount, 4) * 4;
	}

	return clampScore(score);
}

function buildReason(input: RiskAssessmentInput, score: number, level: AlertRiskLevel): string {
	const sourceName = readString(input.zoneName ?? input.name) ?? 'location';
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';

	if (level === 'CRITICAL') {
		return `Critical conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	if (level === 'HIGH') {
		return `High risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	if (level === 'MEDIUM') {
		return `Medium risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
	}

	return `Low risk conditions detected for ${sourceName} (${type}) with score ${score}.`;
}

function buildRecommendedActions(level: AlertRiskLevel, input: RiskAssessmentInput): string[] {
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? 'GENERAL';
	const actions: string[] = [];

	if (level === 'HIGH' || level === 'CRITICAL') {
		actions.push('Prepare for immediate evacuation');
		actions.push('Gather emergency supplies');
	}

	if (level === 'CRITICAL') {
		actions.push('Move to the nearest safe shelter now');
	}

	if (type === 'FLOOD') {
		actions.push('Move to higher ground immediately');
	}

	if (type === 'CYCLONE') {
		actions.push('Secure loose outdoor items and stay indoors');
	}

	if (type === 'EARTHQUAKE') {
		actions.push('Drop, cover, and hold on');
	}

	if (type === 'EVACUATION') {
		actions.push('Follow the directed evacuation route');
	}

	if (toNumber(input.sourcesCount) !== undefined && (level === 'HIGH' || level === 'CRITICAL')) {
		actions.push('Cross-check alerts against multi-source confirmations');
	}

	if (actions.length === 0) {
		actions.push('Stay calm and monitor official updates');
	}

	return actions;
}

export function evaluateRiskLevel(input: RiskAssessmentInput): RiskAssessment {
	const explicitLevel = normalizeRiskLevel(input.riskLevel);
	const level = explicitLevel ?? (() => {
		const score = scoreFromInputs(input);
		if (score >= 85) return 'CRITICAL' as AlertRiskLevel;
		if (score >= 65) return 'HIGH' as AlertRiskLevel;
		if (score >= 35) return 'MEDIUM' as AlertRiskLevel;
		return 'LOW' as AlertRiskLevel;
	})();

	const score = explicitLevel
		? ({ LOW: 10, MEDIUM: 45, HIGH: 75, CRITICAL: 95 } as const)[explicitLevel]
		: scoreFromInputs(input);

	return {
		level,
		score,
		reason: buildReason(input, score, level),
		recommendedActions: buildRecommendedActions(level, input),
	};
}

function buildPriority(level: AlertRiskLevel, score: number): RiskPriority {
	if (level === 'CRITICAL' || score >= 90) return 'EMERGENCY';
	if (level === 'HIGH' || score >= 70) return 'WARNING';
	if (level === 'MEDIUM' || score >= 40) return 'WATCH';
	return 'ROUTINE';
}

function buildIntelligenceReason(input: RiskAssessmentInput, score: number, priority: RiskPriority): string {
	const sourceCount = toNumber(input.sourcesCount) ?? 1;
	const confidence = toNumber(input.confidence);
	const confidenceText = confidence !== undefined ? ` with confidence ${Math.round(confidence * 100)}%` : '';
	return `AI scoring synthesized ${sourceCount} source(s) into ${priority} priority at ${score}${confidenceText}.`;
}

export function evaluateIntelligentRisk(input: RiskAssessmentInput): IntelligentRiskAssessment {
	const assessment = evaluateRiskLevel(input);
	const priority = buildPriority(assessment.level, assessment.score);
	const intelligenceScore = clampScore(
		assessment.score + Math.min(toNumber(input.sourcesCount) ?? 1, 4) * 2 + (toNumber(input.confidence) ?? 0) * 10,
	);

	// Derive simple per-hazard probabilities using lightweight heuristics.
	// This is intentionally rule-based and interpretable; replace with ML model later.
	const hazardProbabilities: Record<string, number> = predictHazardProbs(input);

	return {
		...assessment,
		priority,
		intelligenceScore,
		intelligenceReason: buildIntelligenceReason(input, intelligenceScore, priority),
		hazardProbabilities,
	};
}

/**
 * Predict per-hazard probabilities from aggregated inputs using simple heuristics.
 * Returns values in [0,1] for a small set of hazards.
 */
export function predictHazardProbs(input: RiskAssessmentInput): Record<string, number> {
	const probs: Record<string, number> = {
		flood: 0,
		cyclone: 0,
		earthquake: 0,
		landslide: 0,
		fire: 0,
	};

	const rainfall = toNumber(input.rainfallMm) ?? 0;
	const wind = toNumber(input.windSpeedKph) ?? 0;
	const quake = toNumber(input.earthquakeMagnitude) ?? 0;
	const confidence = Math.max(0, Math.min(1, toNumber(input.confidence) ?? 0.7));
	const sources = Math.min(4, Math.max(1, toNumber(input.sourcesCount) ?? 1));
	const type = readString(input.alertType ?? input.type)?.toUpperCase() ?? '';

	// Flood heuristic: rainfall, explicit floodRisk flag, evacuationRequired
	let floodScore = 0;
	floodScore += Math.min(rainfall / 120, 1) * 0.7;
	if (toBoolean(input.floodRisk)) floodScore += 0.25;
	if (toBoolean(input.evacuationRequired)) floodScore += 0.25;

	// Cyclone heuristic: wind speed and cycloneWarning
	let cycloneScore = Math.min(wind / 160, 1) * 0.8;
	if (toBoolean(input.cycloneWarning) || type === 'CYCLONE') cycloneScore += 0.3;

	// Earthquake heuristic: magnitude
	let earthquakeScore = Math.min(quake / 8, 1) * 0.9;

	// Landslide heuristic: heavy rain + hilly zones (approx by rainfall and evacuation)
	let landslideScore = Math.min(rainfall / 100, 1) * 0.5;
	if (toBoolean(input.evacuationRequired)) landslideScore += 0.2;

	// Fire heuristic: high temperature or dry indicators not available — fallback to low base
	let fireScore = 0.05;
	if (type === 'FIRE') fireScore = 0.8;

	// Normalize and weight by confidence and source count
	const scaleFactor = Math.min(1, 0.5 + 0.15 * sources) * confidence;

	probs.flood = Math.min(1, floodScore * scaleFactor);
	probs.cyclone = Math.min(1, cycloneScore * scaleFactor);
	probs.earthquake = Math.min(1, earthquakeScore * scaleFactor);
	probs.landslide = Math.min(1, landslideScore * scaleFactor);
	probs.fire = Math.min(1, fireScore * scaleFactor);

	return probs;
}

