import { IsString, MaxLength, MinLength, Matches, IsOptional } from "class-validator";

export class CreateSubredditDto {
    @IsString()
    @MinLength(3)
    @MaxLength(21)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'name may only contain letters, numbers and underscores',
    })
    name!: string

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string
}