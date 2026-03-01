import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { RentalsRepository } from './rentals.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
    imports: [VehiclesModule],
    controllers: [RentalsController],
    providers: [RentalsService, RentalsRepository],
    exports: [RentalsService],
})
export class RentalsModule { }
