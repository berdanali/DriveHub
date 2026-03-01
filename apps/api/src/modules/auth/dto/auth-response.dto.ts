import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

class UserResponseDto {
    @ApiProperty({ example: 'uuid-here' })
    id: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ enum: RoleType, example: RoleType.CUSTOMER })
    role: RoleType;
}

export class AuthResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refreshToken: string;

    @ApiProperty({ example: 'Bearer' })
    tokenType: string;
}
