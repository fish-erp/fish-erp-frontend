export type UserRole = "ADMIN";
export interface AuthUser { id: string; email: string; role: UserRole }
export interface LoginInput { identifier: string; password: string; remember: boolean }
export interface LoginResponse { user: AuthUser; expiresIn: number }
