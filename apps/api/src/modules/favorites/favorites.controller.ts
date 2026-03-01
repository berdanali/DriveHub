import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}

    @Get()
    @ApiOperation({ summary: 'Favorilerimi getir' })
    @ApiResponse({ status: 200, description: 'Favori araçlar listesi' })
    async getMyFavorites(@CurrentUser() user: JwtPayload) {
        return this.favoritesService.getUserFavorites(user.sub);
    }

    @Get('ids')
    @ApiOperation({ summary: 'Favori araç ID\'lerimi getir' })
    @ApiResponse({ status: 200, description: 'Favori araç ID listesi' })
    async getMyFavoriteIds(@CurrentUser() user: JwtPayload) {
        return this.favoritesService.getUserFavoriteIds(user.sub);
    }

    @Post(':vehicleId')
    @ApiOperation({ summary: 'Favorilere araç ekle' })
    @ApiResponse({ status: 201, description: 'Araç favorilere eklendi' })
    @ApiResponse({ status: 409, description: 'Araç zaten favorilerde' })
    async addFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('vehicleId') vehicleId: string,
    ) {
        return this.favoritesService.addFavorite(user.sub, vehicleId);
    }

    @Delete(':vehicleId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Favorilerden araç çıkar' })
    @ApiResponse({ status: 200, description: 'Araç favorilerden çıkarıldı' })
    @ApiResponse({ status: 404, description: 'Araç favorilerde değil' })
    async removeFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('vehicleId') vehicleId: string,
    ) {
        await this.favoritesService.removeFavorite(user.sub, vehicleId);
        return { message: 'Araç favorilerden çıkarıldı' };
    }

    @Post(':vehicleId/toggle')
    @ApiOperation({ summary: 'Favori toggle (ekle/çıkar)' })
    @ApiResponse({ status: 200, description: 'Favori durumu değiştirildi' })
    async toggleFavorite(
        @CurrentUser() user: JwtPayload,
        @Param('vehicleId') vehicleId: string,
    ) {
        return this.favoritesService.toggleFavorite(user.sub, vehicleId);
    }
}

