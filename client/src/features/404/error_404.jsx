import React from 'react'

export const Error_404 = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-6 animate-fadeIn">
      <h1 className="text-6xl font-bold text-red-500 mb-4 animate-bounce">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Página no encontrada</h2>
      <p className="text-gray-600 mb-6">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
    </div>
  )
}