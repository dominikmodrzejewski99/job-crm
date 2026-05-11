package pl.dmod.crm.stats.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.dmod.crm.stats.api.dto.DashboardStatsDto;
import pl.dmod.crm.stats.service.StatsService;

@RestController
@RequestMapping("/api/v1/stats")
@Tag(name = "Stats", description = "Aggregated dashboard data for the current user")
public class StatsController {

    private final StatsService service;

    public StatsController(StatsService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Composite dashboard payload: totals, status breakdown, funnel, weekly applied series.")
    public DashboardStatsDto dashboard() {
        return service.dashboard();
    }
}
