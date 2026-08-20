import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthUser } from "./decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @RateLimit({ limit: 10, windowSeconds: 3600 })
    @ApiOperation({
        summary: 'Регистрация',
        description: 'Пароль хешируется Argon2id. В ответе хеша нет.'
    })
    @ApiResponse({ status: 201, description: 'Пользователь создан' })
    @ApiResponse({ status: 400, description: 'Ошибка валидации или лишнее поле' })
    @ApiResponse({ status: 409, description: 'username или email уже заняты' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto)
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @RateLimit({ limit: 5, windowSeconds: 60 })
    @ApiOperation({
        summary: 'Вход',
        description:
            'Возвращает короткоживущий accessToken (JWT) и refreshToken. ' +
            'Ответ на неверный пароль и на несуществующего пользователя одинаков — ' +
            'чтобы нельзя было определить, существует ли аккаунт.'
    })
    @ApiResponse({ status: 200, description: 'Пара токенов' })
    @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto)
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @RateLimit({ limit: 10, windowSeconds: 60 })
    @ApiOperation({
        summary: 'Обновление пары токенов',
        description: 'Старый refreshToken гасится. Повторное использование гасит все сессии.'
    })
    @ApiResponse({ status: 200, description: 'Новая пара токенов' })
    @ApiResponse({ status: 401, description: 'Токен неизвестен или истёк' })
    @ApiResponse({ status: 403, description: 'Повторное использование — все сессии отозваны' })
    refresh(@Body() dto: RefreshDto) {
        return this.authService.refresh(dto)
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Выход', description: 'Гасит переданный refreshToken.' })
    @ApiResponse({ status: 200, description: 'Токен отозван' })
    logout(@Body() dto: RefreshDto) {
        return this.authService.logout(dto.refreshToken)
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Текущий пользователь' })
    @ApiResponse({ status: 200, description: 'id и username' })
    @ApiResponse({ status: 401, description: 'Нет или недействителен токен' })
    me(@CurrentUser() user: AuthUser) {
        return user
    }
}
