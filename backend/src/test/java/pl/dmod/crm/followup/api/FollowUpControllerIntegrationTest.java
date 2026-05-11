package pl.dmod.crm.followup.api;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.domain.ApplicationSource;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.auth.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
@TestPropertySource(properties = {
        "jobtrack.auth.jwt.secret=test-secret-test-secret-test-secret-32+",
        "jobtrack.followup.initial-delay-ms=999999999",
        "jobtrack.followup.fixed-delay-ms=999999999"
})
class FollowUpControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ApplicationRepository applications;
    @Autowired UserRepository users;

    @MockBean JavaMailSender mailSender;

    private final UUID userA = UUID.randomUUID();

    @BeforeEach
    void clean() {
        applications.deleteAll();
        users.deleteAll();
        var u = new pl.dmod.crm.auth.domain.User();
        u.setId(userA);
        u.setEmail("a@example.com");
        u.setPasswordHash("x");
        users.save(u);
    }

    @Test
    void upcoming_lists_followups_due_within_the_horizon() throws Exception {
        Instant now = Instant.now();
        applications.save(app("Acme", now.plus(2, ChronoUnit.HOURS)));   // due
        applications.save(app("Globex", now.plus(2, ChronoUnit.DAYS)));  // due
        applications.save(app("FarFuture", now.plus(30, ChronoUnit.DAYS))); // outside default horizon

        mvc.perform(get("/api/v1/follow-ups/upcoming").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", equalTo(2)))
                .andExpect(jsonPath("$[0].companyName", equalTo("Acme")))
                .andExpect(jsonPath("$[1].companyName", equalTo("Globex")));
    }

    @Test
    void mark_done_clears_followup() throws Exception {
        Application a = applications.save(app("Acme", Instant.now().plus(1, ChronoUnit.HOURS)));

        mvc.perform(post("/api/v1/applications/{id}/follow-up/done", a.getId()).with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextFollowUpAt").doesNotExist());
    }

    @Test
    void snooze_pushes_the_followup_into_the_future() throws Exception {
        Instant past = Instant.now().minus(1, ChronoUnit.DAYS);
        Application a = applications.save(app("Acme", past));

        mvc.perform(post("/api/v1/applications/{id}/follow-up/snooze", a.getId())
                        .with(authAs(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "days": 3 }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextFollowUpAt").isString());

        Application reloaded = applications.findById(a.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(reloaded.getNextFollowUpAt()).isAfter(Instant.now());
    }

    private Application app(String company, Instant followUp) {
        Application a = new Application();
        a.setUserId(userA);
        a.setCompanyName(company);
        a.setPosition("Engineer");
        a.setSource(ApplicationSource.OTHER);
        a.setAppliedAt(LocalDate.now());
        a.setCurrentStatus(ApplicationStatus.APPLIED);
        a.setNextFollowUpAt(followUp);
        return a;
    }

    private RequestPostProcessor authAs(UUID userId) {
        var token = new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return authentication(token);
    }
}
