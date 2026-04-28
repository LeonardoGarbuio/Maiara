"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Login real via API (banco de dados)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("tiamai_user", JSON.stringify(data));
        window.location.href = "/dashboard";
        return;
      }

      setError(data.error || "E-mail ou senha incorretos.");
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side - Login Form */}
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          {/* Logo */}
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="40"
                  height="40"
                  rx="10"
                  fill="url(#logo-gradient)"
                />
                <path
                  d="M12 28V16L20 10L28 16V28H22V22H18V28H12Z"
                  fill="white"
                  fillOpacity="0.95"
                />
                <defs>
                  <linearGradient
                    id="logo-gradient"
                    x1="0"
                    y1="0"
                    x2="40"
                    y2="40"
                  >
                    <stop stopColor="#B8962E" />
                    <stop offset="1" stopColor="#C9A96E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className={styles.logoTitle}>Maiara Garbuio</h1>
              <p className={styles.logoSubtitle}>Arquitetura e Interiores</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className={styles.welcomeArea}>
            <h2 className={styles.welcomeTitle}>Bem-vindo de volta</h2>
            <p className={styles.welcomeSubtitle}>
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Usuário
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.inputIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.inputIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                  aria-label="Mostrar senha"
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${isLoading ? styles.loading : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Autenticando...
                </>
              ) : (
                <>
                  Entrar
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className={styles.footerSlogan}>
            Arquitetura para quem quer construir a primeira casa
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className={styles.imageSide}>
        <div className={styles.imageOverlay}>
          <div className={styles.imageContent}>
            <div className={styles.imageTag}>
              <span className={styles.tagDot}></span>
              Maiara Garbuio Arquitetura
            </div>
            <h2 className={styles.imageTitle}>
              Gerencie seus projetos com <em>eficiência</em> e{" "}
              <em>elegância</em>
            </h2>
            <p className={styles.imageSubtitle}>
              Controle completo de equipe, prazos, documentos e finanças em um
              único painel.
            </p>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10</span>
                <span className={styles.statLabel}>Etapas Interiores</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>11</span>
                <span className={styles.statLabel}>Etapas Arquitetônico</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>∞</span>
                <span className={styles.statLabel}>Projetos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
