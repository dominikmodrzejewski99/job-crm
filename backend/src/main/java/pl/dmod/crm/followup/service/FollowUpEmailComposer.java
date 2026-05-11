package pl.dmod.crm.followup.service;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import org.springframework.stereotype.Component;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.auth.domain.User;

/**
 * Builds the subject + plain-text body of a follow-up reminder email.
 * Kept separate from {@link FollowUpReminderService} so the composition
 * is testable without touching the mail transport.
 */
@Component
public class FollowUpEmailComposer {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("d MMM yyyy").withZone(ZoneId.systemDefault());

    public String subject(Application application) {
        return "[JobTrack] Follow-up: " + application.getCompanyName();
    }

    public String body(Application application, User recipient) {
        String name = recipient.getDisplayName() != null && !recipient.getDisplayName().isBlank()
                ? recipient.getDisplayName()
                : recipient.getEmail();

        return """
                Cześć %s,

                Ustawiłeś przypomnienie o follow-upie dla aplikacji:

                  Firma:       %s
                  Stanowisko:  %s
                  Aplikowano:  %s
                  Termin:      %s

                Sprawdź status u rekrutera i zaktualizuj aplikację:
                http://localhost:4200/app

                — JobTrack
                """.formatted(
                name,
                application.getCompanyName(),
                application.getPosition(),
                DATE.format(application.getAppliedAt().atStartOfDay(ZoneId.systemDefault()).toInstant()),
                DATE.format(application.getNextFollowUpAt())
        );
    }
}
