package pl.dmod.crm.stats.api;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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
        "jobtrack.jobboard.enabled=false"
})
class StatsControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ApplicationRepository applications;
    @Autowired UserRepository users;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();

    @BeforeEach
    void clean() {
        applications.deleteAll();
        users.deleteAll();
        seedUser(userA, "a@example.com");
        seedUser(userB, "b@example.com");
    }

    @Test
    void dashboard_counts_only_the_current_users_applications() throws Exception {
        applications.save(seed(userA, "Acme", ApplicationStatus.APPLIED));
        applications.save(seed(userA, "Globex", ApplicationStatus.INTERVIEW_SCHEDULED));
        applications.save(seed(userA, "Initech", ApplicationStatus.OFFER));
        applications.save(seed(userB, "Hooli", ApplicationStatus.APPLIED));

        mvc.perform(get("/api/v1/stats/dashboard").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", equalTo(3)))
                .andExpect(jsonPath("$.byStatus.APPLIED", equalTo(1)))
                .andExpect(jsonPath("$.byStatus.INTERVIEW_SCHEDULED", equalTo(1)))
                .andExpect(jsonPath("$.byStatus.OFFER", equalTo(1)))
                .andExpect(jsonPath("$.funnel.applied", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.funnel.interview", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.funnel.offer", greaterThanOrEqualTo(1)));

        mvc.perform(get("/api/v1/stats/dashboard").with(authAs(userB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", equalTo(1)));
    }

    @Test
    void dashboard_returns_empty_aggregates_for_brand_new_user() throws Exception {
        mvc.perform(get("/api/v1/stats/dashboard").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", equalTo(0)))
                .andExpect(jsonPath("$.active", equalTo(0)))
                .andExpect(jsonPath("$.responseRate", equalTo(0.0)));
    }

    @Test
    void dashboard_requires_authentication() throws Exception {
        mvc.perform(get("/api/v1/stats/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    private Application seed(UUID owner, String company, ApplicationStatus status) {
        var a = new Application();
        a.setUserId(owner);
        a.setCompanyName(company);
        a.setPosition("Engineer");
        a.setSource(ApplicationSource.JUSTJOIN);
        a.setAppliedAt(LocalDate.now());
        a.setCurrentStatus(status);
        return a;
    }

    private void seedUser(UUID id, String email) {
        var u = new pl.dmod.crm.auth.domain.User();
        u.setId(id);
        u.setEmail(email);
        u.setPasswordHash("x");
        users.save(u);
    }

    private RequestPostProcessor authAs(UUID userId) {
        var token = new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return authentication(token);
    }
}
