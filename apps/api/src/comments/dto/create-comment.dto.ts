import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    body!: string

    @IsOptional()
    @IsUUID()
    parentId?: string
}