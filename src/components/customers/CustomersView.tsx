import React, { useEffect, useState } from 'react';
import { customersService } from '../../services/customersService';
import CustomerFormModal from './CustomerFormModal';
import CustomerDetailModal from './CustomerDetailModal';
import { getCustomerDebt } from '../../utils/debtUtils';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setCustomers(await customersService.getCustomers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (customer) => {
    if (editing) await customersService.updateCustomer(editing.id, customer);
    else await customersService.addCustomer(customer);
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await customersService.deleteCustomer(id);
      load();
    }
  };

  return (
    <div className="p-8 w-full max-w-full mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Clientes</h1>
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-700">{customers.length}</div>
          <div className="text-gray-600">Total clientes</div>
        </div>
        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-yellow-600">{customers.filter(c => getCustomerDebt(c.debt_initial, c.total_ventas, c.total_pagos) > 0).length}</div>
          <div className="text-gray-600">Con deuda</div>
        </div>
        <div className="bg-white rounded shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-green-700">{customers.filter(c => c.location_address).length}</div>
          <div className="text-gray-600">Con ubicación</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 w-full gap-4">
        <button className="px-4 py-2 rounded bg-indigo-600 text-white font-bold shadow self-start" onClick={() => { setEditing(null); setModalOpen(true); }}>Nuevo cliente</button>
        {/* Filtros futuros aquí */}
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-sm bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Teléfono</th>
                <th className="text-left p-3">Ubicación</th>
                <th className="text-left p-3">Deuda actual</th>
                <th className="text-left p-3">Mapa</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const deudaActual = getCustomerDebt(c.debt_initial, c.total_ventas, c.total_pagos);
                return (
                  <tr key={c.id} className="hover:bg-indigo-50 cursor-pointer transition" onClick={e => {
                    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'A') return;
                    setSelectedCustomer(c);
                    setDetailOpen(true);
                  }}>
                    <td className="p-3 font-medium text-indigo-900">{c.name}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3">{c.location_address ? c.location_address : <span className="italic text-gray-400">Sin ubicación</span>}</td>
                    <td className="p-3 font-bold text-red-700">{deudaActual === 0 ? '$0' : deudaActual.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                    <td className="p-3">
                      {(c.latitude && c.longitude) ? (
                        <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" className="text-green-600 underline" onClick={e => e.stopPropagation()}>Abrir mapa</a>
                      ) : c.location_address ? (
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent(c.location_address)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 underline" onClick={e => e.stopPropagation()}>Abrir mapa</a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button className="mr-2 text-blue-600 hover:underline" onClick={e => { e.stopPropagation(); setEditing(c); setModalOpen(true); }}>Editar</button>
                      <button className="text-red-600 hover:underline" onClick={e => { e.stopPropagation(); handleDelete(c.id); }}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <CustomerFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} />
      <CustomerDetailModal customer={selectedCustomer} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
};

export default CustomersView;
