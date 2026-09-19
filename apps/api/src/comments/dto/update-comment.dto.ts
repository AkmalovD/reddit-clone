import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ maxLength: 1000, example: 'Поправил опечатку' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string
}