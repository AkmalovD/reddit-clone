import { Module } from "@nestjs/common";
import { SubredditsController } from "./subreddits.controller";
import { SubredditsService } from "./subreddits.service";

@Module({
    controllers: [SubredditsController],
    providers: [SubredditsService],
    exports: [SubredditsService]
})
export class SubredditsModule {}