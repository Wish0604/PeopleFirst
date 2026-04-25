import { UserResponseStatus, UserRole } from '../constants/enums';

export interface User {
	id: string;
	email: string;
	role: UserRole;
	zoneId?: string;
	lastLoginAt?: string;
}

export interface UserResponse {
	id: string;
	alertId: string;
	userId: string;
	status: UserResponseStatus;
	createdAt?: string;
	location?: {
		latitude: number;
		longitude: number;
	};
}
