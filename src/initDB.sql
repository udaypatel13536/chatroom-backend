CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id  UUID UNIQUE DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role  user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id  SERIAL PRIMARY KEY,
  room_id  UUID UNIQUE DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS room_members (
    id SERIAL PRIMARY KEY,
    room_id UUID NOT NULL,
    member_id UUID NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY(member_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(room_id,member_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  message_id UUID UNIQUE DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  sender_id  UUID NOT NULL,
  content  TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);