export interface User {
  id: number;
  name: string | null;
  email: string | null;
  password: string | null;
  role: number;
  menu_permission: string[] | null;
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
  menu_permission: string[] | null;
  created_at: string;
}

// Menu permissions - must match DashboardLayout navigation items
export const MENU_PERMISSIONS = {
  HOME: "home",
  PRODUCT_BRAND: "product-new",
  ACCESSORIES: "product-accessories",
  PRODUCT_ADDONS: "product-add-ons",
  FILES: "files",
  PROJECTS_MENU: "projects-menu",
  ARTICLES: "articles",
  CONTACTS_LOCATION: "contacts-location",
  USERS: "users",
  SETTINGS: "settings",
} as const;

export type MenuPermission =
  (typeof MENU_PERMISSIONS)[keyof typeof MENU_PERMISSIONS];

export const MENU_ITEMS = [
  { value: MENU_PERMISSIONS.HOME, label: "Home" },
  { value: MENU_PERMISSIONS.PRODUCT_BRAND, label: "Product Brand" },
  { value: MENU_PERMISSIONS.ACCESSORIES, label: "Accessories" },
  { value: MENU_PERMISSIONS.PRODUCT_ADDONS, label: "Product Add-ons" },
  { value: MENU_PERMISSIONS.FILES, label: "Files" },
  { value: MENU_PERMISSIONS.PROJECTS_MENU, label: "Project & Categories" },
  { value: MENU_PERMISSIONS.ARTICLES, label: "Articles" },
  {
    value: MENU_PERMISSIONS.CONTACTS_LOCATION,
    label: "Contacts & Location",
  },
  { value: MENU_PERMISSIONS.USERS, label: "Users" },
  { value: MENU_PERMISSIONS.SETTINGS, label: "Settings" },
] as const;
