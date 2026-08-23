import { Module } from "@nestjs/common";
import { VotesController } from "./votes.controller";
import { VotesService } from "./votes.service";
import { PendingVotesService } from "./pending-votes.service";
import { VoteFlushService } from "./vote-flush.service";

@Module({
    controllers: [VotesController],
    providers: [VotesService, PendingVotesService, VoteFlushService],
    // PostsService складывает отложенную дельту при чтении одного поста
    exports: [PendingVotesService, VoteFlushService]
})
export class VotesModule {}
