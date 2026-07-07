"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./Account.module.scss";
import ProfileTab from "./components/ProfileTab";
import SecurityTab from "./components/SecurityTab";
import AdminTab from "./components/AdminTab";

export default function AccountPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "admin">(
    "profile",
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMessage = (newMessage: {
    type: "success" | "error";
    text: string;
  }) => {
    setMessage(newMessage);
  };

  const positionTabContainer = () => {
    const headerActionsElement = document.querySelector(
      ".header__actions",
    )! as HTMLElement;
    const tabContainerElement = document.querySelector(
      ".account__tabContainer",
    )! as HTMLElement;

    if (headerActionsElement && tabContainerElement) {
      let bottomLeftX = 0;
      let bottomLeftY = 0;
      const headerActionsRect = headerActionsElement.getBoundingClientRect();
      const tabContainerRect = tabContainerElement.getBoundingClientRect();

      tabContainerRect.width = headerActionsRect.width;

      bottomLeftX =
        headerActionsRect.left +
        headerActionsRect.width -
        tabContainerRect.width;
      bottomLeftY =
        headerActionsRect.top +
        headerActionsRect.height -
        tabContainerRect.height;

      tabContainerElement.style.position = "absolute";
      tabContainerElement.style.left = `${bottomLeftX}px`;
      tabContainerElement.style.top = `${bottomLeftY}px`;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      positionTabContainer();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Recalculate position when tab changes
    const timer = setTimeout(() => {
      positionTabContainer();
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab]);

  if (!session) {
    return <div>Chargement...</div>;
  }

  return (
    <div className={`${styles.account} account`}>
      <div className={styles.account__header}>
        <h1 className={styles.account__title}>Mon Compte</h1>

        <div
          className={`${styles.account__tabContainer} account__tabContainer`}
        >
          <button type="button" onClick={() => setActiveTab("profile")}>
            Profil
          </button>
          <button type="button" onClick={() => setActiveTab("security")}>
            Sécurité
          </button>
          {session?.user?.role === "ADMIN" && (
            <button type="button" onClick={() => setActiveTab("admin")}>
              Administration
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`${styles.account__message} ${styles[`account__message--${message.type}`]}`}
        >
          {message.text}
        </div>
      )}

      {activeTab === "profile" && (
        <ProfileTab
          onMessage={handleMessage}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {activeTab === "security" && (
        <SecurityTab
          onMessage={handleMessage}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {activeTab === "admin" && session?.user?.role === "ADMIN" && <AdminTab />}
    </div>
  );
}
