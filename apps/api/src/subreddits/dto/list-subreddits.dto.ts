import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListSubredditsDto {
    @ApiPropertyOptional({
        enum: ['popular', 'new'],
        default: 'popular',
        description: 'popular — по числу участников, new — по дате создания.'
    })
    @IsOptional()
    @IsIn(['popular', 'new'])
    sort?: 'popular' | 'new' = 'popular'

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 25

    @ApiPropertyOptional({
        minimum: 0,
        maximum: 200,
        default: 0,
        description: 'Сортировка идёт по числу участников — колонки для курсора нет, только смещение.'
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(200)
    offset?: number = 0
}
