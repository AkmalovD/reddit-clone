import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    enum: ['TEXT', 'LINK'],
    description: 'TEXT требует body, LINK требует url.',
    example: 'TEXT',
  })
  @IsIn(['TEXT', 'LINK'])
  type!: 'TEXT' | 'LINK';

  @ApiProperty({ maxLength: 300, example: 'Как устроен индекс в Postgres' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({
    description: 'Обязательно при type=TEXT.',
    maxLength: 40000,
    example: 'Длинный текст поста',
  })
  @ValidateIf((o: CreatePostDto) => o.type === 'TEXT')
  @IsString()
  @MaxLength(40000)
  body?: string;

  @ApiPropertyOptional({
    description: 'Обязательно при type=LINK. Только http и https.',
    example: 'https://postgresql.org',
  })
  @ValidateIf((o: CreatePostDto) => o.type === 'LINK')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url?: string;

  @ApiProperty({ description: 'Имя сообщества.', example: 'programming' })
  @IsString()
  @MinLength(3)
  @MaxLength(21)
  subreddit!: string;
}
