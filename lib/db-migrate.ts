import type postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

export async function ensureFullSchema(sql: Sql) {
  // ── Core tables ──────────────────────────────────────────────────────────

  await sql`
    CREATE TABLE IF NOT EXISTS companions (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name              TEXT        NOT NULL,
      type              TEXT        NOT NULL DEFAULT 'human',
      photo_url         TEXT        NOT NULL,
      status            TEXT        NOT NULL DEFAULT 'pending',
      email             TEXT        UNIQUE,
      password_hash     TEXT,
      description       TEXT,
      tagline           TEXT,
      age               INTEGER,
      location          TEXT,
      personality_type  TEXT,
      stripe_account_id TEXT,
      earnings_stars    INTEGER     DEFAULT 0,
      mp_email          TEXT,
      clabe             TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      telegram_id             BIGINT      UNIQUE,
      username                TEXT,
      first_name              TEXT,
      email                   TEXT        UNIQUE,
      password_hash           TEXT,
      age                     INTEGER,
      looking_for             TEXT,
      referred_by             UUID,
      referred_by_companion   UUID,
      subscription_status     TEXT        DEFAULT 'free',
      subscription_expires_at TIMESTAMPTZ,
      options_unlocked        BOOLEAN     DEFAULT false,
      gallery_views           INTEGER     DEFAULT 0,
      gallery_expires_at      TIMESTAMPTZ,
      created_at              TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      companion_id  UUID        NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
      message_count INTEGER     DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, companion_id)
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            TEXT        NOT NULL,
      content         TEXT        NOT NULL,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS vault_items (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      companion_id UUID        NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
      type         TEXT        NOT NULL DEFAULT 'photo',
      title        TEXT,
      description  TEXT,
      price        INTEGER     NOT NULL DEFAULT 4900,
      file_url     TEXT,
      thumbnail_url TEXT,
      group_name   TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vault_item_id     UUID        REFERENCES vault_items(id) ON DELETE SET NULL,
      companion_id      UUID        REFERENCES companions(id) ON DELETE SET NULL,
      amount            INTEGER     NOT NULL DEFAULT 0,
      stripe_payment_id TEXT        UNIQUE,
      status            TEXT        NOT NULL DEFAULT 'completed',
      earnings_credited BOOLEAN     DEFAULT false,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      companion_id UUID        NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
      amount_stars INTEGER     NOT NULL,
      amount_mxn   NUMERIC(10,2) NOT NULL,
      status       TEXT        NOT NULL DEFAULT 'pending',
      mp_payment_id TEXT,
      mp_email     TEXT,
      clabe        TEXT,
      error_msg    TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prefer_type      TEXT DEFAULT 'both',
      age_min          INTEGER DEFAULT 18,
      age_max          INTEGER DEFAULT 50,
      personality_type TEXT,
      location         TEXT,
      UNIQUE (user_id)
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS user_likes (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      companion_id UUID        NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
      messaged     BOOLEAN     DEFAULT false,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, companion_id)
    )
  `.catch(() => {});

  // ── Indexes ──────────────────────────────────────────────────────────────

  await sql`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, created_at)`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases (user_id)`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_vault_companion ON vault_items (companion_id)`.catch(() => {});
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases (stripe_payment_id) WHERE stripe_payment_id IS NOT NULL`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS wr_companion_status_idx ON withdrawal_requests (companion_id, status)`.catch(() => {});

  // ── Additive column migrations (safe on existing DBs) ────────────────────

  await sql`ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS earnings_stars INTEGER DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS mp_email TEXT`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS clabe TEXT`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS email TEXT`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS password_hash TEXT`.catch(() => {});
  await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS personality_prompt TEXT`.catch(() => {});
  await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS earnings_credited BOOLEAN DEFAULT false`.catch(() => {});
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`.catch(() => {});
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_companion UUID`.catch(() => {});
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery_views INTEGER DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery_expires_at TIMESTAMPTZ`.catch(() => {});
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ`.catch(() => {});
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0`.catch(() => {});
}
