package pl.dmod.crm.jobboard.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import pl.dmod.crm.jobboard.domain.JobBoardSource;

public record JobOfferDto(
        UUID id,
        JobBoardSource source,
        String externalId,
        String title,
        String companyName,
        String location,
        boolean remote,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        String currency,
        String url,
        Instant postedAt,
        Instant fetchedAt
) {
}
