import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, RoleType, Prisma } from '@prisma/client';

export type UserWithRole = User & { role: { name: RoleType } };

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find user by ID with role
     */
    async findById(id: string): Promise<UserWithRole | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }

    /**
     * Find user by email with role
     */
    async findByEmail(email: string): Promise<UserWithRole | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }

    /**
     * Create a new user
     */
    async create(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        roleType: RoleType;
    }): Promise<UserWithRole> {
        // First, ensure the role exists
        const role = await this.prisma.role.upsert({
            where: { name: data.roleType },
            update: {},
            create: { name: data.roleType },
        });

        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                roleId: role.id,
            },
            include: { role: true },
        });
    }

    /**
     * Update user's refresh token
     */
    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: { refreshToken },
        });
    }

    /**
     * Update user
     */
    async update(
        id: string,
        data: Prisma.UserUpdateInput,
    ): Promise<UserWithRole> {
        return this.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }

    /**
     * Find all users with pagination
     */
    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<{ users: UserWithRole[]; total: number }> {
        const { skip, take, where, orderBy } = params;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
                include: { role: true },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }

    /**
     * Toggle user active status (ban/unban)
     */
    async toggleActive(id: string, isActive: boolean): Promise<UserWithRole> {
        return this.prisma.user.update({
            where: { id },
            data: { isActive },
            include: { role: true },
        });
    }
}
