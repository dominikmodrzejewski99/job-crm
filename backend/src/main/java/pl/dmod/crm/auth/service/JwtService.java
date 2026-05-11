package pl.dmod.crm.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Signs and validates HS256 JWTs. Stateless — the only dependency is the
 * shared secret, configured under {@code jobtrack.auth.jwt.*} in
 * application.yml. Tokens carry the user id as the subject and the email as
 * a custom claim so the filter can fail fast without a DB lookup.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final Duration validity;
    private final String issuer;

    public JwtService(@Value("${jobtrack.auth.jwt.secret}") String secret,
                      @Value("${jobtrack.auth.jwt.validity:PT1H}") Duration validity,
                      @Value("${jobtrack.auth.jwt.issuer:jobtrack}") String issuer) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                    "jobtrack.auth.jwt.secret must be at least 32 characters for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.validity = validity;
        this.issuer = issuer;
    }

    public String issueToken(UUID userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(validity)))
                .signWith(signingKey)
                .compact();
    }

    public Duration getValidity() {
        return validity;
    }

    /** Returns the user id encoded in the token. Throws on invalid / expired tokens. */
    public UUID parseUserId(String token) {
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token);
            return UUID.fromString(jws.getPayload().getSubject());
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidJwtException("Invalid or expired JWT", ex);
        }
    }

    public static final class InvalidJwtException extends RuntimeException {
        public InvalidJwtException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
