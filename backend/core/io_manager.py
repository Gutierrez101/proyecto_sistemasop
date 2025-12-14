import time


class IOManager:
    def __init__(self):
        self.devices = {}
        self._next_request_id = 1

    def initialize(self):
        # Create default devices for stubbing/demo purposes
        # Each device stores a queue and some simple stats
        self.devices = {
            'disk0': {
                'name': 'Disk 0',
                'type': 'DISK',
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            },
            'printer0': {
                'name': 'Printer 0',
                'type': 'PRINTER',
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            },
            'keyboard0': {
                'name': 'Keyboard',
                'type': 'KEYBOARD',
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            },
            'network0': {
                'name': 'Network',
                'type': 'NETWORK',
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            },
            'usb0': {
                'name': 'USB Hub',
                'type': 'USB',
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            }
        }
        return True

    def process_io_queues(self, current_time=None, scheduler='FCFS'):
        # noop stub
        return True

    def request_io(self, pid, device_name, operation, data_size, priority):
        req_id = self._next_request_id
        self._next_request_id += 1
        # store minimal info
        # ensure device exists; if not, create a simple entry
        if device_name not in self.devices:
            # normalize simple name
            self.devices[device_name] = {
                'name': device_name,
                'type': device_name.upper(),
                'status': 'IDLE',
                'queue': [],
                'total_operations': 0,
                'current_request': None,
                'avg_waiting_time': 0.0
            }
        self.devices[device_name]['queue'].append({'id': req_id, 'pid': pid, 'op': operation, 'size': data_size, 'priority': priority})
        self.devices[device_name]['total_operations'] = self.devices[device_name].get('total_operations', 0) + 1
        # set as current request if idle
        if not self.devices[device_name].get('current_request'):
            self.devices[device_name]['current_request'] = req_id
            self.devices[device_name]['status'] = 'BUSY'
        return req_id

    def get_statistics(self):
        # very basic aggregated statistics from devices
        total_requests = sum(len(d.get('queue', [])) + (1 if d.get('current_request') else 0) for d in self.devices.values())
        completed = 0
        interrupts = 0
        return {'total_requests': total_requests, 'completed_requests': completed, 'total_interrupts': interrupts, 'avg_turnaround_time': 0}

    def get_devices_state(self):
        # Return a list of device state objects expected by the frontend
        out = []
        for key, d in self.devices.items():
            out.append({
                'name': d.get('name', key),
                'type': d.get('type', '').upper(),
                'status': d.get('status', 'IDLE'),
                'queue_length': len(d.get('queue', [])),
                'total_operations': d.get('total_operations', 0),
                'current_request': d.get('current_request'),
                'avg_waiting_time': d.get('avg_waiting_time', 0.0)
            })
        return out
