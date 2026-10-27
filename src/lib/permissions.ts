import type { UserRole } from '@/types/api';

/** Roles that can create poultry batches (backend poultry:write). */
export function canWritePoultry(role?: UserRole | null) {
  return (
    role === 'owner' ||
    role === 'admin' ||
    role === 'farm_manager' ||
    role === 'farm_supervisor' ||
    role === 'veterinarian' ||
    role === 'worker'
  );
}

/** Roles that can add costs (backend cost:write). */
export function canWriteCost(role?: UserRole | null) {
  return (
    role === 'owner' ||
    role === 'admin' ||
    role === 'farm_manager' ||
    role === 'accountant' ||
    role === 'farm_supervisor' ||
    role === 'worker'
  );
}

/** Roles that can register cattle and write milk or weight (backend cow:write). */
export function canWriteCattle(role?: UserRole | null) {
  return canWritePoultry(role);
}

export function isOwnerFirm(role?: UserRole | null) {
  return role === 'owner' || role === 'admin';
}
