import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class SearchDto {
    @ApiProperty({ example: 'postgres index', maxLength: 200 })
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    q!: string

    @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 25 })
    @IsOptional() 
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 25

    @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(100)
    offset?: number = 0
}