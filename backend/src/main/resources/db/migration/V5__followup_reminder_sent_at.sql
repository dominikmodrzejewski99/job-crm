-- Phase 5: track whether the scheduled email reminder for a given
-- nextFollowUpAt was already sent, so the scan job is idempotent.

ALTER TABLE applications
    ADD COLUMN next_follow_up_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX idx_applications_followup_pending
    ON applications (next_follow_up_at)
    WHERE next_follow_up_at IS NOT NULL
      AND next_follow_up_reminder_sent_at IS NULL
      AND archived = FALSE;
