import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 mesaj / dakika
    @ApiOperation({ summary: 'İletişim formu gönder' })
    @ApiResponse({ status: 200, description: 'Mesaj başarıyla gönderildi' })
    @ApiResponse({ status: 429, description: 'Çok fazla mesaj gönderildi' })
    async sendContactForm(@Body() dto: ContactDto): Promise<{ message: string }> {
        const result = await this.contactService.sendContactForm(dto);
        return { 
            message: 'Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.',
        };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tüm iletişim mesajlarını listele (Admin)' })
    async getAll() {
        return this.contactService.getAll();
    }

    @Patch(':id/read')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mesajı okundu olarak işaretle (Admin)' })
    async markAsRead(@Param('id') id: string) {
        return this.contactService.markAsRead(id);
    }
}

