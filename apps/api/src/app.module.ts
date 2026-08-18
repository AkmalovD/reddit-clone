import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from './auth/auth.module';
import { SubredditsModule } from "./subreddits/subreddits.module";
import { PostsModule } from "./posts/posts.module";
import { CommentsModule } from "./comments/comments.module";
import { VotesModule } from "./votes/votes.module";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    PrismaModule,
    AuthModule,
    SubredditsModule,
    PostsModule,
    CommentsModule,
    VotesModule
  ]
})

export class AppModule {}