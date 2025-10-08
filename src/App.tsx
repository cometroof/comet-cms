import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IndexDashboard, Dashboard } from "./pages/dashboard";
import { Login } from "./pages/auth";
import { Home } from "./pages/home";
import { Projects } from "./pages/projects";
import { Files } from "./pages/files";
import { ContactsLocation } from "./pages/contacts-location";
import { ArticlesList, ArticleCreate, ArticleEdit } from "./pages/articles";
import { NotFound } from "./pages/errors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/files" element={<Files />} />
          <Route path="/dashboard/articles" element={<ArticlesList />} />
          <Route
            path="/dashboard/articles/create"
            element={<ArticleCreate />}
          />
          <Route
            path="/dashboard/articles/edit/:id"
            element={<ArticleEdit />}
          />
          <Route path="/contacts-location" element={<ContactsLocation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
