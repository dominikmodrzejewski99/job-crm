-- Add per-user scoping to applications.
-- Existing rows (if any) are attached to a placeholder user so the NOT NULL
-- constraint can be added safely. In a real prod migration we'd back-fill
-- per actual owner; this project ships its DB on first user, so the case
-- only matters for dev databases carrying smoke-test rows.

ALTER TABLE applications ADD COLUMN user_id UUID;

DO $$
DECLARE
    placeholder UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM applications WHERE user_id IS NULL) THEN
        SELECT id INTO placeholder FROM users LIMIT 1;
        IF placeholder IS NULL THEN
            placeholder := '00000000-0000-0000-0000-000000000000';
            INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
            VALUES (placeholder, 'placeholder@local', 'x', 'Placeholder', now(), now());
        END IF;
        UPDATE applications SET user_id = placeholder WHERE user_id IS NULL;
    END IF;
END $$;

ALTER TABLE applications
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_applications_user_id ON applications (user_id);
