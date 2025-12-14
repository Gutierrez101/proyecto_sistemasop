#Utilidades necesarias para estadisticas del sistema

from typing import List, Dict
import statistics
from dataclasses import dataclass

@dataclass
#Estadisticas de un proceso
class ProcessStats:
    pid: int
    name: str
    arrival_time: float
    burst_time: int
    completion_time: float
    waiting_time: int
    turnaround_time: int
    response_time: int
    context_switches: int

#Analizador del sistema
class StatisticsAnalyzer:
    @staticmethod
    def calculate_process_statistics(processes: List[ProcessStats]) -> Dict:
        if not processes:
            return {}
        
        waiting_times = [p.waiting_time for p in processes]
        turnaround_times = [p.turnaround_time for p in processes]
        response_times = [p.response_time for p in processes if p.response_time >= 0]
        
        return {
            'total_processes': len(processes),
            'avg_waiting_time': statistics.mean(waiting_times),
            'max_waiting_time': max(waiting_times),
            'min_waiting_time': min(waiting_times),
            'avg_turnaround_time': statistics.mean(turnaround_times),
            'max_turnaround_time': max(turnaround_times),
            'min_turnaround_time': min(turnaround_times),
            'avg_response_time': statistics.mean(response_times) if response_times else 0,
            'total_context_switches': sum(p.context_switches for p in processes),
            'cpu_utilization': StatisticsAnalyzer._calculate_cpu_utilization(processes)
        }
    
    @staticmethod
    #Funcion para calcular cuanta CPU usa
    def _calculate_cpu_utilization(processes: List[ProcessStats]) -> float:
        if not processes:
            return 0.0
        
        total_burst = sum(p.burst_time for p in processes)
        total_time = max(p.completion_time - p.arrival_time for p in processes)
        
        if total_time == 0:
            return 0.0
        
        return (total_burst / total_time) * 100
    
    @staticmethod
    #Comparacion entre algoritmos
    def compare_algorithms(results: Dict[str, List[ProcessStats]]) -> Dict:
        comparison = {}
        
        for algo_name, processes in results.items():
            stats = StatisticsAnalyzer.calculate_process_statistics(processes)
            comparison[algo_name] = stats
        
        # Determinar mejor algoritmo por métrica
        best = {
            'avg_waiting_time': min(comparison.items(), 
                                   key=lambda x: x[1]['avg_waiting_time'])[0],
            'avg_turnaround_time': min(comparison.items(), 
                                      key=lambda x: x[1]['avg_turnaround_time'])[0],
            'cpu_utilization': max(comparison.items(), 
                                  key=lambda x: x[1]['cpu_utilization'])[0]
        }
        
        comparison['best_by_metric'] = best
        return comparison
    
    @staticmethod
    def generate_gantt_data(processes: List[Dict]) -> List[Dict]:
        gantt_data = []
        
        for process in sorted(processes, key=lambda p: p['start_time']):
            gantt_data.append({
                'process': process['name'],
                'pid': process['pid'],
                'start': process['start_time'],
                'end': process['end_time'],
                'duration': process['end_time'] - process['start_time']
            })
        
        return gantt_data

class MemoryAnalyzer:
    @staticmethod
    def calculate_fragmentation(partitions: List[Dict]) -> Dict:
        """Calcula fragmentación de memoria"""
        total_memory = sum(p['size'] for p in partitions)
        allocated = sum(p['size'] for p in partitions if p['allocated'])
        free = total_memory - allocated
        
        # Fragmentación externa
        free_blocks = [p for p in partitions if not p['allocated']]
        if free_blocks:
            largest_free = max(p['size'] for p in free_blocks)
            external_frag = ((free - largest_free) / total_memory) * 100 if total_memory > 0 else 0
        else:
            external_frag = 0
        
        return {
            'total_memory': total_memory,
            'allocated_memory': allocated,
            'free_memory': free,
            'memory_utilization': (allocated / total_memory) * 100 if total_memory > 0 else 0,
            'external_fragmentation': external_frag,
            'num_free_blocks': len(free_blocks)
        }
    
    @staticmethod
    def calculate_page_fault_rate(total_accesses: int, page_faults: int) -> Dict:
        if total_accesses == 0:
            return {
                'total_accesses': 0,
                'page_faults': 0,
                'page_hits': 0,
                'fault_rate': 0.0,
                'hit_rate': 0.0
            }
        
        page_hits = total_accesses - page_faults
        fault_rate = (page_faults / total_accesses) * 100
        hit_rate = (page_hits / total_accesses) * 100
        
        return {
            'total_accesses': total_accesses,
            'page_faults': page_faults,
            'page_hits': page_hits,
            'fault_rate': fault_rate,
            'hit_rate': hit_rate
        }

class IOAnalyzer:
    @staticmethod
    def calculate_device_utilization(devices: List[Dict]) -> Dict:
        results = {}
        
        for device in devices:
            if device.get('total_operations', 0) > 0:
                busy_time = device.get('busy_time', 0)
                total_time = device.get('total_time', 1)
                utilization = (busy_time / total_time) * 100 if total_time > 0 else 0
                results[device['name']] = {
                    'utilization': utilization,
                    'total_operations': device['total_operations'],
                    'avg_waiting_time': device.get('avg_waiting_time', 0),
                    'throughput': device['total_operations'] / total_time if total_time > 0 else 0
                }
        
        return results
    
    @staticmethod
    def calculate_io_bottlenecks(devices: List[Dict], threshold: float = 80.0) -> List[str]:
        bottlenecks = []
        
        for device in devices:
            busy_time = device.get('busy_time', 0)
            total_time = device.get('total_time', 1)
            utilization = (busy_time / total_time) * 100 if total_time > 0 else 0
            
            if utilization > threshold:
                bottlenecks.append(device['name'])
        
        return bottlenecks

class DeadlockAnalyzer:
    @staticmethod
    def analyze_resource_graph(allocation: Dict, request: Dict) -> Dict:
        # Calcular grado de cada nodo
        node_degrees = {}
        
        for pid, resources in allocation.items():
            node_degrees[f"P{pid}"] = len(resources)
        
        for pid, resources in request.items():
            if f"P{pid}" not in node_degrees:
                node_degrees[f"P{pid}"] = 0
            node_degrees[f"P{pid}"] += len(resources)
        
        # Identificar procesos en riesgo
        high_risk = [pid for pid, degree in node_degrees.items() if degree > 2]
        
        return {
            'node_degrees': node_degrees,
            'high_risk_processes': high_risk,
            'total_resources_allocated': sum(len(r) for r in allocation.values()),
            'total_resources_requested': sum(len(r) for r in request.values())
        }

# Reportes del sistema

class ReportGenerator:
    
    @staticmethod
    def generate_full_report(kernel_state: Dict) -> str:
        report = []
        report.append("=" * 60)
        report.append("SO-LITE SYSTEM REPORT")
        report.append("=" * 60)
        
        # Información general
        report.append(f"\nSystem Clock: {kernel_state.get('clock', 0)}")
        
        # Procesos
        processes = kernel_state.get('processes', [])
        report.append(f"\n--- PROCESSES ({len(processes)}) ---")
        for p in processes:
            report.append(f"PID {p['pid']}: {p['name']} - State: {p['state']}")
            report.append(f"  Priority: {p['priority']}, Burst: {p['burst_time']}, "
                        f"Remaining: {p['remaining_time']}")
        
        # CPU
        cpu = kernel_state.get('cpu', {})
        report.append(f"\n--- CPU SCHEDULER ---")
        report.append(f"Algorithm: {cpu.get('algorithm', 'N/A')}")
        report.append(f"Running: {cpu.get('running_process', 'None')}")
        report.append(f"Ready Queue: {cpu.get('ready_queue_size', 0)} processes")
        
        # Memoria
        memory = kernel_state.get('memory', {})
        report.append(f"\n--- MEMORY ---")
        report.append(f"Mode: {memory.get('mode', 'N/A')}")
        
        # E/S
        io_devices = kernel_state.get('io_devices', [])
        report.append(f"\n--- I/O DEVICES ({len(io_devices)}) ---")
        for dev in io_devices:
            report.append(f"{dev['name']}: {dev['status']} - Queue: {dev['queue_length']}")
        
        report.append("\n" + "=" * 60)
        
        return "\n".join(report)
    
    @staticmethod
    #Rendimiento
    def generate_performance_report(statistics: Dict) -> str:
        report = []
        report.append("=" * 60)
        report.append("PERFORMANCE METRICS")
        report.append("=" * 60)
        
        report.append(f"\nAverage Waiting Time: {statistics.get('avg_waiting_time', 0):.2f}")
        report.append(f"Average Turnaround Time: {statistics.get('avg_turnaround_time', 0):.2f}")
        report.append(f"Average Response Time: {statistics.get('avg_response_time', 0):.2f}")
        report.append(f"CPU Utilization: {statistics.get('cpu_utilization', 0):.2f}%")
        report.append(f"Context Switches: {statistics.get('total_context_switches', 0)}")
        
        report.append("\n" + "=" * 60)
        
        return "\n".join(report)


# ============= PRUEBA UNITARIA =============
if __name__ == "__main__":
    print("=== PRUEBA UNITARIA: Statistics ===\n")
    
    # 1. Estadísticas de procesos
    print("1. ANÁLISIS DE PROCESOS")
    print("-" * 50)
    sample_processes = [
        ProcessStats(1, "P1", 0, 10, 15, 5, 15, 0, 2),
        ProcessStats(2, "P2", 1, 8, 18, 9, 17, 4, 3),
        ProcessStats(3, "P3", 2, 6, 12, 4, 10, 2, 1)
    ]
    
    analyzer = StatisticsAnalyzer()
    stats = analyzer.calculate_process_statistics(sample_processes)
    
    print("Métricas:")
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    # 2. Análisis de memoria
    print("\n2. ANÁLISIS DE MEMORIA")
    print("-" * 50)
    sample_partitions = [
        {'id': 0, 'size': 64, 'allocated': True},
        {'id': 1, 'size': 128, 'allocated': False},
        {'id': 2, 'size': 256, 'allocated': True},
        {'id': 3, 'size': 512, 'allocated': False}
    ]
    
    mem_analyzer = MemoryAnalyzer()
    mem_stats = mem_analyzer.calculate_fragmentation(sample_partitions)
    
    print("Estadísticas de memoria:")
    for key, value in mem_stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    # 3. Tasa de fallos de página
    print("\n3. FALLOS DE PÁGINA")
    print("-" * 50)
    page_stats = mem_analyzer.calculate_page_fault_rate(100, 25)
    
    for key, value in page_stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}%")
        else:
            print(f"  {key}: {value}")
    
    # 4. Generar reporte completo
    print("\n4. REPORTE DEL SISTEMA")
    print("-" * 50)
    generator = ReportGenerator()
    sample_state = {
        'clock': 100,
        'processes': [
            {'pid': 1, 'name': 'Browser', 'state': 'RUNNING', 'priority': 3, 
             'burst_time': 10, 'remaining_time': 5},
            {'pid': 2, 'name': 'Editor', 'state': 'READY', 'priority': 5,
             'burst_time': 8, 'remaining_time': 8}
        ],
        'cpu': {'algorithm': 'RR', 'running_process': 1, 'ready_queue_size': 1},
        'memory': {'mode': 'paging'},
        'io_devices': [
            {'name': 'disk0', 'status': 'BUSY', 'queue_length': 3}
        ]
    }
    
    report = generator.generate_full_report(sample_state)
    print(report)
    
    # 5. Reporte de rendimiento
    print("\n5. REPORTE DE RENDIMIENTO")
    print("-" * 50)
    perf_report = generator.generate_performance_report(stats)
    print(perf_report)
    
    print("\n✅ Todas las pruebas completadas")