"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import LoginOverlay from "./components/LoginOverlay";
import AppShell from "./components/AppShell";
import WorkflowShell from "./components/WorkflowShell";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { ThemeProvider } from "next-themes";

function AuthOverlay() {
  const { showLogin, closeLogin, handleLoginSuccess } = useAuthContext();
  return (
    <LoginOverlay
      open={showLogin}
      onClose={closeLogin}
      onLogin={handleLoginSuccess}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/workflows")) {
    return <WorkflowShell>{children}</WorkflowShell>;
  }
  return <AppShell>{children}</AppShell>;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultAppearance =
    process.env.NEXT_PUBLIC_APPEARANCE ?? "system";
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultAppearance}
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ServiceWorkerRegistrar />
        <AuthOverlay />
        <Suspense fallback={null}>
          <Shell>{children}</Shell>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
