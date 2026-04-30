function toFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readPoint(value) {
  if (!value) return null;

  if (Array.isArray(value) && value.length >= 2) {
    const [lat, lng] = value;
    const latitude = toFiniteNumber(lat);
    const longitude = toFiniteNumber(lng);

    if (latitude !== null && longitude !== null) {
      return [latitude, longitude];
    }
  }

  if (typeof value === 'object') {
    const latitude = toFiniteNumber(value.latitude ?? value._lat ?? value.lat);
    const longitude = toFiniteNumber(value.longitude ?? value._long ?? value.lng);

    if (latitude !== null && longitude !== null) {
      return [latitude, longitude];
    }
  }

  return null;
}

export function normalizeShelterRecord(shelter) {
  const point = readPoint(shelter.location ?? shelter.coords ?? shelter.position ?? shelter);
  const capacity = toFiniteNumber(shelter.capacity ?? shelter.totalCapacity ?? shelter.capacity_total);
  const available = toFiniteNumber(shelter.capacity_available ?? shelter.capacityAvailable);
  const occupied = toFiniteNumber(shelter.occupied ?? shelter.currentOccupancy ?? shelter.usage)
    ?? (capacity !== null && available !== null ? Math.max(0, capacity - available) : null);

  return {
    ...shelter,
    location: point,
    capacity,
    occupied,
  };
}

export function normalizeShelterRecords(shelters) {
  return shelters
    .map(normalizeShelterRecord)
    .filter((shelter) => Array.isArray(shelter.location));
}

export async function loadLocalShelters() {
  const response = await fetch('/pune_shelters.json');

  if (!response.ok) {
    throw new Error(`Failed to load local shelters: ${response.status}`);
  }

  const localShelters = await response.json();
  return normalizeShelterRecords(localShelters);
}