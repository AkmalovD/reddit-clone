import { ConflictException, ForbiddenException, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { hash, verify } from '@node-rs/argon2';
import { Prisma } from '../../generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { createHash, randomBytes } from 'node:crypto';


const ARGON2_OPTIONS = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
}

@Injectable()
export class AuthService implements OnModuleInit {
    private dummyHash!: string

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService
    ) {}

    async onModuleInit() {
        this.dummyHash = await hash('timing-attack-placeholder', ARGON2_OPTIONS)
    }

    async register(dto: RegisterDto) {
        const passwordHash = await hash(dto.password, ARGON2_OPTIONS)

        try {
            return await this.prisma.user.create({
                data: {
                    username: dto.username.toLowerCase(),
                    email: dto.email.toLowerCase(),
                    passwordHash
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    createdAt: true
                },
            })
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError && 
                error.code === 'P2002'
            ) {
                throw new ConflictException('username or email already taken')
            }
            throw error
        }
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username.toLowerCase() }
        })

        const passwordOk = await verify( // always checking hash evenn if no user, to prevent timing hacks
            user?.passwordHash ?? this.dummyHash,
            dto.password,
            ARGON2_OPTIONS
        )

        if (!user || !passwordOk) {
            throw new UnauthorizedException('invalid credentials')
        }

        return this.issueTokens(user.id)
    }

    async refresh(dto: RefreshDto) {
        const tokenHash = this.hashToken(dto.refreshToken)

        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash }
        })

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('invalid refresh token')
        }

        if (stored.revokedAt) {
            await this.prisma.refreshToken.updateMany({
                where: { userId: stored.userId, revokedAt: null },
                data: { revokedAt: new Date() }
            })
            throw new ForbiddenException('token reuse detected, all sessions revoked')
        }

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() }
        })

        return this.issueTokens(stored.userId)
    }

    async logout(refreshtoken: string) {
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash: this.hashToken(refreshtoken), revokedAt: null },
            data: { revokedAt: new Date() }
        })
        return { success: true }
    }

    private async issueTokens(userId: string) {
        const accessToken = await this.jwt.signAsync(
            { sub: userId },
            {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.config.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS')
            }
        )

        const refreshToken = randomBytes(32).toString('hex')
        const days = this.config.getOrThrow<number>('JWT_REFRESH_TTL_DAYS')

        await this.prisma.refreshToken.create({
            data: {
                tokenHash: this.hashToken(refreshToken),
                userId,
                expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            }
        })

        return { accessToken, refreshToken }
    }

    private hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex')
    }
    
}