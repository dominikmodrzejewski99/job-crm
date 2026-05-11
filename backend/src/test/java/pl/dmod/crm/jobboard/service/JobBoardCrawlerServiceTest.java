package pl.dmod.crm.jobboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pl.dmod.crm.jobboard.client.JobBoardClient;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;
import pl.dmod.crm.jobboard.repository.JobOfferRepository;

class JobBoardCrawlerServiceTest {

    private final JobOfferRepository repository = mock(JobOfferRepository.class);

    @Test
    void runOnce_inserts_new_offers_and_updates_existing_ones() {
        JobOffer jjit = sample(JobBoardSource.JUSTJOIN, "j-1", "Senior Java");
        JobOffer nofluff = sample(JobBoardSource.NOFLUFF, "n-1", "Backend Lead");
        JobBoardClient jjitClient = stub(JobBoardSource.JUSTJOIN, List.of(jjit));
        JobBoardClient nofluffClient = stub(JobBoardSource.NOFLUFF, List.of(nofluff));

        // jjit is brand new, nofluff was crawled before
        when(repository.findBySourceAndExternalId(JobBoardSource.JUSTJOIN, "j-1"))
                .thenReturn(Optional.empty());
        JobOffer existingNofluff = sample(JobBoardSource.NOFLUFF, "n-1", "Old title");
        existingNofluff.setId(UUID.randomUUID());
        when(repository.findBySourceAndExternalId(JobBoardSource.NOFLUFF, "n-1"))
                .thenReturn(Optional.of(existingNofluff));
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        var service = new JobBoardCrawlerService(List.of(jjitClient, nofluffClient), repository, true);
        var report = service.runOnce();

        assertThat(report.inserted()).isEqualTo(1);
        assertThat(report.updated()).isEqualTo(1);
        assertThat(report.skipped()).isZero();
        // Existing row got its fields refreshed.
        assertThat(existingNofluff.getTitle()).isEqualTo("Backend Lead");
    }

    @Test
    void runOnce_skips_when_disabled_via_property() {
        JobBoardClient client = stub(JobBoardSource.JUSTJOIN,
                List.of(sample(JobBoardSource.JUSTJOIN, "j-1", "Senior")));

        var service = new JobBoardCrawlerService(List.of(client), repository, false);
        service.scheduled(); // disabled — should be a no-op
        org.mockito.Mockito.verifyNoInteractions(repository);
    }

    @Test
    void runOnce_continues_when_one_client_throws() {
        JobBoardClient broken = mock(JobBoardClient.class);
        when(broken.name()).thenReturn("JUSTJOIN");
        when(broken.fetchLatest()).thenThrow(new RuntimeException("network down"));

        JobBoardClient ok = stub(JobBoardSource.NOFLUFF,
                List.of(sample(JobBoardSource.NOFLUFF, "n-1", "OK Offer")));
        when(repository.findBySourceAndExternalId(JobBoardSource.NOFLUFF, "n-1"))
                .thenReturn(Optional.empty());
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        var service = new JobBoardCrawlerService(List.of(broken, ok), repository, true);
        var report = service.runOnce();

        assertThat(report.inserted()).isEqualTo(1);
    }

    private static JobBoardClient stub(JobBoardSource source, List<JobOffer> offers) {
        JobBoardClient client = mock(JobBoardClient.class);
        when(client.name()).thenReturn(source.name());
        when(client.fetchLatest()).thenReturn(offers);
        return client;
    }

    private static JobOffer sample(JobBoardSource source, String externalId, String title) {
        JobOffer o = new JobOffer();
        o.setSource(source);
        o.setExternalId(externalId);
        o.setTitle(title);
        o.setCompanyName("Acme");
        o.setUrl("https://example.com/" + externalId);
        o.setRemote(true);
        o.setSalaryMin(new BigDecimal("15000"));
        o.setSalaryMax(new BigDecimal("25000"));
        o.setCurrency("PLN");
        return o;
    }
}
