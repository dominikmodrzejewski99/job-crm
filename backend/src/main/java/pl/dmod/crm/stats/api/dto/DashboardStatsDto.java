package pl.dmod.crm.stats.api.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import pl.dmod.crm.application.domain.ApplicationStatus;

public record DashboardStatsDto(
        long total,
        long active,
        Map<ApplicationStatus, Long> byStatus,
        FunnelDto funnel,
        double responseRate,
        long followUpsDueWithin7Days,
        List<WeeklyBucketDto> weekly
) {

    public record FunnelDto(long applied, long interview, long offer) {
    }

    public record WeeklyBucketDto(LocalDate weekStart, long applied) {
    }
}
