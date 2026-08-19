import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateSubredditDto {
    @ApiProperty({
        description: 'Имя сообщества. Приводится к нижнему регистру, уникально.',
        minLength: 3,
        maxLength: 21,
        example: 'programming'
    })
    @IsString()
    @MinLength(3)
    @MaxLength(21)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'name may only contain letters, numbers and underscores'
    })
    name!: string

    @ApiPropertyOptional({ maxLength: 500, example: 'Обсуждаем код' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string
}
