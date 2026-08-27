import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdatePostDto {
    @ApiProperty({ description: 'Новый текст поста', maxLength: 4000 })
    @IsString()
    @MinLength(1)
    @MaxLength(40000)
    body!: string
}