-- Генерируемый столбец пришлось заменить на обычный с триггером.
--
-- Prisma не умеет GENERATED ALWAYS: при интроспекции она читает выражение
-- генерации как DEFAULT и на каждой следующей миграции пытается выполнить
-- ALTER COLUMN ... DROP DEFAULT, что Postgres для генерируемых столбцов
-- запрещает. Одна такая миграция валится, а упавшая миграция блокирует все
-- последующие.
--
-- DROP EXPRESSION превращает столбец в обычный, СОХРАНЯЯ уже вычисленные
-- значения — переиндексировать ничего не нужно.
ALTER TABLE "posts" ALTER COLUMN "search_vector" DROP EXPRESSION;

CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.body,  '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_vector_trigger ON "posts";

-- UPDATE OF title, body — а не просто UPDATE: сброс голосов трогает score и
-- hot_rank у тысяч постов, и пересчитывать вектор при каждом таком обновлении
-- было бы чистой потерей.
CREATE TRIGGER posts_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, body ON "posts"
FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();
