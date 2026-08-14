import { IsIn, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreatePostDto {
  @IsIn(['TEXT', 'LINK'])
  type!: 'TEXT' | 'LINK';

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ValidateIf((o) => o.type === 'TEXT')
  @IsString()
  @MaxLength(40000)
  body?: string;

  @ValidateIf((o) => o.type === 'LINK')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(21)
  subreddit!: string;
}
