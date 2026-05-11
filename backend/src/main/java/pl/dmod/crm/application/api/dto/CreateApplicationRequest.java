package pl.dmod.crm.application.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import pl.dmod.crm.application.domain.ApplicationSource;

/**
 * Input payload for {@code POST /api/v1/applications}.
 */
public record CreateApplicationRequest(
        @NotBlank @Size(max = 200) String companyName,
        @NotBlank @Size(max = 200) String position,
        @Size(max = 500) String jobUrl,
        @NotNull ApplicationSource source,
        @Size(max = 200) String location,
        boolean remote,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        @Pattern(regexp = "^[A-Z]{0,3}$", message = "currency must be 0-3 uppercase letters")
        String currency,
        @NotNull LocalDate appliedAt,
        Instant nextFollowUpAt,
        String notes,
        Set<@Size(min = 1, max = 64) String> tags
) {
}
