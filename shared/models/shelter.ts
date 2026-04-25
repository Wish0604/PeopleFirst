export interface ShelterLocation {
	latitude: number;
	longitude: number;
}

export interface Shelter {
	id: string;
	name: string;
	zoneId: string;
	address: string;
	capacity: number;
	occupancy: number;
	location: ShelterLocation;
	updatedAt?: string;
}
