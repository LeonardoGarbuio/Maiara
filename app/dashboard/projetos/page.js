"use client";

import { useState, useEffect } from "react";
import styles from "./projetos.module.css";
import { PHASE_TEMPLATES } from "@/lib/phase-templates";

const STATUS_MAP = {
  PROSPECT: { label: "Prospecção", color: "#60A5FA" },
  ACTIVE: { label: "Ativo", color: "#10B981" },
  PAUSED: { label: "Pausado", color: "#FBBF24" },
  FINISHED: { label: "Concluído", color: "#888" },
};

export default function ProjetosPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [form, setForm] = useState({ name: "", clientId: "", newClientName: "", type: "INTERIOR", status: "PROSPECT", paymentType: "CASH_UPFRONT", installments: 1, upfrontValue: "", deadline: "", totalValue: "", notes: "", assignedTo: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal Justificativa/Estagiário
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [justifyData, setJustifyData] = useState(null);
  const [justification, setJustification] = useState("");
  const [savingPhase, setSavingPhase] = useState(false);
  const [docType, setDocType] = useState("PLAN");
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal Prejuízo/Despesa (Loss Modal)
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossData, setLossData] = useState({ projectId: "", projectName: "", amount: "", description: "" });
  const [savingLoss, setSavingLoss] = useState(false);
  const [editingLossId, setEditingLossId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    let currentUser = null;
    if (stored) {
      currentUser = JSON.parse(stored);
      setUser(currentUser);
    }

    async function fetchData() {
      try {
        const [projRes, cliRes, usersRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/clients"),
          fetch("/api/users"),
        ]);
        const proj = await projRes.json();
        const cli = await cliRes.json();
        const users = await usersRes.json();
        setProjects(Array.isArray(proj) ? proj : []);
        setClients(Array.isArray(cli) ? cli : []);
        setTeamUsers(Array.isArray(users) ? users : []);
      } catch {
        console.error("Erro ao carregar projetos");
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

  const getClientName = (project) => project.client?.name || "—";

  const filtered = projects.filter((p) => {
    const matchFilter = filter === "ALL" || p.status === filter;
    const clientName = getClientName(p);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openCreate = () => {
    setSelectedProject(null);
    setForm({ name: "", clientId: "", newClientName: "", type: "INTERIOR", status: "PROSPECT", paymentType: "CASH_UPFRONT", installments: 1, upfrontValue: "", deadline: "", totalValue: "", notes: "", assignedTo: "" });
    setIsNewClient(false);
    setShowModal(true);
  };

  const openLossModal = (project) => {
    setSelectedProject(project); // Guardamos o projeto selecionado para podermos listar suas transacoes
    setLossData({ projectId: project.id, projectName: project.name, amount: "", description: "" });
    setEditingLossId(null);
    setShowLossModal(true);
  };

  const openEdit = (project) => {
    setSelectedProject(project);
    setForm({
      name: project.name,
      clientId: project.clientId || project.client?.id || "",
      newClientName: "",
      type: project.type,
      status: project.status,
      deadline: project.deadline ? project.deadline.split("T")[0] : "",
      totalValue: project.totalValue || "",
      paymentType: project.paymentType || "CASH_UPFRONT",
      installments: project.installments || 1,
      upfrontValue: project.upfrontValue || "",
      notes: project.notes || "",
      assignedTo: project.assignedTo || "",
    });
    setIsNewClient(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return showToast("O nome do projeto é obrigatório", "error");
    if (isNewClient && !form.newClientName?.trim()) return showToast("Digite o nome do novo cliente", "error");

    setSaving(true);
    try {
      if (selectedProject) {
        const res = await fetch(`/api/projects/${selectedProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, changedBy: user?.id }),
        });
        if (res.ok) {
          const updated = await res.json();
          setProjects((prev) => prev.map((p) => p.id === selectedProject.id ? updated : p));
          
          if (isAdmin && form.status === "FINISHED" && selectedProject.status !== "FINISHED") {
            setTimeout(() => {
              if (confirm("Você alterou o status deste projeto para Concluído! Ocorreu algum prejuízo/custo extra durante a execução que deseja registrar no financeiro?")) {
                 openLossModal(updated);
              }
            }, 300);
          }
        }
        showToast("Projeto atualizado!");
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = await res.json();
          setProjects((prev) => [created, ...prev]);
        }
        showToast("Projeto criado com as etapas!");
      }
    } catch {
      showToast("Erro ao salvar", "error");
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleSaveLoss = async () => {
    if (!lossData.amount || parseFloat(lossData.amount) <= 0) return showToast("Digite um valor válido", "error");
    if (!lossData.description.trim()) return showToast("Digite uma descrição para o prejuízo", "error");

    setSavingLoss(true);
    try {
      let createdTx;
      if (editingLossId) {
        const res = await fetch(`/api/transactions/${editingLossId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: lossData.projectId,
            type: "EXPENSE",
            amount: parseFloat(lossData.amount),
            description: lossData.description,
            category: "Prejuízo/Custo Extra"
          })
        });
        if (!res.ok) throw new Error("Erro ao atualizar prejuízo");
        createdTx = await res.json();
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: lossData.projectId,
            type: "EXPENSE",
            amount: parseFloat(lossData.amount),
            transactionDate: new Date().toISOString(),
            description: lossData.description,
            category: "Prejuízo/Custo Extra"
          })
        });
        if (!res.ok) throw new Error("Erro ao salvar prejuízo");
        createdTx = await res.json();
      }
      
      setProjects((prev) => prev.map((p) => {
        if (p.id === lossData.projectId) {
          const updatedTxs = editingLossId 
            ? p.transactions.map(t => t.id === editingLossId ? createdTx : t)
            : [createdTx, ...(p.transactions || [])];
          return { ...p, transactions: updatedTxs };
        }
        return p;
      }));

      // Seleciona o projeto novamente para atualizar as transacoes que estao ativas no modal
      setSelectedProject((prev) => {
         if(prev && prev.id === lossData.projectId) {
            const updatedTxs = editingLossId 
              ? prev.transactions.map(t => t.id === editingLossId ? createdTx : t)
              : [createdTx, ...(prev.transactions || [])];
            return { ...prev, transactions: updatedTxs };
         }
         return prev;
      });

      showToast(editingLossId ? "Prejuízo atualizado!" : "Prejuízo registrado com sucesso no painel financeiro!");
      setLossData({ ...lossData, amount: "", description: "" });
      setEditingLossId(null);
      setShowLossModal(false);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingLoss(false);
    }
  };

  const handleDeleteLoss = async (txId) => {
    if (!confirm("Tem certeza que quer deletar este prejuízo/despesa? O dashboard será recalculado.")) return;
    try {
      await fetch(`/api/transactions/${txId}`, { method: "DELETE" });
      
      setProjects((prev) => prev.map((p) => {
        if (p.id === selectedProject?.id) {
          return { ...p, transactions: p.transactions.filter(t => t.id !== txId) };
        }
        return p;
      }));

      setSelectedProject((prev) => {
         if (prev && prev.id === selectedProject?.id) {
            return { ...prev, transactions: prev.transactions.filter(t => t.id !== txId) };
         }
         return prev;
      });
      
      showToast("Prejuízo deletado com sucesso!");
    } catch {
      showToast("Erro ao deletar", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que quer deletar este projeto?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Projeto deletado");
    } catch {
      showToast("Erro ao deletar", "error");
    }
  };

  const handlePhaseToggle = async (project, phase) => {
    const isIntern = user?.role === "TEAM";
    const newStatus = phase.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    const markingComplete = newStatus === "COMPLETED";

    if (isIntern && markingComplete) {
      openJustifyModal(phase, newStatus);
      return;
    }

    await performPhaseToggle(project, phase, newStatus);
  };

  const openJustifyModal = (phase, status) => {
    setJustifyData({ phase, status });
    setJustification("");
    setDocType("PLAN");
    setSelectedFile(null);
    setShowJustifyModal(true);
  };

  const handleCompletePhaseWithReason = async () => {
    if (!justification.trim()) return showToast("A justificativa é obrigatória", "error");
    
    setSavingPhase(true);
    let finalFileUrl = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("projectId", justifyData.phase.projectId);
        formData.append("docType", docType);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Erro no upload");
        finalFileUrl = uploadData.url;
      }

      const bodyPayload = {
        status: justifyData.status,
        justification: justification,
        userId: user?.id
      };

      if (finalFileUrl) {
         bodyPayload.justification += `\n\n[Arquivo Anexado]: ${finalFileUrl}`;
      }

      const res = await fetch(`/api/phases/${justifyData.phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) throw new Error("Erro ao atualizar fase");

      const updateData = await res.json();
      
      let allCompleted = false;
      const targetProject = projects.find(p => p.id === justifyData.phase.projectId);

      setProjects((prev) => prev.map((p) => {
        if (p.id === justifyData.phase.projectId) {
          const updatedPhases = p.phases.map((ph) => ph.id === justifyData.phase.id ? { ...ph, ...updateData } : ph);
          allCompleted = updatedPhases.every((ph) => ph.status === "COMPLETED");
          return { ...p, phases: updatedPhases };
        }
        return p;
      }));

      showToast("Etapa concluída e arquivos registrados!");
      setShowJustifyModal(false);
      setJustifyData(null);

      if (allCompleted && isAdmin && targetProject) {
        setTimeout(() => {
          if (confirm("Projeto 100% concluído! Ocorreu algum prejuízo/custo extra durante a execução que deseja registrar no financeiro?")) {
            openLossModal(targetProject);
          }
        }, 300);
      }

    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingPhase(false);
    }
  };

  const performPhaseToggle = async (project, phase, newStatus, reason = null) => {
    try {
      await fetch(`/api/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          justification: reason,
          userId: user?.id
        }),
      });

      let allCompleted = false;
      setProjects((prev) => prev.map((p) => {
        if (p.id === project.id) {
          const updatedPhases = p.phases.map((ph) => ph.id === phase.id ? { ...ph, status: newStatus, justification: reason } : ph);
          allCompleted = updatedPhases.every((ph) => ph.status === "COMPLETED");
          return { ...p, phases: updatedPhases };
        }
        return p;
      }));

      if (reason) showToast("Etapa concluída com justificativa!");

      if (allCompleted && isAdmin) {
        setTimeout(() => {
          if (confirm("Projeto 100% concluído! Ocorreu algum prejuízo/custo extra durante a execução que deseja registrar no financeiro?")) {
            openLossModal(project);
          }
        }, 300);
      }

    } catch {
      showToast("Erro ao atualizar status", "error");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Carregando projetos...</h1>
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
          <h1 className={styles.title}>Projetos</h1>
          <p className={styles.subtitle}>{projects.length} projetos cadastrados</p>
        </div>
        {isAdmin && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Projeto
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Buscar projeto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.filters}>
          {["ALL", "PROSPECT", "ACTIVE", "PAUSED", "FINISHED"].map((f) => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`} onClick={() => setFilter(f)}>
              {f === "ALL" ? "Todos" : STATUS_MAP[f]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.projectsGrid}>
        {filtered.map((project) => {
          const phases = project.phases || [];
          const completed = phases.filter((p) => p.status === "COMPLETED").length;
          const total = phases.length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const st = STATUS_MAP[project.status];
          const today = new Date();
          const isOverdue = project.deadline && new Date(project.deadline) < today && project.status === "ACTIVE";
          const clientName = getClientName(project);

          return (
            <div key={project.id} className={`${styles.projectCard} ${isOverdue ? styles.overdueCard : ""}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitles}>
                  <span className={styles.badge} style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}33` }}>{st.label}</span>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={styles.clientName}>{clientName}</span>
                </div>
                {isAdmin && (
                  <div className={styles.cardActions}>
                    <button className={styles.iconBtn} onClick={() => openLossModal(project)} title="Registrar Prejuízo/Despesa">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </button>
                    <button className={styles.iconBtn} onClick={() => openEdit(project)} title="Editar Projeto">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(project.id)} title="Deletar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.cardMeta}>
                <span className={styles.typeTag}>{project.type === "INTERIOR" ? "🏠 Interiores" : "🏗️ Arquitetônico"}</span>
                {project.totalValue && <span className={styles.value}>R$ {Number(project.totalValue).toLocaleString("pt-BR")}</span>}
                {project.deadline && (
                  <span className={isOverdue ? styles.deadlineOverdue : styles.deadline}>
                    📅 {new Date(project.deadline).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }}></div></div>
                <span className={styles.progressLabel}>{completed}/{total} etapas — {progress}%</span>
              </div>

              <div className={styles.phases}>
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    className={`${styles.phase} ${phase.status === "COMPLETED" ? styles.phaseCompleted : phase.status === "IN_PROGRESS" ? styles.phaseInProgress : styles.phasePending}`}
                    onClick={() => handlePhaseToggle(project, phase)}
                    title={phase.name}
                  >
                    <span className={styles.phaseOrder}>{phase.order}</span>
                    <span className={styles.phaseName}>{phase.name}</span>
                    <span className={styles.phaseCheck}>
                      {phase.status === "COMPLETED" ? "✓" : phase.status === "IN_PROGRESS" ? "▶" : "○"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>Nenhum projeto encontrado.</div>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedProject ? "Editar Projeto" : "Novo Projeto"}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Nome do Projeto *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Residência Silva" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Cliente</label>
                {!isNewClient ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={styles.input} style={{ flex: 1 }}>
                      <option value="">Nenhum (selecionar depois)</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" className={styles.btnSecondary} onClick={() => { setIsNewClient(true); setForm({ ...form, clientId: "" }); }} style={{ padding: "0 12px", whiteSpace: "nowrap" }}>+ Novo</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={form.newClientName || ""} onChange={(e) => setForm({ ...form, newClientName: e.target.value })} placeholder="Nome do novo cliente..." className={styles.input} style={{ flex: 1 }} autoFocus />
                    <button type="button" className={styles.btnSecondary} onClick={() => { setIsNewClient(false); setForm({ ...form, newClientName: "" }); }} style={{ padding: "0 12px" }}>Voltar</button>
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label>Atribuir a (Opcional)</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={styles.input}>
                  <option value="">Aberto para toda a equipe</option>
                  {teamUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role === "ADMIN" ? "Admin" : "Estagiário"})</option>)}
                </select>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={styles.input}>
                    <option value="INTERIOR">Interiores</option>
                    <option value="ARCHITECTURAL">Arquitetônico</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={styles.input}>
                    <option value="PROSPECT">Prospecção</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="PAUSED">Pausado</option>
                    <option value="FINISHED">Concluído</option>
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Prazo Final</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={styles.input} />
                </div>
                <div className={styles.field}>
                  <label>Valor Total (R$)</label>
                  <input type="number" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} placeholder="0,00" className={styles.input} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Forma de Pagamento</label>
                  <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} className={styles.input}>
                    <option value="CASH_UPFRONT">À Vista (Total)</option>
                    <option value="INSTALLMENTS">Mensalidade (Parcelado sem entrada)</option>
                    <option value="UPFRONT_AND_INSTALLMENTS">Entrada + Parcelas</option>
                  </select>
                </div>
                {form.paymentType !== "CASH_UPFRONT" && (
                  <div className={styles.field}>
                    <label>Qtd. de Parcelas</label>
                    <input type="number" min="1" value={form.installments} onChange={(e) => setForm({ ...form, installments: parseInt(e.target.value) || 1 })} className={styles.input} />
                  </div>
                )}
                {form.paymentType === "UPFRONT_AND_INSTALLMENTS" && (
                  <div className={styles.field}>
                    <label>Valor da Entrada (R$)</label>
                    <input type="number" value={form.upfrontValue} onChange={(e) => setForm({ ...form, upfrontValue: e.target.value })} placeholder="0,00" className={styles.input} />
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label>Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anotações sobre o projeto..." className={`${styles.input} ${styles.textarea}`} rows={3} />
              </div>
              {!selectedProject && (
                <div className={styles.infoBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  As etapas serão criadas automaticamente com o template de {form.type === "INTERIOR" ? "10 etapas (Interiores)" : "11 etapas (Arquitetônico)"}.
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : selectedProject ? "Salvar Alterações" : "Criar Projeto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJustifyModal && (
        <div className={styles.overlay} onClick={() => { setShowJustifyModal(false); setJustifyData(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Justificar Conclusão</h2>
              <button className={styles.closeBtn} onClick={() => { setShowJustifyModal(false); setJustifyData(null); }}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Você está marcando a etapa <strong>"{justifyData?.phase?.name}"</strong> como concluída. Por favor, descreva o que foi feito ou anexe observações importantes.</span>
              </div>
              <div className={styles.field}>
                <label>O que foi realizado nesta etapa? *</label>
                <textarea 
                  value={justification} 
                  onChange={(e) => setJustification(e.target.value)} 
                  placeholder="Ex: Todos os desenhos técnicos foram conferidos e enviados para plotagem..." 
                  className={`${styles.input} ${styles.textarea}`} 
                  rows={4} 
                  autoFocus
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Tipo de Arquivo</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className={styles.input}>
                    <option value="PLAN">Arquipélago/Planta (DWG, SKP, PDF)</option>
                    <option value="PHOTO">Imagem/Render (JPG, PNG)</option>
                    <option value="CONTRACT">Contrato/Proposta (PDF, DOCX)</option>
                    <option value="OTHER">Outros (.ZIP, etc)</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Anexo (Opcional)</label>
                <input 
                  type="file" 
                  className={styles.input}
                  style={{ padding: '8px' }}
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  accept={
                    docType === 'PLAN' ? ".pdf,.dwg,.skp,.rvt" : 
                    docType === 'PHOTO' ? "image/*" : 
                    docType === 'CONTRACT' ? ".pdf,.doc,.docx" : 
                    "*"
                  }
                />
                <span className={styles.hint}>Tamanho máximo: 100MB por arquivo.</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => { setShowJustifyModal(false); setJustifyData(null); }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleCompletePhaseWithReason} disabled={savingPhase || !justification.trim()}>
                {savingPhase ? "Enviando e Salvando..." : "Confirmar Conclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLossModal && (
        <div className={styles.overlay} onClick={() => setShowLossModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Prejuízos / Custos Extras</h2>
              <button className={styles.closeBtn} onClick={() => setShowLossModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoBox} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#FCA5A5" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Adicione aqui gastos que saíram do próprio bolso ou prejuízos para o projeto <strong>{lossData.projectName}</strong>. Ao salvar, os valores serão computados e deduzidos automaticamente do Lucro e Faturamentos mensais.</span>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field} style={{ flex: 1.5 }}>
                  <label>Descrição do Prejuízo *</label>
                  <input id="loss-desc-input" value={lossData.description} onChange={(e) => setLossData({ ...lossData, description: e.target.value })} placeholder="Ex: Vidro quebrado por funcionário" className={styles.input} />
                </div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Valor (R$) *</label>
                  <input type="number" value={lossData.amount} onChange={(e) => setLossData({ ...lossData, amount: e.target.value })} placeholder="0,00" className={styles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '16px', gap: '8px' }}>
                 {editingLossId && (
                   <button className={styles.btnSecondary} onClick={() => { setEditingLossId(null); setLossData({ ...lossData, amount: "", description: "" }); }} disabled={savingLoss}>
                     Cancelar Edição
                   </button>
                 )}
                 <button className={styles.btnPrimary} style={{ background: "#DC2626", borderColor: "#DC2626" }} onClick={handleSaveLoss} disabled={savingLoss}>
                   {savingLoss ? "Adicionando..." : (editingLossId ? "Salvar Alteração" : "Adicionar Prejuízo")}
                 </button>
              </div>

              {selectedProject && selectedProject.transactions && selectedProject.transactions.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '12px' }}>Histórico de Prejuízos deste Projeto</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedProject.transactions.map((tx) => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #DC2626' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ color: '#FFF', fontWeight: 500, fontSize: '0.9rem' }}>{tx.description}</span>
                           <span style={{ color: 'var(--carbon-400)', fontSize: '0.75rem' }}>{new Date(tx.transactionDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: '#FCA5A5', fontWeight: 600 }}>R$ {Number(tx.amount).toLocaleString('pt-BR')}</span>
                          <div style={{ display: 'flex', gap: '8px', opacity: 0.8 }}>
                            <button onClick={() => { 
                              setEditingLossId(tx.id); 
                              setLossData({ ...lossData, amount: String(tx.amount), description: tx.description });
                              document.getElementById("loss-desc-input")?.focus();
                            }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#60A5FA', padding: 0 }} title="Editar Prejuízo">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => handleDeleteLoss(tx.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }} title="Excluir">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
