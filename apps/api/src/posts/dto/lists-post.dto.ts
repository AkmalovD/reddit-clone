import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListPostsDto {
  @ApiPropertyOptional({
    description: 'Значение nextCursor из предыдущей страницы. Пусто — первая страница.',
    example: '019ffedc-3676-7769-b3d3-b91a2612fc1e',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({
    enum: ['hot', 'new', 'top'],
    default: 'hot',
    description:
      'hot — рейтинг с учётом свежести (алгоритм Reddit); new — по времени; top — по сумме голосов.',
  })
  @IsOptional()
  @IsIn(['hot', 'new', 'top'])
  sort?: 'hot' | 'new' | 'top' = 'hot';
}
