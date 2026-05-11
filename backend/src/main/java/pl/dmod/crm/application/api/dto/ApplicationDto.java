package pl.dmod.crm.application.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import pl.dmod.crm.application.domain.ApplicationSource;
import pl.dmod.crm.application.domain.ApplicationStatus;

/**
 * Read model returned by every {@code GET /api/v1/applications/*} endpoint.
 * Mirrors {@link pl.dmod.crm.application.domain.Application} without leaking
 * JPA annotations or the entity's mutable accessors.
 */
public record ApplicationDto(
        UUID id,
        String companyName,
        String position,
        String jobUrl,
        ApplicationSource source,
        String location,
        boolean remote,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        String currency,
        LocalDate appliedAt,
        ApplicationStatus currentStatus,
        Instant nextFollowUpAt,
        boolean archived,
        String notes,
        Set<String> tags,
        Instant createdAt,
        Instant updatedAt
) {
}
