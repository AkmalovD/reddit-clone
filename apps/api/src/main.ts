import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  const config = app.get(ConfigService)
  await app.listen(config.getOrThrow<number>('PORT'))
}

void bootstrap()