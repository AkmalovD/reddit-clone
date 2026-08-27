import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class AddModeratorDto {
    @ApiProperty({ example: 'dilmurod', description: 'Кого назначить' })
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_-]+$/)
    username!: string
}