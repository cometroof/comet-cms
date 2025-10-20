import { createId } from "@paralleldrive/cuid2";
import { format } from "date-fns";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

/**
 * Generate a secure unique identifier
 */
export const generateId = () => createId();

/**
 * Format a date for display
 * @param date Date string or Date object
 * @param formatString Optional format string
 */
export const formatDate = (
  date: string | Date,
  formatString = "PPP",
): string => {
  return format(new Date(date), formatString);
};

/**
 * Validate if a password meets security requirements
 * @param password Password string to validate
 */
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @param saltRounds Number of salt rounds (default: 10)
 */
export const hashPassword = async (
  password: string,
  saltRounds = 10,
): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password
 */
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate a secure random password
 * @param length Password length (default: 12)
 * @param includeSymbols Whether to include symbols (default: true)
 * @returns A secure random password
 */
export const generateSecurePassword = (
  length = 12,
  includeSymbols = true,
): string => {
  // Define character sets
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  // Create alphabet based on requirements
  let alphabet = lowercase + uppercase + numbers;
  if (includeSymbols) alphabet += symbols;

  // Create nanoid generator with custom alphabet
  const nanoid = customAlphabet(alphabet, length);

  // Generate initial password
  const password = nanoid();

  // Ensure password contains at least one character from each required set
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = includeSymbols
    ? /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/.test(password)
    : true;

  // If missing any required character type, regenerate
  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
    return generateSecurePassword(length, includeSymbols);
  }

  return password;
};
