CREATE TABLE job_offer (
    id            UUID          PRIMARY KEY,
    source        VARCHAR(16)   NOT NULL,
    external_id   VARCHAR(200)  NOT NULL,
    title         VARCHAR(300)  NOT NULL,
    company_name  VARCHAR(200)  NOT NULL,
    location      VARCHAR(200),
    remote        BOOLEAN       NOT NULL DEFAULT FALSE,
    salary_min    NUMERIC(12, 2),
    salary_max    NUMERIC(12, 2),
    currency      VARCHAR(3),
    url           VARCHAR(500)  NOT NULL,
    posted_at     TIMESTAMPTZ,
    fetched_at    TIMESTAMPTZ   NOT NULL,
    updated_at    TIMESTAMPTZ   NOT NULL,

    CONSTRAINT job_offer_source_check
        CHECK (source IN ('JUSTJOIN', 'NOFLUFF')),
    CONSTRAINT job_offer_source_external_unique UNIQUE (source, external_id)
);

CREATE INDEX idx_job_offer_source        ON job_offer (source);
CREATE INDEX idx_job_offer_fetched_at    ON job_offer (fetched_at DESC);
CREATE INDEX idx_job_offer_posted_at     ON job_offer (posted_at DESC NULLS LAST);
CREATE INDEX idx_job_offer_company_lower ON job_offer (LOWER(company_name));
