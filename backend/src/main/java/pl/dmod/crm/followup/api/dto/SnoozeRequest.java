package pl.dmod.crm.followup.api.dto;

import jakarta.validation.constraints.Min;

public record SnoozeRequest(@Min(1) long days) {
}
