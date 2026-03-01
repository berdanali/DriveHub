import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Rental, RentalStatus, Prisma } from '@prisma/client';

export type RentalWithDetails = Rental & {
    vehicle: {
        id: string;
        make: string;
        model: string;
        licensePlate: string;
        images: string[];
        ownerId: string;
    };
    customer: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
};

@Injectable()
export class RentalsRepository {
    constructor(private readonly prisma: PrismaService) { }

    private readonly includeDetails = {
        vehicle: {
            select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
                images: true,
                ownerId: true,
            },
        },
        customer: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        },
    };

    /**
     * Create a new rental
     */
    async create(data: Prisma.RentalCreateInput): Promise<RentalWithDetails> {
        return this.prisma.rental.create({
            data,
            include: this.includeDetails,
        });
    }

    /**
     * Find rental by ID
     */
    async findById(id: string): Promise<RentalWithDetails | null> {
        return this.prisma.rental.findUnique({
            where: { id },
            include: this.includeDetails,
        });
    }

    /**
     * Update rental
     */
    async update(
        id: string,
        data: Prisma.RentalUpdateInput,
    ): Promise<RentalWithDetails> {
        return this.prisma.rental.update({
            where: { id },
            data,
            include: this.includeDetails,
        });
    }

    /**
     * Find rentals by customer ID
     */
    async findByCustomerId(customerId: string): Promise<RentalWithDetails[]> {
        return this.prisma.rental.findMany({
            where: { customerId },
            include: this.includeDetails,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find rentals by vehicle ID
     */
    async findByVehicleId(vehicleId: string): Promise<RentalWithDetails[]> {
        return this.prisma.rental.findMany({
            where: { vehicleId },
            include: this.includeDetails,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find rentals by owner ID (for vehicles owned by user)
     */
    async findByOwnerId(ownerId: string): Promise<RentalWithDetails[]> {
        return this.prisma.rental.findMany({
            where: {
                vehicle: {
                    ownerId: ownerId,
                },
            },
            include: this.includeDetails,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find all rentals with pagination
     */
    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.RentalWhereInput;
        orderBy?: Prisma.RentalOrderByWithRelationInput;
    }): Promise<{ rentals: RentalWithDetails[]; total: number }> {
        const { skip, take, where, orderBy } = params;

        const [rentals, total] = await Promise.all([
            this.prisma.rental.findMany({
                skip,
                take,
                where,
                orderBy,
                include: this.includeDetails,
            }),
            this.prisma.rental.count({ where }),
        ]);

        return { rentals, total };
    }

    /**
     * Update rental status
     */
    async updateStatus(
        id: string,
        status: RentalStatus,
    ): Promise<RentalWithDetails> {
        return this.prisma.rental.update({
            where: { id },
            data: { status },
            include: this.includeDetails,
        });
    }

    /**
     * Check if vehicle has overlapping rentals
     */
    async hasOverlappingRentals(
        vehicleId: string,
        startDate: Date,
        endDate: Date,
        excludeRentalId?: string,
    ): Promise<boolean> {
        const count = await this.prisma.rental.count({
            where: {
                vehicleId,
                id: excludeRentalId ? { not: excludeRentalId } : undefined,
                status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });

        return count > 0;
    }

    /**
     * Get rental statistics for admin
     */
    async getStatistics(): Promise<{
        totalRentals: number;
        activeRentals: number;
        completedRentals: number;
        pendingRentals: number;
        totalRevenue: number;
    }> {
        const [totalRentals, activeRentals, completedRentals, pendingRentals, revenueResult] =
            await Promise.all([
                this.prisma.rental.count(),
                this.prisma.rental.count({ where: { status: RentalStatus.ACTIVE } }),
                this.prisma.rental.count({ where: { status: RentalStatus.COMPLETED } }),
                this.prisma.rental.count({ where: { status: RentalStatus.PENDING } }),
                this.prisma.rental.aggregate({
                    _sum: { totalAmount: true },
                    where: { status: { in: [RentalStatus.COMPLETED, RentalStatus.ACTIVE] } },
                }),
            ]);

        return {
            totalRentals,
            activeRentals,
            completedRentals,
            pendingRentals,
            totalRevenue: revenueResult._sum.totalAmount?.toNumber() ?? 0,
        };
    }
}
