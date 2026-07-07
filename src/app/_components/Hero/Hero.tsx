"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./Hero.module.scss";

interface HeroProps {
  videoSrc?: string;
  fallbackImage?: string;
  title?: string;
  navigation?: Array<{
    label: string;
    href: string;
  }>;
  collections?: Array<{
    name: string;
    category?: string;
  }>;
  showScrollIndicator?: boolean;
}

const DEFAULT_POSTER =
  "https://res.cloudinary.com/ddlod4evf/video/upload/f_jpg,q_auto:good,w_1920,h_1080,c_fill/home_vid_e6v05n.jpg";

export default function Hero({
  title = "LYON BETON",
  fallbackImage = DEFAULT_POSTER,
  navigation = [
    { label: "BOUTIQUE", href: "/products" },
    { label: "PANIER", href: "/cart" },
    { label: "COMPTE", href: "/login" },
  ],
  collections = [
    { name: "BERKSHIRE", category: "PROJETS" },
    { name: "NEW DICE", category: "COLLECTIONS" },
    { name: "RETROFUTUR", category: "PROJETS" },
    { name: "LB FEAT. PAPOTTE", category: "PROJETS" },
    { name: "STRUT", category: "SHOOTING SESSIONS" },
    { name: "TWIST", category: "COLLECTIONS" },
    { name: "SOFFFA", category: "COLLAB" },
    { name: "L'ARBUISSONIËRE", category: "SHOOTING SESSIONS" },
  ],
}: HeroProps) {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      video.play().catch(() => {
        setIsVideoError(true);
      });
    };

    video.load();

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.videoContainer}>
        {!isVideoError && (
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={fallbackImage}
            data-loaded={isVideoLoaded}
          >
            <source
              src="https://res.cloudinary.com/ddlod4evf/video/upload/f_webm,q_auto:good,vc_vp9,w_1920,h_1080,c_fill/home_vid_e6v05n.webm"
              type="video/webm"
            />
            <source
              src="https://res.cloudinary.com/ddlod4evf/video/upload/f_mp4,q_auto:good,vc_h264,w_1920,h_1080,c_fill/home_vid_e6v05n.mp4"
              type="video/mp4"
            />
            Ton navigateur ne supporte pas la lecture vidéo.
          </video>
        )}

        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <div className={styles.titleContainer}>
          <h1 className={styles.mainTitle}>{title}</h1>
        </div>

        <nav className={styles.navigation}>
          <div className={styles.navContainer}>
            {navigation.map((item, index) => {
              if (item.label === "COMPTE") {
                return (
                  <Link
                    key={index}
                    href={session ? "/account" : "/login"}
                    className={styles.navItem}
                  >
                    {session ? "COMPTE" : "SE CONNECTER"}
                  </Link>
                );
              }

              return (
                <Link key={index} href={item.href} className={styles.navItem}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={styles.collectionsGrid}>
          {collections.map((collection, index) => (
            <div key={index} className={styles.collectionItem}>
              {collection.category && (
                <span className={styles.category}>{collection.category}</span>
              )}
              <h2 className={styles.collectionName}>{collection.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
