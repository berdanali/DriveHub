import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Decorator to extract current user from request
 * @example getProfile(@CurrentUser() user: JwtPayload)
 * @example getUserId(@CurrentUser('sub') userId: string)
 */
export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as JwtPayload;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
