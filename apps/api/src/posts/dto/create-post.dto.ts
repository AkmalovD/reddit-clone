import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    enum: ['TEXT', 'LINK', 'IMAGE', 'VIDEO'],
    description: 'TEXT требует body, LINK требует url, IMAGE/VIDEO требуют mediaUrl.',
    example: 'TEXT',
  })
  @IsIn(['TEXT', 'LINK', 'IMAGE', 'VIDEO'])
  type!: 'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO';

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

  @ApiPropertyOptional({
    description: 'Обязательно при type=IMAGE или VIDEO. Возвращается из POST /uploads.',
    example: 'http://localhost:3000/uploads/019ffedc.jpg',
  })
  @ValidateIf((o: CreatePostDto) => o.type === 'IMAGE' || o.type === 'VIDEO')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  mediaUrl?: string;

  @ApiProperty({ description: 'Имя сообщества.', example: 'programming' })
  @IsString()
  @MinLength(3)
  @MaxLength(21)
  subreddit!: string;
}
