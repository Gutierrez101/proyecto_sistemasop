from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class PCB:
    pid: int
    name: str
    priority: int
    burst_time: int
    remaining_time: int
    state: str = 'NEW'
    waiting_time: int = 0
    turnaround_time: int = 0
    response_time: int = -1
    context_switches: int = 0


class ProcessManager:
    def __init__(self):
        self.processes: Dict[int, PCB] = {}
        self.ready_queue: List[int] = []
        self.running_process: Optional[int] = None
        self._next_pid = 1

    def create_process(self, name: str, priority: int, burst_time: int, memory_required: int = 0) -> int:
        pid = self._next_pid
        self._next_pid += 1
        pcb = PCB(pid=pid, name=name, priority=priority, burst_time=burst_time, remaining_time=burst_time, state='READY')
        self.processes[pid] = pcb
        self.ready_queue.append(pid)
        return pid

    def update_waiting_times(self):
        for pid in list(self.ready_queue):
            self.processes[pid].waiting_time += 1

    def execute_process(self, pid: int, time_units: int) -> bool:
        pcb = self.processes.get(pid)
        if not pcb:
            return True
        if pcb.response_time < 0:
            pcb.response_time = pcb.waiting_time
        pcb.remaining_time -= time_units
        if pcb.remaining_time <= 0:
            pcb.remaining_time = 0
            pcb.state = 'TERMINATED'
            pcb.turnaround_time = pcb.waiting_time + pcb.burst_time
            if self.running_process == pid:
                self.running_process = None
            return True
        return False

    def transition_to_running(self, pid: int) -> bool:
        if pid in self.ready_queue:
            try:
                self.ready_queue.remove(pid)
            except ValueError:
                pass
            self.running_process = pid
            self.processes[pid].state = 'RUNNING'
            return True
        return False

    def transition_to_ready(self, pid: int) -> bool:
        if self.running_process == pid:
            self.running_process = None
        if pid not in self.ready_queue and self.processes.get(pid):
            self.ready_queue.append(pid)
            self.processes[pid].state = 'READY'
            return True
        return False

    def transition_to_waiting(self, pid: int, reason: str = 'IO') -> None:
        if self.running_process == pid:
            self.running_process = None
        if pid in self.ready_queue:
            try:
                self.ready_queue.remove(pid)
            except ValueError:
                pass
        if pid in self.processes:
            self.processes[pid].state = 'WAITING'

    def terminate_process(self, pid: int) -> None:
        if pid in self.processes:
            self.processes[pid].state = 'TERMINATED'
        if pid in self.ready_queue:
            try:
                self.ready_queue.remove(pid)
            except ValueError:
                pass
        if self.running_process == pid:
            self.running_process = None

    def get_all_processes_info(self):
        return [
            {
                'pid': p.pid,
                'name': p.name,
                'priority': p.priority,
                'state': p.state,
                'remaining_time': p.remaining_time,
                'waiting_time': p.waiting_time,
                'turnaround_time': p.turnaround_time,
                'response_time': p.response_time,
            }
            for p in self.processes.values()
        ]
