"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";

const NAV_ITEMS = [
  {
    label: "Painel",
    href: "/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Projetos",
    href: "/dashboard/projetos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Equipe",
    href: "/dashboard/equipe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    superAdminOnly: true,
  },
  {
    label: "Financeiro",
    href: "/dashboard/financeiro",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    superAdminOnly: true,
  },
  {
    label: "Atestados",
    href: "/dashboard/atestados",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Ajuda / Manual",
    href: "/dashboard/manual",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    isBottom: true,
  },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (!stored) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tiamai_user");
    window.location.href = "/";
  };

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return user.role === "ADMIN";
    if (item.adminOnly) return ["ADMIN", "LEAD_ARCHITECT"].includes(user.role);
    return true;
  });

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brand}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#sb-grad)" />
              <path d="M12 28V16L20 10L28 16V28H22V22H18V28H12Z" fill="white" fillOpacity="0.95" />
              <defs>
                <linearGradient id="sb-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#B8962E" />
                  <stop offset="1" stopColor="#C9A96E" />
                </linearGradient>
              </defs>
            </svg>
            {sidebarOpen && (
              <div className={styles.brandBlock}>
                <span className={styles.brandText}>Maiara Garbuio</span>
                <span className={styles.brandSubtitle}>Arquitetura e Interiores</span>
              </div>
            )}
          </Link>
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <polyline points="15 18 9 12 15 6" />
              ) : (
                <polyline points="9 18 15 12 9 6" />
              )}
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`${styles.navItem} ${
                pathname === item.href ? styles.navActive : ""
              } ${item.isBottom ? styles.navItemBottom : ""}`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            {sidebarOpen && (
              <div className={styles.userMeta}>
                <span className={styles.userName}>
                  {user.name || (user.role === "ADMIN" ? "Administradora" : user.role === "LEAD_ARCHITECT" ? "Arquiteta Líder" : "Equipe")}
                </span>
                <span className={styles.userRole}>
                  {user.role === "ADMIN" ? "Administradora" : user.role === "LEAD_ARCHITECT" ? "Arquiteta Líder" : "Equipe"}
                </span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sair">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.mobileHeader}>
          <div className={styles.brand}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#mh-grad)" />
              <path d="M12 28V16L20 10L28 16V28H22V22H18V28H12Z" fill="white" fillOpacity="0.95" />
              <defs>
                <linearGradient id="mh-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#B8962E" />
                  <stop offset="1" stopColor="#C9A96E" />
                </linearGradient>
              </defs>
            </svg>
            <div className={styles.brandBlock}>
              <span className={styles.brandText}>Maiara Garbuio</span>
              <span className={styles.brandSubtitle}>Arquitetura e Interiores</span>
            </div>
          </div>
          <button 
            className={styles.mobileHamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
