import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function MemoryPanel() {
  const [memoryState, setMemoryState] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const fetchMemoryState = async () => {
    try {
      const response = await axios.get(`${API_URL}/memory/state`);
      const memState = response.data.data;
      
      console.log('📊 Estado de memoria recibido:', memState);
      console.log('   Total frames:', memState.frames?.length);
      console.log('   Frames ocupados:', memState.frames?.filter(f => f.occupied).length);
      
      // Mostrar algunos frames ocupados
      const occupied = memState.frames?.filter(f => f.occupied).slice(0, 5);
      if (occupied && occupied.length > 0) {
        console.log('   Ejemplos de frames ocupados:', occupied);
      }
      
      setMemoryState(memState);
    } catch (error) {
      console.error("Error obteniendo estado de memoria:", error);
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

  const allocateMemory = async () => {
    const pidStr = prompt("Ingresa el PID del proceso:");
    if (!pidStr) return;
    
    const pid = parseInt(pidStr);
    const sizeStr = prompt("Tamaño de memoria a asignar (KB):", "100");
    if (!sizeStr) return;
    
    const size = parseInt(sizeStr);
    
    const algorithm = prompt(
      "Algoritmo de asignación:\n" +
      "1. first_fit\n" +
      "2. best_fit\n" +
      "3. worst_fit\n" +
      "Ingresa el nombre:", 
      "first_fit"
    );

    try {
      const response = await axios.post(`${API_URL}/memory/allocate`, {
        pid,
        size,
        algorithm
      });
      
      if (response.data.allocated) {
        alert(`Memoria asignada exitosamente al proceso ${pid}`);
      } else {
        alert(`No hay memoria disponible para el proceso ${pid}`);
      }
      
      await fetchMemoryState();
      await fetchProcesses();
    } catch (error) {
      console.error("Error asignando memoria:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const deallocateMemory = async () => {
    const pidStr = prompt("Ingresa el PID del proceso a liberar:");
    if (!pidStr) return;
    
    const pid = parseInt(pidStr);

    try {
      await axios.post(`${API_URL}/memory/deallocate`, { pid });
      alert(`Memoria liberada para el proceso ${pid}`);
      await fetchMemoryState();
      await fetchProcesses();
    } catch (error) {
      console.error("Error liberando memoria:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchMemoryState();
    fetchProcesses();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMemoryState();
        fetchProcesses();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!memoryState) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{fontSize: 18, color: 'var(--text-secondary)'}}>Cargando estado de memoria...</div>
      </div>
    );
  }

  // ✅ CALCULAR ESTADÍSTICAS CORRECTAMENTE
  const totalMemory = memoryState.total_memory || 1024;
  
  // Para paging: contar frames ocupados
  let usedMemory = 0;
  if (memoryState.mode === 'paging' && memoryState.frames) {
    const occupiedFrames = memoryState.frames.filter(f => f.occupied).length;
    usedMemory = occupiedFrames * 4; // 4KB por frame
  } else if (memoryState.mode === 'partitions' && memoryState.partitions) {
    usedMemory = memoryState.partitions
      .filter(p => p.allocated)
      .reduce((sum, p) => sum + p.size, 0);
  }

  const freeMemory = totalMemory - usedMemory;
  const utilizationPercent = totalMemory > 0 ? (usedMemory / totalMemory * 100) : 0;

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Gestión de Memoria RAM
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
            onClick={() => {fetchMemoryState(); fetchProcesses();}}
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
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Información General de Memoria */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Resumen de Memoria
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          marginBottom: 20
        }}>
          <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
            <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Modo Gestión</div>
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: 'var(--accent)',
              textTransform: 'uppercase'
            }}>
              {memoryState.mode}
            </div>
          </div>
          <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
            <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Total</div>
            <div style={{fontSize: 22, fontWeight: 'bold', color: 'var(--accent)'}}>
              {totalMemory}
            </div>
            <div style={{fontSize: 10, color: 'var(--text-secondary)'}}>KB</div>
          </div>
          <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
            <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Usada</div>
            <div style={{fontSize: 22, fontWeight: 'bold', color: 'var(--accent)'}}>
              {usedMemory}
            </div>
            <div style={{fontSize: 10, color: 'var(--text-secondary)'}}>KB</div>
          </div>
          <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
            <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Libre</div>
            <div style={{fontSize: 22, fontWeight: 'bold', color: 'var(--accent)'}}>
              {freeMemory}
            </div>
            <div style={{fontSize: 10, color: 'var(--text-secondary)'}}>KB</div>
          </div>
          <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
            <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Utilización</div>
            <div style={{fontSize: 22, fontWeight: 'bold', color: 'var(--accent)'}}>
              {utilizationPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div>
          <div style={{
            height: 24,
            background: 'var(--gantt-bg)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              height: '100%',
              width: `${utilizationPercent}%`,
              background: utilizationPercent > 80 ? '#A4262C' : utilizationPercent > 60 ? '#ffc107' : '#107C10',
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 11,
              color: utilizationPercent > 60 ? '#333' : 'white'
            }}>
              {utilizationPercent > 10 && `${utilizationPercent.toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Memoria */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Operaciones de Memoria
        </h3>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          <button 
            onClick={allocateMemory}
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
          >
            Asignar Memoria
          </button>
          <button 
            onClick={deallocateMemory}
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
          >
            Liberar Memoria
          </button>
        </div>
      </div>

      {/* Modo Paginación */}
      {memoryState.mode === "paging" && (
        <>
          {/* Estadísticas de Paginación */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: 20,
            borderRadius: 4,
            marginBottom: 20,
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
              Estadísticas de Paginación
            </h3>
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12
            }}>
              <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
                <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Frames Totales</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: 'var(--accent)'}}>
                  {memoryState.frames?.length || 0}
                </div>
              </div>
              <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
                <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Frames Ocupados</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: '#ffc107'}}>
                  {memoryState.frames?.filter(f => f.occupied).length || 0}
                </div>
              </div>
              <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
                <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Fallos de Página</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: '#A4262C'}}>
                  {memoryState.page_faults || 0}
                </div>
              </div>
              <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
                <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Accesos</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: 'var(--accent)'}}>
                  {memoryState.page_accesses || 0}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ VISUALIZACIÓN DE FRAMES MEJORADA */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: 20,
            borderRadius: 4,
            border: '1px solid var(--border-color)',
            marginBottom: 20
          }}>
            <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
              Frames de Memoria ({memoryState.frames?.length || 0})
            </h3>
            <div style={{
              marginBottom: 16,
              padding: 10,
              background: 'var(--gantt-bg)',
              borderRadius: 2,
              display: 'flex',
              gap: 20,
              fontSize: 12
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <span style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  background: '#ffc107',
                  borderRadius: 1
                }}></span>
                <span style={{color: 'var(--text-primary)'}}>Ocupado</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <span style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  background: 'var(--border-color)',
                  borderRadius: 1
                }}></span>
                <span style={{color: 'var(--text-primary)'}}>Libre</span>
              </div>
            </div>
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
              gap: 6
            }}>
              {memoryState.frames?.length > 0 ? (
                memoryState.frames.map((frame) => {
                  const isOccupied = frame.occupied === true;
                  const processId = frame.process;
                  
                  return (
                    <div
                      key={frame.frame}
                      style={{
                        padding: 8,
                        textAlign: "center",
                        borderRadius: 2,
                        background: isOccupied ? '#ffc107' : 'var(--border-color)',
                        color: isOccupied ? '#333' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        border: `1px solid ${isOccupied ? '#ffb300' : '#d0d0d0'}`
                      }}
                      title={isOccupied ? `Frame ${frame.frame} - Proceso P${processId}` : `Frame ${frame.frame} - Libre`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isOccupied ? '#ffb300' : '#bfbfbf';
                        setSelectedProcess(isOccupied ? processId : null);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isOccupied ? '#ffc107' : 'var(--border-color)';
                        setSelectedProcess(null);
                      }}
                    >
                      {frame.frame}
                      {isOccupied && processId && (
                        <div style={{fontSize: 10, marginTop: 2}}>P{processId}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'var(--text-secondary)'}}>
                  No hay frames inicializados
                </div>
              )}
            </div>
            {selectedProcess !== null && (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: 'var(--gantt-bg)',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                color: 'var(--text-primary)'
              }}>
                <strong>Proceso seleccionado:</strong> P{selectedProcess}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tabla de Procesos con Memoria Asignada */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        border: '1px solid var(--border-color)',
        marginTop: 20
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Procesos y Memoria Asignada
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gantt-bg)' }}>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)'}}>PID</th>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)'}}>Nombre</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)'}}>Estado</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)'}}>Memoria Asignada</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13}}>
                    No hay procesos activos
                  </td>
                </tr>
              ) : (
                processes.map(proc => {
                  // ✅ CONTAR FRAMES ASIGNADOS A ESTE PROCESO
                  const framesAssigned = memoryState.frames?.filter(f => f.occupied && f.process === proc.pid).length || 0;
                  const memoryUsed = framesAssigned * 4; // 4KB por frame
                  
                  return (
                    <tr 
                      key={proc.pid}
                      style={{borderBottom: '1px solid var(--border-color)'}}
                    >
                      <td style={{padding: 10, fontWeight: 'bold', fontSize: 12, color: 'var(--text-primary)'}}>{proc.pid}</td>
                      <td style={{padding: 10, fontSize: 12, color: 'var(--text-primary)'}}>{proc.name}</td>
                      <td style={{padding: 10, textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 2,
                          background: proc.state === 'RUNNING' ? '#107C10' : 
                                     proc.state === 'READY' ? 'var(--accent)' :
                                     proc.state === 'WAITING' ? '#ffc107' : '#bfbfbf',
                          color: proc.state === 'WAITING' ? '#333' : 'white',
                          fontSize: 11,
                          fontWeight: 'bold'
                        }}>
                          {proc.state}
                        </span>
                      </td>
                      <td style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: 'var(--accent)'}}>
                        {memoryUsed > 0 ? `${memoryUsed} KB (${framesAssigned} frames)` : 'Sin asignar'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}