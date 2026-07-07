"use client";

import React from "react";
import { signOut } from "next-auth/react";

interface LogoutButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function LogoutButton({
  children = "Se déconnecter",
  className,
  disabled = false,
  ...props
}: LogoutButtonProps) {
  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleLogout();
    }
  };

  return (
    <button
      {...props}
      onClick={handleLogout}
      onKeyDown={handleKeyDown}
      className={className}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
