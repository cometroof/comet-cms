import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  Settings,
  Hammer,
  User,
  Newspaper,
  Files,
  MapPinPlus,
  Users,
  PackageOpen,
  Menu,
  X,
  SquareChevronLeft,
  SquareChevronRight,
  PackagePlus,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Wrench,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/pages/users/types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [accessoriesExpanded, setAccessoriesExpanded] = useState(false);
  const [addonsExpanded, setAddonsExpanded] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Fetch products for submenu
  const { data: products = [] } = useQuery({
    queryKey: ["products-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("id, name, slug")
        .eq("type", "product")
        .order("order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch accessories for submenu
  const { data: accessories = [] } = useQuery({
    queryKey: ["accessories-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("id, name, slug")
        .eq("type", "accessories")
        .order("order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch add-ons for submenu
  const { data: addons = [] } = useQuery({
    queryKey: ["addons-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("id, name, slug")
        .eq("type", "add-on")
        .order("order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Auto-expand menus based on current path
  useEffect(() => {
    if (location.pathname.includes("/dashboard/product-new/")) {
      setProductsExpanded(true);
    }
    if (location.pathname.includes("/dashboard/product-accessories/")) {
      setAccessoriesExpanded(true);
    }
    if (location.pathname.includes("/dashboard/product-add-ons/")) {
      setAddonsExpanded(true);
    }
  }, [location.pathname]);

  const navigation = [
    { name: "Home", href: "/dashboard/home", icon: Home },
    { name: "Products", href: "/dashboard/product-new", icon: PackageOpen },
    {
      name: "Accessories",
      href: "/dashboard/product-accessories",
      icon: Wrench,
    },
    {
      name: "Product Add-ons",
      href: "/dashboard/product-add-ons",
      icon: PackagePlus,
    },
    { name: "Files", href: "/dashboard/files", icon: Files },
    { name: "Projects", href: "/dashboard/projects", icon: Hammer },
    { name: "Articles", href: "/dashboard/articles", icon: Newspaper },
    {
      name: "Contacts & Location",
      href: "/dashboard/contacts-location",
      icon: MapPinPlus,
    },
    ...(user?.role === ROLES.SUPER_ADMIN
      ? [{ name: "Users", href: "/dashboard/users", icon: Users }]
      : []),
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== "/" && location.pathname.includes(href));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-200 ease-in-out",
          // Mobile: slide in/out
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: expand/collapse width
          desktopCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile always full width when open
          "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center gap-3 ${desktopCollapsed ? "px-0 justify-center" : "px-6"} py-5 border-b border-sidebar-border`}
          >
            <div className="flex items-center justify-center size-10 max-w-full aspect-square bg-sidebar-foreground rounded-lg flex-shrink-0">
              <img className="size-5" src="/comet-icon.svg" alt="Comet Icon" />
            </div>
            {!desktopCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  RoofCMS
                </h1>
                <p className="text-xs text-sidebar-foreground/70">
                  Admin Panel
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isProductsMenu = item.name === "Products";
              const isAccessoriesMenu = item.name === "Accessories";
              const isAddonsMenu = item.name === "Product Add-ons";

              // Products Menu with Submenu
              if (isProductsMenu) {
                return (
                  <div key={item.name} className="space-y-1">
                    {/* Products parent menu */}
                    <button
                      onClick={() => setProductsExpanded(!productsExpanded)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
                        desktopCollapsed && "lg:justify-center",
                      )}
                      title={desktopCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!desktopCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.name}</span>
                          {productsExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Products submenu */}
                    {productsExpanded && !desktopCollapsed && (
                      <div className="ml-8 space-y-1">
                        {products.map((product) => (
                          <Link
                            key={product.id}
                            to={`/dashboard/product-new/${product.id}`}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-lg transition-colors",
                              location.pathname ===
                                `/dashboard/product-new/${product.id}`
                                ? "bg-sidebar-primary/70 text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {product.name}
                          </Link>
                        ))}
                        {/* Add Product Button */}
                        <Link
                          to="/dashboard/product-new/create"
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            "border border-sidebar-foreground/20 border-dashed mt-2",
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Brand</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              // Accessories Menu with Submenu
              if (isAccessoriesMenu) {
                return (
                  <div key={item.name} className="space-y-1">
                    {/* Accessories parent menu */}
                    <button
                      onClick={() =>
                        setAccessoriesExpanded(!accessoriesExpanded)
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
                        desktopCollapsed && "lg:justify-center",
                      )}
                      title={desktopCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!desktopCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.name}</span>
                          {accessoriesExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Accessories submenu */}
                    {accessoriesExpanded && !desktopCollapsed && (
                      <div className="ml-8 space-y-1">
                        {accessories.map((accessory) => (
                          <Link
                            key={accessory.id}
                            to={`/dashboard/product-accessories/${accessory.id}`}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-lg transition-colors",
                              location.pathname ===
                                `/dashboard/product-accessories/${accessory.id}`
                                ? "bg-sidebar-primary/70 text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {accessory.name}
                          </Link>
                        ))}
                        {/* Add Accessory Button */}
                        <Link
                          to="/dashboard/product-accessories/create"
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            "border border-sidebar-foreground/20 border-dashed mt-2",
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Accessory</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              // Product Add-ons Menu with Submenu
              if (isAddonsMenu) {
                return (
                  <div key={item.name} className="space-y-1">
                    {/* Add-ons parent menu */}
                    <button
                      onClick={() => setAddonsExpanded(!addonsExpanded)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
                        desktopCollapsed && "lg:justify-center",
                      )}
                      title={desktopCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!desktopCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.name}</span>
                          {addonsExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Add-ons submenu */}
                    {addonsExpanded && !desktopCollapsed && (
                      <div className="ml-8 space-y-1">
                        {addons.map((addon) => (
                          <Link
                            key={addon.id}
                            to={`/dashboard/product-add-ons/${addon.id}/edit`}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-lg transition-colors",
                              location.pathname ===
                                `/dashboard/product-add-ons/${addon.id}/edit`
                                ? "bg-sidebar-primary/70 text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {addon.name}
                          </Link>
                        ))}
                        {/* Add Product Add-on Button */}
                        <Link
                          to="/dashboard/product-add-ons"
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
                            "border border-sidebar-foreground/20 border-dashed mt-2",
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Product Add-on</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
                    desktopCollapsed && "lg:justify-center",
                  )}
                  title={desktopCollapsed ? item.name : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!desktopCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            {!desktopCollapsed ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-8 h-8 bg-sidebar-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-sidebar-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">
                      {user?.email || "admin@demo.com"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
                onClick={async () => {
                  await logout();
                }}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-200",
          desktopCollapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          >
            {desktopCollapsed ? (
              <SquareChevronRight className="!size-6" />
            ) : (
              <SquareChevronLeft className="!size-6" />
            )}
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
