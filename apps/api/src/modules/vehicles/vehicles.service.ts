import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { VehicleStatus, RoleType } from '@prisma/client';
import { VehiclesRepository, VehicleWithOwner } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class VehiclesService {
    constructor(
        private readonly vehiclesRepository: VehiclesRepository,
        private readonly redisService: RedisService,
    ) { }

    /**
     * Create a new vehicle listing
     */
    async create(
        ownerId: string,
        dto: CreateVehicleDto,
    ): Promise<VehicleWithOwner> {
        return this.vehiclesRepository.create({
            ...dto,
            owner: { connect: { id: ownerId } },
        });
    }

    /**
     * Find vehicle by ID
     */
    async findById(id: string): Promise<VehicleWithOwner> {
        const vehicle = await this.vehiclesRepository.findById(id);
        if (!vehicle || vehicle.deletedAt !== null) {
            throw new NotFoundException('Araç bulunamadı');
        }
        return vehicle;
    }

    /**
     * Update vehicle
     */
    async update(
        id: string,
        userId: string,
        userRole: RoleType,
        dto: UpdateVehicleDto,
    ): Promise<VehicleWithOwner> {
        const vehicle = await this.findById(id);

        // Only owner or admin can update
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece kendi araçlarınızı güncelleyebilirsiniz');
        }

        return this.vehiclesRepository.update(id, dto);
    }

    /**
     * Delete vehicle
     */
    async delete(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<void> {
        const vehicle = await this.findById(id);

        // Only owner or admin can delete
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece kendi araçlarınızı silebilirsiniz');
        }

        // Soft delete
        await this.vehiclesRepository.update(id, { deletedAt: new Date() });
    }

    /**
     * Search vehicles with caching
     */
    async search(query: VehicleQueryDto): Promise<{
        vehicles: VehicleWithOwner[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, search, status, minPrice, maxPrice, fuelType, transmission, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        // Generate cache key
        const cacheKey = JSON.stringify(query);

        // Check cache first
        const cached = await this.redisService.getCachedVehicleSearch<{
            vehicles: VehicleWithOwner[];
            total: number;
        }>(cacheKey);

        if (cached) {
            return {
                ...cached,
                page,
                limit,
                totalPages: Math.ceil(cached.total / limit),
            };
        }

        // Build where clause
        const where: any = {
            isApproved: true,
            deletedAt: null,
        };

        // Search filter (marka, model, açıklama)
        if (search) {
            where.OR = [
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            where.dailyRate = {};
            if (minPrice) where.dailyRate.gte = Number(minPrice);
            if (maxPrice) where.dailyRate.lte = Number(maxPrice);
        }

        // Fuel type filter (case-insensitive)
        if (fuelType) {
            where.fuelType = { contains: fuelType, mode: 'insensitive' };
        }

        // Transmission filter (case-insensitive)
        if (transmission) {
            where.transmission = { contains: transmission, mode: 'insensitive' };
        }

        const orderBy = sortBy
            ? { [sortBy]: sortOrder || 'asc' }
            : { createdAt: 'desc' as const };

        const { vehicles, total } = await this.vehiclesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy,
        });

        // Cache results for 5 minutes
        await this.redisService.cacheVehicleSearch(cacheKey, { vehicles, total }, 300);

        return {
            vehicles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get owner's vehicles
     */
    async getOwnerVehicles(ownerId: string): Promise<VehicleWithOwner[]> {
        return this.vehiclesRepository.findByOwnerId(ownerId);
    }

    /**
     * Update vehicle status
     */
    async updateStatus(
        id: string,
        status: VehicleStatus,
        userId?: string,
        userRole?: RoleType,
    ): Promise<VehicleWithOwner> {
        const vehicle = await this.findById(id);

        // Ownership check when called from controller (userId provided)
        if (userId && userRole && vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece kendi araçlarınızın durumunu güncelleyebilirsiniz');
        }

        return this.vehiclesRepository.updateStatus(id, status);
    }

    /**
     * Approve/reject vehicle listing (Admin only)
     */
    async approveVehicle(
        id: string,
        isApproved: boolean,
    ): Promise<VehicleWithOwner> {
        await this.findById(id);
        return this.vehiclesRepository.approve(id, isApproved);
    }

    /**
     * Get all active vehicles with locations (for admin map)
     */
    async getActiveVehiclesWithLocations() {
        return this.vehiclesRepository.getActiveVehiclesWithLocations();
    }

    /**
     * Get all vehicles (Admin only) with pagination
     */
    async findAll(query: VehicleQueryDto): Promise<{
        vehicles: VehicleWithOwner[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, search, status, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { licensePlate: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const orderBy = sortBy
            ? { [sortBy]: sortOrder || 'asc' }
            : { createdAt: 'desc' as const };

        const { vehicles, total } = await this.vehiclesRepository.findAll({
            skip,
            take: limit,
            where,
            orderBy,
        });

        return {
            vehicles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
