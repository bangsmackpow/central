import React, { useState } from "react";
import { authClient } from "./lib/auth-client";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/auth/Login";

export default function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <Dashboard user={session.user} />;
}
