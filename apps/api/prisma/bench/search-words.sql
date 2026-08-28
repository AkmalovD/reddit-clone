-- Заголовки вида «Bench post 12345» нечего искать. Раздаём осмысленные слова
-- из небольшого словаря, чтобы выдача была осмысленным подмножеством.
WITH vocab AS (
    SELECT ARRAY[
        'postgres','index','cache','latency','query','plan','vacuum','replica',
        'deadlock','partition','transaction','rollback','throughput','sharding',
        'benchmark','profiler','migration','schema','connection','pooling'
    ] AS w
)
UPDATE posts p SET
    title = (SELECT w[1 + (hashtext(p.id::text)      % 20 + 20) % 20] FROM vocab) || ' ' ||
            (SELECT w[1 + (hashtext(p.id::text || 'b') % 20 + 20) % 20] FROM vocab) || ' notes',
    body  = 'Some notes about ' ||
            (SELECT w[1 + (hashtext(p.id::text || 'c') % 20 + 20) % 20] FROM vocab) ||
            ' and how it behaves under load.'
WHERE p.title LIKE 'Bench post %';

ANALYZE posts;
