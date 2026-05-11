package pl.dmod.crm.shared.exception;

/**
 * Thrown by services when the caller asks for a domain object that doesn't
 * exist. Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException("%s %s not found".formatted(resource, id));
    }
}
