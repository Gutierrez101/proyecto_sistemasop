from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import time

# Agregar el directorio parent al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar TODOS los módulos del core
from core.process_manager import ProcessManager
from core.cpu_scheduler import CPUScheduler
from core.memory_manager import MemoryManager
from core.io_manager import IOManager
from core.concurrency_manager import ConcurrencyManager

app = Flask(__name__)
CORS(app)

# Instancias globales de todos los módulos
process_manager = None
cpu_scheduler = None
memory_manager = None
io_manager = None
concurrency_manager = None
kernel_initialized = False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica que la API esté funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'SO-Lite API funcionando correctamente',
        'kernel_initialized': kernel_initialized
    }), 200

@app.route('/api/kernel/initialize', methods=['POST'])
def initialize_kernel():
    """Inicializa TODOS los módulos del kernel"""
    global process_manager, cpu_scheduler, memory_manager, io_manager, concurrency_manager, kernel_initialized
    
    try:
        data = request.json or {}
        memory_mode = data.get('memory_mode', 'paging')
        total_memory = data.get('total_memory', 1024)
        
        # Inicializar ProcessManager
        process_manager = ProcessManager()
        print("✅ ProcessManager inicializado")
        
        # Inicializar CPUScheduler con el ProcessManager
        cpu_scheduler = CPUScheduler(process_manager)
        print("✅ CPUScheduler inicializado")
        
        # Inicializar MemoryManager con el modo especificado
        memory_manager = MemoryManager(total_memory=total_memory, mode=memory_mode)
        memory_manager.initialize()
        print("✅ MemoryManager inicializado")
        
        # Inicializar IOManager
        io_manager = IOManager()
        io_manager.initialize()
        print("✅ IOManager inicializado")
        
        # Inicializar ConcurrencyManager
        concurrency_manager = ConcurrencyManager()
        print("✅ ConcurrencyManager inicializado")
        
        kernel_initialized = True
        
        return jsonify({
            'status': 'success',
            'message': 'Kernel inicializado correctamente con todos los módulos',
            'config': {
                'memory_mode': memory_mode,
                'total_memory': total_memory
            }
        }), 200
    except Exception as e:
        print(f"❌ Error inicializando kernel: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== PROCESOS ====================

@app.route('/api/processes/create', methods=['POST'])
def create_process():
    """Crea un nuevo proceso usando ProcessManager"""
    global process_manager, memory_manager
    
    if not kernel_initialized or not process_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        name = data.get('name', 'Process')
        priority = data.get('priority', 5)
        burst_time = data.get('burst_time', 10)
        memory_required = data.get('memory_required', 100)
        
        # Crear proceso usando ProcessManager
        pid = process_manager.create_process(name, priority, burst_time, memory_required)
        
        # Intentar asignar memoria usando MemoryManager
        memory_allocated = False
        if memory_manager:
            memory_allocated = memory_manager.allocate(pid, memory_required)
        
        return jsonify({
            'status': 'success',
            'message': f'Proceso {name} creado',
            'pid': pid,
            'memory_allocated': memory_allocated
        }), 201
    except Exception as e:
        print(f"❌ Error creando proceso: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/processes', methods=['GET'])
def get_processes():
    """Obtiene todos los procesos usando ProcessManager.get_all_processes_info()"""
    global process_manager
    
    if not kernel_initialized or not process_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método get_all_processes_info() del ProcessManager
        processes = process_manager.get_all_processes_info()
        return jsonify({
            'status': 'success',
            'data': processes
        }), 200
    except Exception as e:
        print(f"❌ Error obteniendo procesos: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/processes/<int:pid>/transition', methods=['POST'])
def transition_process(pid):
    """Transiciona un proceso a un nuevo estado"""
    global process_manager
    
    if not kernel_initialized or not process_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        new_state = data.get('state')
        
        if new_state == 'READY':
            process_manager.transition_to_ready(pid)
        elif new_state == 'RUNNING':
            process_manager.transition_to_running(pid)
        elif new_state == 'WAITING':
            reason = data.get('reason', 'IO')
            process_manager.transition_to_waiting(pid, reason)
        elif new_state == 'TERMINATED':
            process_manager.terminate_process(pid)
        else:
            return jsonify({'status': 'error', 'message': 'Estado inválido'}), 400
        
        return jsonify({
            'status': 'success',
            'message': f'Proceso {pid} transicionado a {new_state}'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== CPU SCHEDULER ====================

@app.route('/api/cpu/schedule', methods=['POST'])
def schedule_cpu():
    """Ejecuta un paso del planificador usando CPUScheduler.schedule()"""
    global cpu_scheduler
    
    if not kernel_initialized or not cpu_scheduler:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        algorithm = data.get('algorithm', 'FCFS')
        time_quantum = data.get('time_quantum', 4)
        
        # Ejecutar un paso del scheduler usando el método schedule()
        cpu_scheduler.schedule(algorithm, time_quantum)
        
        # Obtener estado del CPU usando get_cpu_state()
        cpu_state = cpu_scheduler.get_cpu_state()
        
        return jsonify({
            'status': 'success',
            'data': cpu_state
        }), 200
    except Exception as e:
        print(f"❌ Error en schedule: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/cpu/metrics', methods=['GET'])
def get_cpu_metrics():
    """Obtiene métricas usando CPUScheduler.calculate_metrics()"""
    global cpu_scheduler
    
    if not kernel_initialized or not cpu_scheduler:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método calculate_metrics() del CPUScheduler
        metrics = cpu_scheduler.calculate_metrics()
        return jsonify({
            'status': 'success',
            'data': metrics
        }), 200
    except Exception as e:
        print(f"❌ Error obteniendo métricas: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/cpu/simulate', methods=['POST'])
def simulate_cpu():
    """Simula múltiples pasos del scheduler"""
    global cpu_scheduler
    
    if not kernel_initialized or not cpu_scheduler:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        algorithm = data.get('algorithm', 'FCFS')
        time_quantum = data.get('time_quantum', 4)
        steps = data.get('steps', 20)
        
        # Ejecutar múltiples pasos
        for _ in range(steps):
            cpu_scheduler.schedule(algorithm, time_quantum)
            time.sleep(0.1)  # Pequeña pausa para simular tiempo real
        
        # Obtener métricas finales
        metrics = cpu_scheduler.calculate_metrics()
        
        return jsonify({
            'status': 'success',
            'message': f'Simulación completada: {steps} pasos',
            'metrics': metrics
        }), 200
    except Exception as e:
        print(f"❌ Error en simulación: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/simulation/run', methods=['POST'])
def run_simulation():
    """Ejecuta una simulación COMPLETA e INTEGRADA del sistema"""
    global cpu_scheduler, process_manager, memory_manager, io_manager
    
    if not kernel_initialized or not cpu_scheduler:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        algorithm = data.get('algorithm', 'FCFS')
        time_quantum = data.get('time_quantum', 4)
        steps = data.get('steps', 30)
        
        print(f"\n{'='*60}")
        print(f"🎮 Iniciando simulación INTEGRADA: {algorithm}")
        print(f"⏱️  Quantum: {time_quantum}, Pasos: {steps}")
        print('='*60)
        
        # Registro de eventos para el timeline
        execution_timeline = []
        current_time = 0
        
        # Ejecutar simulación paso a paso
        for step in range(steps):
            # 1. VERIFICAR PROCESOS ACTIVOS
            active_processes = [p for p in process_manager.processes.values() 
                              if p.state != 'TERMINATED']
            
            if not active_processes:
                print(f"\n⚠️ Todos los procesos completados en paso {step+1}")
                break
            
            print(f"\n--- Paso {step + 1} ---")
            
            # 2. EJECUTAR SCHEDULER DE CPU
            cpu_scheduler.schedule(algorithm, time_quantum)
            
            # Registrar proceso en ejecución para el timeline
            if process_manager.running_process:
                running_pcb = process_manager.processes[process_manager.running_process]
                
                # Agregar o actualizar en timeline
                if execution_timeline and execution_timeline[-1]['pid'] == running_pcb.name:
                    # Extender duración del proceso actual
                    execution_timeline[-1]['duration'] += 1
                else:
                    # Nuevo segmento en timeline
                    execution_timeline.append({
                        'pid': running_pcb.name,
                        'start': current_time,
                        'duration': 1,
                        'priority': running_pcb.priority
                    })
            
            # 3. SIMULAR OPERACIONES DE E/S (cada 5 pasos)
            if step % 5 == 0 and io_manager:
                # Procesar colas de E/S
                io_manager.process_io_queues(time.time(), 'FCFS')
                
                # Algunos procesos en READY pueden solicitar E/S
                ready_processes = [pid for pid in process_manager.ready_queue[:2]]
                for pid in ready_processes:
                    if len(io_manager.devices) > 0:
                        device_name = list(io_manager.devices.keys())[0]
                        io_manager.request_io(pid, device_name, 'read', 512, 5)
            
            # 4. ACTUALIZAR MEMORIA (simular accesos a páginas si es paging)
            if memory_manager and memory_manager.mode == 'paging' and step % 3 == 0:
                # Simular accesos a páginas del proceso en ejecución
                if process_manager.running_process:
                    pid = process_manager.running_process
                    if pid in memory_manager.paging_manager.page_tables:
                        num_pages = len(memory_manager.paging_manager.page_tables[pid])
                        # Acceder a una página aleatoria
                        import random
                        page_to_access = random.randint(0, min(num_pages - 1, 5))
                        fault = memory_manager.paging_manager.access_page(pid, page_to_access)
                        if fault:
                            memory_manager.paging_manager.load_page(pid, page_to_access, 'LRU')
            
            current_time += 1
            time.sleep(0.05)  # Pausa breve
        
        # OBTENER RESULTADOS FINALES
        metrics = cpu_scheduler.calculate_metrics()
        processes = process_manager.get_all_processes_info()
        memory_state = memory_manager.get_memory_state() if memory_manager else {}
        io_stats = io_manager.get_statistics() if io_manager else {}
        io_devices = io_manager.get_devices_state() if io_manager else []
        
        # Asignar colores al timeline
        colors = ['#1e90ff', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da', '#feca57', '#48dbfb']
        pid_colors = {}
        color_idx = 0
        
        for segment in execution_timeline:
            if segment['pid'] not in pid_colors:
                pid_colors[segment['pid']] = colors[color_idx % len(colors)]
                color_idx += 1
            segment['color'] = pid_colors[segment['pid']]
        
        print(f"\n{'='*60}")
        print("✅ Simulación INTEGRADA completada")
        print('='*60)
        print(f"📊 Métricas CPU:")
        print(f"  - Tiempo espera promedio: {metrics.get('avg_waiting_time', 0):.2f}")
        print(f"  - Tiempo retorno promedio: {metrics.get('avg_turnaround_time', 0):.2f}")
        print(f"  - Throughput: {metrics.get('throughput', 0)} procesos")
        print(f"  - Context Switches: {metrics.get('total_context_switches', 0)}")
        
        if memory_state.get('mode') == 'paging':
            print(f"\n🧠 Métricas Memoria:")
            print(f"  - Page Faults: {memory_state.get('page_faults', 0)}")
            print(f"  - Accesos totales: {memory_state.get('page_accesses', 0)}")
            if memory_state.get('page_accesses', 0) > 0:
                hit_rate = ((memory_state['page_accesses'] - memory_state.get('page_faults', 0)) 
                           / memory_state['page_accesses'] * 100)
                print(f"  - Tasa de aciertos: {hit_rate:.1f}%")
        
        if io_stats:
            print(f"\n📡 Métricas E/S:")
            print(f"  - Solicitudes totales: {io_stats.get('total_requests', 0)}")
            print(f"  - Completadas: {io_stats.get('completed_requests', 0)}")
            print(f"  - Interrupciones: {io_stats.get('total_interrupts', 0)}")
        
        print('='*60)
        
        return jsonify({
            'status': 'success',
            'message': 'Simulación integrada completada',
            'timeline': execution_timeline,  # Timeline para el diagrama de Gantt
            'metrics': {
                'cpu': {
                    'avg_waiting_time': metrics.get('avg_waiting_time', 0),
                    'avg_turnaround_time': metrics.get('avg_turnaround_time', 0),
                    'avg_response_time': metrics.get('avg_response_time', 0),
                    'throughput': metrics.get('throughput', 0),
                    'total_context_switches': metrics.get('total_context_switches', 0)
                },
                'memory': {
                    'page_faults': memory_state.get('page_faults', 0),
                    'page_accesses': memory_state.get('page_accesses', 0),
                    'hit_rate': (((memory_state.get('page_accesses', 0) - memory_state.get('page_faults', 0)) 
                                 / memory_state.get('page_accesses', 1) * 100) 
                                if memory_state.get('page_accesses', 0) > 0 else 0)
                } if memory_state.get('mode') == 'paging' else {},
                'io': io_stats
            },
            'processes': processes,
            'memory_state': memory_state,
            'io_devices': io_devices
        }), 200
    except Exception as e:
        print(f"❌ Error en simulación: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== MEMORIA ====================

@app.route('/api/memory/state', methods=['GET'])
def get_memory_state():
    """Obtiene estado de memoria usando MemoryManager.get_memory_state()"""
    global memory_manager
    
    if not kernel_initialized or not memory_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método get_memory_state() del MemoryManager
        memory_state = memory_manager.get_memory_state()
        return jsonify({
            'status': 'success',
            'data': memory_state
        }), 200
    except Exception as e:
        print(f"❌ Error obteniendo estado de memoria: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/memory/allocate', methods=['POST'])
def allocate_memory():
    """Asigna memoria usando MemoryManager.allocate()"""
    global memory_manager
    
    if not kernel_initialized or not memory_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        pid = data.get('pid')
        size = data.get('size')
        algorithm = data.get('algorithm', 'first_fit')
        
        # Usar el método allocate() del MemoryManager
        success = memory_manager.allocate(pid, size, algorithm)
        
        return jsonify({
            'status': 'success' if success else 'error',
            'message': 'Memoria asignada' if success else 'No hay memoria disponible',
            'allocated': success
        }), 200
    except Exception as e:
        print(f"❌ Error asignando memoria: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/memory/deallocate', methods=['POST'])
def deallocate_memory():
    """Libera memoria usando MemoryManager.deallocate()"""
    global memory_manager
    
    if not kernel_initialized or not memory_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        pid = data.get('pid')
        
        # Usar el método deallocate() del MemoryManager
        memory_manager.deallocate(pid)
        
        return jsonify({
            'status': 'success',
            'message': f'Memoria liberada para proceso {pid}'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== DISPOSITIVOS E/S ====================

@app.route('/api/io/devices', methods=['GET'])
def get_io_devices():
    """Obtiene dispositivos usando IOManager.get_devices_state()"""
    global io_manager
    
    if not kernel_initialized or not io_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método get_devices_state() del IOManager
        devices = io_manager.get_devices_state()
        return jsonify({
            'status': 'success',
            'data': devices
        }), 200
    except Exception as e:
        print(f"❌ Error obteniendo dispositivos: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/request', methods=['POST'])
def request_io():
    """Crea solicitud de E/S usando IOManager.request_io()"""
    global io_manager
    
    if not kernel_initialized or not io_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        process_id = data.get('process_id')
        device_name = data.get('device_name')
        operation = data.get('operation', 'read')
        data_size = data.get('data_size', 1024)
        priority = data.get('priority', 5)
        
        # Usar el método request_io() del IOManager
        request_id = io_manager.request_io(
            process_id, device_name, operation, data_size, priority
        )
        
        return jsonify({
            'status': 'success',
            'request_id': request_id,
            'message': f'Solicitud {request_id} creada para dispositivo {device_name}'
        }), 200
    except Exception as e:
        print(f"❌ Error creando solicitud E/S: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/process', methods=['POST'])
def process_io():
    """Procesa colas de E/S usando IOManager.process_io_queues()"""
    global io_manager
    
    if not kernel_initialized or not io_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json or {}
        scheduler = data.get('scheduler', 'FCFS')
        
        # Usar el método process_io_queues() del IOManager
        io_manager.process_io_queues(time.time(), scheduler)
        
        # Obtener estadísticas actualizadas
        stats = io_manager.get_statistics()
        
        return jsonify({
            'status': 'success',
            'message': 'Colas de E/S procesadas',
            'statistics': stats
        }), 200
    except Exception as e:
        print(f"❌ Error procesando E/S: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/io/statistics', methods=['GET'])
def get_io_statistics():
    """Obtiene estadísticas usando IOManager.get_statistics()"""
    global io_manager
    
    if not kernel_initialized or not io_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método get_statistics() del IOManager
        stats = io_manager.get_statistics()
        return jsonify({
            'status': 'success',
            'data': stats
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== CONCURRENCIA ====================

@app.route('/api/concurrency/create-semaphore', methods=['POST'])
def create_semaphore():
    """Crea semáforo usando ConcurrencyManager.create_semaphore()"""
    global concurrency_manager
    
    if not kernel_initialized or not concurrency_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        name = data.get('name')
        initial_value = data.get('initial_value', 1)
        max_value = data.get('max_value')
        
        # Usar el método create_semaphore() del ConcurrencyManager
        concurrency_manager.create_semaphore(name, initial_value, max_value)
        
        return jsonify({
            'status': 'success',
            'message': f'Semáforo {name} creado con valor inicial {initial_value}'
        }), 200
    except Exception as e:
        print(f"❌ Error creando semáforo: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/create-mutex', methods=['POST'])
def create_mutex():
    """Crea mutex usando ConcurrencyManager.create_mutex()"""
    global concurrency_manager
    
    if not kernel_initialized or not concurrency_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        name = data.get('name')
        
        # Usar el método create_mutex() del ConcurrencyManager
        concurrency_manager.create_mutex(name)
        
        return jsonify({
            'status': 'success',
            'message': f'Mutex {name} creado'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/bankers/initialize', methods=['POST'])
def initialize_bankers():
    """Inicializa algoritmo del banquero usando ConcurrencyManager.initialize_bankers()"""
    global concurrency_manager
    
    if not kernel_initialized or not concurrency_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        data = request.json
        resources = data.get('resources', [10, 5, 7])
        
        # Usar el método initialize_bankers() del ConcurrencyManager
        concurrency_manager.initialize_bankers(resources)
        
        return jsonify({
            'status': 'success',
            'message': f'Algoritmo del Banquero inicializado con recursos: {resources}'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/deadlock/check', methods=['GET'])
def check_deadlock():
    """Verifica deadlock usando ConcurrencyManager.check_deadlock()"""
    global concurrency_manager
    
    if not kernel_initialized or not concurrency_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método check_deadlock() del ConcurrencyManager
        deadlocked = concurrency_manager.check_deadlock()
        
        return jsonify({
            'status': 'success',
            'deadlock_detected': deadlocked is not None,
            'deadlocked_processes': deadlocked if deadlocked else []
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/concurrency/state', methods=['GET'])
def get_concurrency_state():
    """Obtiene estado usando ConcurrencyManager.get_concurrency_state()"""
    global concurrency_manager
    
    if not kernel_initialized or not concurrency_manager:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Usar el método get_concurrency_state() del ConcurrencyManager
        state = concurrency_manager.get_concurrency_state()
        return jsonify({
            'status': 'success',
            'data': state
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ==================== SISTEMA COMPLETO ====================

@app.route('/api/system/state', methods=['GET'])
def get_system_state():
    """Obtiene estado completo del sistema usando TODOS los managers"""
    global process_manager, cpu_scheduler, memory_manager, io_manager, concurrency_manager
    
    if not kernel_initialized:
        return jsonify({'status': 'error', 'message': 'Kernel no inicializado'}), 400
    
    try:
        # Recopilar datos de TODOS los módulos
        system_state = {
            'processes': process_manager.get_all_processes_info() if process_manager else [],
            'cpu': cpu_scheduler.get_cpu_state() if cpu_scheduler else {},
            'cpu_metrics': cpu_scheduler.calculate_metrics() if cpu_scheduler else {},
            'memory': memory_manager.get_memory_state() if memory_manager else {},
            'io_devices': io_manager.get_devices_state() if io_manager else [],
            'io_statistics': io_manager.get_statistics() if io_manager else {},
            'concurrency': concurrency_manager.get_concurrency_state() if concurrency_manager else {}
        }
        
        return jsonify({
            'status': 'success',
            'data': system_state
        }), 200
    except Exception as e:
        print(f"❌ Error obteniendo estado del sistema: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("="*60)
    print("🚀 Iniciando SO-Lite API Server")
    print("="*60)
    print("📡 Endpoints disponibles:")
    print("  - GET  /api/health")
    print("  - POST /api/kernel/initialize")
    print("  - POST /api/processes/create")
    print("  - GET  /api/processes")
    print("  - POST /api/cpu/schedule")
    print("  - POST /api/cpu/simulate")
    print("  - POST /api/simulation/run  ⭐ (Para simulaciones completas)")
    print("  - GET  /api/cpu/metrics")
    print("  - GET  /api/memory/state")
    print("  - POST /api/memory/allocate")
    print("  - GET  /api/io/devices")
    print("  - POST /api/io/request")
    print("  - POST /api/io/process")
    print("  - GET  /api/io/statistics")
    print("  - POST /api/concurrency/create-semaphore")
    print("  - POST /api/concurrency/create-mutex")
    print("  - GET  /api/concurrency/state")
    print("  - GET  /api/system/state")
    print("="*60)
    print("✅ Servidor corriendo en http://localhost:5000")
    print("="*60)
    
    app.run(debug=True, port=5000, host='0.0.0.0')