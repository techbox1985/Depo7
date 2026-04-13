import React, { useState } from 'react';
import { UserProfile } from '../../types';

const roles = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Admin' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'chofer', label: 'Chofer' },
];

export default function EditStaffModal({ user, onClose, onSave }: {
  user: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}) {
  const [full_name, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [notes, setNotes] = useState(user.notes || '');
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(!!user.active);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ full_name, phone, notes, role, active });
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div className="modal" style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400 }}>
        <h3>Editar usuario</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Nombre<br/>
            <input value={full_name} onChange={e => setFullName(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Teléfono<br/>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Notas<br/>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Rol<br/>
            <select value={role} onChange={e => setRole(e.target.value as UserProfile['role'])} style={{ width: '100%' }}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Activo
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
