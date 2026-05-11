package pl.dmod.crm.jobboard.service;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.jobboard.client.JobBoardClient;
import pl.dmod.crm.jobboard.domain.JobOffer;
import pl.dmod.crm.jobboard.repository.JobOfferRepository;

/**
 * Periodic crawler that calls every {@link JobBoardClient} and upserts the
 * returned offers into {@code job_offer}. Dedup is done on the
 * {@code (source, externalId)} unique key; rerunning the same crawl just
 * bumps {@code updated_at} on existing rows.
 */
@Service
public class JobBoardCrawlerService {

    private static final Logger log = LoggerFactory.getLogger(JobBoardCrawlerService.class);

    private final List<JobBoardClient> clients;
    private final JobOfferRepository repository;
    private final boolean enabled;

    public JobBoardCrawlerService(List<JobBoardClient> clients,
                                  JobOfferRepository repository,
                                  @Value("${jobtrack.jobboard.enabled:true}") boolean enabled) {
        this.clients = clients;
        this.repository = repository;
        this.enabled = enabled;
    }

    @Scheduled(
            initialDelayString = "${jobtrack.jobboard.initial-delay-ms:60000}",
            fixedDelayString = "${jobtrack.jobboard.fixed-delay-ms:21600000}" // 6 hours
    )
    public void scheduled() {
        if (!enabled) {
            log.debug("Job board crawler disabled via jobtrack.jobboard.enabled=false");
            return;
        }
        runOnce();
    }

    @Transactional
    public CrawlReport runOnce() {
        int inserted = 0;
        int updated = 0;
        int skipped = 0;
        for (JobBoardClient client : clients) {
            List<JobOffer> fetched;
            try {
                fetched = client.fetchLatest();
            } catch (Exception ex) {
                log.warn("Crawl for {} threw: {}", client.name(), ex.getMessage());
                continue;
            }
            for (JobOffer offer : fetched) {
                try {
                    int outcome = upsert(offer);
                    if (outcome == 1) inserted++;
                    else if (outcome == 2) updated++;
                    else skipped++;
                } catch (Exception ex) {
                    log.warn("Upsert failed for {} {}: {}", client.name(), offer.getExternalId(), ex.getMessage());
                    skipped++;
                }
            }
            log.info("Crawl {} done: fetched={}", client.name(), fetched.size());
        }
        return new CrawlReport(inserted, updated, skipped);
    }

    /** @return 1 if newly inserted, 2 if existing row was updated, 0 if nothing changed. */
    private int upsert(JobOffer incoming) {
        var existing = repository.findBySourceAndExternalId(incoming.getSource(), incoming.getExternalId());
        if (existing.isEmpty()) {
            incoming.setFetchedAt(Instant.now());
            repository.save(incoming);
            return 1;
        }
        JobOffer row = existing.get();
        row.setTitle(incoming.getTitle());
        row.setCompanyName(incoming.getCompanyName());
        row.setLocation(incoming.getLocation());
        row.setRemote(incoming.isRemote());
        row.setSalaryMin(incoming.getSalaryMin());
        row.setSalaryMax(incoming.getSalaryMax());
        row.setCurrency(incoming.getCurrency());
        row.setUrl(incoming.getUrl());
        row.setPostedAt(incoming.getPostedAt());
        repository.save(row);
        return 2;
    }

    public record CrawlReport(int inserted, int updated, int skipped) {
        public int total() { return inserted + updated; }
    }
}
