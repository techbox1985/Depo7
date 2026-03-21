import React from 'react';
import { Keyboard } from 'lucide-react';

export const ShortcutsView: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4">
        <p className="text-amber-700 text-sm">
          Esta pantalla muestra los atajos previstos del sistema. Algunos pueden estar aún en implementación.
        </p>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <Keyboard className="h-8 w-8 text-indigo-600" />
        Atajos de Teclado
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">GENERAL</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between"><span className="font-medium">Esc</span> <span>Cerrar ventana o modal</span></li>
            <li className="flex justify-between"><span className="font-medium">Tab</span> <span>Mover foco</span></li>
            <li className="flex justify-between"><span className="font-medium">Shift + Tab</span> <span>Retroceder foco</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">PUNTO DE VENTA</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between"><span className="font-medium">Enter</span> <span>Confirmar / agregar</span></li>
            <li className="flex justify-between"><span className="font-medium">+ / -</span> <span>Cambiar cantidad</span></li>
            <li className="flex justify-between"><span className="font-medium">Delete</span> <span>Eliminar ítem</span></li>
            <li className="flex justify-between"><span className="font-medium text-indigo-600">F2</span> <span>Cobrar (Activo)</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">TABLAS / LISTADOS</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between"><span className="font-medium">Flechas</span> <span>Navegar filas</span></li>
            <li className="flex justify-between"><span className="font-medium">Enter</span> <span>Editar / abrir</span></li>
          </ul>
        </section>
      </div>
    </div>
  );
};
