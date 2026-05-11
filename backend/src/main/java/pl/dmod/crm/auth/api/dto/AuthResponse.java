package pl.dmod.crm.auth.api.dto;

public record AuthResponse(String accessToken, long expiresInSeconds, UserDto user) {
}
