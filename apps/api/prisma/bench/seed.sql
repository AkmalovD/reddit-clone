-- Нагрузочные данные для замеров общей ленты.
-- Всё помечено префиксом bench_, чтобы сносилось одной командой (см. clean.sql).

-- 60 сообществ.
INSERT INTO subreddits (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'bench_' || lpad(i::text, 3, '0'), NULL, now(), now()
FROM generate_series(1, 60) AS i
ON CONFLICT (name) DO NOTHING;

-- 300 000 постов с перекосом: несколько огромных сообществ, много мелких.
-- Равномерное распределение соврало бы — в жизни лента почти целиком состоит
-- из постов пары крупных сообществ, и план запроса это чувствует.
WITH subs AS (
    SELECT id, row_number() OVER (ORDER BY name) AS rn
    FROM subreddits
    WHERE name LIKE 'bench\_%'
),
gen AS (
    SELECT
        i,
        (floor(power(random(), 3) * 60) + 1)::int AS rn,
        now() - (random() * interval '365 days')  AS ts,
        (floor(random() * 5000))::int             AS score
    FROM generate_series(1, 300000) AS i
)
INSERT INTO posts (
    id, type, title, subreddit_id, created_at, updated_at,
    score, upvotes, downvotes, comment_count, hot_rank
)
SELECT
    gen_random_uuid(),
    'TEXT'::"PostType",
    'Bench post ' || gen.i,
    subs.id,
    gen.ts,
    gen.ts,
    gen.score,
    gen.score,
    0,
    0,
    sign(gen.score) * log(greatest(abs(gen.score), 1))
        + (extract(epoch FROM gen.ts) - 1134028003) / 45000
FROM gen
JOIN subs ON subs.rn = gen.rn;

-- Подписываем пользователя bench на 50 сообществ.
INSERT INTO memberships (user_id, subreddit_id, role, joined_at)
SELECT u.id, s.id, 'MEMBER'::"MembershipRole", now()
FROM users u
CROSS JOIN LATERAL (
    SELECT id FROM subreddits WHERE name LIKE 'bench\_%' ORDER BY name LIMIT 50
) s
WHERE u.username = 'bench'
ON CONFLICT DO NOTHING;

-- Без свежей статистики планировщик считает, что в таблице всё ещё семь строк,
-- и выбирает план под несуществующие данные.
ANALYZE posts;
ANALYZE memberships;
ANALYZE subreddits;
