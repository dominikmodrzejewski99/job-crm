package pl.dmod.crm.followup.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.auth.domain.User;
import pl.dmod.crm.auth.repository.UserRepository;

/**
 * Periodically scans for applications whose follow-up date has come due and
 * fires an email reminder to the owner. Idempotent — once an email is sent
 * for a given {@code nextFollowUpAt}, the row is stamped with
 * {@code nextFollowUpReminderSentAt}, so re-scans skip it until the user
 * snoozes or clears the follow-up.
 */
@Service
public class FollowUpReminderService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpReminderService.class);

    private final ApplicationRepository applications;
    private final UserRepository users;
    private final JavaMailSender mailSender;
    private final FollowUpEmailComposer composer;
    private final Clock clock;

    private final String fromAddress;

    public FollowUpReminderService(ApplicationRepository applications,
                                   UserRepository users,
                                   JavaMailSender mailSender,
                                   FollowUpEmailComposer composer,
                                   Clock clock,
                                   @Value("${jobtrack.followup.from:noreply@jobtrack.local}") String fromAddress) {
        this.applications = applications;
        this.users = users;
        this.mailSender = mailSender;
        this.composer = composer;
        this.clock = clock;
        this.fromAddress = fromAddress;
    }

    /** Runs at startup-delay + every {@code jobtrack.followup.cron-rate-ms} ms. */
    @Scheduled(
            initialDelayString = "${jobtrack.followup.initial-delay-ms:30000}",
            fixedDelayString = "${jobtrack.followup.fixed-delay-ms:300000}"
    )
    public void scan() {
        runOnce();
    }

    /**
     * Single iteration of the reminder scan. Exposed so it can be invoked
     * directly from tests without waiting for the scheduler to fire.
     */
    @Transactional
    public int runOnce() {
        Instant now = Instant.now(clock);
        List<Application> due = applications.findPendingReminders(now);
        if (due.isEmpty()) return 0;

        int sent = 0;
        for (Application app : due) {
            User owner = users.findById(app.getUserId()).orElse(null);
            if (owner == null) {
                log.warn("Skipping follow-up reminder for application {} — owner {} not found",
                        app.getId(), app.getUserId());
                continue;
            }
            try {
                send(owner, app);
                app.setNextFollowUpReminderSentAt(now);
                applications.save(app);
                sent++;
            } catch (Exception ex) {
                log.warn("Failed to send follow-up reminder for application {}: {}",
                        app.getId(), ex.getMessage());
            }
        }
        if (sent > 0) {
            log.info("Sent {} follow-up reminder(s) (out of {} due)", sent, due.size());
        }
        return sent;
    }

    private void send(User recipient, Application application) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(recipient.getEmail());
        msg.setSubject(composer.subject(application));
        msg.setText(composer.body(application, recipient));
        mailSender.send(msg);
    }
}
