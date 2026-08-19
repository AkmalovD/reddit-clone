import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class VoteDto {
    @ApiProperty({
        enum: [-1, 0, 1],
        description:
            '1 — за, -1 — против, 0 — отменить голос. ' +
            'Операция идемпотентна: повтор того же значения ничего не меняет.',
        example: 1
    })
    @IsIn([-1, 0, 1])
    value!: -1 | 0 | 1
}
