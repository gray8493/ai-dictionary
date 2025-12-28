'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Eye, Crown, Lock, Unlock, Copy } from 'lucide-react';

interface User {
  user_id: string;
  full_name: string | null;
  avatar_id: number | null;
  is_pro: boolean;
  xp: number;
  level: number;
  status: string;
  role: string | null;
  created_at: string;
  updated_at: string;
}

interface ContextMenu {
  x: number;
  y: number;
  user: User;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const router = useRouter();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user);
    if (!user) {
      console.log('No user, redirect to /auth');
      router.push('/auth');
      return;
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Profile:', profile, 'Error:', error);
    if (error || profile?.role !== 'admin') {
      console.log('Not admin, redirect to /');
      router.push('/');
      return;
    }

    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action }),
    });

    if (response.ok) {
      fetchUsers();
    } else {
      alert('Lỗi khi thực hiện hành động');
    }
    setContextMenu(null);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user_id',
      header: 'User ID',
    },
    {
      accessorKey: 'full_name',
      header: 'Tên đầy đủ',
    },
    {
      accessorKey: 'level',
      header: 'Level',
    },
    {
      accessorKey: 'xp',
      header: 'XP',
    },
    {
      accessorKey: 'is_pro',
      header: 'Pro',
      cell: ({ getValue }) => getValue() ? <Crown className="text-amber-500" size={16} /> : <span className="text-slate-400">Free</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
    },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesPlan = planFilter === 'All' || (planFilter === 'Pro' ? user.is_pro : !user.is_pro);
      return matchesStatus && matchesRole && matchesPlan;
    });
  }, [users, statusFilter, roleFilter, planFilter]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleRightClick = (e: React.MouseEvent, user: User) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      user,
    });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex shrink-0 z-20">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-tight">VocaAI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="#">
            <span className="material-symbols-outlined text-[22px] group-hover:text-primary">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400 transition-colors" href="#">
            <span className="material-symbols-outlined filled text-[22px]">group</span>
            <span className="text-sm font-medium">Users</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="#">
            <span className="material-symbols-outlined text-[22px] group-hover:text-primary">library_books</span>
            <span className="text-sm font-medium">Content</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="#">
            <span className="material-symbols-outlined text-[22px] group-hover:text-primary">analytics</span>
            <span className="text-sm font-medium">Analytics</span>
          </a>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</p>
          </div>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="#">
            <span className="material-symbols-outlined text-[22px] group-hover:text-primary">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="#" onClick={async () => {
             await supabase.auth.signOut();
             router.push('/auth');
           }}>
            <span className="material-symbols-outlined text-[22px] group-hover:text-red-500">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-slate-200"></div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* Top Navigation (Mobile) */}
        <header className="lg:hidden flex h-16 items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-bold">VocaAI</span>
          </div>
          <div className="size-8 rounded-full bg-slate-200"></div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
            {/* Page Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage, view, and edit all registered users.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="hidden sm:flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">file_upload</span>
                  Export
                </button>
                <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-bold shadow-sm shadow-blue-500/30 transition-all">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Add New User
                </button>
              </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Search */}
              <div className="relative w-full lg:w-96 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input
                  value={globalFilter ?? ''}
                  onChange={(event) => setGlobalFilter(String(event.target.value))}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Search by name, email..."
                  type="text"
                />
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <option value="All">Status: All</option>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <option value="All">Role: All</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <option value="All">Plan: All</option>
                  <option value="Pro">Pro</option>
                  <option value="Free">Free</option>
                </select>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setRoleFilter('All');
                    setPlanFilter('All');
                  }}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg text-slate-500 hover:text-red-500 text-sm font-medium transition-colors ml-auto lg:ml-0"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Data Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="p-4 w-12">
                        <input className="rounded border-slate-300 text-primary focus:ring-primary bg-white dark:bg-slate-800 dark:border-slate-600" type="checkbox"/>
                      </th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">User</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registration Date</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.original.user_id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onContextMenu={(e) => handleRightClick(e, row.original)}>
                        <td className="p-4">
                          <input className="rounded border-slate-300 text-primary focus:ring-primary bg-white dark:bg-slate-800 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" type="checkbox"/>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${row.original.avatar_id ? `/avatar/avatar${row.original.avatar_id}.png` : '/avatar/avatar1.png'})` }}></div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.original.full_name || row.original.user_id}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">ID: {row.original.user_id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit border ${row.original.role === 'admin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-100 dark:border-purple-800' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                            <span className="material-symbols-outlined text-[16px]">{row.original.role === 'admin' ? 'shield_person' : 'person'}</span>
                            <span className="text-xs font-medium">{row.original.role === 'admin' ? 'Admin' : 'User'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${row.original.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-100 dark:border-rose-800'}`}>
                            <span className={`size-1.5 rounded-full ${row.original.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {row.original.status === 'active' ? 'Active' : 'Locked'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(row.original.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors" title="Edit User" onClick={() => setSelectedUser(row.original)}>
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="More Actions" onClick={(e) => handleRightClick(e, row.original)}>
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredUsers.length)} of {filteredUsers.length} results</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => setSelectedUser(contextMenu.user)}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Eye size={16} />
              Xem chi tiết
            </button>
            <button
              onClick={() => handleUserAction(contextMenu.user.user_id, 'toggle_pro')}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Crown size={16} />
              {contextMenu.user.is_pro ? 'Hủy Pro' : 'Cấp Pro'}
            </button>
            <button
              onClick={() => handleUserAction(contextMenu.user.user_id, contextMenu.user.status === 'locked' ? 'unlock' : 'lock')}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {contextMenu.user.status === 'locked' ? <Unlock size={16} /> : <Lock size={16} />}
              {contextMenu.user.status === 'locked' ? 'Mở khóa' : 'Khóa'}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(contextMenu.user.user_id)}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Copy size={16} />
              Copy User ID
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chi tiết Người dùng</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* User Info */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full bg-cover bg-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg ring-2 ring-slate-100 dark:ring-slate-700" style={{ backgroundImage: `url(${selectedUser.avatar_id ? `/avatar/avatar${selectedUser.avatar_id}.png` : '/avatar/avatar1.png'})` }}></div>
                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online"></span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.full_name || 'User'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">ID: {selectedUser.user_id.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-full">#{selectedUser.user_id.slice(-6)}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${selectedUser.is_pro ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      <span className="material-symbols-outlined text-[14px]">{selectedUser.is_pro ? 'verified' : 'person'}</span> {selectedUser.is_pro ? 'Pro Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Level Hiện Tại</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.level}</span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Top 5%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Tổng XP</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.xp}</span>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">XP</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Chuỗi Ngày</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">45</span>
                      <span className="text-xs font-medium text-orange-500 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">local_fire_department</span> ngày
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">AI Credits</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">200</span>
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">bolt</span> Free
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Thông tin Tài khoản</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên hiển thị</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary focus:ring-primary focus:ring-2 rounded-lg text-sm px-4 py-2.5 text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500" type="text" defaultValue={selectedUser.full_name || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary focus:ring-primary focus:ring-2 rounded-lg text-sm px-4 py-2.5 text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500" type="email" defaultValue="" placeholder="Email not available" disabled />
                    </div>
                    <button className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 dark:focus:ring-slate-700">
                      <span className="material-symbols-outlined text-lg">lock_reset</span>
                      Gửi email đặt lại mật khẩu
                    </button>
                  </div>
                </div>

                {/* Pro Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quản lý Gói Pro</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Trạng thái Pro</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Hết hạn: {selectedUser.is_pro ? '12/10/2024' : 'N/A'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        checked={selectedUser.is_pro}
                        onChange={() => handleUserAction(selectedUser.user_id, 'toggle_pro')}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUserAction(selectedUser.user_id, selectedUser.status === 'locked' ? 'unlock' : 'lock')}
                  className="flex-[2] py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-opacity shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}