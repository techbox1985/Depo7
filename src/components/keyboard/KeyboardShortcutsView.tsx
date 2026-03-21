import React from 'react';

export const KeyboardShortcutsView: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Atajos de Teclado</h1>
      
      <div className="grid gap-6">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">General</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex justify-between"><span>Esc</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Cerrar ventana o modal</span></li>
            <li className="flex justify-between"><span>Tab</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Mover foco</span></li>
            <li className="flex justify-between"><span>Shift + Tab</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Retroceder foco</span></li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Punto de Venta</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex justify-between"><span>Enter</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Confirmar / agregar</span></li>
            <li className="flex justify-between"><span>+ / -</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Cambiar cantidad</span></li>
            <li className="flex justify-between"><span>Delete</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Eliminar ítem seleccionado</span></li>
            <li className="flex justify-between"><span>F2</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Cobrar</span></li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tablas / Listados</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex justify-between"><span>Flechas</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Navegar filas</span></li>
            <li className="flex justify-between"><span>Enter</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">Editar / abrir</span></li>
          </ul>
        </section>
      </div>
    </div>
  );
};
