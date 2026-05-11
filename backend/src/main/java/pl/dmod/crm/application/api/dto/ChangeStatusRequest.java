package pl.dmod.crm.application.api.dto;

import jakarta.validation.constraints.NotNull;
import pl.dmod.crm.application.domain.ApplicationStatus;

/**
 * Input payload for {@code POST /api/v1/applications/{id}/status}.
 */
public record ChangeStatusRequest(@NotNull ApplicationStatus status) {
}
