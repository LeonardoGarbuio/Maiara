"use client";

import { useState, useEffect } from "react";
import styles from "./financeiro.module.css";

const CATEGORIES = ["Projeto", "Fixo", "Software", "Material", "Transporte", "Outros"];
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState({ type: "INCOME", amount: "", description: "", category: "Projeto", transactionDate: new Date().toISOString().split("T")[0], projectId: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear] = useState(today.getFullYear());

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) setUser(JSON.parse(stored));

    async function fetchData() {
      try {
        const [txRes, projRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/projects"),
        ]);
        const txData = await txRes.json();
        const proj = await projRes.json();
        setTransactions(Array.isArray(txData.transactions) ? txData.transactions : Array.isArray(txData) ? txData : []);
        setProjects(Array.isArray(proj) ? proj : []);
      } catch {
        console.error("Erro ao carregar financeiro");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevTx = transactions.filter((t) => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === prevMonth && d.getFullYear() === viewYear;
  });

  const income = monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
  const prevIncome = prevTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const prevExpense = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
  const profit = income - expense;

  const expCats = {};
  monthTx.filter((t) => t.type === "EXPENSE").forEach((t) => { expCats[t.category || "Outros"] = (expCats[t.category || "Outros"] || 0) + parseFloat(t.amount); });
  const totalCatExp = Object.values(expCats).reduce((a, b) => a + b, 0);
  const pieColors = ["#C9A96E","#3B82F6","#F59E0B","#EF4444","#8B5CF6","#EC4899"];
  const barMax = Math.max(income, prevIncome, expense, prevExpense, 1);

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSave = async () => {
    if (!form.amount || !form.transactionDate) return showToast("Preencha valor e data", "error");
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (res.ok) {
        const created = await res.json();
        setTransactions((prev) => [created, ...prev]);
        showToast(form.type === "INCOME" ? "Entrada lançada!" : "Despesa lançada!");
      }
    } catch { showToast("Erro ao salvar", "error"); }
    setSaving(false); setShowModal(false);
    setForm({ type: "INCOME", amount: "", description: "", category: "Projeto", transactionDate: new Date().toISOString().split("T")[0], projectId: "" });
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast("Lançamento removido");
    } catch {
      showToast("Erro ao remover", "error");
    }
  };

  // 6 months chart
  const last6 = Array.from({ length: 6 }).map((_, i) => {
    const m = (today.getMonth() - 5 + i + 12) % 12;
    const y = today.getFullYear() - (today.getMonth() - 5 + i < 0 ? 1 : 0);
    const txs = transactions.filter((t) => { const d = new Date(t.transactionDate); return d.getMonth() === m && d.getFullYear() === y; });
    const inc = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
    const exp = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { label: MONTHS[m], income: inc, expense: exp };
  });
  const chartMax = Math.max(...last6.map((d) => Math.max(d.income, d.expense)), 1);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando financeiro...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Barreira Visual de Privacidade (Apertando os Parafusos)
  if (!["ADMIN", "LEAD_ARCHITECT"].includes(user?.role)) {
    return (
      <div className={styles.page}>
        <div className={styles.restricted}>
          <div className={styles.restrictedIcon}>🔒</div>
          <h1 className={styles.title}>Acesso Restrito</h1>
          <p className={styles.subtitle}>
            Esta área contém dados financeiros sensíveis e é exclusiva para a diretoria. 
            Seus acessos são monitorados para garantir a segurança da empresa.
          </p>
          <button className={styles.btnSecondary} onClick={() => window.location.href = "/dashboard"}>
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>{toast.msg}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financeiro</h1>
          <p className={styles.subtitle}>Controle de entradas e saídas</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={() => setViewMonth((m) => m === 0 ? 11 : m - 1)}>‹</button>
            <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
            <button className={styles.navBtn} onClick={() => setViewMonth((m) => m === 11 ? 0 : m + 1)}>›</button>
          </div>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Lançar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Entradas</span>
          <span className={`${styles.metricValue} ${styles.income}`}>{fmt(income)}</span>
          <span className={styles.metricDiff}>vs {fmt(prevIncome)} mês ant.</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Saídas</span>
          <span className={`${styles.metricValue} ${styles.expense}`}>{fmt(expense)}</span>
          <span className={styles.metricDiff}>vs {fmt(prevExpense)} mês ant.</span>
        </div>
        <div className={`${styles.metricCard} ${profit >= 0 ? styles.profitPositive : styles.profitNegative}`}>
          <span className={styles.metricLabel}>Lucro Líquido</span>
          <span className={styles.metricValue}>{fmt(profit)}</span>
          <span className={styles.metricDiff}>{profit >= 0 ? "✓ Positivo" : "✗ Negativo"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "overview" ? styles.tabActive : ""}`} onClick={() => setTab("overview")}>Visão Geral</button>
        <button className={`${styles.tab} ${tab === "lancamentos" ? styles.tabActive : ""}`} onClick={() => setTab("lancamentos")}>Lançamentos</button>
      </div>

      {tab === "overview" && (
        <div className={styles.chartsGrid}>
          {/* Bar Chart 6 meses */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Últimos 6 Meses</h3>
            <div className={styles.barChart}>
              {last6.map((d, i) => (
                <div key={i} className={styles.barCol}>
                  <div className={styles.barPair}>
                    <div className={styles.barItem} style={{ height: `${(d.income / chartMax) * 100}%`, background: "var(--emerald-500)" }} title={`Entrada: ${fmt(d.income)}`}></div>
                    <div className={styles.barItem} style={{ height: `${(d.expense / chartMax) * 100}%`, background: "#EF4444" }} title={`Saída: ${fmt(d.expense)}`}></div>
                  </div>
                  <span className={styles.barLabel}>{d.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.barLegend}>
              <span><span className={styles.dot} style={{ background: "var(--emerald-500)" }}></span>Entradas</span>
              <span><span className={styles.dot} style={{ background: "#EF4444" }}></span>Saídas</span>
            </div>
          </div>

          {/* Pie despesas */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Despesas por Categoria</h3>
            {totalCatExp === 0 ? (
              <p className={styles.empty}>Sem despesas no período</p>
            ) : (
              <div className={styles.pieSection}>
                <div className={styles.pieRing} style={{ background: `conic-gradient(${Object.entries(expCats).map(([, v], i) => { let cum = 0; Object.values(expCats).slice(0, i).forEach((x) => { cum += x; }); return `${pieColors[i % pieColors.length]} ${(cum / totalCatExp) * 100}% ${((cum + v) / totalCatExp) * 100}%`; }).join(", ")})` }}>
                  <div className={styles.pieCenter}>{fmt(totalCatExp)}</div>
                </div>
                <div className={styles.pieLegend}>
                  {Object.entries(expCats).map(([cat, val], i) => (
                    <div key={cat} className={styles.pieLegendItem}>
                      <span className={styles.dot} style={{ background: pieColors[i % pieColors.length] }}></span>
                      <span className={styles.pieLegendLabel}>{cat}</span>
                      <span className={styles.pieLegendValue}>{fmt(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comparativo barra horizontal */}
          <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
            <h3 className={styles.chartTitle}>Comparativo — {MONTHS[viewMonth]} vs {MONTHS[prevMonth]}</h3>
            <div className={styles.compareSection}>
              {[["Entradas", income, prevIncome, "var(--emerald-500)"], ["Saídas", expense, prevExpense, "#EF4444"]].map(([label, cur, prev, color]) => (
                <div key={label} className={styles.compareGroup}>
                  <span className={styles.compareLabel}>{label}</span>
                  <div className={styles.compareRow}>
                    <span className={styles.compareMonth}>{MONTHS[prevMonth]}</span>
                    <div className={styles.compareTrack}><div className={styles.compareFill} style={{ width: `${(prev / barMax) * 100}%`, background: `${color}55` }}></div></div>
                    <span className={styles.compareValue}>{fmt(prev)}</span>
                  </div>
                  <div className={styles.compareRow}>
                    <span className={styles.compareMonth}>{MONTHS[viewMonth]}</span>
                    <div className={styles.compareTrack}><div className={styles.compareFill} style={{ width: `${(cur / barMax) * 100}%`, background: color }}></div></div>
                    <span className={styles.compareValue}>{fmt(cur)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "lancamentos" && (
        <div className={styles.txList}>
          {monthTx.length === 0 ? (
            <div className={styles.empty}>Nenhum lançamento em {MONTHS[viewMonth]}.</div>
          ) : (
            monthTx.map((tx) => (
              <div key={tx.id} className={`${styles.txItem} ${tx.type === "INCOME" ? styles.txIncome : styles.txExpense}`}>
                <div className={styles.txIcon}>{tx.type === "INCOME" ? "↑" : "↓"}</div>
                <div className={styles.txInfo}>
                  <span className={styles.txDesc}>{tx.description || "Sem descrição"}</span>
                  <span className={styles.txMeta}>{tx.category} · {new Date(tx.transactionDate).toLocaleDateString("pt-BR")}</span>
                </div>
                <span className={`${styles.txAmount} ${tx.type === "INCOME" ? styles.amountIncome : styles.amountExpense}`}>
                  {tx.type === "INCOME" ? "+" : "-"}{fmt(parseFloat(tx.amount))}
                </span>
                <button className={styles.deleteBtn} onClick={() => handleDelete(tx.id)} title="Remover">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Lançamento</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.typeToggle}>
                <button className={`${styles.typeBtn} ${form.type === "INCOME" ? styles.typeBtnIncome : ""}`} onClick={() => setForm({ ...form, type: "INCOME" })}>↑ Entrada</button>
                <button className={`${styles.typeBtn} ${form.type === "EXPENSE" ? styles.typeBtnExpense : ""}`} onClick={() => setForm({ ...form, type: "EXPENSE" })}>↓ Saída</button>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Valor (R$) *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className={styles.input} /></div>
                <div className={styles.field}><label>Data *</label><input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} className={styles.input} /></div>
              </div>
              <div className={styles.field}><label>Descrição</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Honorários projeto X" className={styles.input} /></div>
              <div className={styles.row}>
                <div className={styles.field}><label>Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={styles.input}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.field}><label>Projeto (opcional)</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className={styles.input}>
                    <option value="">Sem projeto</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Lançar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
