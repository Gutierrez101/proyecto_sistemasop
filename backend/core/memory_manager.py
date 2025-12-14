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
        self.frames = [{'frame': i, 'occupied': False, 'process': None} for i in range(total_frames)]

        # Create simple partitions (equal chunks) for partition mode
        num_partitions = 4
        part_size = max(1, self.total_memory // num_partitions)
        self.partitions = [{'id': i, 'size': part_size, 'allocated': False, 'pid': None} for i in range(num_partitions)]
        return True

    def allocate(self, pid, size, algorithm='first_fit'):
        # Basic allocation: support 'paging' and 'partitions' modes
        if self.mode == 'partitions':
            # find first partition with enough size and not allocated
            for p in self.partitions:
                if (not p['allocated']) and p['size'] >= size:
                    p['allocated'] = True
                    p['pid'] = pid
                    return True
            return False

        # paging mode: allocate frames (4 KB per frame)
        pages_needed = max(1, (size + 3) // 4)
        free_frames = [f for f in self.frames if not f['occupied']]
        if len(free_frames) < pages_needed:
            return False
        # assign first available frames
        assigned = 0
        for f in self.frames:
            if not f['occupied'] and assigned < pages_needed:
                f['occupied'] = True
                f['process'] = pid
                # record page in paging manager
                if pid not in self.paging_manager.page_tables:
                    self.paging_manager.page_tables[pid] = []
                self.paging_manager.page_tables[pid].append({'frame': f['frame']})
                assigned += 1
        # update stats
        self.page_accesses += pages_needed
        self.page_faults += pages_needed
        return True

    def deallocate(self, pid):
        # Free partition allocations
        for p in self.partitions:
            if p.get('pid') == pid:
                p['allocated'] = False
                p['pid'] = None

        # Free frames and remove page table entries
        for f in self.frames:
            if f.get('process') == pid:
                f['occupied'] = False
                f['process'] = None
        if pid in self.paging_manager.page_tables:
            del self.paging_manager.page_tables[pid]

    def get_memory_state(self):
        # Provide a richer, frontend-friendly memory state for the UI
        state = {
            'mode': self.mode,
            'page_faults': self.page_faults,
            'page_accesses': self.page_accesses,
            'total_memory': self.total_memory
        }

        # Frames / paging data (assume 4KB frames)
        total_frames = max(1, self.total_memory // 4)
        state['total_frames'] = total_frames
        frames = []
        for i in range(total_frames):
            frames.append({'frame': i, 'occupied': False, 'process': None})
        state['frames'] = frames

        # Partitions (static example) used when mode == 'partitions'
        if self.mode == 'partitions':
            # create a few example partitions if none exist
            state['partitions'] = [
                {'id': 0, 'size': max(1, self.total_memory // 4), 'allocated': False, 'pid': None},
                {'id': 1, 'size': max(1, self.total_memory // 4), 'allocated': False, 'pid': None},
                {'id': 2, 'size': max(1, self.total_memory // 4), 'allocated': False, 'pid': None},
                {'id': 3, 'size': max(1, self.total_memory // 4), 'allocated': False, 'pid': None}
            ]
        else:
            state['partitions'] = []

        # Segments placeholder
        state['segments'] = []

        return state
