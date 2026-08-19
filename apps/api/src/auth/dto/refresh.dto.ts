import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RefreshDto {
    @ApiProperty({
        description:
            'Непрозрачная случайная строка, выданная при логине. ' +
            'При обновлении происходит ротация: старый токен гасится. ' +
            'Повторное использование погашенного трактуется как кража и гасит все сессии.',
        example: '784efc3383d92015dd58b70623b228c665499311eab784330df2e54fc27d0253'
    })
    @IsString()
    refreshToken!: string
}
