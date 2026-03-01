import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRentalDto {
    @ApiProperty({ example: 'uuid-of-vehicle' })
    @IsUUID()
    vehicleId: string;

    @ApiProperty({ example: '2024-02-15T10:00:00Z' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2024-02-20T10:00:00Z' })
    @IsDateString()
    endDate: string;

    @ApiProperty({ example: '123 Main St, City' })
    @IsString()
    pickupLocation: string;

    @ApiProperty({ example: '456 Oak Ave, City', required: false })
    @IsOptional()
    @IsString()
    returnLocation?: string;

    @ApiProperty({ example: 'Please have the car ready by 10am', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
