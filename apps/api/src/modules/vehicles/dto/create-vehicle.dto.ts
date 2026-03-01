import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsInt,
    Min,
    Max,
    MinLength,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
    @ApiProperty({ example: 'Toyota' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    make: string;

    @ApiProperty({ example: 'Camry' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    model: string;

    @ApiProperty({ example: 2023 })
    @Type(() => Number)
    @IsInt()
    @Min(1990)
    @Max(2030)
    year: number;

    @ApiProperty({ example: 'ABC-123' })
    @IsString()
    @MinLength(2)
    @MaxLength(20)
    licensePlate: string;

    @ApiProperty({ example: 'Silver' })
    @IsString()
    @MinLength(2)
    @MaxLength(30)
    color: string;

    @ApiProperty({ example: 5, default: 5 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(15)
    seats?: number = 5;

    @ApiProperty({ example: 'Gasoline' })
    @IsString()
    fuelType: string;

    @ApiProperty({ example: 'Automatic' })
    @IsString()
    transmission: string;

    @ApiProperty({ example: 75.00, description: 'Daily rental rate in USD' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    dailyRate: number;

    @ApiProperty({ example: 'Comfortable sedan with great fuel economy', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiProperty({
        example: ['https://example.com/car1.jpg'],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({
        example: ['GPS', 'Bluetooth', 'Backup Camera'],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @ApiProperty({ example: '123 Main St, City', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: 40.7128, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    latitude?: number;

    @ApiProperty({ example: -74.0060, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    longitude?: number;
}
