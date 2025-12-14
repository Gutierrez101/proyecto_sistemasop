from core.io_manager import IOManager
from core.memory_manager import MemoryManager
import json

io = IOManager()
io.initialize()
mem = MemoryManager()
mem.initialize()

print('IO devices:')
print(json.dumps(io.get_devices_state(), indent=2))
print('\nIO stats:')
print(io.get_statistics())
print('\nMemory state:')
print(json.dumps(mem.get_memory_state(), indent=2))
