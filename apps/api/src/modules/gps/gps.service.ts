import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { GPSLog, RoleType } from '@prisma/client';

export interface GPSLocation {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp: Date;
}

@Injectable()
export class GpsService {
    private readonly logger = new Logger(GpsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    /**
     * Record GPS location for a vehicle
     * Stores in both Redis (real-time) and PostgreSQL (historical)
     */
    async recordLocation(data: GPSLocation): Promise<GPSLog> {
        // Store in Redis for real-time tracking
        await this.redisService.setVehicleLocation(data.vehicleId, {
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: data.timestamp,
        });

        // Store in PostgreSQL for historical data
        const gpsLog = await this.prisma.gPSLog.create({
            data: {
                vehicleId: data.vehicleId,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                heading: data.heading,
                accuracy: data.accuracy,
                recordedAt: data.timestamp,
            },
        });

        // Update vehicle's current location
        await this.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });

        this.logger.debug(
            `Recorded GPS location for vehicle ${data.vehicleId}: ${data.latitude}, ${data.longitude}`,
        );

        return gpsLog;
    }

    /**
     * Verify vehicle ownership
     */
    private async verifyVehicleAccess(
        vehicleId: string,
        userId: string,
        userRole: RoleType,
    ): Promise<void> {
        if (userRole === RoleType.SUPER_ADMIN) return;

        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { ownerId: true },
        });

        if (!vehicle) {
            throw new NotFoundException('Araç bulunamadı');
        }

        if (vehicle.ownerId !== userId) {
            throw new ForbiddenException('Sadece kendi araçlarınızın GPS verilerine erişebilirsiniz');
        }
    }

    /**
     * Get real-time location for a vehicle from Redis
     */
    async getRealTimeLocation(
        vehicleId: string,
        userId?: string,
        userRole?: RoleType,
    ): Promise<GPSLocation | null> {
        if (userId && userRole) {
            await this.verifyVehicleAccess(vehicleId, userId, userRole);
        }

        const location = await this.redisService.getVehicleLocation(vehicleId);
        if (!location) return null;

        return {
            vehicleId,
            ...location,
        };
    }

    /**
     * Get all active vehicle locations from Redis
     */
    async getAllActiveLocations(): Promise<GPSLocation[]> {
        const locations = await this.redisService.getAllVehicleLocations();
        const result: GPSLocation[] = [];

        locations.forEach((location, vehicleId) => {
            result.push({
                vehicleId,
                ...location,
            });
        });

        return result;
    }

    /**
     * Get historical GPS logs for a vehicle
     */
    async getVehicleHistory(
        vehicleId: string,
        userId: string,
        userRole: RoleType,
        startDate: Date,
        endDate: Date,
    ): Promise<GPSLog[]> {
        await this.verifyVehicleAccess(vehicleId, userId, userRole);

        return this.prisma.gPSLog.findMany({
            where: {
                vehicleId,
                recordedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { recordedAt: 'asc' },
        });
    }

    /**
     * Get the last known location from database
     */
    async getLastKnownLocation(vehicleId: string): Promise<GPSLog | null> {
        return this.prisma.gPSLog.findFirst({
            where: { vehicleId },
            orderBy: { recordedAt: 'desc' },
        });
    }

    /**
     * Simulate GPS movement for demo/testing
     * This simulates vehicle movement by generating random coordinates
     */
    async simulateMovement(
        vehicleId: string,
        baseLat: number,
        baseLng: number,
    ): Promise<GPSLocation> {
        // Small random offset to simulate movement
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;

        const location: GPSLocation = {
            vehicleId,
            latitude: baseLat + latOffset,
            longitude: baseLng + lngOffset,
            speed: Math.random() * 60 + 20, // 20-80 km/h
            heading: Math.random() * 360,
            accuracy: 5 + Math.random() * 10,
            timestamp: new Date(),
        };

        await this.recordLocation(location);

        return location;
    }
}
