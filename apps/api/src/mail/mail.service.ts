import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private isReady = false;

    constructor(private readonly configService: ConfigService) {
        const mailUser = this.configService.get<string>('MAIL_USER') || process.env.MAIL_USER;
        const mailPass = this.configService.get<string>('MAIL_PASSWORD') || process.env.MAIL_PASSWORD;

        if (!mailPass) {
            this.logger.warn('MAIL_PASSWORD ayarlanmamış! E-posta gönderimi devre dışı.');
            return;
        }

        // Gmail SMTP yapılandırması
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: mailPass,
            },
        });

        // SMTP bağlantısını doğrula
        this.transporter.verify()
            .then(() => {
                this.isReady = true;
                this.logger.log('SMTP bağlantısı başarılı - Mail servisi hazır');
            })
            .catch((err) => {
                this.logger.error(`SMTP bağlantı hatası: ${err.message}`);
            });
    }

    /**
     * E-posta doğrulama maili gönder
     */
    async sendEmailVerification(email: string, token: string, firstName: string): Promise<void> {
        if (!this.transporter || !this.isReady) {
            this.logger.warn(`Mail servisi hazır değil, doğrulama maili gönderilemedi: ${email}`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
        
        this.logger.log(`Doğrulama maili hazırlanıyor: ${email}, URL: ${frontendUrl}/verify-email?token=...`);

        const mailOptions = {
            from: '"RentaCar" <berdanali002@gmail.com>',
            to: email,
            subject: 'E-posta Adresinizi Doğrulayın - RentaCar',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">RentaCar</h1>
                        <p style="color: #6B7280; margin-top: 5px;">Premium Araç Kiralama</p>
                    </div>
                    
                    <div style="background: #F9FAFB; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #1F2937; margin-top: 0;">Merhaba ${firstName || 'Değerli Müşterimiz'},</h2>
                        
                        <p style="color: #4B5563; line-height: 1.6;">
                            RentaCar'a hoş geldiniz! Hesabınızı aktifleştirmek için lütfen aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                                E-postamı Doğrula
                            </a>
                        </div>
                        
                        <p style="color: #6B7280; font-size: 14px;">
                            Veya bu linki tarayıcınıza kopyalayın:<br>
                            <a href="${verificationUrl}" style="color: #4F46E5; word-break: break-all;">${verificationUrl}</a>
                        </p>
                        
                        <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
                            Bu link 24 saat geçerlidir. Bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
                        <p>© 2024 RentaCar. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Doğrulama e-postası gönderildi: ${email} (ID: ${info.messageId}, Response: ${info.response})`);
        } catch (error) {
            this.logger.error(`E-posta gönderme hatası [${email}]: ${error.message}`, error.stack);
            // Hata fırlatmıyoruz, kullanıcı kaydı devam etsin
        }
    }

    /**
     * Şifre sıfırlama maili gönder
     */
    async sendPasswordReset(email: string, token: string, firstName: string): Promise<void> {
        if (!this.transporter || !this.isReady) {
            this.logger.warn(`Mail servisi hazır değil, şifre sıfırlama maili gönderilemedi: ${email}`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: '"RentaCar" <berdanali002@gmail.com>',
            to: email,
            subject: 'Şifre Sıfırlama Talebi - RentaCar',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">RentaCar</h1>
                        <p style="color: #6B7280; margin-top: 5px;">Premium Araç Kiralama</p>
                    </div>
                    
                    <div style="background: #F9FAFB; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #1F2937; margin-top: 0;">Merhaba ${firstName || 'Değerli Müşterimiz'},</h2>
                        
                        <p style="color: #4B5563; line-height: 1.6;">
                            Şifrenizi sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                                Şifremi Sıfırla
                            </a>
                        </div>
                        
                        <p style="color: #6B7280; font-size: 14px;">
                            Veya bu linki tarayıcınıza kopyalayın:<br>
                            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
                        </p>
                        
                        <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
                            Bu link 15 dakika geçerlidir. Bu işlemi siz yapmadıysanız, şifrenizi değiştirmenizi öneririz.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
                        <p>© 2024 RentaCar. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Şifre sıfırlama e-postası gönderildi: ${email} (ID: ${info.messageId})`);
        } catch (error) {
            this.logger.error(`Şifre sıfırlama e-posta hatası [${email}]: ${error.message}`, error.stack);
        }
    }

    /**
     * İletişim formu maili gönder
     */
    async sendContactForm(data: {
        name: string;
        email: string;
        phone?: string;
        subject: string;
        message: string;
    }): Promise<boolean> {
        // Mail credentials yoksa hata verme, sadece logla
        if (!this.configService.get<string>('MAIL_PASSWORD')) {
            this.logger.warn('Mail şifresi ayarlanmamış. Mesaj kaydedildi ancak e-posta gönderilemedi.');
            this.logger.log(`[İLETİŞİM] Ad: ${data.name}, E-posta: ${data.email}, Telefon: ${data.phone || '-'}, Konu: ${data.subject}, Mesaj: ${data.message}`);
            return false;
        }

        const mailOptions = {
            from: '"RentaCar İletişim" <berdanali002@gmail.com>',
            to: 'berdanali002@gmail.com',
            replyTo: data.email,
            subject: `[İletişim Formu] ${data.subject}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">RentaCar</h1>
                        <p style="color: #6B7280; margin-top: 5px;">Yeni İletişim Formu Mesajı</p>
                    </div>
                    
                    <div style="background: #F9FAFB; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #1F2937; margin-top: 0;">📩 Yeni Mesaj</h2>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; width: 120px;">Ad Soyad:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: 500;">${data.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">E-posta:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937;">
                                    <a href="mailto:${data.email}" style="color: #4F46E5;">${data.email}</a>
                                </td>
                            </tr>
                            ${data.phone ? `
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Telefon:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937;">
                                    <a href="tel:${data.phone}" style="color: #4F46E5;">${data.phone}</a>
                                </td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Konu:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: 500;">${data.subject}</td>
                            </tr>
                        </table>
                        
                        <div style="margin-top: 20px;">
                            <p style="color: #6B7280; margin-bottom: 10px;">Mesaj:</p>
                            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB;">
                                <p style="color: #1F2937; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
                        <p>Bu mesaj RentaCar web sitesindeki iletişim formundan gönderilmiştir.</p>
                    </div>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`İletişim formu e-postası gönderildi: ${data.email}`);
            return true;
        } catch (error) {
            this.logger.error(`E-posta gönderme hatası: ${error.message}`);
            // Hata fırlatma, mesaj loglansın yeter
            this.logger.log(`[İLETİŞİM] Ad: ${data.name}, E-posta: ${data.email}, Telefon: ${data.phone || '-'}, Konu: ${data.subject}, Mesaj: ${data.message}`);
            return false;
        }
    }
}

