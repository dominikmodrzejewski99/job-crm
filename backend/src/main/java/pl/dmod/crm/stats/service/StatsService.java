package pl.dmod.crm.stats.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.shared.security.CurrentUserService;
import pl.dmod.crm.stats.api.dto.DashboardStatsDto;

@Service
@Transactional(readOnly = true)
public class StatsService {

    /** Statuses that mean "the funnel ended without progress." */
    private static final Set<ApplicationStatus> DEAD_END = Set.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.GHOSTED
    );

    /** Anything past plain APPLIED counts as "got a response." */
    private static final Set<ApplicationStatus> RESPONDED = Set.of(
            ApplicationStatus.ACK_RECEIVED,
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_DONE,
            ApplicationStatus.TASK_RECEIVED,
            ApplicationStatus.TASK_SUBMITTED,
            ApplicationStatus.OFFER,
            ApplicationStatus.REJECTED
    );

    /** Mid-funnel: anything between APPLIED and OFFER. */
    private static final Set<ApplicationStatus> INTERVIEW_BUCKET = Set.of(
            ApplicationStatus.ACK_RECEIVED,
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_DONE,
            ApplicationStatus.TASK_RECEIVED,
            ApplicationStatus.TASK_SUBMITTED,
            ApplicationStatus.OFFER
    );

    private static final int WEEKLY_WINDOW_WEEKS = 12;

    private final ApplicationRepository repository;
    private final CurrentUserService currentUser;
    private final Clock clock;

    public StatsService(ApplicationRepository repository,
                        CurrentUserService currentUser,
                        Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public DashboardStatsDto dashboard() {
        UUID userId = currentUser.requireUserId();

        Map<ApplicationStatus, Long> byStatus = loadByStatus(userId);
        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long active = byStatus.entrySet().stream()
                .filter(e -> !DEAD_END.contains(e.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();

        long applied = total - countOf(byStatus, ApplicationStatus.DRAFT);
        long interview = INTERVIEW_BUCKET.stream()
                .mapToLong(s -> countOf(byStatus, s))
                .sum();
        long offer = countOf(byStatus, ApplicationStatus.OFFER);

        long responded = RESPONDED.stream()
                .mapToLong(s -> countOf(byStatus, s))
                .sum();
        double responseRate = applied == 0 ? 0.0 : (double) responded / (double) applied;

        Instant horizon = Instant.now(clock).plus(7, ChronoUnit.DAYS);
        long followUpsDue = repository.countUpcomingFollowUps(userId, horizon);

        List<DashboardStatsDto.WeeklyBucketDto> weekly = computeWeekly(userId);

        return new DashboardStatsDto(
                total, active, byStatus,
                new DashboardStatsDto.FunnelDto(applied, interview, offer),
                responseRate, followUpsDue, weekly
        );
    }

    private Map<ApplicationStatus, Long> loadByStatus(UUID userId) {
        Map<ApplicationStatus, Long> out = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) out.put(s, 0L);
        for (Object[] row : repository.countByStatusForUser(userId)) {
            ApplicationStatus status = (ApplicationStatus) row[0];
            Long count = (Long) row[1];
            out.put(status, count);
        }
        return out;
    }

    private List<DashboardStatsDto.WeeklyBucketDto> computeWeekly(UUID userId) {
        LocalDate today = LocalDate.now(clock);
        LocalDate startOfThisWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate firstBucket = startOfThisWeek.minusWeeks(WEEKLY_WINDOW_WEEKS - 1L);

        Map<LocalDate, Long> buckets = new TreeMap<>();
        for (int i = 0; i < WEEKLY_WINDOW_WEEKS; i++) {
            buckets.put(firstBucket.plusWeeks(i), 0L);
        }

        for (LocalDate appliedAt : repository.appliedDatesSince(userId, firstBucket)) {
            LocalDate bucketKey = appliedAt.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (buckets.containsKey(bucketKey)) {
                buckets.merge(bucketKey, 1L, Long::sum);
            }
        }

        List<DashboardStatsDto.WeeklyBucketDto> out = new ArrayList<>(buckets.size());
        buckets.forEach((week, count) -> out.add(new DashboardStatsDto.WeeklyBucketDto(week, count)));
        return out;
    }

    private static long countOf(Map<ApplicationStatus, Long> map, ApplicationStatus status) {
        return map.getOrDefault(status, 0L);
    }
}
