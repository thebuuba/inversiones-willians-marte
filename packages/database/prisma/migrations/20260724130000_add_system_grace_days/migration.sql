CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "grace_days" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "system_settings_singleton" CHECK ("id" = 1),
    CONSTRAINT "system_settings_grace_days_range" CHECK ("grace_days" BETWEEN 0 AND 30)
);

INSERT INTO "system_settings" ("id", "grace_days", "updated_at")
VALUES (1, 5, CURRENT_TIMESTAMP);
