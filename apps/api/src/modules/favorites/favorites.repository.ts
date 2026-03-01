import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByUserId(userId: string) {
        return this.prisma.favorite.findMany({
            where: { userId },
            include: {
                vehicle: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(userId: string, vehicleId: string) {
        return this.prisma.favorite.findUnique({
            where: {
                userId_vehicleId: { userId, vehicleId },
            },
        });
    }

    async create(userId: string, vehicleId: string) {
        return this.prisma.favorite.create({
            data: { userId, vehicleId },
            include: {
                vehicle: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async delete(userId: string, vehicleId: string) {
        return this.prisma.favorite.delete({
            where: {
                userId_vehicleId: { userId, vehicleId },
            },
        });
    }

    async getUserFavoriteVehicleIds(userId: string): Promise<string[]> {
        const favorites = await this.prisma.favorite.findMany({
            where: { userId },
            select: { vehicleId: true },
        });
        return favorites.map((f) => f.vehicleId);
    }

    async count(userId: string): Promise<number> {
        return this.prisma.favorite.count({ where: { userId } });
    }
}

