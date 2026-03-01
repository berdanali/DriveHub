import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ContactService', () => {
    let service: ContactService;
    let mailService: jest.Mocked<Partial<MailService>>;
    let prisma: any;

    const mockContactDto = {
        name: 'Test Kullanıcı',
        email: 'test@contact.com',
        phone: '+905551112233',
        subject: 'Test Konusu',
        message: 'Bu bir test mesajıdır. Lütfen dikkate almayınız.',
    };

    const mockContactMessage = {
        id: 'contact-123',
        ...mockContactDto,
        isRead: false,
        emailSent: true,
        createdAt: new Date(),
    };

    beforeEach(async () => {
        mailService = {
            sendContactForm: jest.fn(),
        };

        prisma = {
            contactMessage: {
                create: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactService,
                { provide: MailService, useValue: mailService },
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<ContactService>(ContactService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // SEND CONTACT FORM TESTLER
    // ============================================

    describe('sendContactForm()', () => {
        it('mesaj başarıyla gönderilir ve kaydedilir (e-posta başarılı)', async () => {
            (mailService.sendContactForm as jest.Mock).mockResolvedValue(true);
            prisma.contactMessage.create.mockResolvedValue(mockContactMessage);

            const result = await service.sendContactForm(mockContactDto);

            expect(result).toHaveProperty('id');
            expect(result.emailSent).toBe(true);
            expect(prisma.contactMessage.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: mockContactDto.name,
                    email: mockContactDto.email,
                    subject: mockContactDto.subject,
                    message: mockContactDto.message,
                    emailSent: true,
                }),
            });
        });

        it('e-posta gönderilemese bile mesaj kaydedilir', async () => {
            (mailService.sendContactForm as jest.Mock).mockResolvedValue(false);
            prisma.contactMessage.create.mockResolvedValue({
                ...mockContactMessage,
                emailSent: false,
            });

            const result = await service.sendContactForm(mockContactDto);

            expect(result.id).toBeDefined();
            expect(result.emailSent).toBe(false);
            expect(prisma.contactMessage.create).toHaveBeenCalled();
        });

        it('telefon numarası opsiyonel', async () => {
            const dtoWithoutPhone = { ...mockContactDto, phone: undefined };
            (mailService.sendContactForm as jest.Mock).mockResolvedValue(true);
            prisma.contactMessage.create.mockResolvedValue({
                ...mockContactMessage,
                phone: undefined,
            });

            const result = await service.sendContactForm(dtoWithoutPhone);

            expect(result).toBeDefined();
        });

        it('mail servisine doğru parametreler gönderilir', async () => {
            (mailService.sendContactForm as jest.Mock).mockResolvedValue(true);
            prisma.contactMessage.create.mockResolvedValue(mockContactMessage);

            await service.sendContactForm(mockContactDto);

            expect(mailService.sendContactForm).toHaveBeenCalledWith({
                name: mockContactDto.name,
                email: mockContactDto.email,
                phone: mockContactDto.phone,
                subject: mockContactDto.subject,
                message: mockContactDto.message,
            });
        });
    });

    // ============================================
    // GET ALL TESTLER
    // ============================================

    describe('getAll()', () => {
        it('tüm mesajları tarih sırasıyla döner', async () => {
            prisma.contactMessage.findMany.mockResolvedValue([
                mockContactMessage,
                { ...mockContactMessage, id: 'contact-456' },
            ]);

            const result = await service.getAll();

            expect(result).toHaveLength(2);
            expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            });
        });

        it('mesaj yoksa boş dizi döner', async () => {
            prisma.contactMessage.findMany.mockResolvedValue([]);

            const result = await service.getAll();

            expect(result).toHaveLength(0);
        });
    });

    // ============================================
    // MARK AS READ TESTLER
    // ============================================

    describe('markAsRead()', () => {
        it('mesajı okundu olarak işaretler', async () => {
            prisma.contactMessage.update.mockResolvedValue({
                ...mockContactMessage,
                isRead: true,
            });

            const result = await service.markAsRead('contact-123');

            expect(result.isRead).toBe(true);
            expect(prisma.contactMessage.update).toHaveBeenCalledWith({
                where: { id: 'contact-123' },
                data: { isRead: true },
            });
        });

        it('zaten okunmuş mesaj tekrar okundu yapılabilir', async () => {
            prisma.contactMessage.update.mockResolvedValue({
                ...mockContactMessage,
                isRead: true,
            });

            const result = await service.markAsRead('contact-123');

            expect(result.isRead).toBe(true);
        });
    });
});

