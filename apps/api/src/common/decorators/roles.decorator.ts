import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @example @Roles(RoleType.SUPER_ADMIN, RoleType.VEHICLE_OWNER)
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
