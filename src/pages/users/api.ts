import { supabase } from "@/lib/supabase";
import { User, UserFormData, UserUpdateFormData } from "./types";
import bcrypt from "bcryptjs";

// Salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

export const usersApi = {
  async getAll() {
    const { data, error } = await supabase
      .from("user")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Omit<User, "password">[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from("user")
      .select("id, name, email, role, created_at")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Omit<User, "password">;
  },

  async create(userData: UserFormData) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const { data, error } = await supabase
      .from("user")
      .insert([
        {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
      ])
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;
    return data as Omit<User, "password">;
  },

  async update(userData: UserUpdateFormData) {
    const { id, current_password, password, ...updateData } = userData;
    const updatePayload: Record<string, string | number | null> = {
      ...updateData,
    };

    // If password is being updated, verify current password and hash new password
    if (password) {
      if (!current_password) {
        throw new Error("Current password is required to change password");
      }

      // Fetch the user's current hashed password
      const { data: user, error: fetchError } = await supabase
        .from("user")
        .select("password")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!user?.password) throw new Error("User has no password set");

      // Verify the current password
      const isPasswordValid = await bcrypt.compare(
        current_password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash the new password
      updatePayload.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Update the user
    const { data, error } = await supabase
      .from("user")
      .update(updatePayload)
      .eq("id", id)
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;
    return data as Omit<User, "password">;
  },

  async delete(id: number) {
    const { error } = await supabase.from("user").delete().eq("id", id);

    if (error) throw error;
    return { success: true } as const;
  },

  async verifyPassword(email: string, password: string) {
    const { data: user, error } = await supabase
      .from("user")
      .select("id, password")
      .eq("email", email)
      .single();

    if (error) throw error;
    if (!user) throw new Error("User not found");
    if (!user.password) throw new Error("User has no password set");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    return { id: user.id };
  },
};
