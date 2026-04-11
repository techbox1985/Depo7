import React, { useEffect, useState } from 'react';
import { customersService } from '../../services/customersService';
import CustomerFormModal from './CustomerFormModal';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <button className="mb-4 px-4 py-2 rounded bg-indigo-600 text-white font-bold" onClick={() => { setEditing(null); setModalOpen(true); }}>Nuevo cliente</button>
      {loading ? <div>Cargando...</div> : (
        <table className="w-full text-sm bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2">
                  <button className="mr-2 text-blue-600" onClick={() => { setEditing(c); setModalOpen(true); }}>Editar</button>
                  <button className="text-red-600" onClick={() => handleDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <CustomerFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} />
    </div>
  );
};

export default CustomersView;
