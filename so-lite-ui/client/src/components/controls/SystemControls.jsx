import React, { useState, useEffect, useContext } from "react";
import { SimulatorContext } from "../../context/SimulatorContext";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function SystemControls() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [systemState, setSystemState] = useState(null);
  const { resetState } = useContext(SimulatorContext);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus('connected');
      return response.data;
    } catch (error) {
      setApiStatus('disconnected');
      return null;
    }
  };

  const getSystemState = async () => {
    try {
      const response = await axios.get(`${API_URL}/system/state`);
      setSystemState(response.data.data);
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
    }
  };

  const resetBackend = async () => {
    if (!confirm('¿Estás seguro de reiniciar completamente el sistema?\n\nEsto eliminará:\n- Todos los procesos\n- Memoria asignada\n- Solicitudes de E/S\n- Historial de ejecución')) {
      return;
    }

    try {
      // Reinicializar el kernel
      await axios.post(`${API_URL}/kernel/initialize`, {
        memory_mode: 'paging',
        total_memory: 1024
      });

      // Limpiar estado del frontend
      resetState();
      localStorage.clear();

      alert('Sistema reiniciado completamente');
      window.location.reload();
    } catch (error) {
      console.error('Error reiniciando backend:', error);
      alert('Error al reiniciar: ' + (error.response?.data?.message || error.message));
    }
  };

  const clearFrontendState = () => {
    if (confirm('¿Limpiar el estado del frontend?\n\nEsto NO afectará el backend.')) {
      resetState();
      localStorage.clear();
      alert('Estado del frontend limpiado');
    }
  };

  useEffect(() => {
    checkHealth();
    getSystemState();

    const interval = setInterval(() => {
      checkHealth();
      if (apiStatus === 'connected') {
        getSystemState();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [apiStatus]);

  const getStatusBadge = () => {
    if (apiStatus === 'connected') {
      return {
        color: '#107C10',
        text: 'Conectado',
        bg: '#DFF6DD'
      };
    } else if (apiStatus === 'checking') {
      return {
        color: '#FFB900',
        text: 'Verificando...',
        bg: '#FFF4CE'
      };
    } else {
      return {
        color: '#A4262C',
        text: 'Desconectado',
        bg: '#FDE7E9'
      };
    }
  };

  const badge = getStatusBadge();

  return (
    <div style={{
      background: 'var(--bg-primary)',
      padding: 20,
      borderRadius: 4,
      border: '1px solid var(--border-color)',
      marginBottom: 20
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Control del Sistema
        </h3>
        
        {/* Estado de la API */}
        <div style={{
          padding: '8px 14px',
          background: badge.bg,
          borderRadius: 2,
          border: `1px solid ${badge.color}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 500,
          fontSize: 13,
          color: badge.color
        }}>
          ● {badge.text}
        </div>
      </div>

      {/* Información del sistema */}
      {systemState && (
        <div style={{
          background: 'var(--gantt-bg)',
          padding: 15,
          borderRadius: 2,
          marginBottom: 15,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 15,
            fontSize: 13
          }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '12px' }}>
                Reloj del Sistema
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                {systemState.clock || 0}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '12px' }}>
                Procesos Activos
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                {systemState.processes?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '12px' }}>
                Dispositivos E/S
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                {systemState.io_devices?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '12px' }}>
                Modo de Memoria
              </div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>
                {systemState.memory?.mode || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de control */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: 15
      }}>
        <button
          onClick={checkHealth}
          style={{
            padding: '10px 14px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13,
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#1565c0'}
          onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
        >
          Verificar Conexión
        </button>

        <button
          onClick={clearFrontendState}
          style={{
            padding: '10px 14px',
            background: '#ffc107',
            color: '#333',
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13,
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#ffb300'}
          onMouseLeave={(e) => e.target.style.background = '#ffc107'}
        >
          Limpiar Frontend
        </button>

        <button
          onClick={resetBackend}
          disabled={apiStatus !== 'connected'}
          style={{
            padding: '10px 14px',
            background: apiStatus === 'connected' ? '#d32f2f' : '#d0d0d0',
            color: apiStatus === 'connected' ? 'white' : '#808080',
            border: 'none',
            borderRadius: 2,
            cursor: apiStatus === 'connected' ? 'pointer' : 'not-allowed',
            fontWeight: 500,
            fontSize: 13,
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            if (apiStatus === 'connected') e.target.style.background = '#b71c1c';
          }}
          onMouseLeave={(e) => {
            if (apiStatus === 'connected') e.target.style.background = '#d32f2f';
          }}
        >
          Reiniciar Sistema
        </button>
      </div>

      {/* Ayuda */}
      <div style={{
        padding: 12,
        background: 'rgba(13, 71, 161, 0.05)',
        borderRadius: 2,
        fontSize: 12,
        border: '1px solid rgba(13, 71, 161, 0.2)',
        color: 'var(--text-primary)'
      }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>Información:</strong>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: 4 }}>Limpiar Frontend: Elimina datos locales sin afectar el backend</li>
          <li style={{ marginBottom: 4 }}>Reiniciar Sistema: Reinicia completamente backend y frontend</li>
          <li>Si el backend no responde: Verifica que esté ejecutándose en http://localhost:5000</li>
        </ul>
      </div>
    </div>
  );
}