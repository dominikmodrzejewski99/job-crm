package pl.dmod.crm.application.api;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import pl.dmod.crm.application.repository.ApplicationRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
class ApplicationControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ApplicationRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.companyName", equalTo("Acme Corp")))
                .andExpect(jsonPath("$.currentStatus", equalTo("APPLIED")))
                .andReturn();

        String id = json.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/v1/applications/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.position", equalTo("Senior Java Engineer")))
                .andExpect(jsonPath("$.tags.length()", equalTo(2)));
    }

    @Test
    void list_filters_by_status() throws Exception {
        repository.save(seed("A", LocalDate.of(2026, 5, 1)));
        repository.save(seed("B", LocalDate.of(2026, 5, 2)));

        mvc.perform(get("/api/v1/applications").param("status", "APPLIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(2)));

        mvc.perform(get("/api/v1/applications").param("status", "OFFER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", equalTo(0)));
    }

    @Test
    void patch_updates_only_provided_fields() throws Exception {
        var entity = repository.save(seed("OldCo", LocalDate.of(2026, 4, 1)));
        String id = entity.getId().toString();

        mvc.perform(patch("/api/v1/applications/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "companyName": "NewCo" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", equalTo("NewCo")))
                .andExpect(jsonPath("$.position", equalTo("Engineer"))); // unchanged
    }

    @Test
    void status_change_endpoint_moves_state() throws Exception {
        var entity = repository.save(seed("X", LocalDate.now()));
        String id = entity.getId().toString();

        mvc.perform(post("/api/v1/applications/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "INTERVIEW_SCHEDULED" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStatus", equalTo("INTERVIEW_SCHEDULED")));
    }

    @Test
    void validation_errors_come_back_as_problem_detail() throws Exception {
        mvc.perform(post("/api/v1/applications")
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

    @Test
    void delete_then_get_returns_not_found_problem() throws Exception {
        var entity = repository.save(seed("Z", LocalDate.now()));
        String id = entity.getId().toString();

        mvc.perform(delete("/api/v1/applications/{id}", id))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/applications/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", equalTo("Resource not found")));
    }

    private pl.dmod.crm.application.domain.Application seed(String company, LocalDate appliedAt) {
        var a = new pl.dmod.crm.application.domain.Application();
        a.setCompanyName(company);
        a.setPosition("Engineer");
        a.setSource(pl.dmod.crm.application.domain.ApplicationSource.JUSTJOIN);
        a.setAppliedAt(appliedAt);
        a.setCurrentStatus(pl.dmod.crm.application.domain.ApplicationStatus.APPLIED);
        return a;
    }
}
