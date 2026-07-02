import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="min-h-screen lg:pl-64">
        <AdminTopbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
