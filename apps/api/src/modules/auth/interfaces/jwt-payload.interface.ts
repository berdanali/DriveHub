import { RoleType } from '@prisma/client';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    role: RoleType;
    iat?: number;
    exp?: number;
}
