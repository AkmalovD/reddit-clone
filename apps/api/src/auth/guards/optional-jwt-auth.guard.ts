import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest<TUser>(err: unknown, user: TUser): TUser | null {
        return user ?? null
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context)
    }
}