export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}
