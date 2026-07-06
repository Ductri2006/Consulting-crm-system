import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc,#eef2f7)]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="min-h-screen lg:pl-64">
        <AdminTopbar
          isMenuOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
