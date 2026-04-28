export const AUTHORITY_ROLES = ['ADMIN', 'COLLECTOR', 'NDRF'];

export function getRoleLabel(role) {
  return role ? role.toUpperCase() : 'UNASSIGNED';
}