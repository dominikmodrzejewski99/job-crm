-- Phase 1: empty baseline. Real schema lands in Phase 3 (Application entity).
-- Flyway needs at least one migration to consider the schema initialized.

CREATE TABLE IF NOT EXISTS flyway_baseline_marker (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    note TEXT NOT NULL DEFAULT 'Phase 1 baseline'
);

INSERT INTO flyway_baseline_marker (id) VALUES (1) ON CONFLICT DO NOTHING;
