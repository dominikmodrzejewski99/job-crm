package pl.dmod.crm.jobboard.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;

/**
 * Pulls the JustJoinIT feed. The endpoint is a free, public JSON listing
 * (no auth, no paging) of all currently active offers — we keep the
 * mapping defensive so feed schema changes don't crash the crawler.
 */
@Component
public class JustJoinItClient implements JobBoardClient {

    private static final Logger log = LoggerFactory.getLogger(JustJoinItClient.class);

    private final RestClient http;
    private final String offersPath;
    private final int limit;

    public JustJoinItClient(
            @Value("${jobtrack.jobboard.justjoin.base-url:https://justjoin.it}") String baseUrl,
            @Value("${jobtrack.jobboard.justjoin.offers-path:/api/offers}") String offersPath,
            @Value("${jobtrack.jobboard.justjoin.limit:50}") int limit) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
        this.offersPath = offersPath;
        this.limit = limit;
    }

    @Override
    public String name() {
        return JobBoardSource.JUSTJOIN.name();
    }

    @Override
    public List<JobOffer> fetchLatest() {
        try {
            List<JjitOffer> raw = http.get()
                    .uri(offersPath)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (raw == null) return List.of();

            List<JobOffer> out = new ArrayList<>(Math.min(raw.size(), limit));
            for (JjitOffer offer : raw) {
                if (out.size() >= limit) break;
                JobOffer mapped = map(offer);
                if (mapped != null) out.add(mapped);
            }
            return out;
        } catch (Exception ex) {
            log.warn("JustJoinIT fetch failed: {}", ex.getMessage());
            return List.of();
        }
    }

    private JobOffer map(JjitOffer raw) {
        if (raw == null || raw.id == null || raw.title == null || raw.companyName == null) {
            return null;
        }
        JobOffer offer = new JobOffer();
        offer.setSource(JobBoardSource.JUSTJOIN);
        offer.setExternalId(raw.id);
        offer.setTitle(truncate(raw.title, 300));
        offer.setCompanyName(truncate(raw.companyName, 200));
        offer.setLocation(truncate(raw.city, 200));
        offer.setRemote("remote".equalsIgnoreCase(raw.workplaceType));
        offer.setSalaryMin(raw.salaryFrom);
        offer.setSalaryMax(raw.salaryTo);
        offer.setCurrency(truncate(raw.currency, 3));
        offer.setUrl(buildUrl(raw.slug));
        offer.setPostedAt(parseInstant(raw.publishedAt));
        return offer;
    }

    private String buildUrl(String slug) {
        if (slug == null || slug.isBlank()) return "https://justjoin.it";
        return "https://justjoin.it/offers/" + slug;
    }

    private static Instant parseInstant(String input) {
        if (input == null || input.isBlank()) return null;
        try {
            return Instant.parse(input);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class JjitOffer {
        public String id;
        public String slug;
        public String title;
        @JsonProperty("companyName") public String companyName;
        public String city;
        public String workplaceType;
        public BigDecimal salaryFrom;
        public BigDecimal salaryTo;
        public String currency;
        public String publishedAt;
    }
}
