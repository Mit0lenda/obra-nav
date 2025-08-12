import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Shadcn toaster */}
        <Toaster />
        {/* Sonner toaster */}
        <Sonner richColors position="top-right" />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
