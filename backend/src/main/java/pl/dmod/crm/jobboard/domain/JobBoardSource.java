package pl.dmod.crm.jobboard.domain;

/**
 * External job-board feeds we crawl. The value is stored verbatim in the
 * job_offer table and matched against an enum CHECK constraint.
 */
public enum JobBoardSource {
    JUSTJOIN,
    NOFLUFF;
}
