import { Module } from '@nestjs/common';
import { SavedService } from './saved.service';
import { SavedController } from './saved.controller';

@Module({
  controllers: [SavedController],
  providers: [SavedService]
})

export class SavedModule {}