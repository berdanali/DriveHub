import {
    Controller,
    Get,
    Post,
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
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('gps')
@Controller('gps')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GpsController {
    constructor(private readonly gpsService: GpsService) { }

    @Get('vehicle/:vehicleId/realtime')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get real-time vehicle location' })
    @ApiResponse({ status: 200, description: 'Current vehicle location' })
    async getRealTimeLocation(
        @Param('vehicleId') vehicleId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.gpsService.getRealTimeLocation(vehicleId, user.sub, user.role);
    }

    @Get('vehicle/:vehicleId/history')
    @Roles(RoleType.VEHICLE_OWNER, RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get vehicle GPS history' })
    @ApiResponse({ status: 200, description: 'GPS history logs' })
    async getVehicleHistory(
        @Param('vehicleId') vehicleId: string,
        @CurrentUser() user: JwtPayload,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.gpsService.getVehicleHistory(
            vehicleId,
            user.sub,
            user.role,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get('admin/all-locations')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all active vehicle locations (Admin)' })
    @ApiResponse({ status: 200, description: 'All active vehicle locations' })
    async getAllActiveLocations() {
        return this.gpsService.getAllActiveLocations();
    }

    @Post('vehicle/:vehicleId/simulate')
    @Roles(RoleType.SUPER_ADMIN)
    @ApiOperation({ summary: 'Simulate GPS movement (Admin - for testing)' })
    @ApiResponse({ status: 201, description: 'Simulated location' })
    async simulateMovement(
        @Param('vehicleId') vehicleId: string,
        @Body() body: { latitude: number; longitude: number },
    ) {
        return this.gpsService.simulateMovement(
            vehicleId,
            body.latitude,
            body.longitude,
        );
    }
}
