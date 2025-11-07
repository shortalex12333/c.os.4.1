#!/usr/bin/env python3
"""
Test Script for Yacht Email Reader
Validates installation and basic functionality without GUI
"""

import sys
import os
import logging
from datetime import datetime

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import msal
        print(f"✓ MSAL version {msal.__version__}")
    except ImportError as e:
        print(f"✗ MSAL import failed: {e}")
        return False
    
    try:
        import requests
        print(f"✓ Requests version {requests.__version__}")
    except ImportError as e:
        print(f"✗ Requests import failed: {e}")
        return False
    
    try:
        import keyring
        print(f"✓ Keyring available")
    except ImportError as e:
        print(f"✗ Keyring import failed: {e}")
        return False
    
    try:
        from dateutil import parser
        print(f"✓ Python-dateutil available")
    except ImportError as e:
        print(f"✗ Python-dateutil import failed: {e}")
        return False
    
    try:
        import tkinter as tk
        print(f"✓ Tkinter available (version {tk.TkVersion})")
    except ImportError as e:
        print(f"✗ Tkinter import failed: {e}")
        return False
    
    return True

def test_config():
    """Test configuration loading"""
    print("\nTesting configuration...")
    
    try:
        import config
        
        # Check required configuration
        required_configs = ['CLIENT_ID', 'TENANT_ID', 'AUTHORITY', 'SCOPES', 'REDIRECT_URI']
        missing_configs = []
        
        for cfg in required_configs:
            if not hasattr(config, cfg):
                missing_configs.append(cfg)
            else:
                value = getattr(config, cfg)
                if cfg in ['CLIENT_ID', 'TENANT_ID'] and ('YOUR_' in str(value) or 'HERE' in str(value)):
                    print(f"⚠ {cfg} needs to be configured: {value}")
                else:
                    print(f"✓ {cfg} configured")
        
        if missing_configs:
            print(f"✗ Missing configurations: {missing_configs}")
            return False
        
        print(f"✓ Configuration loaded successfully")
        return True
        
    except ImportError as e:
        print(f"✗ Config import failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Config error: {e}")
        return False

def test_token_manager():
    """Test token manager functionality"""
    print("\nTesting token manager...")
    
    try:
        from token_manager import TokenManager
        
        # Test token manager initialization
        tm = TokenManager("test_user")
        print("✓ TokenManager initialized")
        
        # Test has_tokens (should be False for test user)
        has_tokens = tm.has_tokens()
        print(f"✓ Token check: {has_tokens}")
        
        # Test storing dummy tokens
        dummy_tokens = {
            'access_token': 'dummy_access_token',
            'refresh_token': 'dummy_refresh_token',
            'expires_in': 3600
        }
        
        if tm.store_tokens(dummy_tokens):
            print("✓ Token storage test passed")
            
            # Test retrieving tokens
            retrieved = tm.get_tokens()
            if retrieved and retrieved.get('access_token') == 'dummy_access_token':
                print("✓ Token retrieval test passed")
            else:
                print("✗ Token retrieval test failed")
                return False
            
            # Clean up test tokens
            tm.clear_tokens()
            print("✓ Token cleanup completed")
        else:
            print("✗ Token storage test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Token manager test failed: {e}")
        return False

def test_auth_manager():
    """Test auth manager initialization"""
    print("\nTesting auth manager...")
    
    try:
        from auth_manager import AuthManager
        
        # Test initialization
        auth = AuthManager("test_user")
        print("✓ AuthManager initialized")
        
        # Test authentication check
        is_auth = auth.is_authenticated()
        print(f"✓ Authentication check: {is_auth}")
        
        return True
        
    except Exception as e:
        print(f"✗ Auth manager test failed: {e}")
        return False

def test_graph_client():
    """Test graph client initialization"""
    print("\nTesting graph client...")
    
    try:
        from auth_manager import AuthManager
        from graph_client import GraphClient
        
        # Test initialization
        auth = AuthManager("test_user")
        graph = GraphClient(auth)
        print("✓ GraphClient initialized")
        
        return True
        
    except Exception as e:
        print(f"✗ Graph client test failed: {e}")
        return False

def test_error_handler():
    """Test error handling components"""
    print("\nTesting error handler...")
    
    try:
        from error_handler import ErrorHandler, retry_on_error, NetworkError
        
        # Test error handler initialization
        eh = ErrorHandler()
        print("✓ ErrorHandler initialized")
        
        # Test network connectivity check
        is_online = eh.check_network_connectivity()
        print(f"✓ Network connectivity: {is_online}")
        
        # Test retry decorator
        @retry_on_error(max_retries=1, exceptions=(ValueError,))
        def test_retry_func():
            return "success"
        
        result = test_retry_func()
        if result == "success":
            print("✓ Retry decorator test passed")
        else:
            print("✗ Retry decorator test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error handler test failed: {e}")
        return False

def test_gui_imports():
    """Test GUI components can be imported"""
    print("\nTesting GUI imports...")
    
    try:
        from gui_app import YachtEmailReaderApp
        print("✓ GUI application class imported")
        
        # Test that we can create the app object (but don't run it)
        # This tests that all imports work
        import tkinter as tk
        root = tk.Tk()
        root.withdraw()  # Hide the window
        
        # We can't easily test the full GUI without running it
        # but we can test that initialization doesn't crash
        print("✓ Tkinter root window created")
        root.destroy()
        
        return True
        
    except Exception as e:
        print(f"✗ GUI test failed: {e}")
        return False

def run_all_tests():
    """Run all tests and report results"""
    print("=" * 50)
    print("Yacht Email Reader - Installation Test")
    print("=" * 50)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python version: {sys.version}")
    print(f"Operating system: {os.name} - {sys.platform}")
    print("")
    
    tests = [
        ("Import Test", test_imports),
        ("Configuration Test", test_config),
        ("Token Manager Test", test_token_manager),
        ("Auth Manager Test", test_auth_manager),
        ("Graph Client Test", test_graph_client),
        ("Error Handler Test", test_error_handler),
        ("GUI Import Test", test_gui_imports),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"✓ {test_name} PASSED")
            else:
                failed += 1
                print(f"✗ {test_name} FAILED")
        except Exception as e:
            failed += 1
            print(f"✗ {test_name} FAILED with exception: {e}")
        print("")
    
    print("=" * 50)
    print("Test Summary:")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Total:  {passed + failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! The application is ready to use.")
        print("\nNext steps:")
        print("1. Configure your Azure AD app registration")
        print("2. Update config.py with your CLIENT_ID and TENANT_ID")
        print("3. Run the application: python3 gui_app.py")
        return True
    else:
        print(f"\n❌ {failed} test(s) failed. Please fix the issues before using the application.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)