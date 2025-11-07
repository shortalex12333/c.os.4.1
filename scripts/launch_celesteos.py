#!/usr/bin/env python3
"""
CelesteOS Complete Launch Script
Manages all services and dependencies for the CelesteOS application
"""

import subprocess
import time
import socket
import json
import sys
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import signal
import atexit
from pathlib import Path

class ServiceStatus(Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    FAILED = "failed"
    CHECKING = "checking"

class Colors:
    """Terminal colors for output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

@dataclass
class Service:
    """Service configuration"""
    name: str
    ports: List[int]
    start_command: str
    check_command: str
    health_endpoint: Optional[str] = None
    depends_on: List[str] = None
    wait_time: int = 3
    cwd: Optional[str] = None
    background: bool = True
    process: Optional[subprocess.Popen] = None

class CelesteOSLauncher:
    """Main launcher for CelesteOS services"""

    def __init__(self):
        self.base_dir = Path(__file__).parent.absolute()
        self.services: Dict[str, Service] = {}
        self.running_processes: List[subprocess.Popen] = []
        self.setup_services()
        self.setup_signal_handlers()

    def setup_signal_handlers(self):
        """Setup cleanup on exit"""
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        atexit.register(self.cleanup)

    def cleanup(self, *args):
        """Clean shutdown of all services"""
        print(f"\n{Colors.WARNING}Shutting down services...{Colors.ENDC}")

        # Stop services in reverse order
        for service_name in reversed(list(self.services.keys())):
            service = self.services[service_name]
            if service.process:
                print(f"  Stopping {service.name}...")
                try:
                    service.process.terminate()
                    service.process.wait(timeout=5)
                except:
                    service.process.kill()

        sys.exit(0)

    def setup_services(self):
        """Define all services and their configurations"""

        # Podman Machine (required for Supabase)
        self.services["podman"] = Service(
            name="Podman Machine",
            ports=[],
            start_command="podman machine start",
            check_command="podman machine info | grep 'machinestate: Running'",
            wait_time=10,
            background=False
        )

        # Supabase (all services)
        # Note: REST API is accessed through Kong gateway at port 54321/rest/v1/
        # Port 54323 is Studio (web UI), NOT the REST API
        self.services["supabase"] = Service(
            name="Supabase",
            ports=[54321, 54322, 54323, 54324, 54327],  # Gateway, DB, Studio, Inbucket, Analytics
            start_command="supabase start",
            check_command="curl -s http://127.0.0.1:54321/auth/v1/health",
            health_endpoint="http://127.0.0.1:54321/auth/v1/health",
            depends_on=["podman"],
            wait_time=20,  # Increased wait time for container startup
            cwd=str(self.base_dir),
            background=False
        )

        # Vite Dev Server
        self.services["vite"] = Service(
            name="Vite Dev Server",
            ports=[8082],
            start_command="npm run dev",
            check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:8082",
            health_endpoint="http://localhost:8082",
            cwd=str(self.base_dir),
            wait_time=5
        )

        # Caddy HTTP Proxy
        self.services["caddy"] = Service(
            name="Caddy HTTP Proxy",
            ports=[80],
            start_command="caddy run --config dev-proxy/Caddyfile-single-label",
            check_command="curl -s -o /dev/null -w '%{http_code}' http://celesteos.local",
            health_endpoint="http://celesteos.local",
            depends_on=["vite"],
            cwd=str(self.base_dir),
            wait_time=3
        )

        # mDNS Service Discovery
        self.services["mdns"] = Service(
            name="mDNS Discovery",
            ports=[],
            start_command="python3 infra/mdns/advertise-mdns.py 80",
            check_command="ps aux | grep -q '[a]dvertise-mdns.py'",
            depends_on=["caddy"],
            cwd=str(self.base_dir),
            wait_time=2
        )

        # n8n Workflow Automation
        self.services["n8n"] = Service(
            name="n8n Workflow Automation",
            ports=[5678],
            start_command="n8n start",
            check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:5678 | grep -q 200",
            health_endpoint="http://localhost:5678",
            depends_on=["supabase"],  # May need Supabase for webhook data storage
            wait_time=5
        )

        # Token Counter Service
        self.services["token_counter"] = Service(
            name="Token Counter Service",
            ports=[3000],
            start_command="python3 token_counter_service.py",
            check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
            health_endpoint="http://localhost:3000",
            cwd=str(self.base_dir),
            wait_time=3
        )

        # FastAPI Document Processing - DISABLED (not currently in use)
        # NOTE: Uncomment if needed, but verify api/main.py exists first
        # self.services["fastapi"] = Service(
        #     name="FastAPI Document Processing",
        #     ports=[8000],
        #     start_command="python3 api/main.py",
        #     check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health",
        #     health_endpoint="http://localhost:8000",
        #     depends_on=["supabase"],
        #     cwd=str(self.base_dir),
        #     wait_time=5
        # )

        # Yacht Search Frontend - DISABLED (port 3000 used by token_counter)
        # NOTE: If needed, change to different port or stop token_counter
        # self.services["yacht_frontend"] = Service(
        #     name="Yacht Search Frontend",
        #     ports=[3001],  # Changed from 3000 to avoid conflict
        #     start_command="npm start",
        #     check_command="curl -s -o /dev/null -w '%{http_code}' http://localhost:3001",
        #     health_endpoint="http://localhost:3001",
        #     depends_on=[],
        #     cwd=str(self.base_dir / "yacht-frontend"),
        #     wait_time=8
        # )

    def check_port(self, port: int) -> bool:
        """Check if a port is available"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result != 0  # True if port is free

    def check_ports(self, service: Service) -> Tuple[bool, List[int]]:
        """Check if all required ports are available"""
        blocked_ports = []
        for port in service.ports:
            if not self.check_port(port):
                blocked_ports.append(port)
        return len(blocked_ports) == 0, blocked_ports

    def get_process_on_port(self, port: int) -> Optional[str]:
        """Get process name using a port"""
        try:
            result = subprocess.run(
                f"lsof -i :{port} | grep LISTEN | awk '{{print $1}}'",
                shell=True, capture_output=True, text=True
            )
            return result.stdout.strip() if result.stdout else None
        except:
            return None

    def print_status(self, message: str, status: ServiceStatus):
        """Print colored status message"""
        colors = {
            ServiceStatus.RUNNING: Colors.OKGREEN,
            ServiceStatus.FAILED: Colors.FAIL,
            ServiceStatus.STARTING: Colors.OKBLUE,
            ServiceStatus.CHECKING: Colors.WARNING,
            ServiceStatus.STOPPED: Colors.FAIL
        }

        status_symbol = {
            ServiceStatus.RUNNING: "✓",
            ServiceStatus.FAILED: "✗",
            ServiceStatus.STARTING: "⟳",
            ServiceStatus.CHECKING: "?",
            ServiceStatus.STOPPED: "○"
        }

        color = colors.get(status, Colors.ENDC)
        symbol = status_symbol.get(status, "")
        print(f"{color}[{symbol}] {message}{Colors.ENDC}")

    def start_service(self, service_name: str) -> bool:
        """Start a single service"""
        if service_name not in self.services:
            print(f"Unknown service: {service_name}")
            return False

        service = self.services[service_name]

        # Check dependencies
        if service.depends_on:
            for dep in service.depends_on:
                if not self.is_service_running(dep):
                    self.print_status(f"{service.name} depends on {dep}, starting it first...",
                                    ServiceStatus.STARTING)
                    if not self.start_service(dep):
                        return False

        self.print_status(f"Starting {service.name}...", ServiceStatus.STARTING)

        # Check ports
        if service.ports:
            available, blocked = self.check_ports(service)
            if not available:
                for port in blocked:
                    process = self.get_process_on_port(port)
                    self.print_status(
                        f"  Port {port} is in use by {process or 'unknown process'}",
                        ServiceStatus.FAILED
                    )

                response = input(f"\n{Colors.WARNING}Kill blocking processes? (y/n): {Colors.ENDC}")
                if response.lower() == 'y':
                    for port in blocked:
                        subprocess.run(f"lsof -ti :{port} | xargs kill -9", shell=True)
                        time.sleep(1)
                else:
                    return False

        # Start the service
        try:
            if service.background:
                service.process = subprocess.Popen(
                    service.start_command,
                    shell=True,
                    cwd=service.cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    start_new_session=True
                )
                self.running_processes.append(service.process)
            else:
                result = subprocess.run(
                    service.start_command,
                    shell=True,
                    cwd=service.cwd,
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    self.print_status(f"Failed to start {service.name}: {result.stderr}",
                                    ServiceStatus.FAILED)
                    return False

            # Wait for service to start
            time.sleep(service.wait_time)

            # Check if service is running
            if self.is_service_running(service_name):
                self.print_status(f"{service.name} started successfully", ServiceStatus.RUNNING)
                return True
            else:
                self.print_status(f"{service.name} failed to start", ServiceStatus.FAILED)
                return False

        except Exception as e:
            self.print_status(f"Error starting {service.name}: {str(e)}", ServiceStatus.FAILED)
            return False

    def is_service_running(self, service_name: str) -> bool:
        """Check if a service is running"""
        if service_name not in self.services:
            return False

        service = self.services[service_name]

        # Try health endpoint first
        if service.health_endpoint:
            try:
                import requests
                import warnings
                warnings.filterwarnings("ignore", message="Unverified HTTPS")
                response = requests.get(service.health_endpoint, timeout=2, verify=False)
                return response.status_code < 500
            except:
                pass

        # Try check command with timeout
        if service.check_command:
            try:
                result = subprocess.run(
                    service.check_command,
                    shell=True,
                    capture_output=True,
                    cwd=service.cwd,
                    timeout=3  # 3 second timeout
                )
                return result.returncode == 0
            except subprocess.TimeoutExpired:
                return False
            except:
                pass

        # Check if process is running
        if service.process:
            return service.process.poll() is None

        return False

    def health_check(self) -> Dict[str, bool]:
        """Perform health check on all services"""
        print(f"\n{Colors.HEADER}=== Health Check ==={Colors.ENDC}")

        health_status = {}
        for name, service in self.services.items():
            is_running = self.is_service_running(name)
            health_status[name] = is_running

            status = ServiceStatus.RUNNING if is_running else ServiceStatus.STOPPED
            self.print_status(f"{service.name}: {status.value}", status)

            if is_running and service.ports:
                for port in service.ports:
                    port_status = not self.check_port(port)
                    if port_status:
                        print(f"    Port {port}: ✓ listening")

        return health_status

    def launch_all(self):
        """Launch all services in order"""
        print(f"{Colors.HEADER}{Colors.BOLD}CelesteOS Service Launcher{Colors.ENDC}")
        print(f"{Colors.HEADER}{'='*50}{Colors.ENDC}\n")

        # Check current status
        print(f"{Colors.OKBLUE}Checking current service status...{Colors.ENDC}")
        initial_health = self.health_check()

        # Start services
        print(f"\n{Colors.OKBLUE}Starting services...{Colors.ENDC}")
        service_order = ["podman", "supabase", "n8n", "token_counter", "vite", "caddy", "mdns"]

        for service_name in service_order:
            if not initial_health.get(service_name, False):
                if not self.start_service(service_name):
                    self.print_status(f"Failed to start {service_name}, aborting",
                                    ServiceStatus.FAILED)
                    return False
            else:
                self.print_status(f"{self.services[service_name].name} already running",
                                ServiceStatus.RUNNING)

        # Final health check
        print(f"\n{Colors.OKGREEN}All services started!{Colors.ENDC}")
        time.sleep(2)
        self.health_check()

        # Print access URLs
        print(f"\n{Colors.HEADER}=== Access Points ==={Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ Local Development: http://localhost:8082{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ LAN Access (Apple devices): http://celesteos.local:8082{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ LAN Access (All devices): http://192.168.1.44:8082{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ Token Counter Service: http://localhost:3000{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ n8n Workflow UI: http://localhost:5678{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ Supabase Studio: http://localhost:54323{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✓ Supabase API: http://localhost:54321{Colors.ENDC}")
        print(f"{Colors.OKBLUE}  - REST: http://localhost:54321/rest/v1/{Colors.ENDC}")
        print(f"{Colors.OKBLUE}  - Auth: http://localhost:54321/auth/v1/{Colors.ENDC}")

        print(f"\n{Colors.WARNING}Press Ctrl+C to stop all services{Colors.ENDC}")

        # Keep running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

        return True

def main():
    """Main entry point"""
    launcher = CelesteOSLauncher()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "start":
            launcher.launch_all()
        elif command == "stop":
            launcher.cleanup()
        elif command == "status":
            launcher.health_check()
        elif command == "restart":
            launcher.cleanup()
            time.sleep(2)
            launcher.launch_all()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python3 launch_celesteos.py [start|stop|status|restart]")
    else:
        # Default: start all
        launcher.launch_all()

if __name__ == "__main__":
    main()