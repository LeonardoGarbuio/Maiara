"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Create Modal State
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [newReqProjectId, setNewReqProjectId] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [checklistsArr, setChecklistsArr] = useState([""]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/change-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
    }
  }

  useEffect(() => {
    // 🔒 Verificação real do papel do usuário
    const stored = localStorage.getItem("tiamai_user");
    if (stored) {
      const userData = JSON.parse(stored);
      setCurrentUser(userData);
      setIsAdmin(userData.role === "ADMIN");
    }
    fetchRequests();
    fetchProjects();
  }, []);

  const handleAddChecklistField = () => {
    setChecklistsArr([...checklistsArr, ""]);
  };

  const updateChecklistField = (index, value) => {
    const newArr = [...checklistsArr];
    newArr[index] = value;
    setChecklistsArr(newArr);
  };

  const createChangeRequest = async (e) => {
    e.preventDefault();
    try {
      const validChecklists = checklistsArr.filter(c => c.trim().length > 0);
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newReqProjectId || null,
          description: newReqDesc,
          checklists: validChecklists
        })
      });

      if (res.ok) {
        setIsNewRequestModalOpen(false);
        setNewReqDesc("");
        setChecklistsArr([""]);
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleChecklistStatus = async (itemId, currentStatus) => {
    try {
      await fetch(`/api/change-requests/update-checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Fake route format, we'll use the ID route since that's what we mapped
      });
      // Actually, we mapped /api/change-requests/[id]/route.js with PUT accepting checklistItems.
      // Easiest is to send the individual update:
      const reqId = requests.find(r => r.checklists.some(c => c.id === itemId)).id;
      
      const res = await fetch(`/api/change-requests/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItems: [{ id: itemId, isCompleted: !currentStatus }]
        })
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markRequestAsCompleted = async (reqId) => {
    try {
      const res = await fetch(`/api/change-requests/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DONE"
        })
      });

      if (res.ok) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Controle de Alterações</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie pedidos de mudança, histórico e checklists para a equipe aprovar novos arquivos.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors font-medium flex items-center gap-2"
            >
              ⚠️ Solicitar Nova Alteração (Admin)
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center py-10">Carregando histórico de alterações...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-[#1e1e1e] border border-[#333] rounded-lg">
            <p className="text-gray-500">Nenhum pedido de mudança registrado.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className={`p-5 rounded-lg border ${req.status === 'DONE' ? 'bg-[#152015] border-green-900/50' : 'bg-[#1e1e1e] border-[#3a2020]'}`}>
              <div className="flex items-start justify-between border-b border-[#333] pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">Solicitação de Mudança</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${req.status === 'DONE' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'}`}>
                      {req.status === 'DONE' ? 'Finalizado' : 'Em Andamento'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 flex gap-4">
                    <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                    <span>Admin: {req.admin?.name || "Desconhecido"}</span>
                    {req.project?.name && <span className="font-medium text-blue-400">Projeto: {req.project.name}</span>}
                  </div>
                </div>
                {req.status !== 'DONE' && (
                  <button 
                    onClick={() => markRequestAsCompleted(req.id)}
                    className="px-3 py-1 bg-green-700/50 hover:bg-green-600 text-green-100 rounded text-sm transition-colors border border-green-700"
                  >
                    Marcar como Resolvido
                  </button>
                )}
              </div>
              
              <div className="p-4 bg-[#111] rounded mb-4 text-gray-300 whitespace-pre-wrap border border-[#222]">
                <span className="font-bold text-white block mb-2">Comentários / Motivo:</span>
                {req.description}
              </div>

              {req.checklists?.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2 ml-1 text-sm">Checklist de Aprovação e Reenvio:</h4>
                  <div className="flex flex-col gap-2">
                    {req.checklists.map(check => (
                      <label key={check.id} className="flex items-center gap-3 p-3 bg-[#252525] hover:bg-[#2a2a2a] rounded cursor-pointer border border-[#333]">
                        <input 
                          type="checkbox" 
                          checked={check.isCompleted} 
                          onChange={() => toggleChecklistStatus(check.id, check.isCompleted)}
                          className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                        />
                        <span className={`${check.isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}>{check.taskDescription}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-red-500">Registrar Alteração do Cliente</h2>
            <form onSubmit={createChangeRequest}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Projeto Afetado (Opcional)</label>
                <select 
                  value={newReqProjectId} 
                  onChange={e => setNewReqProjectId(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded p-2 text-white outline-none mb-4"
                >
                  <option value="">Selecione um projeto para atrelar...</option>
                  {projectsList?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <label className="block text-sm text-gray-400 mb-1">Motivo / Descrição da Correção</label>
                <textarea 
                  value={newReqDesc} 
                  onChange={e => setNewReqDesc(e.target.value)} 
                  placeholder="Ex: Cliente ligou agora e mandou alterar o piso da sala. Ver PDF enviado por email."
                  required
                  className="w-full bg-[#111] border border-[#333] rounded p-2 text-white outline-none resize-none h-24 mb-4" 
                />

                <label className="block text-sm font-bold text-gray-300 mb-2 border-b border-[#333] pb-2">Checklist da Etapa (Para Estagiário marcar)</label>
                {checklistsArr.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={item} 
                      onChange={(e) => updateChecklistField(i, e.target.value)} 
                      placeholder={`Subtarefa ${i + 1} (Ex: Atualizar render DWG)`}
                      className="w-full bg-[#111] border border-[#333] rounded p-2 text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                ))}
                <button type="button" onClick={handleAddChecklistField} className="text-sm text-blue-400 mt-1 hover:underline">
                  + Adicionar mais um item
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsNewRequestModalOpen(false)} className="px-4 py-2 bg-transparent text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium">Cadastrar Alerta</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
