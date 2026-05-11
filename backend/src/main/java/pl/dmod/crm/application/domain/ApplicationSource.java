package pl.dmod.crm.application.domain;

/**
 * Where a job application originated from. Used for stats and routing of
 * import workflows (e.g. Faza 7 will crawl JUSTJOIN and NOFLUFF feeds).
 */
public enum ApplicationSource {
    LINKEDIN,
    JUSTJOIN,
    NOFLUFF,
    REFERRAL,
    COMPANY_SITE,
    OTHER;
}
