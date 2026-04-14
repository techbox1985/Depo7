

import React, { useState, useMemo } from 'react';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { UserProfile } from '../../types';
import EditStaffModal from './EditStaffModal.tsx';

import { User2, UserCog, UserCheck, User, Briefcase, Key, Users, UserX, Edit2 } from 'lucide-react';

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  vendedor: 'Vendedor',
  oficina: 'Oficina',
  cajero: 'Cajero',
  chofer: 'Chofer',
};
const roleOrder = ['superadmin', 'admin', 'vendedor', 'oficina', 'cajero', 'chofer'];
const roleIcons: Record<string, any> = {
  superadmin: Key,
  admin: UserCog,
  vendedor: UserCheck,
  oficina: Briefcase,
  cajero: User,
  chofer: User2,
};
const badgeColors: Record<string, string> = {
  superadmin: 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200',
  vendedor: 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200',
  oficina: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200',
  cajero: 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 border-pink-200',
  chofer: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200',
};

function RoleBadge({ role }: { role: string }) {
  const Icon = roleIcons[role] || User;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColors[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      <Icon size={14} className="opacity-70" />
      {roleLabels[role] || role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>Inactivo
    </span>
  );
}

export default function StaffView() {
  const { profiles, loading, error, saveProfile } = useUserProfiles();
  const { profile, refetchProfile } = useCurrentUserProfile();
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // KPIs
  const kpis = useMemo(() => {
    const total = profiles.length;
    const counts: Record<string, number> = {
      superadmin: 0, admin: 0, vendedor: 0, oficina: 0, cajero: 0, chofer: 0, inactivos: 0
    };
    profiles.forEach((u) => {
      if (!u.active) counts.inactivos++;
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return { total, ...counts };
  }, [profiles]);

  // Filtros
  const filtered = useMemo(() => {
    return profiles.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'activo' && !u.active) return false;
      if (statusFilter === 'inactivo' && u.active) return false;
      return true;
    });
  }, [profiles, roleFilter, statusFilter]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff</h1>
          <p className="text-gray-500 text-base mt-1">Gestión de usuarios internos y roles del sistema.</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold shadow-sm hover:bg-indigo-100 transition disabled:opacity-60"
          disabled
        >
          <UserPlusIcon />
          Agregar usuario
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mb-12">
        <KpiCard label="Total staff" value={kpis.total} icon={<Users className="text-indigo-400" size={28} />} />
        <KpiCard label="Superadmins" value={kpis.superadmin} icon={<Key className="text-purple-400" size={28} />} />
        <KpiCard label="Admins" value={kpis.admin} icon={<UserCog className="text-blue-400" size={28} />} />
        <KpiCard label="Vendedores" value={kpis.vendedor} icon={<UserCheck className="text-green-400" size={28} />} />
        <KpiCard label="Oficina" value={kpis.oficina} icon={<Briefcase className="text-yellow-400" size={28} />} />
        <KpiCard label="Cajeros" value={kpis.cajero} icon={<User className="text-pink-400" size={28} />} />
        <KpiCard label="Choferes" value={kpis.chofer} icon={<User2 className="text-gray-400" size={28} />} />
        <KpiCard label="Inactivos" value={kpis.inactivos} icon={<UserX className="text-red-400" size={28} />} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-6 mb-8 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Rol</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100">
            <option value="">Todos</option>
            {roleOrder.map((role) => (
              <option key={role} value={role}>{roleLabels[role]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100">
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Listado tipo dashboard */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full">
        <div className="grid grid-cols-14 gap-0 bg-gray-50 px-8 py-3 border-b border-gray-100">
          <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</div>
          <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Acción</div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Sin resultados</div>
        ) : filtered.map((u) => (
          <div key={u.id} className="grid grid-cols-14 gap-0 items-center px-8 py-4 border-b border-gray-50 hover:bg-gray-50 transition">
            <div className="col-span-3 font-medium text-gray-900 truncate">{u.full_name}</div>
            <div className="col-span-3 text-gray-700 truncate" title={u.email}>{u.email}</div>
            <div className="col-span-2"><RoleBadge role={u.role} /></div>
            <div className="col-span-2 text-gray-700 truncate">{u.phone}</div>
            <div className="col-span-2"><StatusBadge active={u.active} /></div>
            <div className="col-span-2 flex justify-center">
              <button
                className="flex items-center gap-1 px-3 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold shadow-sm transition"
                onClick={() => setEditUser(u)}
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editUser && (
        <EditStaffModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (updates: Partial<UserProfile>) => {
            await saveProfile(editUser.id, updates);
            // Si el usuario editado es el autenticado, forzar refetch global
            if (editUser.id === profile?.id) {
              await refetchProfile();
            }
            setEditUser(null);
          }}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col items-center group hover:shadow-xl transition">
      <div className="mb-2">{icon}</div>
      <div className="text-3xl font-extrabold text-gray-900 mb-1">{value}</div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 1 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 8v-4m0 0v4m0-4h4m-4 0h-4" /></svg>
  );
}
