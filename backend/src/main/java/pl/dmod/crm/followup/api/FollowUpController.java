package pl.dmod.crm.followup.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.followup.api.dto.SetFollowUpRequest;
import pl.dmod.crm.followup.api.dto.SnoozeRequest;
import pl.dmod.crm.followup.service.FollowUpService;

@RestController
@Tag(name = "Follow-ups", description = "Reminders for sticking with job applications")
public class FollowUpController {

    private final FollowUpService service;

    public FollowUpController(FollowUpService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/follow-ups/upcoming")
    @Operation(summary = "Upcoming + overdue follow-ups for the current user",
            description = "Returns applications whose nextFollowUpAt is within the supplied horizon (default 7 days), soonest first.")
    public List<ApplicationDto> upcoming(@RequestParam(required = false) Long withinDays) {
        return service.upcoming(withinDays);
    }

    @PostMapping("/api/v1/applications/{id}/follow-up")
    @Operation(summary = "Set or change the next follow-up date")
    public ApplicationDto set(@PathVariable UUID id, @Valid @RequestBody SetFollowUpRequest req) {
        return service.setFollowUp(id, req.nextFollowUpAt());
    }

    @PostMapping("/api/v1/applications/{id}/follow-up/done")
    @Operation(summary = "Mark follow-up as done — clears the reminder")
    public ApplicationDto markDone(@PathVariable UUID id) {
        return service.markDone(id);
    }

    @PostMapping("/api/v1/applications/{id}/follow-up/snooze")
    @Operation(summary = "Push the follow-up by N days")
    public ApplicationDto snooze(@PathVariable UUID id, @Valid @RequestBody SnoozeRequest req) {
        return service.snooze(id, req.days());
    }
}
