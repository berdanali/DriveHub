import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
    ) {}

    async sendContactForm(dto: ContactDto): Promise<{ id: string; emailSent: boolean }> {
        this.logger.log(`İletişim formu alındı: ${dto.email} - ${dto.subject}`);
        
        // Mail göndermeyi dene
        const emailSent = await this.mailService.sendContactForm({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            subject: dto.subject,
            message: dto.message,
        });

        // Veritabanına kaydet
        const contactMessage = await this.prisma.contactMessage.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                subject: dto.subject,
                message: dto.message,
                emailSent,
            },
        });

        this.logger.log(`İletişim mesajı kaydedildi: ${contactMessage.id}`);

        return {
            id: contactMessage.id,
            emailSent,
        };
    }

    async getAll() {
        return this.prisma.contactMessage.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async markAsRead(id: string) {
        return this.prisma.contactMessage.update({
            where: { id },
            data: { isRead: true },
        });
    }
}

