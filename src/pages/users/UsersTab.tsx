import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  ShieldAlert,
  AtSign,
  Calendar,
  Shield,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "./hooks";
import { supabase } from "@/lib/supabase";
import {
  User as UserType,
  UserFormData,
  UserUpdateFormData,
  ROLES,
  MENU_ITEMS,
} from "./types";
import PasswordInput from "@/components/PasswordInput";
import { generateSecurePassword } from "./utils";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema for creating a new user
const createUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    role: z.number().int().min(1).max(2),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// Form schema for updating a user
const updateUserSchema = z
  .object({
    id: z.number(),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Please enter a valid email address").optional(),
    role: z.number().int().min(1).max(2).optional(),
    current_password: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      )
      .optional(),
    confirm_password: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password is provided, confirm_password must match
      if (data.password) {
        return data.password === data.confirm_password;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirm_password"],
    },
  )
  .refine(
    (data) => {
      // If password is provided, current_password must be provided too
      if (data.password) {
        return !!data.current_password;
      }
      return true;
    },
    {
      message: "Current password is required to change password",
      path: ["current_password"],
    },
  );

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

const UsersTab = () => {
  const { toast } = useToast();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Omit<
    UserType,
    "password"
  > | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMenuPermissions, setSelectedMenuPermissions] = useState<
    string[]
  >([]);

  // React Query - Fetch data
  const { data: users = [] } = useUsers();

  // React Query - Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Create form
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: ROLES.ADMIN, // Default to regular admin
      confirm_password: "",
    },
  });

  // Update form
  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: 0,
      name: "",
      email: "",
      role: ROLES.ADMIN,
      current_password: "",
      password: "",
      confirm_password: "",
    },
  });

  // Filtered data
  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const email = user.email || "";
    const searchLower = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

  // User handlers
  const handleUserEdit = (user: Omit<UserType, "password">) => {
    setSelectedUser(user);
    setIsEditing(true);

    // Reset and set form values
    updateForm.reset({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      current_password: "",
      password: "",
      confirm_password: "",
    });

    setUserDialogOpen(true);
  };

  const handleUserAdd = () => {
    setIsEditing(false);
    setSelectedUser(null);
    createForm.reset();
    setUserDialogOpen(true);
  };

  const handleUserDeleteOpen = (user: Omit<UserType, "password">) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handlePermissionDialogOpen = (user: Omit<UserType, "password">) => {
    setSelectedUser(user);
    setSelectedMenuPermissions(user.menu_permission || []);
    setPermissionDialogOpen(true);
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({
        title: "User deleted",
        description: `User ${selectedUser.name || selectedUser.email} has been deleted.`,
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (values: CreateUserFormValues) => {
    try {
      const { confirm_password, ...userData } = values;

      // Use the API to create user - this will trigger the mutation and refetch
      await createUser.mutateAsync({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });

      toast({
        title: "User created",
        description: `User ${userData.name} has been created successfully.${userData.password !== "" ? " Note: Please save the password in a secure location." : ""}`,
      });

      setUserDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again.";
      console.error(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (values: UpdateUserFormValues) => {
    try {
      const { confirm_password, ...userData } = values;

      // Only include fields that have values for the mutation
      const updateData: UserUpdateFormData = { id: userData.id };
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.password) {
        updateData.password = userData.password;
        updateData.current_password = userData.current_password;
      }

      await updateUser.mutateAsync(updateData);

      toast({
        title: "User updated",
        description: `User ${updateData.name || selectedUser?.name || "information"} has been updated.`,
      });

      setUserDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update user. Please try again.";
      console.error(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user")
        .update({
          menu_permission:
            selectedMenuPermissions.length > 0 ? selectedMenuPermissions : null,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Permissions updated",
        description: `Menu permissions for ${selectedUser.name || selectedUser.email} have been updated.`,
      });

      setPermissionDialogOpen(false);

      // Refresh users data
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleUserAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "Unnamed User"}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {user.role === ROLES.SUPER_ADMIN ? (
                              <>
                                <ShieldAlert className="mr-1 h-3 w-3" />
                                Super Admin
                              </>
                            ) : (
                              <>
                                <Shield className="mr-1 h-3 w-3" />
                                Admin
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AtSign className="h-3 w-3 text-muted-foreground" />
                        <span>{user.email || "No email"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === ROLES.SUPER_ADMIN ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Admin
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span title={user.created_at}>
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermissionDialogOpen(user)}
                          title="Menu Permissions"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="hidden md:inline">Menu</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserEdit(user)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden md:inline">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserDeleteOpen(user)}
                          disabled={user.role === ROLES.SUPER_ADMIN}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update user details"
                : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>

          {isEditing ? (
            <Form {...updateForm}>
              <form
                onSubmit={updateForm.handleSubmit(handleUpdateUser)}
                className="space-y-4"
              >
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        >
                          <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                          <option value={ROLES.ADMIN}>Admin</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Change Password</h3>
                  <FormField
                    control={updateForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter current password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>New Password</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              const generatedPassword =
                                generateSecurePassword();
                              field.onChange(generatedPassword);
                              updateForm.setValue(
                                "confirm_password",
                                generatedPassword,
                              );
                            }}
                          >
                            Generate Password
                          </Button>
                        </div>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter new password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Confirm new password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUserDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateUser.isPending}>
                    {updateUser.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateUser)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        >
                          <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                          <option value={ROLES.ADMIN}>Admin</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            const generatedPassword = generateSecurePassword();
                            field.onChange(generatedPassword);
                            createForm.setValue(
                              "confirm_password",
                              generatedPassword,
                            );
                          }}
                        >
                          Generate Password
                        </Button>
                      </div>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUserDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Menu Permissions Dialog */}
      <Dialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu Permissions</DialogTitle>
            <DialogDescription>
              Manage menu access for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Menu Access</Label>
            <p className="text-sm text-muted-foreground">
              Select which menu items this user can access
            </p>
            <div className="grid grid-cols-2 gap-3 border rounded-md p-4 max-h-[400px] overflow-y-auto">
              {MENU_ITEMS.map((menu) => (
                <div key={menu.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`permission-${menu.value}`}
                    checked={selectedMenuPermissions.includes(menu.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMenuPermissions([
                          ...selectedMenuPermissions,
                          menu.value,
                        ]);
                      } else {
                        setSelectedMenuPermissions(
                          selectedMenuPermissions.filter(
                            (p) => p !== menu.value,
                          ),
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`permission-${menu.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {menu.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPermissionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <span className="font-medium">
                {selectedUser?.name || selectedUser?.email}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTab;
