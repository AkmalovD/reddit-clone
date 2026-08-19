import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
    @ApiProperty({ maxLength: 1000, example: 'Хороший разбор, спасибо' })
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    body!: string

    @ApiPropertyOptional({
        description:
            'Комментарий, на который отвечаем. Пусто — корневой комментарий. ' +
            'Родитель должен принадлежать тому же посту. Максимальная вложенность — 10.',
        example: '01a00faa-61be-7178-aec1-cd386324481c'
    })
    @IsOptional()
    @IsUUID()
    parentId?: string
}
