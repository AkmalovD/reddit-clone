import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity } from "@nestjs/swagger";

/**
 * Необязательная аутентификация.
 *
 * В OpenAPI это выражается массивом из двух требований: пустой объект
 * означает «без токена тоже можно». Обычный @ApiBearerAuth() рисует замок
 * и вводит в заблуждение — маршрут доступен анонимам.
 */
export function ApiOptionalBearerAuth() {
    return applyDecorators(ApiSecurity({}), ApiBearerAuth())
}
