package pl.dmod.crm.followup.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.application.api.ApplicationMapper;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.shared.exception.ResourceNotFoundException;
import pl.dmod.crm.shared.security.CurrentUserService;

/**
 * User-facing follow-up actions. The companion {@link FollowUpReminderService}
 * does the scheduled email work; this service handles the synchronous side
 * (list / set / snooze / done) invoked by the frontend.
 */
@Service
@Transactional
public class FollowUpService {

    private static final long DEFAULT_HORIZON_DAYS = 7L;

    private final ApplicationRepository applications;
    private final ApplicationMapper mapper;
    private final CurrentUserService currentUser;
    private final Clock clock;

    public FollowUpService(ApplicationRepository applications, ApplicationMapper mapper,
                           CurrentUserService currentUser, Clock clock) {
        this.applications = applications;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> upcoming(Long withinDays) {
        long days = withinDays != null && withinDays > 0 ? withinDays : DEFAULT_HORIZON_DAYS;
        Instant horizon = Instant.now(clock).plus(days, ChronoUnit.DAYS);
        return applications.findUpcomingForUser(currentUser.requireUserId(), horizon).stream()
                .map(mapper::toDto)
                .toList();
    }

    public ApplicationDto setFollowUp(UUID id, Instant when) {
        Application app = loadOwned(id);
        app.setNextFollowUpAt(when);
        app.setNextFollowUpReminderSentAt(null);
        return mapper.toDto(applications.save(app));
    }

    public ApplicationDto markDone(UUID id) {
        Application app = loadOwned(id);
        app.setNextFollowUpAt(null);
        app.setNextFollowUpReminderSentAt(null);
        return mapper.toDto(applications.save(app));
    }

    public ApplicationDto snooze(UUID id, long days) {
        long bumped = days <= 0 ? 1 : days;
        return setFollowUp(id, Instant.now(clock).plus(bumped, ChronoUnit.DAYS));
    }

    private Application loadOwned(UUID id) {
        UUID userId = currentUser.requireUserId();
        Application app = applications.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Application", id));
        if (!userId.equals(app.getUserId())) {
            throw ResourceNotFoundException.of("Application", id);
        }
        return app;
    }
}
