class PagingManager:
    def __init__(self):
        self.page_tables = {}  # pid -> list of pages

    def access_page(self, pid, page_index):
        # Return False = no page fault by default
        return False

    def load_page(self, pid, page_index, strategy='LRU'):
        # Ensure page table exists
        if pid not in self.page_tables:
            self.page_tables[pid] = []
        while len(self.page_tables[pid]) <= page_index:
            self.page_tables[pid].append(None)


class MemoryManager:
    def __init__(self, total_memory=1024, mode='paging'):
        self.total_memory = total_memory
        self.mode = mode
        self.paging_manager = PagingManager()
        self.page_faults = 0
        self.page_accesses = 0
        self.frames = []
        self.partitions = []

    def initialize(self):
        # initialize frames and partitions according to total_memory
        total_frames = max(1, self.total_memory // 4)
        # ✅ INICIALIZAR FRAMES CORRECTAMENTE
        self.frames = [
            {'frame': i, 'occupied': False, 'process': None} 
            for i in range(total_frames)
        ]

        # Create simple partitions (equal chunks) for partition mode
        num_partitions = 4
        part_size = max(1, self.total_memory // num_partitions)
        self.partitions = [
            {'id': i, 'size': part_size, 'allocated': False, 'pid': None} 
            for i in range(num_partitions)
        ]
        
        print(f"✅ MemoryManager inicializado: {total_frames} frames, modo: {self.mode}")
        return True

    def allocate(self, pid, size, algorithm='first_fit'):
        """Asigna memoria a un proceso"""
        print(f"🔧 Intentando asignar {size}KB al proceso {pid} (modo: {self.mode})")
        
        if self.mode == 'partitions':
            # find first partition with enough size and not allocated
            for p in self.partitions:
                if (not p['allocated']) and p['size'] >= size:
                    p['allocated'] = True
                    p['pid'] = pid
                    print(f"✅ Partición {p['id']} asignada al proceso {pid}")
                    return True
            print(f"❌ No hay particiones disponibles para {size}KB")
            return False

        # ✅ MODO PAGING: Asignar frames
        pages_needed = max(1, (size + 3) // 4)  # Redondear hacia arriba
        free_frames = [f for f in self.frames if not f['occupied']]
        
        print(f"   Páginas necesarias: {pages_needed}, Frames libres: {len(free_frames)}")
        
        if len(free_frames) < pages_needed:
            print(f"❌ No hay suficientes frames libres")
            return False
        
        # Asignar los primeros frames disponibles
        assigned = 0
        for f in self.frames:
            if not f['occupied'] and assigned < pages_needed:
                f['occupied'] = True
                f['process'] = pid
                
                # Registrar página en el paging manager
                if pid not in self.paging_manager.page_tables:
                    self.paging_manager.page_tables[pid] = []
                self.paging_manager.page_tables[pid].append({'frame': f['frame']})
                
                assigned += 1
        
        # Actualizar estadísticas
        self.page_accesses += pages_needed
        self.page_faults += pages_needed
        
        print(f"✅ Asignados {assigned} frames al proceso {pid}")
        return True

    def deallocate(self, pid):
        """Libera memoria de un proceso"""
        print(f"🔧 Liberando memoria del proceso {pid}")
        
        # Free partition allocations
        for p in self.partitions:
            if p.get('pid') == pid:
                p['allocated'] = False
                p['pid'] = None
                print(f"✅ Partición {p['id']} liberada")

        # Free frames and remove page table entries
        freed_count = 0
        for f in self.frames:
            if f.get('process') == pid:
                f['occupied'] = False
                f['process'] = None
                freed_count += 1
        
        if pid in self.paging_manager.page_tables:
            del self.paging_manager.page_tables[pid]
        
        print(f"✅ Liberados {freed_count} frames del proceso {pid}")

    def get_memory_state(self):
        """Proporciona estado completo de la memoria para el frontend"""
        state = {
            'mode': self.mode,
            'page_faults': self.page_faults,
            'page_accesses': self.page_accesses,
            'total_memory': self.total_memory
        }

        # ✅ DEVOLVER FRAMES CON INFORMACIÓN DE OCUPACIÓN
        state['total_frames'] = len(self.frames)
        state['frames'] = self.frames  # Ya contiene 'occupied' y 'process'

        # Partitions
        if self.mode == 'partitions':
            state['partitions'] = self.partitions
        else:
            state['partitions'] = []

        # Segments placeholder
        state['segments'] = []
        
        # Debug: imprimir algunos frames ocupados
        occupied_frames = [f for f in self.frames if f['occupied']]
        print(f"📊 Frames ocupados: {len(occupied_frames)}/{len(self.frames)}")
        if occupied_frames:
            print(f"   Ejemplos: {occupied_frames[:5]}")

        return state