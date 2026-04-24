"use client";

import { useState, useEffect } from "react";
import styles from "./DriveExplorer.module.css";

export default function DriveExplorer({ projectId, userRole, onClose }) {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "Raiz" }]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Edit & Selection
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState("");

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState(null); // { id, type }
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  // Audit Logs Modal
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load audit logs if admin
  const openAuditLogs = async () => {
    setShowLogsModal(true);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/drive/logs?projectId=${projectId}`);
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingLogs(false);
  };

  const handleDownloadDoc = async (doc) => {
    try {
      await fetch('/api/drive/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'DOWNLOADED_DOCUMENT', targetName: doc.name })
      });
    } catch (e) {} // Silent logger
    window.open(doc.fileUrl, '_blank');
  };

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;

  const fetchContents = async (folderId) => {
    setLoading(true);
    try {
      // Load project details to know if it's read-only
      const projRes = await fetch(`/api/projects/${projectId}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setIsReadOnly(projData.status === 'FINISHED');
      }
      
      if (folderId) {
        const res = await fetch(`/api/drive/folders/${folderId}`);
        if (res.ok) {
          const data = await res.json();
          setFolders(data.children || []);
          setDocuments(data.documents || []);
        }
      } else {
        const res = await fetch(`/api/drive/folders?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setFolders(data);
          const docsRes = await fetch(`/api/drive/documents?projectId=${projectId}&root=true`);
          if (docsRes.ok) {
            setDocuments(await docsRes.json());
          } else {
            setDocuments([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setSelectedItems(new Set());
  };

  useEffect(() => {
    fetchContents(currentFolderId);
  }, [currentFolderId, projectId]);

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ id: item.id, type });
    e.dataTransfer.effectAllowed = "move";
    // For visual effect
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedItem && draggedItem.type === 'folder' && draggedItem.id === folderId) return; // Can't drop into itself
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = (e) => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    if (!draggedItem) return;
    
    // Prevent dropping into self
    if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) return;

    try {
      const prefix = draggedItem.type === 'folder' ? 'folders' : 'documents';
      const body = draggedItem.type === 'folder' ? { parentId: targetFolderId } : { folderId: targetFolderId };
      
      const res = await fetch(`/api/drive/${prefix}/${draggedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        fetchContents(currentFolderId);
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
    setDraggedItem(null);
  };

  // Dropping into breadcrumbs (moving back up)
  const handleDropToBreadcrumb = async (e, targetFolderId) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) return;
    
    // Same parent check
    if (targetFolderId === currentFolderId) return;

    try {
      const prefix = draggedItem.type === 'folder' ? 'folders' : 'documents';
      const body = draggedItem.type === 'folder' ? { parentId: targetFolderId } : { folderId: targetFolderId };
      
      const res = await fetch(`/api/drive/${prefix}/${draggedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        fetchContents(currentFolderId);
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navigateToFolder = (folderId, folderName) => {
    setBreadcrumbs((prev) => {
      // Evita duplicação se clicar muito rápido
      if (prev[prev.length - 1]?.id === folderId) return prev;
      return [...prev, { id: folderId, name: folderName }];
    });
  };

  const navigateToBreadcrumb = (index) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolderId, projectId })
      });
      if (res.ok) {
        setNewFolderName("");
        setIsNewFolderModalOpen(false);
        fetchContents(currentFolderId);
      } else {
        const errData = await res.json();
        alert(`Erro (${res.status}): ${errData.error || "Erro desconhecido"}`);
        if (res.status === 403) setIsReadOnly(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("projectId", projectId);
    if (currentFolderId) fd.append("folderId", currentFolderId);
    fd.append("notes", uploadNotes);
    try {
      const res = await fetch("/api/drive/documents", { method: "POST", body: fd });
      if (res.ok) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadNotes("");
        fetchContents(currentFolderId);
      } else {
        const errData = await res.json();
        alert(`Erro upload (${res.status}): ${errData.error || "Erro desconhecido"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (e, id, type) => {
    e.stopPropagation();
    if (!confirm(`Excluir permanentemente este ${type === 'folder' ? 'diretório e todo seu conteúdo' : 'arquivo'}?`)) return;
    try {
      const prefix = type === 'folder' ? 'folders' : 'documents';
      const res = await fetch(`/api/drive/${prefix}/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchContents(currentFolderId);
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || "Acesso negado"}`);
        if (res.status === 403) setIsReadOnly(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditInput = (e, item, type) => {
    e.stopPropagation();
    setEditingItem({ id: item.id, type });
    setEditName(item.name);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingItem) return;
    try {
       const prefix = editingItem.type === 'folder' ? 'folders' : 'documents';
       const res = await fetch(`/api/drive/${prefix}/${editingItem.id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: editName })
       });
       if (res.ok) {
         setEditingItem(null);
         fetchContents(currentFolderId);
       } else {
         const err = await res.json();
         alert(`Erro: ${err.error}`);
         if (res.status === 403) setIsReadOnly(true);
       }
    } catch (err) {
       console.error(err);
    }
  };

  const downloadFile = (e, fileUrl, fileName) => {
    e.stopPropagation();
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch(err => {
        console.error("Download failed", err);
        window.open(fileUrl, '_blank'); // fallback
      });
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    const newSel = new Set(selectedItems);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelectedItems(newSel);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "APPROVED": return { dotClass: styles.dotApproved };
      case "WAITING_CLIENT": return { dotClass: styles.dotWaiting };
      case "IN_ALTERATION": return { dotClass: styles.dotAlteration };
      default: return { dotClass: styles.dotPending };
    }
  };

  const getExtensionIcon = (ext) => {
    const e = (ext || "").toLowerCase();
    if (['png','jpg','jpeg','webp','gif'].includes(e)) return "🖼️";
    if (['pdf'].includes(e)) return "📕";
    if (['doc','docx'].includes(e)) return "📘";
    if (['xls','xlsx'].includes(e)) return "📗";
    if (['zip','rar'].includes(e)) return "📦";
    if (['dwg','rvt'].includes(e)) return "🏗️";
    return "📄";
  };

  return (
    <div className={styles.driveContainer} onClick={() => setSelectedItems(new Set())}>
      {/* Header */}
      <div className={styles.driveHeader}>
        <div className={styles.driveTitle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Workspace do Projeto
        </div>
        <div className={styles.headerRight}>
          {isReadOnly && (
            <span className={styles.readOnlyBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Somente Leitura
            </span>
          )}
          <button onClick={onClose} className={styles.closeBtn}>
            Fechar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => (
            <div key={`crumb-${crumb.id || "root"}-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => navigateToBreadcrumb(index)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => handleDropToBreadcrumb(e, crumb.id)}
                className={`${styles.crumb} ${index === breadcrumbs.length - 1 ? styles.crumbActive : ""}`}
              >
                {index === 0 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                )}
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <span className={styles.crumbSep}>›</span>}
            </div>
          ))}
        </div>
        
        <div className={styles.toolbarActions}>
          {userRole === "ADMIN" && (
            <button onClick={openAuditLogs} className={styles.btnSecondary} style={{ marginRight: '8px' }} title="Auditoria de Logs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Auditoria
            </button>
          )}
          <button onClick={() => setIsNewFolderModalOpen(true)} className={styles.btnNewFolder} disabled={isReadOnly && userRole !== "ADMIN"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Pasta
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className={styles.btnUpload} disabled={isReadOnly && userRole !== "ADMIN"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Desktop Area */}
      <div className={styles.desktopArea}>
        {loading ? (
          <div className={styles.loadingState}>Carregando...</div>
        ) : folders.length === 0 && documents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>Pasta vazia</p>
          </div>
        ) : (
          <div className={styles.desktopGrid}>
            {/* Folders */}
            {folders.map((folder, index) => {
              const isDragTarget = dragOverFolderId === folder.id;
              const isSelected = selectedItems.has(folder.id);
              const isPhaseFolder = !!folder.phaseId;
              const isPhaseLocked = folder.phase?.status === "COMPLETED"; 
              const canEdit = userRole === "ADMIN" ? true : (!isReadOnly && !isPhaseLocked && !isPhaseFolder);
              
              return (
                <div 
                  key={`folder-${folder.id}-${index}`} 
                  className={`${styles.folderItem} ${isDragTarget ? styles.dragOver : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={(e) => toggleSelect(e, folder.id)}
                  onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  title={folder.name}
                >
                  {isPhaseLocked && (
                    <div style={{ position: 'absolute', top: 4, left: 4, fontSize: '0.85rem' }} title="Etapa Concluída/Trancada">🔒</div>
                  )}

                  {canEdit && (
                    <div className={styles.itemActions}>
                      <button onClick={(e) => openEditInput(e, folder, 'folder')} className={styles.actionBtn} title="Renomear">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={(e) => handleDeleteItem(e, folder.id, 'folder')} className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Excluir">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.folderIcon}>📁</div>
                  
                  {editingItem?.id === folder.id && editingItem?.type === 'folder' ? (
                    <form onSubmit={saveEdit} className="w-full" onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={styles.renameInput} onBlur={saveEdit} />
                    </form>
                  ) : (
                    <div className={styles.itemLabel}>{folder.name}</div>
                  )}
                </div>
              );
            })}

            {/* Documents */}
            {documents.map((doc, index) => {
              const st = getStatusInfo(doc.status);
              const isSelected = selectedItems.has(doc.id);
              const isPhaseLocked = doc.phase?.status === "COMPLETED";
              const canEdit = userRole === "ADMIN" ? true : (!isReadOnly && !isPhaseLocked);

              return (
                <div 
                  key={`doc-${doc.id}-${index}`} 
                  className={`${styles.docItem} ${isSelected ? styles.selected : ''}`}
                  onClick={(e) => toggleSelect(e, doc.id)}
                  onDoubleClick={() => handleDownloadDoc(doc)}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, doc, 'doc')}
                  onDragEnd={handleDragEnd}
                  title={doc.name}
                >
                  <div className={`${styles.docStatusDot} ${st.dotClass}`} title="Status de aprovação" />
                  {isPhaseLocked && (
                    <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.75rem' }} title="Travado pela Etapa Concluída">🔒</div>
                  )}
                  
                  <div className={styles.itemActions}>
                    <button onClick={(e) => downloadFile(e, doc.fileUrl, doc.name)} className={`${styles.actionBtn} ${styles.downloadBtn}`} title="Baixar">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </button>
                    {canEdit && (
                      <>
                      <button onClick={(e) => openEditInput(e, doc, 'doc')} className={styles.actionBtn} title="Renomear">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={(e) => handleDeleteItem(e, doc.id, 'doc')} className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Excluir">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                      </>
                    )}
                  </div>

                  <div className={styles.docIcon}>{getExtensionIcon(doc.extension)}</div>
                  
                  {editingItem?.id === doc.id && editingItem?.type === 'doc' ? (
                    <form onSubmit={saveEdit} style={{ width: '100%' }} onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={styles.renameInput} onBlur={saveEdit} />
                    </form>
                  ) : (
                    <div className={styles.itemLabel}>{doc.name}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals for Create/Upload */}
      {isNewFolderModalOpen && (
        <div className={styles.internalOverlay} onClick={() => setIsNewFolderModalOpen(false)}>
          <div className={styles.internalModal} onClick={e => e.stopPropagation()}>
            <div className={styles.internalModalHeader}>
              <h3>Nova Pasta</h3>
            </div>
            <form onSubmit={createFolder}>
              <div className={styles.internalModalBody}>
                <div>
                  <label className={styles.fieldLabel}>Nome da Pasta</label>
                  <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className={styles.fieldInput} autoFocus required />
                </div>
              </div>
              <div className={styles.internalModalFooter}>
                <button type="button" onClick={() => setIsNewFolderModalOpen(false)} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnSubmit}>Criar Pasta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className={styles.internalOverlay} onClick={() => setIsUploadModalOpen(false)}>
          <div className={styles.internalModal} onClick={e => e.stopPropagation()}>
            <div className={styles.internalModalHeader}>
              <h3>Enviar Arquivo</h3>
            </div>
            <form onSubmit={handleUpload}>
              <div className={styles.internalModalBody}>
                <div>
                  <label className={styles.fieldLabel}>Arquivo</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files[0])} className={styles.fieldInput} style={{ padding: '8px 10px' }} required />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Justificativa / Versão</label>
                  <textarea value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} className={styles.fieldTextarea} />
                </div>
              </div>
              <div className={styles.internalModalFooter}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnSubmit}>Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLogsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLogsModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 className={styles.modalTitle}>Trilha de Auditoria (Audit Log)</h2>
            {loadingLogs ? <p style={{ color: '#fff' }}>Carregando log...</p> : (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.length === 0 && <p style={{ color: '#aaa' }}>Nenhum log de manipulação encontrado.</p>}
                {auditLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                    <span style={{ color: '#FFF' }}>
                      <strong style={{ color: '#60A5FA' }}>{log.user.name} ({log.user.role})</strong> {log.action.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 'bold' }}>{log.targetName}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.modalActions}>
              <button onClick={() => setShowLogsModal(false)} className={styles.btnSecondary}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
