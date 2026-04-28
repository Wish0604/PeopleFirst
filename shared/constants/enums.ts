export enum AlertRiskLevel {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
	CRITICAL = 'CRITICAL',
}

export enum AlertType {
	GENERAL = 'GENERAL',
	FLOOD = 'FLOOD',
	CYCLONE = 'CYCLONE',
	EARTHQUAKE = 'EARTHQUAKE',
	EVACUATION = 'EVACUATION',
}

export enum UserResponseStatus {
	SAFE = 'SAFE',
	NEED_HELP = 'NEED_HELP',
}

export enum DeliveryStatus {
	SENT = 'SENT',
	FAILED = 'FAILED',
	PENDING = 'PENDING',
}

export enum UserRole {
	CITIZEN = 'CITIZEN',
	VOLUNTEER = 'VOLUNTEER',
	COLLECTOR = 'COLLECTOR',
	NDRF = 'NDRF',
	ADMIN = 'ADMIN',
}
