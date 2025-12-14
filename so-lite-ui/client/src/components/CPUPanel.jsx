import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function CPUPanel() {
  const [cpuState, setCpuState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);
  const [executionLog, setExecutionLog] = useState([]);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchCPUState(),
        fetchCPUMetrics(),
        fetchProcesses()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCPUState = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm,
        time_quantum: quantum
      });
      setCpuState(response.data.data);
    } catch (error) {
      console.error("Error obteniendo estado CPU:", error);
    }
  };

  const fetchCPUMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/cpu/metrics`);
      setMetrics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo métricas:", error);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get(`${API_URL}/processes`);
      setProcesses(response.data.data || []);
    } catch (error) {
      console.error("Error obteniendo procesos:", error);
    }
  };

  const scheduleCPU = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm,
        time_quantum: quantum
      });
      
      setCpuState(response.data.data);
      
      // Agregar al log de ejecución
      const timestamp = new Date().toLocaleTimeString();
      setExecutionLog(prev => [{
        time: timestamp,
        action: `Ejecutando ${algorithm}`,
        details: response.data.data.running_process ? 
          `Proceso: ${response.data.data.running_process.name}` : 
          'CPU Idle'
      }, ...prev].slice(0, 20));
      
      await fetchCPUMetrics();
      await fetchProcesses();
    } catch (error) {
      console.error("Error en schedule:", error);
    }
  };

  const startScheduling = () => {
    setIsRunning(true);
    const interval = setInterval(() => {
      scheduleCPU();
    }, simulationSpeed);

    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 30000); // 30 segundos
  };

  const stopScheduling = () => {
    setIsRunning(false);
  };

  const createNewProcess = async () => {
    const name = prompt("Nombre del proceso:");
    if (!name) return;

    const priority = parseInt(prompt("Prioridad (1-10, menor = mayor prioridad):", "5"));
    const burstTime = parseInt(prompt("Tiempo de ráfaga (unidades):", "10"));
    const memoryRequired = parseInt(prompt("Memoria requerida (KB):", "100"));

    try {
      await axios.post(`${API_URL}/processes/create`, {
        name,
        priority,
        burst_time: burstTime,
        memory_required: memoryRequired
      });
      
      alert(`Proceso "${name}" creado exitosamente`);
      await fetchProcesses();
    } catch (error) {
      console.error("Error creando proceso:", error);
      alert("Error al crear proceso: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStateColor = (state) => {
    const colors = {
      'NEW': '#9e9e9e',
      'READY': '#2196f3',
      'RUNNING': '#4caf50',
      'WAITING': '#ff9800',
      'TERMINATED': '#f44336'
    };
    return colors[state] || '#9e9e9e';
  };

  const getStateBadge = (state) => {
    const badges = {
      'NEW': 'N',
      'READY': 'R',
      'RUNNING': 'E',
      'WAITING': 'W',
      'TERMINATED': 'T'
    };
    return badges[state] || '?';
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Planificador de CPU
        </h2>
        <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500}}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-actualizar
          </label>
          <button 
            onClick={fetchAllData}
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
        </div>
      </div>

      {/* Configuración y Controles */}
      <div style={{ 
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Control de Planificación
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 15,
          marginBottom: 15
        }}>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
              Algoritmo
            </label>
            <select 
              value={algorithm} 
              onChange={e => setAlgorithm(e.target.value)}
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s'
              }}
            >
              <option value="FCFS">FCFS</option>
              <option value="SJF">SJF</option>
              <option value="RR">Round Robin</option>
              <option value="PRIORITY">Prioridades</option>
            </select>
          </div>

          {algorithm === "RR" && (
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
                Quantum (ms)
              </label>
              <input 
                type="number" 
                min="1"
                max="10"
                value={quantum} 
                onChange={e => setQuantum(parseInt(e.target.value))}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  fontSize: 13,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>
          )}

          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
              Velocidad (ms)
            </label>
            <input 
              type="range"
              min="500"
              max="3000"
              step="500"
              value={simulationSpeed}
              onChange={e => setSimulationSpeed(parseInt(e.target.value))}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
            <div style={{textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4}}>
              {simulationSpeed}ms
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={scheduleCPU}
            disabled={isRunning}
            style={{
              padding: '10px 16px',
              background: isRunning ? '#d0d0d0' : 'var(--accent)',
              color: isRunning ? '#808080' : 'white',
              border: 'none',
              borderRadius: 2,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!isRunning) e.target.style.background = '#1565c0';
            }}
            onMouseLeave={(e) => {
              if (!isRunning) e.target.style.background = 'var(--accent)';
            }}
          >
            Ejecutar 1 Paso
          </button>

          {!isRunning ? (
            <button 
              onClick={startScheduling}
              style={{
                padding: '10px 16px',
                background: '#107C10',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#0d6e0d'}
              onMouseLeave={(e) => e.target.style.background = '#107C10'}
            >
              Iniciar Auto-Ejecución
            </button>
          ) : (
            <button 
              onClick={stopScheduling}
              style={{
                padding: '10px 16px',
                background: '#A4262C',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#7d1e22'}
              onMouseLeave={(e) => e.target.style.background = '#A4262C'}
            >
              Detener
            </button>
          )}

          <button 
            onClick={createNewProcess}
            style={{
              padding: '10px 16px',
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
            Crear Proceso
          </button>
        </div>
      </div>

      {/* Estado del CPU */}
      {cpuState && (
        <div style={{ 
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
            Estado Actual del CPU
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 15,
            marginBottom: 16
          }}>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Algoritmo Activo</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {cpuState.algorithm}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Quantum</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {cpuState.time_quantum}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Contador Quantum</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {cpuState.quantum_counter} / {cpuState.time_quantum}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Cola Ready</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {cpuState.ready_queue_size}
              </div>
            </div>
          </div>
          
          {cpuState.running_process ? (
            <div style={{ 
              padding: 15,
              background: 'var(--gantt-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <strong style={{fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 10}}>
                Proceso en Ejecución
              </strong>
              <div style={{marginTop: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--text-secondary)'}}>
                <div><strong style={{color: 'var(--text-primary)'}}>PID:</strong> {cpuState.running_process.pid}</div>
                <div><strong style={{color: 'var(--text-primary)'}}>Nombre:</strong> {cpuState.running_process.name}</div>
                <div><strong style={{color: 'var(--text-primary)'}}>Tiempo restante:</strong> {cpuState.running_process.remaining_time} u</div>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: 15,
              background: 'var(--gantt-bg)',
              borderRadius: 2,
              textAlign: 'center',
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-color)',
              fontSize: 13
            }}>
              CPU en estado IDLE - No hay procesos en ejecución
            </div>
          )}
        </div>
      )}

      {/* Tabla de Procesos */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Lista de Procesos ({processes.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gantt-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>PID</th>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Nombre</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Estado</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Prioridad</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Burst</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Restante</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Espera</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Memoria</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13}}>
                    No hay procesos
                  </td>
                </tr>
              ) : (
                processes.map(proc => (
                  <tr 
                    key={proc.pid}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: proc.state === 'RUNNING' ? 'rgba(13, 71, 161, 0.05)' : 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <td style={{padding: 10, fontWeight: 600}}>{proc.pid}</td>
                    <td style={{padding: 10}}>{proc.name}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 2,
                        background: getStateColor(proc.state),
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 500,
                        display: 'inline-block'
                      }}>
                        {getStateBadge(proc.state)}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '3px 6px',
                        borderRadius: 2,
                        background: proc.priority <= 3 ? '#A4262C' : proc.priority <= 7 ? '#ffc107' : '#107C10',
                        color: proc.priority <= 7 ? '#333' : 'white',
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {proc.priority}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.burst_time}</td>
                    <td style={{padding: 10, textAlign: 'center', fontWeight: 600, color: proc.remaining_time === 0 ? '#107C10' : 'var(--accent)'}} >
                      {proc.remaining_time}
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.waiting_time}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.memory_required}KB</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      {metrics && (
        <div style={{ 
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
            Métricas de Rendimiento
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16
          }}>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Espera</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_waiting_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Retorno</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_turnaround_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Respuesta</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_response_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Throughput</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.throughput || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>procesos</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Context Switches</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.total_context_switches || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log de Ejecución */}
      {executionLog.length > 0 && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <h3 style={{margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
              Log de Ejecución
            </h3>
            <button 
              onClick={() => setExecutionLog([])}
              style={{
                padding: '6px 12px',
                background: '#A4262C',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#7d1e22'}
              onMouseLeave={(e) => e.target.style.background = '#A4262C'}
            >
              Limpiar
            </button>
          </div>
          <div style={{
            maxHeight: 300,
            overflowY: 'auto',
            background: 'var(--gantt-bg)',
            padding: 10,
            borderRadius: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            {executionLog.map((log, idx) => (
              <div key={idx} style={{
                padding: 8,
                borderBottom: '1px solid var(--border-color)',
                background: idx % 2 === 0 ? 'var(--bg-primary)' : 'transparent'
              }}>
                <strong style={{color: 'var(--accent)'}}>[{log.time}]</strong> {log.action}
                <div style={{color: 'var(--text-secondary)', fontSize: 11, marginTop: 2}}>{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}