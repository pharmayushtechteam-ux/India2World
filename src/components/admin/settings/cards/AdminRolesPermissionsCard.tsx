import React, { useState } from 'react';
import { Shield, Users, UserCheck, Key, Lock, Check, CheckCircle2 } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';
import { useAdminAuth } from '../../../../context/AdminAuthContext';

interface AdminRolesPermissionsCardProps {
  settings: AdminSettingsData['adminRoles'];
  onSave: (data: AdminSettingsData['adminRoles']) => Promise<void>;
  isSaving: boolean;
}

export const AdminRolesPermissionsCard: React.FC<AdminRolesPermissionsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const { adminUser } = useAdminAuth();
  const [roles, setRoles] = useState([...settings.roles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ roles });
  };

  const getBadgeStyle = (perm: string) => {
    switch (perm) {
      case 'full':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'approval_only':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'view':
        return 'bg-blue-50 text-[#0066FF] border-blue-200';
      default:
        return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Admin Roles & Permissions
              </h2>
              <p className="text-[11px] text-slate-400">
                Role-Based Access Control (RBAC) matrix for Super Admin, Operations, Support, and Finance
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 10 of 12
          </span>
        </div>

        {/* Current Active Session Indicator */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-xs">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>{adminUser?.name || 'Administrator'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#0066FF] font-bold">
                  {adminUser?.role || 'Super Admin'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">{adminUser?.email || 'admin@india2world.com'}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authenticated Session</span>
          </span>
        </div>

        {/* Permissions Table */}
        <form id="roles-settings-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9.5px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-2 text-center">Orders</th>
                  <th className="py-2.5 px-2 text-center">Procure</th>
                  <th className="py-2.5 px-2 text-center">Warehouse</th>
                  <th className="py-2.5 px-2 text-center">Consolidate</th>
                  <th className="py-2.5 px-2 text-center">Refunds</th>
                  <th className="py-2.5 px-2 text-center">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {roles.map((r) => (
                  <tr key={r.roleId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800 leading-tight">{r.roleName}</div>
                      <div className="text-[9.5px] text-slate-400 line-clamp-1 max-w-[140px]">{r.description}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.orders)}`}>
                        {r.permissions.orders}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.procurement)}`}>
                        {r.permissions.procurement}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.warehouse)}`}>
                        {r.permissions.warehouse}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.consolidation)}`}>
                        {r.permissions.consolidation}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.refunds)}`}>
                        {r.permissions.refunds === 'approval_only' ? 'Approve' : r.permissions.refunds}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeStyle(r.permissions.settings)}`}>
                        {r.permissions.settings}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
            <strong>RBAC Enforcement:</strong> Only administrators with <strong>Super Admin</strong> authorization can modify SMTP credentials, API secret keys, and billing pricing constants.
          </div>
        </form>
      </div>

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Strict server authorization active</span>
        <button
          type="submit"
          form="roles-settings-form"
          disabled={isSaving}
          className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
