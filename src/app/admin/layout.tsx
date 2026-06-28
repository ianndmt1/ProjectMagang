import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import { LayoutDashboard, Package, Bug } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Kelola Produk", icon: Package },
  { href: "/admin/penyakit", label: "Kelola Penyakit", icon: Bug },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check sepenuhnya ditangani oleh src/middleware.ts
  // Layout ini hanya bertanggung jawab untuk tampilan

  return (
    <div className="flex min-h-screen bg-cream-soft">
      {/* SIDEBAR */}
      <aside className="flex w-64 flex-shrink-0 flex-col bg-dark-green text-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <span className="text-2xl">🌸</span>
          <div>
            <h2 className="text-base font-bold leading-tight">Bakoel Admin</h2>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 px-3 py-4">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
