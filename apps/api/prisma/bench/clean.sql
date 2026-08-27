-- Снести нагрузочные данные. Посты уедут каскадом за сообществами.
DELETE FROM subreddits WHERE name LIKE 'bench\_%';
DELETE FROM users WHERE username = 'bench';

ANALYZE posts;
ANALYZE memberships;
ANALYZE subreddits;
