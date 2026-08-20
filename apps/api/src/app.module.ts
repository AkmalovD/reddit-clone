import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from './auth/auth.module';
import { SubredditsModule } from "./subreddits/subreddits.module";
import { PostsModule } from "./posts/posts.module";
import { CommentsModule } from "./comments/comments.module";
import { VotesModule } from "./votes/votes.module";
import { APP_GUARD } from "@nestjs/core";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    SubredditsModule,
    PostsModule,
    CommentsModule,
    VotesModule
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }]
})

export class AppModule {}