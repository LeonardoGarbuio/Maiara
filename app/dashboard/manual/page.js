"use client";

import { useEffect, useState } from "react";
import styles from "./manual.module.css";

export default function ManualPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("tiamai_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  if (!user) return <div className={styles.page}>Carregando manual...</div>;

  const isAdminOrLeader = ["ADMIN", "LEAD_ARCHITECT"].includes(user.role);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manual do Sistema</h1>
          <p className={styles.subtitle}>
            Guia rápido de uso para {isAdminOrLeader ? "Diretoria" : "Equipe"}
          </p>
        </div>
        <button 
          className={styles.printBtn} 
          onClick={() => window.print()}
          title="Salvar como PDF ou Imprimir"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Salvar PDF
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Primeiros Passos</h2>
        <p className={styles.text}>
          Bem-vindo(a) à plataforma de gestão do escritório **Maiara Garbuio — Arquitetura e Interiores**. O sistema foi desenhado para simplificar o acompanhamento de projetos e centralizar os arquivos.
        </p>
        {isAdminOrLeader ? (
          <p className={styles.text}>
            Como Líder, o seu painel exibe relatórios financeiros globais, lucros do mês, atestados pendentes de aprovação e métricas gerais de saúde do escritório.
          </p>
        ) : (
          <p className={styles.text}>
            No seu painel, você verá um resumo rápido dos Projetos Ativos que você deve dar atenção e tem atalhos para visualizar arquivos e justificar faltas.
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Gestão de Projetos e Etapas</h2>
        <p className={styles.text}>
          Na aba "Projetos", a evolução de cada obra funciona através de "Semáforos" (bolinhas indicadoras):
        </p>
        <ul className={styles.list}>
          <li><strong>Cinza (Pendente):</strong> A etapa ainda não começou.</li>
          <li><strong>Amarelo (Em Andamento):</strong> Sinaliza para a equipe que alguém está trabalhando naqueles arquivos agora.</li>
          <li><strong>Verde (Concluído):</strong> Ao finalizar a etapa, você deverá fornecer uma justificativa formal do que foi feito.</li>
        </ul>

        <div className={styles.alert}>
          <div className={styles.alertTitle}>⚠️ Atenção Crítica (Bloqueio)</div>
          <div className={styles.alertText}>
            Ao concluir (Verde) uma etapa, a respectiva pasta no Drive Explorer daquele projeto será <strong>trancada</strong> para edições. Ninguém da equipe poderá deletar ou enviar novos arquivos para essa etapa. Apenas a Diretoria poderá reabrir o acesso caso precise de refação.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Drive Explorer (Arquivos e Pastas)</h2>
        <p className={styles.text}>
          O sistema gera e organiza pastas automaticamente para cada novo projeto. Diga adeus à bagunça de arquivos no computador local:
        </p>
        <ul className={styles.list}>
          <li>Para enviar Plantas, PDFs e Renders 3D, basta abrir o "Drive" de um projeto.</li>
          <li>Você pode criar sub-pastas livremente.</li>
          <li>Todas as ações no Drive ficam registradas na aba "Logs" para auditoria, prevenindo a perda acidental de arquivos.</li>
        </ul>
      </div>

      {isAdminOrLeader && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Controle Financeiro (Restrito)</h2>
          <p className={styles.text}>
            O módulo "Financeiro" é visível apenas para a liderança.
          </p>
          <ul className={styles.list}>
            <li><strong>Entradas e Saídas:</strong> Todos os lançamentos geram gráficos automáticos e comparações percentuais com os lucros do mês anterior.</li>
            <li><strong>Custos Extras e Prejuízos:</strong> Se um vidro quebrar na obra, a conta não deve sumir. Existe um botão de "Registrar Prejuízo" dentro da página de cada Projeto específico, que debita automaticamente esse valor do faturamento geral (Apenas Administrador).</li>
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Atestados e Faltas</h2>
        <p className={styles.text}>
          Problemas de saúde ou provas na faculdade? O fluxo agora é 100% digital:
        </p>
        <ul className={styles.list}>
          <li><strong>Equipe:</strong> Clique em "Atestados", faça upload da foto do documento, escreva o motivo e selecione a data.</li>
          <li><strong>Liderança:</strong> O atestado aparecerá na aba "Atestados Pendentes" onde você poderá validar (Aprovar) ou rejeitar o envio.</li>
        </ul>
      </div>

      <div className={`${styles.alert} ${styles.alertInfo}`}>
        <div className={styles.alertTitle}>💡 Dica da Plataforma</div>
        <div className={styles.alertText}>
          Use o botão "Salvar PDF" no topo desta tela a qualquer momento para imprimir este manual ou salvar uma cópia para enviar no WhatsApp.
        </div>
      </div>
    </div>
  );
}
