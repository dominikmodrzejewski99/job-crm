package pl.dmod.crm.followup.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SetFollowUpRequest(@NotNull Instant nextFollowUpAt) {
}
