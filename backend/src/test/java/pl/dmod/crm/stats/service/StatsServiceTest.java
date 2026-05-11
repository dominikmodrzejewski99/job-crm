package pl.dmod.crm.stats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.shared.security.CurrentUserService;
import pl.dmod.crm.stats.api.dto.DashboardStatsDto;

class StatsServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final ZoneId UTC = ZoneId.of("UTC");
    private static final LocalDate TODAY = LocalDate.of(2026, 5, 11); // a Monday
    private static final Clock FIXED = Clock.fixed(TODAY.atStartOfDay(UTC).toInstant(), UTC);

    private final ApplicationRepository repo = mock(ApplicationRepository.class);
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final StatsService service = new StatsService(repo, currentUser, FIXED);

    {
        when(currentUser.requireUserId()).thenReturn(USER);
    }

    @Test
    void dashboard_computes_totals_funnel_and_response_rate() {
        when(repo.countByStatusForUser(USER)).thenReturn(List.of(
                row(ApplicationStatus.APPLIED, 10),
                row(ApplicationStatus.ACK_RECEIVED, 4),
                row(ApplicationStatus.INTERVIEW_SCHEDULED, 2),
                row(ApplicationStatus.OFFER, 1),
                row(ApplicationStatus.REJECTED, 3),
                row(ApplicationStatus.DRAFT, 2)
        ));
        when(repo.appliedDatesSince(eq(USER), any())).thenReturn(List.of());
        when(repo.countUpcomingFollowUps(eq(USER), any())).thenReturn(2L);

        DashboardStatsDto stats = service.dashboard();

        assertThat(stats.total()).isEqualTo(22);
        // Active excludes REJECTED/WITHDRAWN/GHOSTED → 22 - 3 = 19
        assertThat(stats.active()).isEqualTo(19);

        // Funnel
        assertThat(stats.funnel().applied()).isEqualTo(20);   // total minus DRAFT
        assertThat(stats.funnel().interview()).isEqualTo(7);  // ACK + INTERVIEW_SCHEDULED + OFFER
        assertThat(stats.funnel().offer()).isEqualTo(1);

        // Response rate: responded (4+2+1+3 = 10) / applied (20) = 0.5
        assertThat(stats.responseRate()).isCloseTo(0.5, within(0.0001));

        assertThat(stats.followUpsDueWithin7Days()).isEqualTo(2L);
        assertThat(stats.byStatus().get(ApplicationStatus.APPLIED)).isEqualTo(10L);
        assertThat(stats.byStatus().get(ApplicationStatus.GHOSTED)).isZero();
    }

    @Test
    void weekly_buckets_cover_last_12_iso_weeks_with_correct_counts() {
        // 3 applications: one this week, one 2 weeks ago, one outside the window.
        when(repo.countByStatusForUser(USER)).thenReturn(List.of());
        when(repo.appliedDatesSince(eq(USER), any())).thenReturn(List.of(
                TODAY,                      // this week's Monday
                TODAY.minusWeeks(2).plusDays(3), // 2 weeks ago, Thursday
                TODAY.minusWeeks(20)        // outside the window — bucket key absent
        ));
        when(repo.countUpcomingFollowUps(eq(USER), any())).thenReturn(0L);

        DashboardStatsDto stats = service.dashboard();

        assertThat(stats.weekly()).hasSize(12);
        // Last bucket is "this week"
        assertThat(stats.weekly().get(11).weekStart()).isEqualTo(TODAY);
        assertThat(stats.weekly().get(11).applied()).isEqualTo(1L);
        // 2 weeks ago bucket should have one
        assertThat(stats.weekly().get(9).applied()).isEqualTo(1L);
        // All others zero
        long zeroBuckets = stats.weekly().stream().filter(b -> b.applied() == 0).count();
        assertThat(zeroBuckets).isEqualTo(10);
    }

    @Test
    void response_rate_is_zero_when_no_applications() {
        when(repo.countByStatusForUser(USER)).thenReturn(List.of());
        when(repo.appliedDatesSince(eq(USER), any())).thenReturn(List.of());
        when(repo.countUpcomingFollowUps(eq(USER), any())).thenReturn(0L);

        DashboardStatsDto stats = service.dashboard();

        assertThat(stats.total()).isZero();
        assertThat(stats.responseRate()).isZero();
        assertThat(stats.funnel().applied()).isZero();
    }

    private static Object[] row(ApplicationStatus status, long count) {
        return new Object[]{status, count};
    }

    private static Instant tomorrowAt8() {
        return TODAY.plusDays(1).atStartOfDay(UTC).toInstant().plusSeconds(8 * 3600);
    }
}
