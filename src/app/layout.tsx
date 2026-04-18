import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import StatusIndicator from "@/components/StatusIndicator";

export const metadata: Metadata = {
  title: "ID Card Manager",
  description: "Manage 30+ Schools ID Cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">Bizera<span className="text-gray-800">ID</span></h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4">Daily Operations</div>
            <Link href="/" className="block px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-sm transition-colors">
              Data Injection (Upload)
            </Link>
            <Link href="/students" className="block px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-sm transition-colors">
              Student Directory
            </Link>

            <div className="mt-6 mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Super Admin</div>
            <Link href="/schools" className="block px-4 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-medium text-sm transition-colors">
              Schools Management
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">System Status</div>
            <StatusIndicator />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          {children}
        </main>
      </body>
    </html>
  );
}