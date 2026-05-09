import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TÁTICA CONCURSO - Simulados Militares",
  description: "Plataforma de simulados para concursos militares e promoção PMMT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-black text-white">
        <header className="bg-accent border-b border-yellow-600 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">
              TÁTICA CONCURSO
            </h1>
            <nav className="flex gap-4">
              <a href="/dashboard" className="text-yellow-500 hover:text-yellow-400">
                Dashboard
              </a>
              <a href="/simulado" className="text-yellow-500 hover:text-yellow-400">
                Simulado
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-accent border-t border-yellow-600 p-4 text-center">
          <p className="text-yellow-600 text-sm">
            © 2024 TÁTICA CONCURSO - Sistema de Simulados Militares
          </p>
        </footer>
      </body>
    </html>
  );
}