import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { RentalStatus, VehicleStatus, RoleType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { RentalsRepository, RentalWithDetails } from './rentals.repository';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class RentalsService {
    constructor(
        private readonly rentalsRepository: RentalsRepository,
        private readonly vehiclesService: VehiclesService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Create a new rental
     */
    async create(
        customerId: string,
        dto: CreateRentalDto,
    ): Promise<RentalWithDetails> {
        // Validate vehicle exists and is available
        const vehicle = await this.vehiclesService.findById(dto.vehicleId);

        if (vehicle.status !== VehicleStatus.AVAILABLE) {
            throw new BadRequestException('Araç kiralama için müsait değil');
        }

        if (!vehicle.isApproved) {
            throw new BadRequestException('Araç ilanı henüz onaylanmamış');
        }

        // Check for overlapping rentals
        const hasOverlap = await this.rentalsRepository.hasOverlappingRentals(
            dto.vehicleId,
            new Date(dto.startDate),
            new Date(dto.endDate),
        );

        if (hasOverlap) {
            throw new BadRequestException(
                'Araç seçilen tarihlerde zaten rezerve edilmiş',
            );
        }

        // Calculate pricing
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const totalDays = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (totalDays < 1) {
            throw new BadRequestException('Kiralama süresi en az 1 gün olmalıdır');
        }

        const dailyRate = Number(vehicle.dailyRate);
        const subtotal = dailyRate * totalDays;
        const commissionRate = this.configService.get<number>('commission.rate') || 0.15;
        const serviceFee = subtotal * commissionRate;
        const totalAmount = subtotal + serviceFee;

        // Create rental
        const rental = await this.rentalsRepository.create({
            startDate,
            endDate,
            dailyRate: new Decimal(dailyRate),
            totalDays,
            subtotal: new Decimal(subtotal),
            serviceFee: new Decimal(serviceFee),
            totalAmount: new Decimal(totalAmount),
            pickupLocation: dto.pickupLocation,
            returnLocation: dto.returnLocation,
            notes: dto.notes,
            vehicle: { connect: { id: dto.vehicleId } },
            customer: { connect: { id: customerId } },
        });

        // Update vehicle status
        await this.vehiclesService.updateStatus(dto.vehicleId, VehicleStatus.BOOKED);

        return rental;
    }

    /**
     * Get rental by ID
     */
    async findById(id: string): Promise<RentalWithDetails> {
        const rental = await this.rentalsRepository.findById(id);
        if (!rental) {
            throw new NotFoundException('Kiralama bulunamadı');
        }
        return rental;
    }

    /**
     * Get rental by ID with authorization check
     */
    async findByIdSecured(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        // Admin can view all
        if (userRole === RoleType.SUPER_ADMIN) {
            return rental;
        }

        // Customer can view their own rentals
        if (rental.customerId === userId) {
            return rental;
        }

        // Vehicle owner can view rentals for their vehicles
        if (rental.vehicle.ownerId === userId) {
            return rental;
        }

        throw new ForbiddenException('Bu kiralama detaylarını görme yetkiniz yok');
    }

    /**
     * Get customer's rentals
     */
    async getCustomerRentals(customerId: string): Promise<RentalWithDetails[]> {
        return this.rentalsRepository.findByCustomerId(customerId);
    }

    /**
     * Get vehicle rentals (for owner)
     */
    async getVehicleRentals(
        vehicleId: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails[]> {
        const vehicle = await this.vehiclesService.findById(vehicleId);

        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException(
                'Sadece kendi araçlarınızın kiralamalarını görebilirsiniz',
            );
        }

        return this.rentalsRepository.findByVehicleId(vehicleId);
    }

    /**
     * Start rental (activate)
     */
    async startRental(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        // Only owner or admin can start rental
        const vehicle = await this.vehiclesService.findById(rental.vehicleId);
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece araç sahibi kiralamayı başlatabilir');
        }

        if (rental.status !== RentalStatus.APPROVED) {
            throw new BadRequestException('Kiralama onaylanmış durumda değil');
        }

        // Update rental status
        const updated = await this.rentalsRepository.updateStatus(
            id,
            RentalStatus.ACTIVE,
        );

        // Update vehicle status
        await this.vehiclesService.updateStatus(rental.vehicleId, VehicleStatus.ACTIVE);

        return updated;
    }

    /**
     * Complete rental
     */
    async completeRental(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        const vehicle = await this.vehiclesService.findById(rental.vehicleId);
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece araç sahibi kiralamayı tamamlayabilir');
        }

        if (rental.status !== RentalStatus.ACTIVE) {
            throw new BadRequestException('Kiralama aktif değil');
        }

        // Update rental
        const updated = await this.rentalsRepository.update(id, {
            status: RentalStatus.COMPLETED,
            actualEndDate: new Date(),
        });

        // Update vehicle status
        await this.vehiclesService.updateStatus(
            rental.vehicleId,
            VehicleStatus.AVAILABLE,
        );

        return updated;
    }

    /**
     * Cancel rental
     */
    async cancelRental(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        // Customer or owner or admin can cancel
        if (
            rental.customerId !== userId &&
            userRole !== RoleType.SUPER_ADMIN
        ) {
            const vehicle = await this.vehiclesService.findById(rental.vehicleId);
            if (vehicle.ownerId !== userId) {
                throw new ForbiddenException('Bu kiralamayı iptal edemezsiniz');
            }
        }

        if (rental.status === RentalStatus.COMPLETED) {
            throw new BadRequestException('Tamamlanmış kiralama iptal edilemez');
        }

        if (rental.status === RentalStatus.CANCELLED) {
            throw new BadRequestException('Bu kiralama zaten iptal edilmiş');
        }

        if (rental.status === RentalStatus.REJECTED) {
            throw new BadRequestException('Reddedilmiş kiralama iptal edilemez');
        }

        // Update rental
        const updated = await this.rentalsRepository.updateStatus(
            id,
            RentalStatus.CANCELLED,
        );

        // Update vehicle status
        await this.vehiclesService.updateStatus(
            rental.vehicleId,
            VehicleStatus.AVAILABLE,
        );

        return updated;
    }

    /**
     * Get all rentals (Admin)
     */
    async findAll(pagination: PaginationDto): Promise<{
        rentals: RentalWithDetails[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, sortBy, sortOrder } = pagination;
        const skip = (page - 1) * limit;

        const orderBy = sortBy
            ? { [sortBy]: sortOrder || 'desc' }
            : { createdAt: 'desc' as const };

        const { rentals, total } = await this.rentalsRepository.findAll({
            skip,
            take: limit,
            orderBy,
        });

        return {
            rentals,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get rental statistics (Admin)
     */
    async getStatistics() {
        return this.rentalsRepository.getStatistics();
    }

    /**
     * Get rentals for owner's vehicles
     */
    async getOwnerRentals(ownerId: string): Promise<RentalWithDetails[]> {
        return this.rentalsRepository.findByOwnerId(ownerId);
    }

    /**
     * Approve rental request
     */
    async approveRental(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        // Only owner or admin can approve
        const vehicle = await this.vehiclesService.findById(rental.vehicleId);
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece araç sahibi talebi onaylayabilir');
        }

        if (rental.status !== RentalStatus.PENDING) {
            throw new BadRequestException('Bu talep zaten işlenmiş');
        }

        // Update rental status to approved
        return this.rentalsRepository.updateStatus(id, RentalStatus.APPROVED);
    }

    /**
     * Reject rental request
     */
    async rejectRental(
        id: string,
        userId: string,
        userRole: RoleType,
    ): Promise<RentalWithDetails> {
        const rental = await this.findById(id);

        // Only owner or admin can reject
        const vehicle = await this.vehiclesService.findById(rental.vehicleId);
        if (vehicle.ownerId !== userId && userRole !== RoleType.SUPER_ADMIN) {
            throw new ForbiddenException('Sadece araç sahibi talebi reddedebilir');
        }

        if (rental.status !== RentalStatus.PENDING) {
            throw new BadRequestException('Bu talep zaten işlenmiş');
        }

        // Update rental status to rejected
        const updated = await this.rentalsRepository.updateStatus(id, RentalStatus.REJECTED);

        // Make vehicle available again
        await this.vehiclesService.updateStatus(rental.vehicleId, VehicleStatus.AVAILABLE);

        return updated;
    }
}
