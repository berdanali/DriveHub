import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(private readonly configService: ConfigService) {
        const secretOrKey = configService.get<string>('jwt.refreshSecret');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey,
            passReqToCallback: true,
        });
    }

    validate(
        req: Request,
        payload: JwtPayload,
    ): JwtPayload & { refreshToken: string } {
        const refreshToken = req.get('Authorization')?.replace('Bearer ', '').trim();

        return {
            ...payload,
            refreshToken: refreshToken || '',
        };
    }
}
