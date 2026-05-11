package pl.dmod.crm.shared.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Reads the currently authenticated user id off the Spring Security context.
 * Avoids forcing controllers / services to fish through SecurityContextHolder
 * themselves.
 */
@Component
public class CurrentUserService {

    /** @return current user id, or empty if unauthenticated. */
    public Optional<UUID> getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null
                || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof UUID uuid) return Optional.of(uuid);
        return Optional.empty();
    }

    public UUID requireUserId() {
        return getUserId().orElseThrow(() -> new AccessDeniedException("Not authenticated"));
    }
}
