export interface User {
  id: number;
  name: string | null;
  email: string | null;
  password: string | null;
  role: number;
  created_at: string;
}

// Role constants
export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: number;
  confirm_password?: string;
}

export type UserUpdateFormData = Partial<UserFormData> & {
  id: number;
  current_password?: string;
};

export interface UserWithoutPassword {
  id: number;
  name: string | null;
  email: string | null;
  role: number;
  created_at: string;
}
