import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { IndexDashboard, Dashboard } from "./pages/dashboard";
import { Login } from "./pages/auth";
import { Home } from "./pages/home";
import { Projects } from "./pages/projects";
import { Files } from "./pages/files";
import { ContactsLocation } from "./pages/contacts-location";
import { ArticlesList, ArticleCreate, ArticleEdit } from "./pages/articles";
import { NotFound } from "./pages/errors";
import Users from "./pages/users";
import { Products } from "./pages/product";
import ProductListPage from "./pages/product-new";
import ProductFormPage from "./pages/product-new/product-form";
import ProductDetailPage from "./pages/product-new/product-detail";
import ProfileFormPage from "./pages/product-new/profile-form";
import ProfileDetailPage from "./pages/product-new/profile-detail";
import CategoryDetailPage from "./pages/product-new/category-detail";
import AddonListPage from "./pages/product-new-addons";
import AddonFormPage from "./pages/product-new-addons/form";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./pages/users/types";
import ProductAccessoriesListPage from "./pages/product-new-accessories";
import ProductAccessoriesFormPage from "./pages/product-new-accessories/product-form";
import ProductAccessoriesDetailPage from "./pages/product-new-accessories/product-detail";
import CategoryAccessoriesDetailPage from "./pages/product-new-accessories/category-detail";
import ItemAccessoriesDetailPage from "./pages/product-new-accessories/item-detail";
import DirectItemsPage from "./pages/product-new-accessories/direct-items";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <IndexDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/files"
                element={
                  <ProtectedRoute>
                    <Files />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/articles"
                element={
                  <ProtectedRoute>
                    <ArticlesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/articles/create"
                element={
                  <ProtectedRoute>
                    <ArticleCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/articles/edit/:id"
                element={
                  <ProtectedRoute>
                    <ArticleEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/contacts-location"
                element={
                  <ProtectedRoute>
                    <ContactsLocation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              {/* Product Management Routes (Old) */}
              <Route
                path="/dashboard/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/:id"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              {/* Product Management Routes (New) */}
              <Route
                path="/dashboard/product-new"
                element={
                  <ProtectedRoute>
                    <ProductListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/create"
                element={
                  <ProtectedRoute>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/edit/:id"
                element={
                  <ProtectedRoute>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/:productId/profile/create"
                element={
                  <ProtectedRoute>
                    <ProfileFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/:productId/profile/:profileId/edit"
                element={
                  <ProtectedRoute>
                    <ProfileFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/:id/profile/:profileId"
                element={
                  <ProtectedRoute>
                    <ProfileDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-new/:id/profile/:profileId/category/:categoryId"
                element={
                  <ProtectedRoute>
                    <CategoryDetailPage />
                  </ProtectedRoute>
                }
              />
              {/* Product Add-ons Routes */}
              <Route
                path="/dashboard/product-add-ons"
                element={
                  <ProtectedRoute>
                    <AddonListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-add-ons/create"
                element={
                  <ProtectedRoute>
                    <AddonFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-add-ons/:id/edit"
                element={
                  <ProtectedRoute>
                    <AddonFormPage />
                  </ProtectedRoute>
                }
              />
              {/* Product Accessories Routes */}
              <Route
                path="/dashboard/product-accessories"
                element={
                  <ProtectedRoute>
                    <ProductAccessoriesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/create"
                element={
                  <ProtectedRoute>
                    <ProductAccessoriesFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/edit/:id"
                element={
                  <ProtectedRoute>
                    <ProductAccessoriesFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id"
                element={
                  <ProtectedRoute>
                    <ProductAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/category/:categoryId"
                element={
                  <ProtectedRoute>
                    <CategoryAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/category/:categoryId/item/new"
                element={
                  <ProtectedRoute>
                    <ItemAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/category/:categoryId/item/:itemId"
                element={
                  <ProtectedRoute>
                    <ItemAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/items"
                element={
                  <ProtectedRoute>
                    <DirectItemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/item/new"
                element={
                  <ProtectedRoute>
                    <ItemAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-accessories/:id/item/:itemId"
                element={
                  <ProtectedRoute>
                    <ItemAccessoriesDetailPage />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
