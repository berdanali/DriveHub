import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Vehicle, VehicleStatus, Prisma } from '@prisma/client';

export type VehicleWithOwner = Vehicle & {
    owner: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
};

@Injectable()
export class VehiclesRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find vehicle by ID
     */
    async findById(id: string): Promise<VehicleWithOwner | null> {
        return this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Create a new vehicle
     */
    async create(data: Prisma.VehicleCreateInput): Promise<VehicleWithOwner> {
        return this.prisma.vehicle.create({
            data,
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Update a vehicle
     */
    async update(
        id: string,
        data: Prisma.VehicleUpdateInput,
    ): Promise<VehicleWithOwner> {
        return this.prisma.vehicle.update({
            where: { id },
            data,
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Delete a vehicle
     */
    async delete(id: string): Promise<void> {
        await this.prisma.vehicle.delete({ where: { id } });
    }

    /**
     * Find all vehicles with pagination and filters
     */
    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.VehicleWhereInput;
        orderBy?: Prisma.VehicleOrderByWithRelationInput;
    }): Promise<{ vehicles: VehicleWithOwner[]; total: number }> {
        const { skip, take, where, orderBy } = params;

        const [vehicles, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.vehicle.count({ where }),
        ]);

        return { vehicles, total };
    }

    /**
     * Find vehicles by owner ID
     */
    async findByOwnerId(ownerId: string): Promise<VehicleWithOwner[]> {
        return this.prisma.vehicle.findMany({
            where: { ownerId, deletedAt: null },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Update vehicle status
     */
    async updateStatus(
        id: string,
        status: VehicleStatus,
    ): Promise<VehicleWithOwner> {
        return this.prisma.vehicle.update({
            where: { id },
            data: { status },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Approve vehicle listing (Admin)
     */
    async approve(id: string, isApproved: boolean): Promise<VehicleWithOwner> {
        return this.prisma.vehicle.update({
            where: { id },
            data: { isApproved },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Update vehicle location
     */
    async updateLocation(
        id: string,
        latitude: number,
        longitude: number,
    ): Promise<void> {
        await this.prisma.vehicle.update({
            where: { id },
            data: { latitude, longitude },
        });
    }

    /**
     * Get all active (rented) vehicles with locations
     */
    async getActiveVehiclesWithLocations(): Promise<
        Pick<Vehicle, 'id' | 'make' | 'model' | 'licensePlate' | 'latitude' | 'longitude' | 'status'>[]
    > {
        return this.prisma.vehicle.findMany({
            where: {
                status: VehicleStatus.ACTIVE,
                latitude: { not: null },
                longitude: { not: null },
            },
            select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
                latitude: true,
                longitude: true,
                status: true,
            },
        });
    }
}
