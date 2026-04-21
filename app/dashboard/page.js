"use client";

import { useState, useEffect } from "react";
import styles from "./painel.module.css";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) setUser(JSON.parse(stored));

    async function fetchData() {
      try {
        const [projRes, cliRes, txRes, certRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/clients"),
          fetch("/api/transactions"),
          fetch("/api/certificates"),
        ]);
        const proj = await projRes.json();
        const cli = await cliRes.json();
        const txData = await txRes.json();
        const cert = await certRes.json();

        setProjects(Array.isArray(proj) ? proj : []);
        setClients(Array.isArray(cli) ? cli : []);
        setTransactions(Array.isArray(txData.transactions) ? txData.transactions : Array.isArray(txData) ? txData : []);
        setCertificates(Array.isArray(cert) ? cert : []);
      } catch {
        console.error("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const today = new Date();

  // Métricas
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const totalClients = clients.length;
  const pendingCerts = certificates.filter((c) => c.status === "PENDING").length;

  // Financeiro do mês atual
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const income = thisMonthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = thisMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);

  // Mês anterior
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthTx = transactions.filter((t) => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const prevIncome = prevMonthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const prevExpense = prevMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);

  // Alarme Visual - Fases atrasadas
  const overduePhases = [];
  projects.filter((p) => p.status === "ACTIVE").forEach((project) => {
    (project.phases || []).forEach((phase) => {
      if (
        phase.status !== "COMPLETED" &&
        phase.deadline &&
        new Date(phase.deadline) < today
      ) {
        overduePhases.push({ ...phase, projectName: project.name, projectId: project.id });
      }
    });
  });

  // Categorias de despesas para gráfico pizza
  const expenseCategories = {};
  thisMonthTx.filter((t) => t.type === "EXPENSE").forEach((t) => {
    expenseCategories[t.category || "Outros"] =
      (expenseCategories[t.category || "Outros"] || 0) + parseFloat(t.amount);
  });
  const totalExpense = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
  const pieColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  const formatCurrency = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Barra chart max
  const barMax = Math.max(income, prevIncome, expense, prevExpense, 1);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando...</h1>
            <p className={styles.subtitle}>Buscando dados do sistema</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Olá, {user?.name || "Equipe"} 👋
          </h1>
          <p className={styles.subtitle}>
            Aqui está o resumo do seu escritório hoje.
          </p>
        </div>
        <div className={styles.dateTag}>
          {today.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "rgba(16,185,129,0.12)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>{activeProjects}</span>
            <span className={styles.metricLabel}>Projetos Ativos</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: "rgba(59,130,246,0.12)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>{totalClients}</span>
            <span className={styles.metricLabel}>Clientes</span>
          </div>
        </div>

        {isAdmin && (
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(16,185,129,0.12)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.metricData}>
              <span className={styles.metricValue}>{formatCurrency(income - expense)}</span>
              <span className={styles.metricLabel}>Lucro do Mês</span>
            </div>
          </div>
        )}

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: overduePhases.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={overduePhases.length > 0 ? "#EF4444" : "#F59E0B"} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue} style={{ color: overduePhases.length > 0 ? "#EF4444" : undefined }}>
              {overduePhases.length}
            </span>
            <span className={styles.metricLabel}>Etapas Atrasadas</span>
          </div>
        </div>
      </div>

      {/* Alarme Visual */}
      {overduePhases.length > 0 && (
        <div className={styles.alarmSection}>
          <h3 className={styles.alarmTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Alarme de Atraso
          </h3>
          <div className={styles.alarmList}>
            {overduePhases.map((phase, i) => (
              <div key={i} className={styles.alarmItem}>
                <div className={styles.alarmDot}></div>
                <div>
                  <strong>{phase.projectName}</strong>
                  <span className={styles.alarmPhase}>{phase.name}</span>
                  <span className={styles.alarmDate}>
                    Prazo: {new Date(phase.deadline).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section - Admin Only */}
      {isAdmin && (
        <div className={styles.chartsGrid}>
          {/* Bar Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Faturamento Mensal</h3>
            <p className={styles.chartSubtitle}>Comparação com o mês anterior</p>
            <div className={styles.barChart}>
              <div className={styles.barGroup}>
                <span className={styles.barLabel}>Entradas</span>
                <div className={styles.barRow}>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(prevIncome / barMax) * 100}%`, background: "rgba(16,185,129,0.3)" }}></div>
                  </div>
                  <span className={styles.barValue}>{formatCurrency(prevIncome)}</span>
                </div>
                <div className={styles.barRow}>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(income / barMax) * 100}%`, background: "linear-gradient(90deg, #059669, #10B981)" }}></div>
                  </div>
                  <span className={styles.barValue}>{formatCurrency(income)}</span>
                </div>
              </div>
              <div className={styles.barGroup}>
                <span className={styles.barLabel}>Saídas</span>
                <div className={styles.barRow}>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(prevExpense / barMax) * 100}%`, background: "rgba(239,68,68,0.3)" }}></div>
                  </div>
                  <span className={styles.barValue}>{formatCurrency(prevExpense)}</span>
                </div>
                <div className={styles.barRow}>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(expense / barMax) * 100}%`, background: "linear-gradient(90deg, #DC2626, #EF4444)" }}></div>
                  </div>
                  <span className={styles.barValue}>{formatCurrency(expense)}</span>
                </div>
              </div>
              <div className={styles.barLegend}>
                <span><span className={styles.legendDot} style={{ background: "rgba(255,255,255,0.2)" }}></span>Mês Anterior</span>
                <span><span className={styles.legendDot} style={{ background: "#10B981" }}></span>Mês Atual</span>
              </div>
            </div>
          </div>

          {/* Pie Chart (CSS-based) */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Despesas por Categoria</h3>
            <p className={styles.chartSubtitle}>Distribuição do mês atual</p>
            <div className={styles.pieSection}>
              <div className={styles.pieChart}>
                {(() => {
                  const entries = Object.entries(expenseCategories);
                  let cumulative = 0;
                  const gradientParts = entries.map(([, val], i) => {
                    const start = cumulative;
                    const pct = (val / totalExpense) * 100;
                    cumulative += pct;
                    return `${pieColors[i % pieColors.length]} ${start}% ${cumulative}%`;
                  });
                  return (
                    <div
                      className={styles.pieRing}
                      style={{
                        background: `conic-gradient(${gradientParts.join(", ")})`,
                      }}
                    >
                      <div className={styles.pieCenter}>
                        <span>{formatCurrency(totalExpense)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className={styles.pieLegend}>
                {Object.entries(expenseCategories).map(([cat, val], i) => (
                  <div key={cat} className={styles.pieLegendItem}>
                    <span className={styles.legendDot} style={{ background: pieColors[i % pieColors.length] }}></span>
                    <span className={styles.pieLegendLabel}>{cat}</span>
                    <span className={styles.pieLegendValue}>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className={styles.recentSection}>
        <h3 className={styles.sectionTitle}>Projetos Recentes</h3>
        <div className={styles.projectsList}>
          {projects.slice(0, 4).map((project) => {
            const phases = project.phases || [];
            const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
            const totalPhases = phases.length;
            const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
            const clientName = project.client?.name || project.clientName || "—";
            const statusMap = {
              PROSPECT: { label: "Prospecção", cls: styles.badgeInfo },
              ACTIVE: { label: "Ativo", cls: styles.badgeSuccess },
              PAUSED: { label: "Pausado", cls: styles.badgeWarning },
              FINISHED: { label: "Concluído", cls: styles.badgeNeutral },
            };
            const st = statusMap[project.status];

            return (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <div>
                    <h4 className={styles.projectName}>{project.name}</h4>
                    <span className={styles.projectClient}>{clientName}</span>
                  </div>
                  <span className={`${styles.badge} ${st.cls}`}>{st.label}</span>
                </div>
                <div className={styles.projectMeta}>
                  <span className={styles.projectType}>
                    {project.type === "INTERIOR" ? "Interiores" : "Arquitetônico"}
                  </span>
                  {project.deadline && (
                    <span className={styles.projectDeadline}>
                      Prazo: {new Date(project.deadline).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className={styles.progressText}>
                    {completedPhases}/{totalPhases} etapas ({progress}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
