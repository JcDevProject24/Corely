import { useState, useEffect } from 'react'

interface Usuario {
  id?: number;
  nombre: string;
}

function App() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [error, setError] = useState<string | null>(null)

  // Función para pedir datos al backend
  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:8000/usuarios')
      if (!res.ok) throw new Error('Error en la respuesta de la API')
      const data = await res.json()
      setUsuarios(data)
    } catch (err) {
      setError('No se pudo conectar con el Backend')
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-extrabold text-center mb-8 bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          TFG Infrastructure
        </h1>

        {error ? (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-lg text-center mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-400 border-b border-gray-700 pb-2">
              Nombres en PostgreSQL:
            </h2>
            {usuarios.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4">
                La base de datos está vacía. ¡Añade un nombre desde la terminal!
              </p>
            ) : (
              <ul className="space-y-3">
                {usuarios.map((u) => (
                  <li key={u.id} className="bg-gray-700/50 p-4 rounded-xl flex items-center border border-gray-600">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full mr-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-lg font-semibold">{u.nombre}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={cargarUsuarios}
              className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔄 Refrescar datos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App