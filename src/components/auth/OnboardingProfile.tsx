import React, { useState } from 'react';
import { updateUserProfile } from '../../services/userProfilesService';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { useNavigate } from 'react-router-dom';
import { useCompanySettingsHeader } from '../../hooks/useCompanySettingsHeader';
import { OnlineStatusIndicator } from '../OnlineStatusIndicator';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const OnboardingProfile: React.FC = () => {
  const { profile, loading, refetchProfile } = useCurrentUserProfile();
  const navigate = useNavigate();
  const { company } = useCompanySettingsHeader();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);


  if (loading) return null;
  if (!profile) return null;
  // Si el perfil ya está completo, redirigir fuera de onboarding
  if (profile.full_name && profile.phone && profile.role) {
    setTimeout(() => {
      if (profile.role === 'superadmin') {
        navigate('/', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/', { replace: true });
      } else if (profile.role === 'oficina') {
        navigate('/', { replace: true });
      } else if (profile.role === 'vendedor') {
        navigate('/catalog', { replace: true });
      } else if (profile.role === 'cliente') {
        navigate('/catalog', { replace: true });
      } else if (profile.role === 'cajero') {
        navigate('/', { replace: true });
      } else if (profile.role === 'chofer') {
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 0);
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!phone.trim() || phone.length < 6) {
      setError('El teléfono es obligatorio y debe ser válido.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(profile.id, { full_name: fullName, phone });
      await refetchProfile();
      setSuccess(true);
      setTimeout(() => {
        if (profile.role === 'vendedor') {
          navigate('/catalog', { replace: true });
        } else if (profile.role === 'chofer') {
          navigate('/catalog', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 500);
    } catch (e) {
      setError('Error al guardar los datos.');
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center mb-8">
        <img
          src={company?.logo_url || 'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg'}
          alt="Logo"
          className="h-20 w-20 object-contain rounded mb-2 bg-white border"
        />
        <div className="text-2xl font-bold text-gray-900 mb-1">{company?.company_name || 'Depo7'}</div>
        <OnlineStatusIndicator />
      </div>
      <form className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6" onSubmit={handleSave}>
        <h1 className="text-2xl font-bold text-gray-900">Completa tu perfil</h1>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 text-sm font-bold">{error}</div>}
        {success === true && <div className="text-green-600 text-sm font-bold">¡Perfil actualizado!</div>}
        <Button type="submit" variant="primary" isLoading={saving} className="w-full">Guardar y continuar</Button>
      </form>
    </div>
  );
};

export default OnboardingProfile;
