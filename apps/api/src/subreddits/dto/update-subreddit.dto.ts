import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateSubredditDto {
  @ApiProperty({ maxLength: 500, example: 'Обсуждаем код', description: 'Что нибудь' })
  @IsString()
  @MaxLength(500)
  description!: string
}