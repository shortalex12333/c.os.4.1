#!/usr/bin/env python3
"""
mDNS/Bonjour Advertisement for celesteos.local
Broadcasts the service on the local network without requiring DNS or hosts file changes.
"""

import socket
import time
import signal
import sys
import logging
from typing import Optional

try:
    from zeroconf import ServiceInfo, Zeroconf
    ZEROCONF_AVAILABLE = True
except ImportError:
    ZEROCONF_AVAILABLE = False

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CelesteosMDNS:
    """Manages mDNS advertisement for celesteos.local"""

    def __init__(self, port: int = 80):
        self.port = port
        self.hostname = "celesteos"
        self.domain = "local"
        self.fqdn = f"{self.hostname}.{self.domain}."
        self.service_name = f"CelesteOS Web Service._http._tcp.{self.domain}."
        self.zeroconf: Optional[Zeroconf] = None
        self.service_info: Optional[ServiceInfo] = None

    def get_lan_ip(self) -> str:
        """Auto-detect the LAN IP address"""
        try:
            # Connect to a public DNS to determine local IP
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except Exception:
            # Fallback to localhost if detection fails
            return "127.0.0.1"

    def start_zeroconf(self) -> bool:
        """Start mDNS advertisement using zeroconf library"""
        if not ZEROCONF_AVAILABLE:
            logger.error("zeroconf library not installed. Install with: pip3 install zeroconf")
            return False

        try:
            ip_address = self.get_lan_ip()
            logger.info(f"Detected LAN IP: {ip_address}")

            # Create service info
            self.service_info = ServiceInfo(
                "_http._tcp.local.",
                self.service_name,
                addresses=[socket.inet_aton(ip_address)],
                port=self.port,
                properties={
                    'path': '/',
                    'version': '1.0',
                },
                server=self.fqdn
            )

            # Start Zeroconf and register service
            self.zeroconf = Zeroconf()
            self.zeroconf.register_service(self.service_info)

            logger.info(f"✓ mDNS service registered: {self.hostname}.{self.domain} → {ip_address}:{self.port}")
            logger.info(f"  Access at: http://{self.hostname}.{self.domain}/")
            return True

        except Exception as e:
            logger.error(f"Failed to start zeroconf: {e}")
            return False

    def start_dns_sd(self) -> bool:
        """Fallback: Use macOS dns-sd command for mDNS advertisement"""
        try:
            import subprocess
            import os

            ip_address = self.get_lan_ip()
            logger.info(f"Using dns-sd (macOS native) with IP: {ip_address}")

            # Register HTTP service
            cmd = [
                "dns-sd",
                "-R",
                "CelesteOS Web",  # Service name
                "_http._tcp",      # Service type
                "local",           # Domain
                str(self.port),    # Port
                "path=/",          # TXT record
            ]

            # Also register hostname
            hostname_cmd = [
                "dns-sd",
                "-P",
                "celesteos",       # Name
                "_http._tcp",      # Service type
                "local",           # Domain
                str(self.port),    # Port
                "celesteos.local", # Hostname
                ip_address,        # IP address
                "path=/",          # TXT record
            ]

            # Start both processes
            proc1 = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            proc2 = subprocess.Popen(hostname_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            logger.info(f"✓ dns-sd service registered: celesteos.local → {ip_address}:{self.port}")
            logger.info(f"  Access at: http://celesteos.local/")

            # Keep processes alive
            try:
                proc1.wait()
                proc2.wait()
            except KeyboardInterrupt:
                proc1.terminate()
                proc2.terminate()

            return True

        except Exception as e:
            logger.error(f"Failed to start dns-sd: {e}")
            return False

    def start(self):
        """Start mDNS advertisement with appropriate method"""
        # Try zeroconf first (cross-platform)
        if ZEROCONF_AVAILABLE:
            success = self.start_zeroconf()
            if success:
                return

        # Fallback to dns-sd on macOS
        if sys.platform == "darwin":
            self.start_dns_sd()
        else:
            logger.error("No mDNS method available. Install zeroconf: pip3 install zeroconf")
            sys.exit(1)

    def stop(self):
        """Stop mDNS advertisement"""
        if self.zeroconf and self.service_info:
            logger.info("Stopping mDNS advertisement...")
            self.zeroconf.unregister_service(self.service_info)
            self.zeroconf.close()
            logger.info("✓ mDNS service unregistered")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info("\nShutdown signal received")
    if mdns_service:
        mdns_service.stop()
    sys.exit(0)

if __name__ == "__main__":
    # Parse arguments
    port = 80
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            logger.error(f"Invalid port: {sys.argv[1]}")
            sys.exit(1)

    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start mDNS service
    mdns_service = CelesteosMDNS(port=port)
    mdns_service.start()

    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        mdns_service.stop()