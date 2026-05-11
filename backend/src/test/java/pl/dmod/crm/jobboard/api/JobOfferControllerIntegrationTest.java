package pl.dmod.crm.jobboard.api;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.auth.repository.UserRepository;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;
import pl.dmod.crm.jobboard.repository.JobOfferRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
@TestPropertySource(properties = {
        "jobtrack.auth.jwt.secret=test-secret-test-secret-test-secret-32+",
        "jobtrack.jobboard.enabled=false"
})
class JobOfferControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired JobOfferRepository offers;
    @Autowired ApplicationRepository applications;
    @Autowired UserRepository users;

    private final UUID userA = UUID.randomUUID();

    @BeforeEach
    void clean() {
        applications.deleteAll();
        offers.deleteAll();
        users.deleteAll();
        seedUser(userA, "a@example.com");
    }

    @Test
    void list_returns_all_crawled_offers_for_any_authenticated_user() throws Exception {
        offers.save(seedOffer(JobBoardSource.JUSTJOIN, "jjit-1", "Java Dev", "Acme"));
        offers.save(seedOffer(JobBoardSource.NOFLUFF, "nfj-1", "Spring Dev", "Globex"));

        mvc.perform(get("/api/v1/joboffers").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(2)))
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void list_filters_by_source_when_query_param_is_present() throws Exception {
        offers.save(seedOffer(JobBoardSource.JUSTJOIN, "jjit-1", "Java Dev", "Acme"));
        offers.save(seedOffer(JobBoardSource.NOFLUFF, "nfj-1", "Spring Dev", "Globex"));

        mvc.perform(get("/api/v1/joboffers")
                        .param("source", "NOFLUFF")
                        .with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(1)))
                .andExpect(jsonPath("$.content[0].source", equalTo("NOFLUFF")));
    }

    @Test
    void save_as_application_creates_an_application_owned_by_the_caller() throws Exception {
        var offer = offers.save(seedOffer(JobBoardSource.JUSTJOIN, "jjit-42", "Java Dev", "Acme"));

        mvc.perform(post("/api/v1/joboffers/{id}/save-as-application", offer.getId())
                        .with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", equalTo("Acme")))
                .andExpect(jsonPath("$.position", equalTo("Java Dev")));

        // And it sticks: the application now shows up in the user's list.
        mvc.perform(get("/api/v1/applications").with(authAs(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(1)));
    }

    @Test
    void list_requires_authentication() throws Exception {
        mvc.perform(get("/api/v1/joboffers"))
                .andExpect(status().isUnauthorized());
    }

    private JobOffer seedOffer(JobBoardSource source, String externalId, String title, String company) {
        var o = new JobOffer();
        o.setSource(source);
        o.setExternalId(externalId);
        o.setTitle(title);
        o.setCompanyName(company);
        o.setRemote(true);
        o.setUrl("https://example.test/" + externalId);
        o.setFetchedAt(Instant.now());
        return o;
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
