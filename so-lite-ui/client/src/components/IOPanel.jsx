import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function IOPanel() {
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [processId, setProcessId] = useState(1);
  const [operation, setOperation] = useState("read");
  const [dataSize, setDataSize] = useState(1024);
  const [autoProcess, setAutoProcess] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const intervalRef = useRef(null);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/devices`);
      setDevices(response.data.data);
    } catch (error) {
      console.error("Error obteniendo dispositivos:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/statistics`);
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
    }
  };

  const createIORequest = async () => {
    if (!selectedDevice) {
      alert("Selecciona un dispositivo");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/io/request`, {
        process_id: parseInt(processId),
        device_name: selectedDevice,
        operation: operation,
        data_size: parseInt(dataSize),
        priority: 5
      });
      
      const newRequest = {
        id: response.data.request_id,
        device: selectedDevice,
        process: processId,
        operation: operation,
        size: dataSize,
        time: new Date().toLocaleTimeString()
      };
      
      setRequestHistory(prev => [newRequest, ...prev].slice(0, 10));
      
      await fetchDevices();
      await fetchStatistics();
      
      console.log("Solicitud creada:", response.data);
    } catch (error) {
      console.error("Error creando solicitud:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const processIOQueues = async () => {
    try {
      const response = await axios.post(`${API_URL}/io/process`, {
        scheduler: "FCFS"
      });
      await fetchDevices();
      await fetchStatistics();
      console.log("Colas procesadas:", response.data);
    } catch (error) {
      console.error("Error procesando colas:", error);
    }
  };

  const clearHistory = () => {
    setRequestHistory([]);
  };

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
    
    // Auto-refresh cada 2 segundos
    const refreshInterval = setInterval(() => {
      fetchDevices();
      fetchStatistics();
    }, 2000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Auto-procesamiento de colas
    if (autoProcess) {
      intervalRef.current = setInterval(() => {
        processIOQueues();
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoProcess]);

  const getDeviceIcon = (type) => {
    const size = 36;
    const commonProps = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', style: { display: 'inline-block', verticalAlign: 'middle' } };
    switch ((type || '').toUpperCase()) {
      case 'DISK':
        return (
          <svg {...commonProps} aria-hidden>
            <rect x="3" y="4" width="18" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
            <circle cx="12" cy="10" r="2" fill="var(--accent)" />
            <rect x="7" y="16" width="10" height="2" rx="1" fill="var(--border-color)" />
          </svg>
        );
      case 'PRINTER':
        return (
          <svg {...commonProps} aria-hidden>
            <rect x="4" y="3" width="16" height="8" rx="1" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
            <rect x="6" y="11" width="12" height="6" rx="1" stroke="var(--border-color)" strokeWidth="1" fill="none" />
            <rect x="9" y="14" width="6" height="2" rx="0.5" fill="var(--accent)" />
          </svg>
        );
      case 'KEYBOARD':
        return (
          <svg {...commonProps} aria-hidden>
            <rect x="3" y="6" width="18" height="10" rx="1" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
            <rect x="5" y="8" width="2" height="2" rx="0.3" fill="var(--accent)" />
            <rect x="9" y="8" width="2" height="2" rx="0.3" fill="var(--accent)" />
            <rect x="13" y="8" width="2" height="2" rx="0.3" fill="var(--accent)" />
            <rect x="17" y="8" width="2" height="2" rx="0.3" fill="var(--accent)" />
          </svg>
        );
      case 'NETWORK':
        return (
          <svg {...commonProps} aria-hidden>
            <path d="M4 12h16" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="12" r="1.6" fill="var(--accent)" />
            <circle cx="12" cy="12" r="1.6" fill="var(--accent)" />
            <circle cx="18" cy="12" r="1.6" fill="var(--accent)" />
          </svg>
        );
      case 'USB':
        return (
          <svg {...commonProps} aria-hidden>
            <path d="M12 3v8" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="12" cy="13.5" r="1" fill="var(--accent)" />
            <path d="M12 14.5v3" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );
      default:
        return (
          <svg {...commonProps} aria-hidden>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="var(--border-color)" strokeWidth="1" fill="none" />
            <circle cx="12" cy="12" r="2" fill="var(--text-secondary)" />
          </svg>
        );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "IDLE": "#4caf50",
      "BUSY": "#ff9800",
      "ERROR": "#f44336"
    };
    return colors[status] || "#9e9e9e";
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Gestión de Dispositivos
        </h2>
        <div style={{display: 'flex', gap: 10}}>
          <button 
            onClick={() => {fetchDevices(); fetchStatistics();}}
            style={{
              padding: '8px 14px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1565c0'}
            onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
          >
            Actualizar
          </button>
          <button 
            onClick={clearHistory}
            style={{
              padding: '8px 14px',
              background: '#A4262C',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#7d1e22'}
            onMouseLeave={(e) => e.target.style.background = '#A4262C'}
          >
            Limpiar Historial
          </button>
        </div>
      </div>

      {/* Crear Nueva Solicitud de E/S */}
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: 20, 
        borderRadius: 4, 
        marginBottom: 20,
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Crear Nueva Solicitud de E/S
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 12,
          marginBottom: 16
        }}>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)'}}>
              Dispositivo
            </label>
            <select 
              value={selectedDevice} 
              onChange={e => setSelectedDevice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)'
              }}
            >
              <option value="">Seleccionar...</option>
              {devices.map(dev => (
                <option key={dev.name} value={dev.name}>
                  {dev.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)'}}>
              Proceso ID
            </label>
            <input 
              type="number" 
              min="1" 
              value={processId} 
              onChange={e => setProcessId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)'
              }}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)'}}>
              Operación
            </label>
            <select 
              value={operation} 
              onChange={e => setOperation(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)'
              }}
            >
              <option value="read">Lectura</option>
              <option value="write">Escritura</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)'}}>
              Tamaño (bytes)
            </label>
            <input 
              type="number" 
              min="512" 
              step="512"
              value={dataSize} 
              onChange={e => setDataSize(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={createIORequest}
            style={{
              padding: '10px 16px',
              background: '#107C10',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s',
              flex: 1,
              minWidth: '120px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#0d6e0d'}
            onMouseLeave={(e) => e.target.style.background = '#107C10'}
          >
            Crear Solicitud
          </button>

          <button 
            onClick={processIOQueues}
            style={{
              padding: '10px 16px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s',
              flex: 1,
              minWidth: '120px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1565c0'}
            onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
          >
            Procesar Colas
          </button>

          <button 
            onClick={() => setAutoProcess(!autoProcess)}
            style={{
              padding: '10px 16px',
              background: autoProcess ? '#A4262C' : '#107C10',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s',
              flex: 1,
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (autoProcess) {
                e.target.style.background = '#7d1e22';
              } else {
                e.target.style.background = '#0d6e0d';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = autoProcess ? '#A4262C' : '#107C10';
            }}
          >
            {autoProcess ? 'Detener Auto' : 'Auto Procesar'}
          </button>
        </div>
      </div>

      {/* Estadísticas del Sistema */}
      {statistics && (
        <div style={{ 
          background: 'var(--bg-primary)', 
          padding: 20, 
          borderRadius: 4, 
          marginBottom: 20,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
            Estadísticas del Sistema
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Solicitudes Totales</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                {statistics.total_requests}
              </div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Completadas</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#107C10' }}>
                {statistics.completed_requests}
              </div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>En Progreso</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ffc107' }}>
                {statistics.pending_requests}
              </div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Interrupciones</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                {statistics.total_interrupts}
              </div>
            </div>
          </div>
          {statistics.avg_turnaround_time > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Promedio de Retorno</div>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--accent)' }}>
                {statistics.avg_turnaround_time.toFixed(2)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Historial de Solicitudes Recientes */}
      {requestHistory.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 4, marginBottom: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)'}}>Historial de Solicitudes</h3>
          <div style={{maxHeight: 200, overflowY: 'auto'}}>
            {requestHistory.map((req, idx) => (
              <div 
                key={idx}
                style={{
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  marginBottom: 8,
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  fontSize: 13,
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <div><strong>#{req.id}</strong> - {req.device} / P{req.process}</div>
                  <div style={{color: 'var(--text-secondary)', fontSize: 12}}>{req.time}</div>
                </div>
                <div style={{marginTop: 6, fontSize: 12, color: 'var(--text-secondary)'}}>{req.operation} · {req.size} bytes</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispositivos */}
      <h3 style={{marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)'}}>Dispositivos Disponibles</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: 12 
      }}>
        {devices.map((device) => (
          <div
            key={device.name}
            style={{
              padding: 14,
              borderRadius: 2,
              background: 'var(--bg-primary)',
              border: `1px solid ${getStatusColor(device.status) || 'var(--border-color)'}`,
              transition: 'box-shadow 0.12s, transform 0.12s',
              cursor: 'default'
            }}
          >
            <div style={{textAlign: 'center', marginBottom: 8}}>{getDeviceIcon(device.type)}</div>
            <div style={{ fontSize: 13, marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{device.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>{device.type}</div>

            <div style={{ 
              padding: '6px 8px', 
              borderRadius: 2, 
              background: getStatusColor(device.status),
              color: 'white',
              textAlign: 'center',
              marginBottom: 12,
              fontWeight: 600,
              fontSize: 12
            }}>
              {device.status}
            </div>

            <div style={{ fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                <div style={{color: 'var(--text-secondary)'}}>Cola</div>
                <div style={{
                  padding: '2px 8px',
                  background: device.queue_length > 0 ? '#ffc107' : '#107C10',
                  color: '#111',
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 700
                }}>{device.queue_length}</div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                <div style={{color: 'var(--text-secondary)'}}>Operaciones</div>
                <div style={{fontWeight: 700}}>{device.total_operations}</div>
              </div>

              {device.current_request && (
                <div style={{ 
                  marginTop: 8, 
                  padding: 8, 
                  background: 'var(--gantt-bg)', 
                  borderRadius: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{fontWeight: 700, color: 'var(--text-primary)'}}>Procesando</div>
                  <div style={{fontSize: 12, color: 'var(--text-secondary)'}}>#{device.current_request}</div>
                </div>
              )}

              {device.avg_waiting_time > 0 && (
                <div style={{marginTop: 8, fontSize: 12, color: 'var(--text-secondary)'}}>
                  Espera Promedio: {device.avg_waiting_time.toFixed(2)}s
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}