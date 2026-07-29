import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { ApplicantStore } from './applicant.store';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly store: ApplicantStore) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const header = req.headers.authorization ?? req.headers.Authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const user = this.store.userFromToken(token);
    if (!user) throw new UnauthorizedException('Sign in required');
    req.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ user?: { id: string; email: string; role: string } }>();
  return req.user;
});
