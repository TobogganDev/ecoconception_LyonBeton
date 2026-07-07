"use client";

import React from "react";
import { useSession } from "next-auth/react";
import styles from "./AdminTab.module.scss";

export default function AdminTab() {
  const { data: session } = useSession();

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className={styles.adminTab}>
      <h2 className={styles.adminTab__title}>Administration</h2>
      <p className={styles.adminTab__description}>
        Accès au panel d administration
      </p>

      <div className={styles.adminTab__section}>
        <a href="/admin" className={styles.adminTab__mainButton}>
          Accéder au tableau de bord admin
        </a>
      </div>

      <div className={styles.adminTab__section}>
        <h3 className={styles.adminTab__sectionTitle}>Raccourcis</h3>
        <ul className={styles.adminTab__shortcuts}>
          <li>
            <a href="/admin/users" className={styles.adminTab__shortcutLink}>
              Gestion des utilisateurs
            </a>
          </li>
          <li>
            <a href="/admin/products" className={styles.adminTab__shortcutLink}>
              Gestion des produits
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
