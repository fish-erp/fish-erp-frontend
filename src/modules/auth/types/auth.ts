export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export interface AuthUser { id: string; email: string; role: UserRole }
export interface LoginInput { email: string; password: string; remember: boolean }
export interface LoginResponse { user: AuthUser; expiresIn: number }
