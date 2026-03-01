import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleType, VehicleStatus } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @Post()
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new vehicle listing' })
    @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
    async create(
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateVehicleDto,
    ) {
        return this.vehiclesService.create(user.sub, dto);
    }

    @Get('search')
    @Public()
    @ApiOperation({ summary: 'Search available vehicles' })
    @ApiResponse({ status: 200, description: 'List of vehicles' })
    async search(@Query() query: VehicleQueryDto) {
        return this.vehiclesService.search(query);
    }

    @Get('my')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current owner vehicles' })
    @ApiResponse({ status: 200, description: 'List of owner vehicles' })
    async getMyVehicles(@CurrentUser() user: JwtPayload) {
        return this.vehiclesService.getOwnerVehicles(user.sub);
    }

    @Get('admin/all')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all vehicles (Admin only)' })
    @ApiResponse({ status: 200, description: 'List of all vehicles' })
    async findAll(@Query() query: VehicleQueryDto) {
        return this.vehiclesService.findAll(query);
    }

    @Get('admin/active-locations')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get active vehicles with locations (Admin only)' })
    @ApiResponse({ status: 200, description: 'Vehicles with GPS coordinates' })
    async getActiveLocations() {
        return this.vehiclesService.getActiveVehiclesWithLocations();
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get vehicle by ID' })
    @ApiResponse({ status: 200, description: 'Vehicle details' })
    @ApiResponse({ status: 404, description: 'Vehicle not found' })
    async findOne(@Param('id') id: string) {
        return this.vehiclesService.findById(id);
    }

    @Patch(':id')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update vehicle' })
    @ApiResponse({ status: 200, description: 'Vehicle updated' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpdateVehicleDto,
    ) {
        return this.vehiclesService.update(id, user.sub, user.role, dto);
    }

    @Patch(':id/status')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update vehicle status' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    async updateStatus(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
        @Body('status') status: VehicleStatus,
    ) {
        return this.vehiclesService.updateStatus(id, status, user.sub, user.role);
    }

    @Patch(':id/approve')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Approve/reject vehicle listing (Admin only)' })
    @ApiResponse({ status: 200, description: 'Approval status updated' })
    async approve(
        @Param('id') id: string,
        @Body('isApproved') isApproved: boolean,
    ) {
        return this.vehiclesService.approveVehicle(id, isApproved);
    }

    @Delete(':id')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete vehicle' })
    @ApiResponse({ status: 204, description: 'Vehicle deleted' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        await this.vehiclesService.delete(id, user.sub, user.role);
    }
}
