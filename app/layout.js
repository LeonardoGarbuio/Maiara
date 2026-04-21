import "./globals.css";

export const metadata = {
  title: "Tia Mai | Sistema Gestor de Projetos",
  description:
    "Sistema de gestão de projetos de arquitetura e interiores — Maiara Garbuio Arquitetura. Controle de equipe, prazos, documentos e finanças.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
