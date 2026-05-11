package pl.dmod.crm.jobboard.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;

/**
 * NoFluffJobs public listing endpoint. Schema is more nested than JJIT —
 * postings live under {@code postings[]} with salary in a sub-object. We
 * only consume the fields we care about and ignore the rest.
 */
@Component
public class NoFluffJobsClient implements JobBoardClient {

    private static final Logger log = LoggerFactory.getLogger(NoFluffJobsClient.class);

    private final RestClient http;
    private final String postingsPath;
    private final int limit;

    public NoFluffJobsClient(
            @Value("${jobtrack.jobboard.nofluff.base-url:https://nofluffjobs.com}") String baseUrl,
            @Value("${jobtrack.jobboard.nofluff.postings-path:/api/posting}") String postingsPath,
            @Value("${jobtrack.jobboard.nofluff.limit:50}") int limit) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
        this.postingsPath = postingsPath;
        this.limit = limit;
    }

    @Override
    public String name() {
        return JobBoardSource.NOFLUFF.name();
    }

    @Override
    public List<JobOffer> fetchLatest() {
        try {
            NfjEnvelope env = http.get()
                    .uri(postingsPath)
                    .retrieve()
                    .body(NfjEnvelope.class);
            if (env == null || env.postings == null) return List.of();

            List<JobOffer> out = new ArrayList<>(Math.min(env.postings.size(), limit));
            for (NfjPosting p : env.postings) {
                if (out.size() >= limit) break;
                JobOffer mapped = map(p);
                if (mapped != null) out.add(mapped);
            }
            return out;
        } catch (Exception ex) {
            log.warn("NoFluffJobs fetch failed: {}", ex.getMessage());
            return List.of();
        }
    }

    private JobOffer map(NfjPosting p) {
        if (p == null || p.id == null || p.title == null) return null;
        String companyName = p.name != null ? p.name : "Unknown";

        JobOffer offer = new JobOffer();
        offer.setSource(JobBoardSource.NOFLUFF);
        offer.setExternalId(p.id);
        offer.setTitle(truncate(p.title, 300));
        offer.setCompanyName(truncate(companyName, 200));
        offer.setLocation(truncate(joinLocations(p), 200));
        offer.setRemote(p.location != null && Boolean.TRUE.equals(p.location.fullyRemote));
        if (p.salary != null) {
            offer.setSalaryMin(p.salary.from);
            offer.setSalaryMax(p.salary.to);
            offer.setCurrency(truncate(p.salary.currency, 3));
        }
        offer.setUrl("https://nofluffjobs.com/" + p.url);
        return offer;
    }

    private static String joinLocations(NfjPosting p) {
        if (p.location == null || p.location.places == null || p.location.places.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        for (NfjPlace place : p.location.places) {
            if (place == null || place.city == null) continue;
            if (sb.length() > 0) sb.append(", ");
            sb.append(place.city);
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class NfjEnvelope {
        public List<NfjPosting> postings;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class NfjPosting {
        public String id;
        public String title;
        public String name;
        public String url;
        public NfjLocation location;
        public NfjSalary salary;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class NfjLocation {
        public List<NfjPlace> places;
        public Boolean fullyRemote;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class NfjPlace {
        public String city;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class NfjSalary {
        public BigDecimal from;
        public BigDecimal to;
        public String currency;
    }
}
