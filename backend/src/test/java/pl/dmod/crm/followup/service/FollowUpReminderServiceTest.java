package pl.dmod.crm.followup.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.domain.ApplicationSource;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.auth.domain.User;
import pl.dmod.crm.auth.repository.UserRepository;

class FollowUpReminderServiceTest {

    private final Instant fixedNow = Instant.parse("2026-05-11T08:00:00Z");
    private final Clock clock = Clock.fixed(fixedNow, ZoneId.of("UTC"));

    private final ApplicationRepository applications = mock(ApplicationRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final JavaMailSender mailSender = mock(JavaMailSender.class);

    private final FollowUpReminderService service = new FollowUpReminderService(
            applications, users, mailSender,
            new FollowUpEmailComposer(),
            clock,
            "noreply@jobtrack.local"
    );

    @Test
    void runOnce_sends_one_email_per_due_application_and_marks_them() {
        UUID userA = UUID.randomUUID();
        Application a = sample(userA, "Acme");
        Application b = sample(userA, "Globex");
        when(applications.findPendingReminders(fixedNow)).thenReturn(List.of(a, b));
        when(users.findById(userA)).thenReturn(Optional.of(user(userA, "dom@example.com")));

        int sent = service.runOnce();

        assertThat(sent).isEqualTo(2);
        verify(mailSender, times(2)).send(any(SimpleMailMessage.class));
        assertThat(a.getNextFollowUpReminderSentAt()).isEqualTo(fixedNow);
        assertThat(b.getNextFollowUpReminderSentAt()).isEqualTo(fixedNow);
        verify(applications, times(2)).save(any(Application.class));
    }

    @Test
    void runOnce_skips_application_when_owner_user_is_missing() {
        UUID ghostUser = UUID.randomUUID();
        Application orphan = sample(ghostUser, "Ghosted Co");
        when(applications.findPendingReminders(fixedNow)).thenReturn(List.of(orphan));
        when(users.findById(ghostUser)).thenReturn(Optional.empty());

        int sent = service.runOnce();

        assertThat(sent).isZero();
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
        assertThat(orphan.getNextFollowUpReminderSentAt()).isNull();
    }

    @Test
    void runOnce_continues_after_mail_send_failure() {
        UUID uid = UUID.randomUUID();
        Application a = sample(uid, "A");
        Application b = sample(uid, "B");
        when(applications.findPendingReminders(fixedNow)).thenReturn(List.of(a, b));
        when(users.findById(uid)).thenReturn(Optional.of(user(uid, "u@example.com")));
        org.mockito.Mockito.doThrow(new org.springframework.mail.MailSendException("smtp down"))
                .doNothing()
                .when(mailSender).send(any(SimpleMailMessage.class));

        int sent = service.runOnce();

        assertThat(sent).isEqualTo(1);
        // Only the second application should be marked as reminded.
        assertThat(a.getNextFollowUpReminderSentAt()).isNull();
        assertThat(b.getNextFollowUpReminderSentAt()).isEqualTo(fixedNow);
    }

    private Application sample(UUID owner, String company) {
        Application a = new Application();
        a.setId(UUID.randomUUID());
        a.setUserId(owner);
        a.setCompanyName(company);
        a.setPosition("Engineer");
        a.setSource(ApplicationSource.OTHER);
        a.setAppliedAt(LocalDate.of(2026, 5, 1));
        a.setNextFollowUpAt(fixedNow);
        return a;
    }

    private User user(UUID id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setPasswordHash("x");
        u.setDisplayName("Test");
        return u;
    }
}
