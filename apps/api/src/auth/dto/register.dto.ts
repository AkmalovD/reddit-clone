import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({
        description: 'Логин. Хранится в нижнем регистре, должен быть уникальным.',
        minLength: 3,
        maxLength: 20,
        example: 'dilmurod'
    })
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message: 'username may only contain letters, numbers, underscores and hyphens'
    })
    username!: string

    @ApiProperty({ maxLength: 255, example: 'me@example.com' })
    @IsEmail()
    @MaxLength(255)
    email!: string

    @ApiProperty({
        description: 'Хешируется алгоритмом Argon2id, в открытом виде не хранится.',
        minLength: 8,
        maxLength: 128,
        example: 'supersecret123'
    })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string
}
