"use client";

import { useState, useEffect } from "react";
import styles from "./equipe.module.css";

export default function EquipePage() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "TEAM" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para redefinir senha
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [selectedUserForPwd, setSelectedUserForPwd] = useState(null);
  const [newPwd, setNewPwd] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) setUser(JSON.parse(stored));

    async function fetchData() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        console.error("Erro ao carregar equipe");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.password) return showToast("Preencha todos os campos", "error");
    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, createdBy: user?.id }) });
      if (res.ok) {
        const created = await res.json();
        setUsers((prev) => [...prev, created]);
        showToast(`${form.role === "ADMIN" ? "Admin" : "Estagiário"} cadastrado!`);
      } else {
        const err = await res.json();
        showToast(err.error || "Erro ao criar", "error");
      }
    } catch { showToast("Erro ao criar", "error"); }
    setSaving(false); setShowModal(false);
    setForm({ name: "", username: "", password: "", role: "TEAM" });
  };

  const handleDelete = async (id) => {
    if (id === user?.id) return showToast("Você não pode se deletar", "error");
    if (!confirm("Deletar este usuário?")) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("Usuário removido");
    } catch {
      showToast("Erro ao deletar", "error");
    }
  };

  const handleResetPassword = async () => {
    if (newPwd.length < 4) return showToast("A senha deve ter pelo menos 4 caracteres", "error");
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUserForPwd.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });
      if (res.ok) {
        showToast("Senha alterada com sucesso!");
        setShowPwdModal(false);
        setNewPwd("");
      } else {
        showToast("Erro ao alterar senha", "error");
      }
    } catch {
      showToast("Erro ao alterar senha", "error");
    }
    setSaving(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nunca";

  const admins = users.filter((u) => u.role === "ADMIN");
  const team = users.filter((u) => u.role === "TEAM");

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando equipe...</h1>
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
          <h1 className={styles.title}>Equipe</h1>
          <p className={styles.subtitle}>{users.length} usuários cadastrados</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Usuário
        </button>
      </div>

      {/* Admins */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Administradores
        </h2>
        <div className={styles.userGrid}>
          {admins.map((u) => (
            <div key={u.id} className={`${styles.userCard} ${styles.adminCard}`}>
              <div className={`${styles.avatar} ${styles.avatarAdmin}`}>{u.name[0]}</div>
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>{u.name}</h3>
                <span className={styles.userEmail}>{u.username}</span>
                <div className={styles.lastLogin}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Último acesso: {formatDate(u.lastLogin)}
                </div>
              </div>
              <div className={styles.userBadge}>Admin</div>
              {u.id !== user?.id && (
                <div className={styles.actionsWrapper}>
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(u.id)} title="Deletar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Equipe */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Estagiários
        </h2>
        {team.length === 0 ? (
          <p className={styles.empty}>Nenhum estagiário cadastrado. Clique em "Novo Usuário" para adicionar.</p>
        ) : (
          <div className={styles.userGrid}>
            {team.map((u) => (
              <div key={u.id} className={styles.userCard}>
                <div className={styles.avatar}>{u.name[0]}</div>
                <div className={styles.userInfo}>
                  <h3 className={styles.userName}>{u.name}</h3>
                  <span className={styles.userEmail}>{u.username}</span>
                  <div className={styles.lastLogin}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Último acesso: {formatDate(u.lastLogin)}
                  </div>
                </div>
                <div className={`${styles.userBadge} ${styles.teamBadge}`}>Estagiário</div>
                <div className={styles.actionsWrapper}>
                  <button className={styles.iconBtn} onClick={() => { setSelectedUserForPwd(u); setShowPwdModal(true); }} title="Redefinir Senha">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </button>
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(u.id)} title="Deletar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Usuário</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.roleToggle}>
                <button className={`${styles.roleBtn} ${form.role === "TEAM" ? styles.roleBtnActive : ""}`} onClick={() => setForm({ ...form, role: "TEAM" })}>Estagiário</button>
                <button className={`${styles.roleBtn} ${form.role === "ADMIN" ? styles.roleBtnActiveAdmin : ""}`} onClick={() => setForm({ ...form, role: "ADMIN" })}>Administrador</button>
              </div>
              <div className={styles.field}><label>Nome completo *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do usuário" className={styles.input} /></div>
              <div className={styles.field}><label>Usuário *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="nome.sobrenome" className={styles.input} /></div>
              <div className={styles.field}>
                <label>Senha inicial *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" className={styles.input} />
                <span className={styles.hint}>O usuário pode alterar depois</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={saving}>{saving ? "Criando..." : "Criar Usuário"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {showPwdModal && (
        <div className={styles.overlay} onClick={() => setShowPwdModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Redefinir Senha</h2>
              <button className={styles.closeBtn} onClick={() => setShowPwdModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: "16px", color: "rgba(255,255,255,0.7)" }}>
                Defina uma nova senha para o estagiário <strong>{selectedUserForPwd?.name}</strong>. Ele poderá usar essa senha para fazer login imediatamente.
              </p>
              <div className={styles.field}>
                <label>Nova Senha</label>
                <input 
                  value={newPwd} 
                  onChange={(e) => setNewPwd(e.target.value)} 
                  placeholder="Digite a nova senha" 
                  className={styles.input} 
                  type="text" 
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowPwdModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleResetPassword} disabled={saving || !newPwd}>
                {saving ? "Salvando..." : "Alterar Senha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
