package pl.dmod.crm.application.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import pl.dmod.crm.application.domain.ApplicationSource;

/**
 * Partial update payload for {@code PATCH /api/v1/applications/{id}}. Every
 * field is optional — null means "do not touch". For boolean / primitive
 * fields the caller must send the full intended value.
 */
public record UpdateApplicationRequest(
        @Size(max = 200) String companyName,
        @Size(max = 200) String position,
        @Size(max = 500) String jobUrl,
        ApplicationSource source,
        @Size(max = 200) String location,
        Boolean remote,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        @Pattern(regexp = "^[A-Z]{0,3}$")
        String currency,
        LocalDate appliedAt,
        Instant nextFollowUpAt,
        Boolean archived,
        String notes,
        Set<@Size(min = 1, max = 64) String> tags
) {
}
