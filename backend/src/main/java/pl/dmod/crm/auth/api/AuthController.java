package pl.dmod.crm.auth.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.dmod.crm.auth.api.dto.AuthResponse;
import pl.dmod.crm.auth.api.dto.LoginRequest;
import pl.dmod.crm.auth.api.dto.RegisterRequest;
import pl.dmod.crm.auth.api.dto.UserDto;
import pl.dmod.crm.auth.service.AuthService;
import pl.dmod.crm.shared.security.CurrentUserService;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Email / password registration, login, current user")
public class AuthController {

    private final AuthService auth;
    private final CurrentUserService currentUser;

    public AuthController(AuthService auth, CurrentUserService currentUser) {
        this.auth = auth;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new account and return an access token")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    @Operation(summary = "Log in with email + password and return an access token")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user")
    public UserDto me() {
        return auth.getCurrentUser(currentUser.requireUserId());
    }
}
