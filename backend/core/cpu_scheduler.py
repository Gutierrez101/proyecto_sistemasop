#Modulo de Planificacion de CPU

from typing import Optional, List
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.process_manager import ProcessManager, PCB

#Planificador de CPU con múltiples algoritmos
class CPUScheduler:
    def __init__(self, process_manager: ProcessManager):
        self.pm = process_manager
        self.current_algorithm = 'FCFS'
        self.time_quantum = 4
        self.quantum_counter = 0
        
    def schedule(self, algorithm: str = 'FCFS', time_quantum: int = 4):
        """Ejecuta un ciclo del algoritmo de planificación"""
        self.current_algorithm = algorithm
        self.time_quantum = time_quantum
        
        # Actualizar tiempos de espera
        self.pm.update_waiting_times()
        
        # Seleccionar siguiente proceso según algoritmo
        if algorithm == 'FCFS':
            self._schedule_fcfs()
        elif algorithm == 'SJF':
            self._schedule_sjf()
        elif algorithm == 'RR':
            self._schedule_round_robin()
        elif algorithm == 'PRIORITY':
            self._schedule_priority()
        else:
            print(f"Algoritmo desconocido: {algorithm}")
    
    #Algoritmo FCFS
    def _schedule_fcfs(self):
        # Si hay proceso ejecutándose, continuar
        if self.pm.running_process is not None:
            completed = self.pm.execute_process(self.pm.running_process, 1)
            if not completed:
                return
        
        # Seleccionar siguiente proceso (el primero en la cola)
        if self.pm.ready_queue:
            next_pid = self.pm.ready_queue[0]
            if self.pm.transition_to_running(next_pid):
                self.pm.execute_process(next_pid, 1)
    
    #Algoritmo SJF
    def _schedule_sjf(self):
        # Si hay proceso ejecutándose, continuar hasta que termine
        if self.pm.running_process is not None:
            completed = self.pm.execute_process(self.pm.running_process, 1)
            if not completed:
                return
        
        # Seleccionar proceso con menor tiempo de ráfaga restante
        if not self.pm.ready_queue:
            return
            
        shortest_pid = min(
            self.pm.ready_queue,
            key=lambda pid: self.pm.processes[pid].remaining_time
        )
        
        if self.pm.transition_to_running(shortest_pid):
            self.pm.execute_process(shortest_pid, 1)
    
    #Algoritmo RR
    def _schedule_round_robin(self):
        current_pid = self.pm.running_process
        
        # Si hay proceso ejecutándose
        if current_pid is not None:
            self.quantum_counter += 1
            completed = self.pm.execute_process(current_pid, 1)
            
            # Verificar quantum o si terminó
            if completed:
                self.quantum_counter = 0
            elif self.quantum_counter >= self.time_quantum:
                # Cambio de contexto
                pcb = self.pm.processes[current_pid]
                pcb.context_switches += 1
                self.pm.transition_to_ready(current_pid)
                self.quantum_counter = 0
                print(f"  Context switch: {pcb.name} regresa a READY")
            else:
                return  # Continuar con el proceso actual
        
        # Seleccionar siguiente proceso
        if self.pm.ready_queue:
            next_pid = self.pm.ready_queue[0]
            if self.pm.transition_to_running(next_pid):
                self.quantum_counter = 0
    #Algoritmo de prioridad
    def _schedule_priority(self):
        # Si hay proceso ejecutándose, verificar si hay uno con mayor prioridad
        if self.pm.running_process is not None:
            current_pcb = self.pm.processes[self.pm.running_process]
            
            # Buscar proceso con mayor prioridad en ready
            if self.pm.ready_queue:
                highest_priority_pid = min(
                    self.pm.ready_queue,
                    key=lambda pid: self.pm.processes[pid].priority
                )
                highest_priority = self.pm.processes[highest_priority_pid].priority
                
                # Apropiativo: si hay proceso con mayor prioridad, cambiar
                if highest_priority < current_pcb.priority:
                    print(f"  Apropiación: {current_pcb.name} (P{current_pcb.priority}) -> "
                          f"{self.pm.processes[highest_priority_pid].name} (P{highest_priority})")
                    current_pcb.context_switches += 1
                    self.pm.transition_to_ready(self.pm.running_process)
                    self.pm.transition_to_running(highest_priority_pid)
                    return
            
            # Continuar con proceso actual
            self.pm.execute_process(self.pm.running_process, 1)
            return
        
        # No hay proceso ejecutándose, seleccionar el de mayor prioridad
        if self.pm.ready_queue:
            highest_priority_pid = min(
                self.pm.ready_queue,
                key=lambda pid: self.pm.processes[pid].priority
            )
            if self.pm.transition_to_running(highest_priority_pid):
                pass  # Ya transicionó
    #Verificar el estado actual del CPU
    def get_cpu_state(self) -> dict:
        running_info = None
        if self.pm.running_process:
            pcb = self.pm.processes[self.pm.running_process]
            running_info = {
                'pid': pcb.pid,
                'name': pcb.name,
                'remaining_time': pcb.remaining_time
            }
        
        return {
            'algorithm': self.current_algorithm,
            'time_quantum': self.time_quantum,
            'running_process': running_info,
            'quantum_counter': self.quantum_counter,
            'ready_queue_size': len(self.pm.ready_queue)
        }
    
    #Metricas de rendimiento
    def calculate_metrics(self) -> dict:
        completed = [p for p in self.pm.processes.values() if p.state == 'TERMINATED']
        
        if not completed:
            return {
                'avg_waiting_time': 0,
                'avg_turnaround_time': 0,
                'avg_response_time': 0,
                'throughput': 0
            }
        
        avg_waiting = sum(p.waiting_time for p in completed) / len(completed)
        avg_turnaround = sum(p.turnaround_time for p in completed) / len(completed)
        avg_response = sum(p.response_time for p in completed if p.response_time >= 0) / len(completed)
        
        return {
            'avg_waiting_time': avg_waiting,
            'avg_turnaround_time': avg_turnaround,
            'avg_response_time': avg_response,
            'throughput': len(completed),
            'total_context_switches': sum(p.context_switches for p in completed)
        }