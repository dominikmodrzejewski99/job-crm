package pl.dmod.crm.auth.api;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import pl.dmod.crm.auth.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
@TestPropertySource(properties = "jobtrack.auth.jwt.secret=test-secret-test-secret-test-secret-32+")
class AuthControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;

    @BeforeEach
    void clean() {
        users.deleteAll();
    }

    @Test
    void register_login_me_round_trip() throws Exception {
        // Register
        MvcResult registered = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "dom@example.com",
                                  "password": "strong-pass-123",
                                  "displayName": "Dominik" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.expiresInSeconds", greaterThan(0)))
                .andExpect(jsonPath("$.user.email", equalTo("dom@example.com")))
                .andReturn();

        String token = json.readTree(registered.getResponse().getContentAsString())
                .get("accessToken").asText();

        // /me requires the token
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", equalTo("dom@example.com")));

        // Login with same credentials returns a fresh token
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "dom@example.com", "password": "strong-pass-123" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").isString());
    }

    @Test
    void register_with_existing_email_returns_conflict() throws Exception {
        register("dup@example.com");
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "dup@example.com",
                                  "password": "strong-pass-123" }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title", equalTo("Email already taken")));
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        register("user@example.com");
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "user@example.com", "password": "wrong-pass-123" }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title", equalTo("Invalid credentials")));
    }

    @Test
    void me_without_token_is_unauthorized() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private void register(String email) throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "%s", "password": "strong-pass-123" }
                                """.formatted(email)))
                .andExpect(status().isOk());
    }
}
