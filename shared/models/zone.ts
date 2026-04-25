import { AlertRiskLevel } from '../constants/enums';

export interface ZoneLocation {
	latitude: number;
	longitude: number;
}

export interface Zone {
	id: string;
	name: string;
	district: string;
	state: string;
	center: ZoneLocation;
	riskLevel: AlertRiskLevel;
	shelters: string[];
	updatedAt?: string;
}
