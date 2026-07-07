"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import cart from "~/../public/assets/cart.svg";
import logo from "~/../public/assets/logo.svg";
import search from "~/../public/assets/search.svg";
import LogoutButton from "~/components/LogoutButton";
import bemCondition from "../../helpers/bemHelper";
import "./Header.css";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [showHeader, setShowHeader] = useState(!isHomePage);
  const [showInputSearch, setShowInputSearch] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchIconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isHomePage) {
      setShowHeader(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 150 || currentScrollY > lastScrollY.current) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (currentScrollY > 0) {
          setShowHeader(true);
        }
      }, 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [isHomePage]);

  const toggleSearch = () => {
    setShowInputSearch((prev) => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return newState;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showInputSearch &&
        inputRef.current &&
        searchIconRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        !searchIconRef.current.contains(e.target as Node)
      ) {
        setShowInputSearch(false);
        inputRef.current.value = "";
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInputSearch]);

  return (
    <header
      className={bemCondition("header", ["visible", "hidden"], showHeader)}
    >
      <div className="header__container">
        <Link href="/products" className="header__shop">
          <span>Boutique</span>
        </Link>
        <Link href="/" className="header__logo">
          <Image
            src={logo}
            alt="Lyon Beton"
            width={140}
            height={70}
            loading="eager"
            unoptimized
          />
        </Link>
        <div className="header__actions">
          {session ? (
            <>
              <Link href="/account" className="header__account inversed">
                <span>Mon Compte</span>
              </Link>
              {session.user?.role === "ADMIN" &&
                process.env.NODE_ENV === "development" && (
                  <Link
                    href="/api-docs"
                    className="header__account"
                    target="_blank"
                  >
                    <span>API Docs</span>
                  </Link>
                )}
              <LogoutButton className="header__account noBorder">
                Se déconnecter
              </LogoutButton>
            </>
          ) : (
            <>
              <Link href="/login" className="header__account inversed">
                <span>Se Connecter</span>
              </Link>
              <Link href="/register" className="header__account">
                <span>S inscrire</span>
              </Link>
            </>
          )}
          <span
            className="header__actions-icon search"
            onClick={toggleSearch}
            ref={searchIconRef}
          >
            <input
              ref={inputRef}
              name="search-input"
              type="text"
              className={bemCondition(
                "header__actions-input",
                "visible",
                showInputSearch,
              )}
              placeholder="Rechercher..."
            />
            <Image
              src={search}
              alt="Search"
              width={24}
              height={24}
              loading="eager"
              unoptimized
            />
          </span>
          <Link href="/cart" className="header__actions-icon cart">
            <Image
              src={cart}
              alt="Cart"
              width={24}
              height={24}
              loading="eager"
              unoptimized
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
