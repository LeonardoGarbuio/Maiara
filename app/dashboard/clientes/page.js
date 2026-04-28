"use client";

import { useState, useEffect } from "react";
import styles from "./clientes.module.css";

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) setUser(JSON.parse(stored));

    async function fetchData() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch {
        console.error("Erro ao carregar clientes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isAdmin = ["ADMIN", "LEAD_ARCHITECT"].includes(user?.role);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const openCreate = () => { setSelected(null); setForm({ name: "", email: "", phone: "", address: "", notes: "" }); setShowModal(true); };
  const openEdit = (client) => { setSelected(client); setForm({ name: client.name, email: client.email || "", phone: client.phone || "", address: client.address || "", notes: client.notes || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return showToast("Nome é obrigatório", "error");
    setSaving(true);
    try {
      if (selected) {
        const res = await fetch(`/api/clients/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          const updated = await res.json();
          setClients((prev) => prev.map((c) => c.id === selected.id ? { ...c, ...updated } : c));
          if (detailClient?.id === selected.id) setDetailClient({ ...detailClient, ...updated });
        }
        showToast("Cliente atualizado!");
      } else {
        const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          const created = await res.json();
          setClients((prev) => [{ ...created, projects: [] }, ...prev]);
        }
        showToast("Cliente cadastrado!");
      }
    } catch { showToast("Erro ao salvar", "error"); }
    setSaving(false); setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar este cliente?")) return;
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== id));
      if (detailClient?.id === id) setDetailClient(null);
      showToast("Cliente removido");
    } catch {
      showToast("Erro ao deletar", "error");
    }
  };

  const getClientProjects = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.projects || [];
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando clientes...</h1>
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
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>{clients.length} clientes cadastrados</p>
        </div>
        {isAdmin && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Cliente
          </button>
        )}
      </div>

      <div className={styles.searchBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
      </div>

      <div className={styles.layout}>
        {/* Lista */}
        <div className={styles.clientsList}>
          {filtered.map((client) => {
            const clientProjects = client.projects || [];
            const activeProjects = clientProjects.filter((p) => p.status === "ACTIVE").length;
            return (
              <div key={client.id} className={`${styles.clientCard} ${detailClient?.id === client.id ? styles.clientCardActive : ""}`} onClick={() => setDetailClient(client)}>
                <div className={styles.clientAvatar}>{client.name[0].toUpperCase()}</div>
                <div className={styles.clientInfo}>
                  <h3 className={styles.clientName}>{client.name}</h3>
                  <span className={styles.clientEmail}>{client.email || "Sem email"}</span>
                  <span className={styles.clientPhone}>{client.phone || "Sem telefone"}</span>
                </div>
                <div className={styles.clientStats}>
                  <span className={styles.projectCount}>{clientProjects.length} proj.</span>
                  {activeProjects > 0 && <span className={styles.activeTag}>{activeProjects} ativo{activeProjects > 1 ? "s" : ""}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className={styles.empty}>Nenhum cliente encontrado.</p>}
        </div>

        {/* Detalhe */}
        {detailClient && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailClient.name[0]}</div>
              <div>
                <h2 className={styles.detailName}>{detailClient.name}</h2>
                <span className={styles.detailSince}>Cliente desde {new Date(detailClient.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              {isAdmin && (
                <div className={styles.detailActions}>
                  <button className={styles.iconBtn} onClick={() => openEdit(detailClient)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(detailClient.id)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              )}
            </div>

            <div className={styles.detailInfos}>
              {detailClient.email && <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span>{detailClient.email}</span></div>}
              {detailClient.phone && <div className={styles.detailItem}><span className={styles.detailLabel}>Telefone</span><span>{detailClient.phone}</span></div>}
              {detailClient.address && <div className={styles.detailItem}><span className={styles.detailLabel}>Endereço</span><span>{detailClient.address}</span></div>}
              {detailClient.notes && <div className={styles.detailItem}><span className={styles.detailLabel}>Notas</span><span>{detailClient.notes}</span></div>}
            </div>

            <div className={styles.detailProjects}>
              <h4 className={styles.detailSectionTitle}>Projetos</h4>
              {getClientProjects(detailClient.id).length === 0 ? (
                <p className={styles.empty}>Sem projetos</p>
              ) : (
                getClientProjects(detailClient.id).map((p) => (
                  <div key={p.id} className={styles.minProject}>
                    <span>{p.name}</span>
                    <span className={styles.minStatus} style={{ color: p.status === "ACTIVE" ? "var(--emerald-400)" : p.status === "FINISHED" ? "#888" : "#FBBF24" }}>
                      {p.status === "ACTIVE" ? "Ativo" : p.status === "FINISHED" ? "Concluído" : p.status === "PROSPECT" ? "Prospecção" : "Pausado"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selected ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}><label>Nome *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" className={styles.input} /></div>
              <div className={styles.row}>
                <div className={styles.field}><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className={styles.input} /></div>
                <div className={styles.field}><label>Telefone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(42) 99999-0000" className={styles.input} /></div>
              </div>
              <div className={styles.field}><label>Endereço</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número - Cidade/UF" className={styles.input} /></div>
              <div className={styles.field}><label>Notas</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre o cliente..." className={`${styles.input} ${styles.textarea}`} rows={3} /></div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : selected ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
