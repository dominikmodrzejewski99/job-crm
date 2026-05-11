package pl.dmod.crm.application.api;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.auth.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
@TestPropertySource(properties = "jobtrack.auth.jwt.secret=test-secret-test-secret-test-secret-32+")
class ApplicationControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ApplicationRepository repository;
    @Autowired UserRepository userRepository;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();

    @BeforeEach
    void clean() {
        repository.deleteAll();
        userRepository.deleteAll();
        seedUser(userA, "a@example.com");
        seedUser(userB, "b@example.com");
    }

    @Test
    void create_then_get_returns_the_same_record() throws Exception {
        String body = """
                {
                  "companyName": "Acme Corp",
                  "position": "Senior Java Engineer",
                  "source": "JUSTJOIN",
                  "remote": true,
                  "appliedAt": "2026-05-01",
                  "tags": ["java", "remote"]
                }
                """;

        MvcResult created = mvc.perform(post("/api/v1/applications")
                        .with(authAs(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.companyName", equalTo("Acme Corp")))
                .andExpect(jsonPath("$.currentStatus", equalTo("APPLIED")))
                .andReturn();

        String id = json.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/v1/applications/{id}", id).with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.position", equalTo("Senior Java Engineer")))
                .andExpect(jsonPath("$.tags.length()", equalTo(2)));
    }

    @Test
    void list_only_shows_current_users_applications() throws Exception {
        repository.save(seed(userA, "AcmeA", LocalDate.of(2026, 5, 1)));
        repository.save(seed(userA, "AcmeA2", LocalDate.of(2026, 5, 2)));
        repository.save(seed(userB, "GlobexB", LocalDate.of(2026, 5, 3)));

        mvc.perform(get("/api/v1/applications").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(2)));

        mvc.perform(get("/api/v1/applications").with(authAs(userB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(1)))
                .andExpect(jsonPath("$.content[0].companyName", equalTo("GlobexB")));
    }

    @Test
    void other_user_cannot_read_or_delete_anothers_application() throws Exception {
        var owned = repository.save(seed(userA, "AcmeA", LocalDate.now()));
        String id = owned.getId().toString();

        mvc.perform(get("/api/v1/applications/{id}", id).with(authAs(userB)))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/v1/applications/{id}", id).with(authAs(userB)))
                .andExpect(status().isNotFound());

        // Original owner still sees it.
        mvc.perform(get("/api/v1/applications/{id}", id).with(authAs(userA)))
                .andExpect(status().isOk());
    }

    @Test
    void patch_updates_only_provided_fields() throws Exception {
        var entity = repository.save(seed(userA, "OldCo", LocalDate.of(2026, 4, 1)));
        String id = entity.getId().toString();

        mvc.perform(patch("/api/v1/applications/{id}", id)
                        .with(authAs(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "companyName": "NewCo" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", equalTo("NewCo")))
                .andExpect(jsonPath("$.position", equalTo("Engineer")));
    }

    @Test
    void unauthenticated_request_is_rejected() throws Exception {
        mvc.perform(get("/api/v1/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validation_errors_come_back_as_problem_detail() throws Exception {
        mvc.perform(post("/api/v1/applications")
                        .with(authAs(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "companyName": "",
                                  "position": "",
                                  "source": "JUSTJOIN",
                                  "appliedAt": "2026-05-01"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", equalTo("Validation failed")))
                .andExpect(jsonPath("$.fieldErrors.companyName").exists())
                .andExpect(jsonPath("$.fieldErrors.position").exists());
    }

    private void seedUser(UUID id, String email) {
        var u = new pl.dmod.crm.auth.domain.User();
        u.setId(id);
        u.setEmail(email);
        u.setPasswordHash("x");
        userRepository.save(u);
    }

    private pl.dmod.crm.application.domain.Application seed(UUID owner, String company, LocalDate appliedAt) {
        var a = new pl.dmod.crm.application.domain.Application();
        a.setUserId(owner);
        a.setCompanyName(company);
        a.setPosition("Engineer");
        a.setSource(pl.dmod.crm.application.domain.ApplicationSource.JUSTJOIN);
        a.setAppliedAt(appliedAt);
        a.setCurrentStatus(pl.dmod.crm.application.domain.ApplicationStatus.APPLIED);
        return a;
    }

    private RequestPostProcessor authAs(UUID userId) {
        var token = new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return authentication(token);
    }
}
