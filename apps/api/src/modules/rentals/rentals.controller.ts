import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('rentals')
@Controller('rentals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RentalsController {
    constructor(private readonly rentalsService: RentalsService) { }

    @Post()
    @Roles(RoleType.CUSTOMER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new rental booking' })
    @ApiResponse({ status: 201, description: 'Rental created successfully' })
    async create(
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateRentalDto,
    ) {
        return this.rentalsService.create(user.sub, dto);
    }

    @Get('my-rentals')
    @Roles(RoleType.CUSTOMER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get current user rentals' })
    @ApiResponse({ status: 200, description: 'List of user rentals' })
    async getMyRentals(@CurrentUser() user: JwtPayload) {
        return this.rentalsService.getCustomerRentals(user.sub);
    }

    @Get('owner')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get rentals for owner vehicles' })
    @ApiResponse({ status: 200, description: 'List of rentals for owner vehicles' })
    async getOwnerRentals(@CurrentUser() user: JwtPayload) {
        return this.rentalsService.getOwnerRentals(user.sub);
    }

    @Patch(':id/approve')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Approve rental request (Owner only)' })
    @ApiResponse({ status: 200, description: 'Rental approved' })
    async approveRental(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.approveRental(id, user.sub, user.role);
    }

    @Patch(':id/reject')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Reject rental request (Owner only)' })
    @ApiResponse({ status: 200, description: 'Rental rejected' })
    async rejectRental(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.rejectRental(id, user.sub, user.role);
    }

    @Get('vehicle/:vehicleId')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get rentals for a vehicle (Owner only)' })
    @ApiResponse({ status: 200, description: 'List of vehicle rentals' })
    async getVehicleRentals(
        @Param('vehicleId') vehicleId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.getVehicleRentals(vehicleId, user.sub, user.role);
    }

    @Get('admin/all')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all rentals (Admin only)' })
    @ApiResponse({ status: 200, description: 'List of all rentals' })
    async findAll(@Query() pagination: PaginationDto) {
        return this.rentalsService.findAll(pagination);
    }

    @Get('admin/statistics')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get rental statistics (Admin only)' })
    @ApiResponse({ status: 200, description: 'Rental statistics' })
    async getStatistics() {
        return this.rentalsService.getStatistics();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get rental by ID' })
    @ApiResponse({ status: 200, description: 'Rental details' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.findByIdSecured(id, user.sub, user.role);
    }

    @Patch(':id/start')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Start rental (Owner only)' })
    @ApiResponse({ status: 200, description: 'Rental started' })
    async startRental(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.startRental(id, user.sub, user.role);
    }

    @Patch(':id/complete')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Complete rental (Owner only)' })
    @ApiResponse({ status: 200, description: 'Rental completed' })
    async completeRental(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.completeRental(id, user.sub, user.role);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel rental' })
    @ApiResponse({ status: 200, description: 'Rental cancelled' })
    async cancelRental(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.rentalsService.cancelRental(id, user.sub, user.role);
    }
}
