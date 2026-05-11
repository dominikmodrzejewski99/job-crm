package pl.dmod.crm.auth.service;

import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.auth.api.dto.AuthResponse;
import pl.dmod.crm.auth.api.dto.LoginRequest;
import pl.dmod.crm.auth.api.dto.RegisterRequest;
import pl.dmod.crm.auth.api.dto.UserDto;
import pl.dmod.crm.auth.domain.User;
import pl.dmod.crm.auth.repository.UserRepository;
import pl.dmod.crm.shared.exception.ResourceNotFoundException;

@Service
@Transactional
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;

    public AuthService(UserRepository repository, PasswordEncoder passwordEncoder, JwtService jwt) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (repository.existsByEmailIgnoreCase(req.email())) {
            throw new EmailAlreadyTakenException(req.email());
        }
        User user = new User();
        user.setEmail(req.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName());
        user = repository.save(user);
        return issueResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = repository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new InvalidCredentialsException());
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return issueResponse(user);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User u = repository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        return toDto(u);
    }

    private AuthResponse issueResponse(User user) {
        String token = jwt.issueToken(user.getId(), user.getEmail());
        return new AuthResponse(token, jwt.getValidity().toSeconds(), toDto(user));
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getDisplayName(), u.getCreatedAt());
    }

    public static final class EmailAlreadyTakenException extends RuntimeException {
        public EmailAlreadyTakenException(String email) {
            super("Email " + email + " is already registered");
        }
    }

    public static final class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid email or password");
        }
    }
}
