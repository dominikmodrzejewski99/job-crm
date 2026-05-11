package pl.dmod.crm.jobboard.client;

import java.util.List;
import pl.dmod.crm.jobboard.domain.JobOffer;

/**
 * Common interface for any external job-board feed. Implementations call the
 * board's HTTP API and translate the response into {@link JobOffer} instances
 * ready to be upserted into our {@code job_offer} table.
 */
public interface JobBoardClient {

    /** A short label for logging — matches the {@code JobBoardSource} value. */
    String name();

    /** Fetch the latest postings. Returns an empty list on any error. */
    List<JobOffer> fetchLatest();
}
