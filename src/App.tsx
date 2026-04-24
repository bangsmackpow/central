import React, { useState } from "react";
import { authClient } from "./lib/auth-client";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/auth/Login";

export default function App() {
  const { data: session, isPending } = authClient.useSession();
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (isPending) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Dashboard
      user={session.user}
      onViewProject={(id) => {
        setSelectedProjectId(id);
        setCurrentView("project");
      }}
    />
  );
}
