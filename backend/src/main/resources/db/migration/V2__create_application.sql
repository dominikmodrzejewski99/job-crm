-- Phase 3 — Application entity, status enum check, tag join table.

CREATE TABLE applications (
    id                UUID         PRIMARY KEY,
    company_name      VARCHAR(200) NOT NULL,
    position          VARCHAR(200) NOT NULL,
    job_url           VARCHAR(500),
    source            VARCHAR(32)  NOT NULL,
    location          VARCHAR(200),
    remote            BOOLEAN      NOT NULL DEFAULT FALSE,
    salary_min        NUMERIC(12, 2),
    salary_max        NUMERIC(12, 2),
    currency          VARCHAR(3),
    applied_at        DATE         NOT NULL,
    current_status    VARCHAR(32)  NOT NULL,
    next_follow_up_at TIMESTAMPTZ,
    archived          BOOLEAN      NOT NULL DEFAULT FALSE,
    notes             TEXT,
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL,

    CONSTRAINT applications_source_check
        CHECK (source IN ('LINKEDIN','JUSTJOIN','NOFLUFF','REFERRAL','COMPANY_SITE','OTHER')),
    CONSTRAINT applications_status_check
        CHECK (current_status IN ('DRAFT','APPLIED','ACK_RECEIVED','INTERVIEW_SCHEDULED','INTERVIEW_DONE',
                                  'TASK_RECEIVED','TASK_SUBMITTED','OFFER','REJECTED','WITHDRAWN','GHOSTED')),
    CONSTRAINT applications_salary_range_check
        CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE INDEX idx_applications_status        ON applications (current_status);
CREATE INDEX idx_applications_applied_at    ON applications (applied_at DESC);
CREATE INDEX idx_applications_archived      ON applications (archived);
CREATE INDEX idx_applications_company_lower ON applications (LOWER(company_name));

CREATE TABLE application_tag (
    application_id UUID         NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    tag            VARCHAR(64)  NOT NULL,
    PRIMARY KEY (application_id, tag)
);

CREATE INDEX idx_application_tag_tag ON application_tag (tag);
