import React, { useState } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';

export const CompanySettingsView: React.FC = () => {
  const { data, loading, error, save } = useCompanySettings();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await save(form);
      setSuccess(true);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="p-8">Cargando datos de empresa...</div>;
  if (error) return <div className="p-8 text-red-600">Error cargando datos de empresa.</div>;
  if (!form) return <div className="p-8">No hay datos de empresa.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Empresa</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Datos generales */}
        <div>
          <h3 className="font-semibold mb-2">Datos generales</h3>
          <div className="flex items-center gap-4 mb-4">
            <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded bg-white border object-contain" />
            <input
              type="text"
              name="logo_url"
              value={form.logo_url || ''}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
              placeholder="URL del logo"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="company_name" value={form.company_name || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Nombre comercial" />
            <input type="text" name="legal_name" value={form.legal_name || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Razón social" />
            <input type="text" name="cuit" value={form.cuit || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="CUIT" />
          </div>
        </div>
        {/* Contacto */}
        <div>
          <h3 className="font-semibold mb-2">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="phone" value={form.phone || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Teléfono" />
            <input type="email" name="email" value={form.email || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Email" />
            <input type="text" name="website" value={form.website || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Sitio web" />
          </div>
        </div>
        {/* Dirección */}
        <div>
          <h3 className="font-semibold mb-2">Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="address" value={form.address || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Dirección" />
            <input type="text" name="city" value={form.city || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Ciudad" />
            <input type="text" name="province" value={form.province || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Provincia" />
            <input type="text" name="postal_code" value={form.postal_code || ''} onChange={handleChange} className="border rounded px-2 py-1" placeholder="Código Postal" />
          </div>
        </div>
        {/* Ticket / branding */}
        <div>
          <h3 className="font-semibold mb-2">Ticket / Branding</h3>
          <textarea
            name="ticket_footer"
            value={form.ticket_footer || ''}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full min-h-[60px]"
            placeholder="Pie de ticket"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded font-bold disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
        {success && <div className="text-green-600 font-semibold text-right">¡Cambios guardados!</div>}
      </form>
    </div>
  );
};
