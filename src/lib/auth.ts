import { supabase } from "./supabase";
import { ROLES } from "@/pages/users/types";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import bcrypt from "bcryptjs";

// Auth token cookie name
const AUTH_TOKEN_COOKIE = "auth_token";
// Token expiration in days
const TOKEN_EXPIRATION_DAYS = 3;

// User type definition matching database schema
interface User {
  id: number;
  name: string | null;
  email: string | null;
  password: string | null;
  role: number;
  token: string | null;
  created_at: string;
  menu_permission: string[] | null;
}

/**
 * Authentication utilities for custom auth with tokens and cookies
 */
export const auth = {
  /**
   * Get the current authentication token from cookies
   * @returns The auth token or null if not found
   */
  getAuthToken() {
    return Cookies.get(AUTH_TOKEN_COOKIE) || null;
  },

  /**
   * Set the authentication token in cookies
   * @param token The token to store
   * @param expiresInDays Days until the token expires
   */
  setAuthToken(token: string, expiresInDays = TOKEN_EXPIRATION_DAYS) {
    Cookies.set(AUTH_TOKEN_COOKIE, token, {
      expires: expiresInDays,
      sameSite: "strict",
    });
  },

  /**
   * Remove the authentication token from cookies
   */
  removeAuthToken() {
    Cookies.remove(AUTH_TOKEN_COOKIE);
  },

  /**
   * Check if the user is authenticated
   * @returns Boolean indicating if the user is authenticated
   */
  async isAuthenticated() {
    const token = this.getAuthToken();
    if (!token) return false;

    // Verify the token exists in the database
    const { data } = await supabase
      .from("user")
      .select("id")
      .eq("token", token)
      .single();

    return !!data;
  },

  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  async getCurrentUser(): Promise<Omit<User, "password" | "token"> | null> {
    const token = this.getAuthToken();
    if (!token) return null;

    // Fetch user data based on token
    const { data, error } = await supabase
      .from("user")
      .select("id, name, email, role, created_at, menu_permission")
      .eq("token", token)
      .single();

    if (error || !data) {
      this.removeAuthToken(); // Clear invalid token
      return null;
    }

    return data;
  },

  /**
   * Get the current user's role
   * @returns The user's role or null if not authenticated
   */
  async getCurrentUserRole() {
    const user = await this.getCurrentUser();
    return user ? user.role : null;
  },

  /**
   * Check if the current user has a specific role
   * @param role The role to check
   * @returns Boolean indicating if user has the role
   */
  async hasRole(role: number) {
    const userRole = await this.getCurrentUserRole();
    return userRole === role;
  },

  /**
   * Check if the current user is a Super Admin
   * @returns Boolean indicating if user is a Super Admin
   */
  async isSuperAdmin() {
    return this.hasRole(ROLES.SUPER_ADMIN);
  },

  /**
   * Check if the current user is an Admin
   * @returns Boolean indicating if user is an Admin
   */
  async isAdmin() {
    const userRole = await this.getCurrentUserRole();
    return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
  },

  /**
   * Sign in with email and password
   * @param email User email
   * @param password User password
   * @returns Result of sign in attempt with user data if successful
   */
  async login(email: string, password: string) {
    try {
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from("user")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (userError || !user) {
        return { success: false, error: "Invalid email or password" };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password || "",
      );
      if (!isPasswordValid) {
        return { success: false, error: "Invalid email or password" };
      }

      // Generate a new auth token
      const token = uuidv4();

      // Update user with new token
      const { error: updateError } = await supabase
        .from("user")
        .update({ token })
        .eq("id", user.id);

      if (updateError) {
        return { success: false, error: "Authentication failed" };
      }

      // Set token in cookie
      this.setAuthToken(token);

      // Return user data without sensitive info
      const { password: _, token: __, ...userData } = user;
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Authentication failed" };
    }
  },

  /**
   * Sign out the current user
   * @returns Result of sign out attempt
   */
  async logout() {
    try {
      const user = await this.getCurrentUser();

      if (user) {
        // Clear token in database
        await supabase.from("user").update({ token: null }).eq("id", user.id);
      }

      // Remove token cookie
      this.removeAuthToken();

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Failed to log out" };
    }
  },

  /**
   * Verify if a token is valid
   * @param token Auth token to verify
   * @returns Boolean indicating if the token is valid
   */
  async verifyToken(token: string) {
    if (!token) return false;

    const { data } = await supabase
      .from("user")
      .select("id")
      .eq("token", token)
      .single();

    return !!data;
  },
};

export default auth;
