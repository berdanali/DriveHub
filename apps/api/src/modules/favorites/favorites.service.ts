import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
    constructor(private readonly repository: FavoritesRepository) {}

    /**
     * Kullanıcının tüm favorilerini getir
     */
    async getUserFavorites(userId: string) {
        const favorites = await this.repository.findByUserId(userId);
        return favorites.map((fav) => ({
            id: fav.id,
            vehicleId: fav.vehicleId,
            createdAt: fav.createdAt,
            vehicle: fav.vehicle,
        }));
    }

    /**
     * Favorilere araç ekle
     */
    async addFavorite(userId: string, vehicleId: string) {
        // Zaten favorilerde mi kontrol et
        const existing = await this.repository.findOne(userId, vehicleId);
        if (existing) {
            throw new ConflictException('Bu araç zaten favorilerinizde');
        }

        return this.repository.create(userId, vehicleId);
    }

    /**
     * Favorilerden araç çıkar
     */
    async removeFavorite(userId: string, vehicleId: string) {
        const existing = await this.repository.findOne(userId, vehicleId);
        if (!existing) {
            throw new NotFoundException('Bu araç favorilerinizde değil');
        }

        await this.repository.delete(userId, vehicleId);
    }

    /**
     * Araç favori mi kontrol et
     */
    async isFavorite(userId: string, vehicleId: string): Promise<boolean> {
        const fav = await this.repository.findOne(userId, vehicleId);
        return !!fav;
    }

    /**
     * Kullanıcının favori araç ID'lerini getir
     */
    async getUserFavoriteIds(userId: string): Promise<string[]> {
        return this.repository.getUserFavoriteVehicleIds(userId);
    }

    /**
     * Favori toggle (ekle/çıkar)
     */
    async toggleFavorite(userId: string, vehicleId: string): Promise<{ isFavorite: boolean }> {
        const existing = await this.repository.findOne(userId, vehicleId);
        
        if (existing) {
            await this.repository.delete(userId, vehicleId);
            return { isFavorite: false };
        } else {
            await this.repository.create(userId, vehicleId);
            return { isFavorite: true };
        }
    }
}

