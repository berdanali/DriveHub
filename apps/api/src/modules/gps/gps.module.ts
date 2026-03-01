import { Module } from '@nestjs/common';
import { GpsGateway } from './gps.gateway';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';

@Module({
    controllers: [GpsController],
    providers: [GpsGateway, GpsService],
    exports: [GpsService],
})
export class GpsModule { }
