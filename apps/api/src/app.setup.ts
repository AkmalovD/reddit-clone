import { INestApplication, ValidationPipe } from "@nestjs/common";

/**
 * Единая настройка приложения для main.ts и тестов.
 * Всё, что здесь отсутствует, тесты проверять не будут.
 */
export function configureApp(app: INestApplication) {
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true
        })
    )
    app.setGlobalPrefix('api')

    return app
}
