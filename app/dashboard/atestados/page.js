"use client";

import { useState, useEffect } from "react";
import styles from "./atestados.module.css";

const STATUS_MAP = {
  PENDING: { label: "Pendente", color: "#FBBF24", bg: "rgba(245, 158, 11, 0.1)" },
  APPROVED: { label: "Aprovado", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
  REJECTED: { label: "Rejeitado", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
};

export default function AtestadosPage() {
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ absenceDate: new Date().toISOString().split("T")[0], description: "", fileUrl: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) setUser(JSON.parse(stored));

    async function fetchData() {
      try {
        const res = await fetch("/api/certificates");
        const data = await res.json();
        setCertificates(Array.isArray(data) ? data : []);
      } catch {
        console.error("Erro ao carregar atestados");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = async () => {
    if (!form.absenceDate || !form.description) return showToast("Preencha data e descrição", "error");
    setSaving(true);
    
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          absenceDate: form.absenceDate,
          fileUrl: "atestado_upload.pdf",
          description: form.description,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setCertificates(prev => [created, ...prev]);
        showToast("Atestado enviado com sucesso!");
      } else {
        showToast("Erro ao enviar atestado", "error");
      }
    } catch {
      showToast("Erro de conexão", "error");
    }
    setSaving(false);
    setShowModal(false);
    setForm({ absenceDate: new Date().toISOString().split("T")[0], description: "", fileUrl: "" });
  };

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCertificates(prev => prev.map(at => at.id === id ? { ...at, status } : at));
        showToast(status === "APPROVED" ? "Atestado aprovado" : "Atestado rejeitado");
      }
    } catch {
      showToast("Erro ao atualizar", "error");
    }
  };

  const filtered = isAdmin 
    ? certificates 
    : certificates.filter(at => at.userId === user?.id);

  const getUserName = (cert) => cert.user?.name || cert.userName || "—";

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando atestados...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>{toast.msg}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Atestados</h1>
          <p className={styles.subtitle}>Gerenciamento de ausências e justificativas</p>
        </div>
        {!isAdmin && (
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Enviar Atestado
          </button>
        )}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>Nenhum atestado encontrado.</div>
        ) : (
          filtered.map((at) => (
            <div key={at.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <div className={styles.userSection}>
                  <div className={styles.avatar}>{getUserName(at)[0]}</div>
                  <div>
                    <strong className={styles.userName}>{getUserName(at)}</strong>
                    <span className={styles.createdAt}>Enviado em {new Date(at.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className={styles.details}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Data da Ausência</span>
                    <span className={styles.value}>{new Date(at.absenceDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Descrição / Motivo</span>
                    <span className={styles.value}>{at.description}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <div className={styles.statusBadge} style={{ color: STATUS_MAP[at.status].color, background: STATUS_MAP[at.status].bg }}>
                  {STATUS_MAP[at.status].label}
                </div>
                
                <a href="#" className={styles.fileLink} onClick={(e) => { e.preventDefault(); alert("Abrindo arquivo..."); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  Ver Documento
                </a>

                {isAdmin && at.status === "PENDING" && (
                  <div className={styles.adminButtons}>
                    <button className={styles.approveBtn} onClick={() => handleAction(at.id, "APPROVED")}>Aprovar</button>
                    <button className={styles.rejectBtn} onClick={() => handleAction(at.id, "REJECTED")}>Rejeitar</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Atestado</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Data da Ausência *</label>
                <input type="date" value={form.absenceDate} onChange={(e) => setForm({ ...form, absenceDate: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Descrição / Motivo *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Consulta médica agendada no período da manhã" className={`${styles.input} ${styles.textarea}`} rows={3} />
              </div>
              <div className={styles.field}>
                <label>Arquivo (PDF ou Imagem) *</label>
                <div className={styles.uploadBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Clique para selecionar ou arraste o arquivo</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleUpload} disabled={saving}>
                {saving ? "Enviando..." : "Enviar Atestado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
