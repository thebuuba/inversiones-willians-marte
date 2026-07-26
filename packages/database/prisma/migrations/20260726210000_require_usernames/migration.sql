WITH missing_usernames AS (
  SELECT
    id,
    COALESCE(
      NULLIF(LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), ''),
      'usuario'
    ) AS base,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g'))
      ORDER BY created_at, id
    ) AS occurrence
  FROM users
  WHERE username IS NULL
)
UPDATE users AS target
SET username = CASE
  WHEN missing.occurrence = 1
    AND NOT EXISTS (
      SELECT 1
      FROM users AS existing
      WHERE existing.username = missing.base
        AND existing.id <> missing.id
    )
  THEN missing.base
  ELSE missing.base || '_' || SUBSTRING(REPLACE(missing.id, '-', ''), 1, 6)
END
FROM missing_usernames AS missing
WHERE target.id = missing.id;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
