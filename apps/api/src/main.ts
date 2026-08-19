import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  configureApp(app)
  app.enableShutdownHooks()

  const config = app.get(ConfigService)

  // документацию поднимаем только вне продакшена
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Reddit Clone API')
      .setDescription(
        'Учебный клон Reddit: аутентификация, сообщества, посты, ' +
        'древовидные комментарии, голосование и ранжирование лент.'
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer'
      )
      .addTag('auth', 'Регистрация, вход, refresh-токены')
      .addTag('subreddits', 'Сообщества и участие')
      .addTag('posts', 'Посты и ленты с курсорной пагинацией')
      .addTag('comments', 'Древовидные комментарии')
      .addTag('votes', 'Голосование за посты и комментарии')
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        // токен переживает перезагрузку страницы
        persistAuthorization: true
      }
    })
  }

  const port = config.getOrThrow<number>('PORT')
  await app.listen(port)

  console.log(`API:  http://localhost:${port}/api`)
  console.log(`Docs: http://localhost:${port}/docs`)
}

void bootstrap()
