import React from 'react';

const RestrictedAccess: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <h1 className="text-2xl font-bold mb-4 text-gray-800">Acceso restringido</h1>
    <p className="text-gray-600 mb-2">Tu usuario no tiene acceso a esta sección.</p>
    <p className="text-gray-400">Si crees que esto es un error, contacta a un administrador.</p>
  </div>
);

export default RestrictedAccess;
