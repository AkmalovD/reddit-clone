import { Module } from "@nestjs/common";
import { VotesModule } from "../votes/votes.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
    imports: [VotesModule],
    controllers: [PostsController],
    providers: [PostsService]    
})

export class PostsModule {}