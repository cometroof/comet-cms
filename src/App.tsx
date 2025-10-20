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
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./pages/users/types";

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
