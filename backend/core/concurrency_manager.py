class ConcurrencyManager:
    def __init__(self):
        self.semaphores = {}
        self.mutexes = {}

    def create_semaphore(self, name, initial_value=1, max_value=None):
        self.semaphores[name] = {'value': initial_value, 'max': max_value}

    def create_mutex(self, name):
        self.mutexes[name] = {'locked_by': None}

    def initialize_bankers(self, resources):
        self._bankers_resources = list(resources)

    def check_deadlock(self):
        return None

    def get_concurrency_state(self):
        return {'semaphores': list(self.semaphores.keys()), 'mutexes': list(self.mutexes.keys())}
