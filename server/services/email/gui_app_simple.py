"""
Simplified GUI Application for Yacht Email Reader
Using basic Tkinter widgets for better compatibility
"""

import tkinter as tk
from tkinter import messagebox, scrolledtext
import threading
import logging
from typing import List, Dict, Any, Optional
from config import APP_NAME, WINDOW_WIDTH, WINDOW_HEIGHT, validate_config
from auth_manager import AuthManager
from graph_client import GraphClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class YachtEmailReaderApp:
    """Main application class for the GUI"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(APP_NAME)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.resizable(True, True)
        self.root.configure(bg='white')
        
        # Validate configuration
        try:
            validate_config()
        except ValueError as e:
            messagebox.showerror("Configuration Error", 
                               f"Azure AD configuration is not complete:\n\n{str(e)}\n\n"
                               "Please set environment variables:\n"
                               "export AZURE_TENANT_ID=your-tenant-id\n"
                               "export AZURE_CLIENT_ID=your-client-id")
            self.root.destroy()
            return
        
        # Initialize managers
        try:
            self.auth_manager = AuthManager()
            self.graph_client = GraphClient(self.auth_manager)
        except Exception as e:
            messagebox.showerror("Initialization Error", 
                               f"Failed to initialize application:\n\n{str(e)}")
            self.root.destroy()
            return
        
        # Application state
        self.user_info = None
        self.current_emails = []
        self.selected_email = None
        
        # Create GUI
        self.create_widgets()
        
        # Check initial authentication state
        self.check_auth_status()
    
    def create_widgets(self):
        """Create all GUI widgets using basic Tkinter"""
        
        # Header Section
        header_frame = tk.Frame(self.root, bg='lightblue', height=80)
        header_frame.pack(fill='x', padx=10, pady=5)
        
        title_label = tk.Label(header_frame, text=APP_NAME, 
                              font=('Arial', 16, 'bold'), 
                              bg='lightblue', fg='darkblue')
        title_label.pack(side='left', pady=20)
        
        self.status_label = tk.Label(header_frame, text="Not authenticated", 
                                    font=('Arial', 12), 
                                    bg='lightblue', fg='red')
        self.status_label.pack(side='right', pady=20)
        
        # User info
        self.user_label = tk.Label(self.root, text="", 
                                  font=('Arial', 10), 
                                  bg='white', fg='green')
        self.user_label.pack(pady=5)
        
        # Authentication Section
        auth_frame = tk.Frame(self.root, bg='lightyellow', relief='raised', bd=2)
        auth_frame.pack(fill='x', padx=10, pady=5)
        
        auth_title = tk.Label(auth_frame, text="Authentication", 
                             font=('Arial', 12, 'bold'), 
                             bg='lightyellow')
        auth_title.pack(pady=5)
        
        button_frame = tk.Frame(auth_frame, bg='lightyellow')
        button_frame.pack(pady=5)
        
        self.login_button = tk.Button(button_frame, text="Login to Microsoft", 
                                     font=('Arial', 12), 
                                     bg='lightgreen', fg='black',
                                     width=20, height=2,
                                     command=self.handle_login)
        self.login_button.pack(side='left', padx=5)
        
        self.logout_button = tk.Button(button_frame, text="Logout", 
                                      font=('Arial', 12), 
                                      bg='lightcoral', fg='black',
                                      width=15, height=2,
                                      command=self.handle_logout,
                                      state='disabled')
        self.logout_button.pack(side='left', padx=5)
        
        # Search Section
        search_frame = tk.Frame(self.root, bg='lightcyan', relief='raised', bd=2)
        search_frame.pack(fill='x', padx=10, pady=5)
        
        search_title = tk.Label(search_frame, text="Email Search", 
                               font=('Arial', 12, 'bold'), 
                               bg='lightcyan')
        search_title.pack(pady=5)
        
        search_controls = tk.Frame(search_frame, bg='lightcyan')
        search_controls.pack(pady=5)
        
        tk.Label(search_controls, text="Search emails:", 
                bg='lightcyan').pack(side='left', padx=5)
        
        self.search_var = tk.StringVar()
        self.search_entry = tk.Entry(search_controls, textvariable=self.search_var, 
                                    width=40, font=('Arial', 10))
        self.search_entry.pack(side='left', padx=5)
        self.search_entry.bind('<Return>', lambda e: self.handle_search())
        
        self.search_button = tk.Button(search_controls, text="Search", 
                                      command=self.handle_search,
                                      bg='lightblue', state='disabled')
        self.search_button.pack(side='left', padx=5)
        
        self.clear_button = tk.Button(search_controls, text="Clear", 
                                     command=self.handle_clear,
                                     bg='lightgray', state='disabled')
        self.clear_button.pack(side='left', padx=5)
        
        # Results Section
        results_frame = tk.Frame(self.root, bg='white', relief='sunken', bd=2)
        results_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        results_title = tk.Label(results_frame, text="Email Results", 
                                font=('Arial', 12, 'bold'), 
                                bg='white')
        results_title.pack(pady=5)
        
        # Simple text area for results (replacing complex treeview)
        self.results_text = scrolledtext.ScrolledText(results_frame, 
                                                     height=10, width=80,
                                                     font=('Courier', 10),
                                                     state='disabled')
        self.results_text.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Email Details Section
        details_frame = tk.Frame(self.root, bg='white', relief='sunken', bd=2)
        details_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        details_title = tk.Label(details_frame, text="Email Details", 
                                font=('Arial', 12, 'bold'), 
                                bg='white')
        details_title.pack(pady=5)
        
        self.details_text = scrolledtext.ScrolledText(details_frame, 
                                                     height=8, width=80,
                                                     font=('Arial', 10),
                                                     state='disabled')
        self.details_text.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Status Bar
        status_frame = tk.Frame(self.root, bg='lightgray', relief='sunken', bd=1)
        status_frame.pack(fill='x', side='bottom')
        
        self.status_var = tk.StringVar(value="Ready")
        self.status_bar = tk.Label(status_frame, textvariable=self.status_var,
                                  bg='lightgray', anchor='w')
        self.status_bar.pack(fill='x', padx=5, pady=2)
    
    def check_auth_status(self):
        """Check and update authentication status"""
        try:
            if hasattr(self, 'auth_manager') and self.auth_manager.is_authenticated():
                self.update_status("Authenticated", success=True)
                self.login_button.config(state='disabled')
                self.logout_button.config(state='normal')
                self.search_button.config(state='normal')
                self.clear_button.config(state='normal')
                
                # Get user info
                threading.Thread(target=self.load_user_info, daemon=True).start()
            else:
                self.update_status("Not authenticated", success=False)
                self.login_button.config(state='normal')
                self.logout_button.config(state='disabled')
                self.search_button.config(state='disabled')
                self.clear_button.config(state='disabled')
        except Exception as e:
            logger.error(f"Error checking auth status: {str(e)}")
            self.update_status("Authentication check failed", success=False)
    
    def update_status(self, message: str, success: bool = True):
        """Update status display"""
        self.status_label.config(
            text=message,
            fg='green' if success else 'red'
        )
        self.status_var.set(message)
    
    def handle_login(self):
        """Handle login button click"""
        self.update_status("Authenticating...")
        self.login_button.config(state='disabled', text="Logging in...")
        
        def login_thread():
            success = self.auth_manager.login(callback=self.on_login_complete)
        
        threading.Thread(target=login_thread, daemon=True).start()
    
    def on_login_complete(self, success: bool, message: str):
        """Callback for login completion"""
        def update_ui():
            if success:
                self.update_status("Authenticated", success=True)
                self.login_button.config(state='disabled', text="Login to Microsoft")
                self.logout_button.config(state='normal')
                self.search_button.config(state='normal')
                self.clear_button.config(state='normal')
                
                # Load user info
                threading.Thread(target=self.load_user_info, daemon=True).start()
            else:
                self.update_status(f"Login failed: {message}", success=False)
                self.login_button.config(state='normal', text="Login to Microsoft")
                messagebox.showerror("Authentication Error", message)
        
        # Schedule UI update on main thread
        self.root.after(0, update_ui)
    
    def handle_logout(self):
        """Handle logout button click"""
        if self.auth_manager.logout():
            self.update_status("Logged out", success=True)
            self.login_button.config(state='normal')
            self.logout_button.config(state='disabled')
            self.search_button.config(state='disabled')
            self.clear_button.config(state='disabled')
            self.user_label.config(text="")
            self.clear_results()
        else:
            messagebox.showerror("Logout Error", "Failed to logout")
    
    def load_user_info(self):
        """Load user profile information"""
        try:
            self.user_info = self.graph_client.get_user_profile()
            user_text = f"Welcome, {self.user_info['displayName']} ({self.user_info['mail']})"
            self.root.after(0, lambda: self.user_label.config(text=user_text))
        except Exception as e:
            logger.error(f"Failed to load user info: {str(e)}")
            if "Authentication expired" in str(e):
                self.root.after(0, lambda: self.check_auth_status())  # Update auth status
            else:
                self.root.after(0, lambda: self.user_label.config(text="Failed to load user info"))
    
    def handle_search(self):
        """Handle search button click"""
        search_query = self.search_var.get().strip()
        
        if not search_query:
            messagebox.showwarning("No Search Term", "Please enter a search term")
            return
        
        # Validate authentication before searching
        if not self.auth_manager.is_authenticated():
            messagebox.showerror("Not Authenticated", "Please login first before searching")
            return
        
        self.update_status("Searching emails...")
        self.search_button.config(state='disabled', text="Searching...")
        
        def search_thread():
            try:
                # Get days back and max results from UI (add these controls if needed)
                try:
                    days_back = 30  # Default value
                    max_results = 25  # Reduced for faster loading
                except ValueError:
                    days_back = 30
                    max_results = 25
                
                emails = self.graph_client.search_emails(
                    search_query=search_query, 
                    days_back=days_back, 
                    max_results=max_results
                )
                self.current_emails = emails
                self.root.after(0, lambda: self.display_search_results(emails))
                self.root.after(0, lambda: self.update_status(f"Found {len(emails)} emails"))
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Search failed: {error_msg}")
                self.root.after(0, lambda: self.update_status(error_msg, success=False))
                
                # Handle specific error types
                if "Authentication expired" in error_msg:
                    self.root.after(0, lambda: self.check_auth_status())  # Update auth status
                    self.root.after(0, lambda: messagebox.showerror("Authentication Error", 
                                                                   "Your session has expired. Please login again."))
                else:
                    self.root.after(0, lambda: messagebox.showerror("Search Error", error_msg))
            finally:
                self.root.after(0, lambda: self.search_button.config(state='normal', text="Search"))
        
        threading.Thread(target=search_thread, daemon=True).start()
    
    def display_search_results(self, emails: List[Dict[str, Any]]):
        """Display search results in simple text format"""
        self.results_text.config(state='normal')
        self.results_text.delete(1.0, tk.END)
        
        if not emails:
            self.results_text.insert(tk.END, "No emails found.\n")
        else:
            self.results_text.insert(tk.END, f"Found {len(emails)} emails:\n\n")
            for i, email in enumerate(emails, 1):
                result_line = f"{i}. {email['subject']}\n"
                result_line += f"   From: {email['from']}\n"
                result_line += f"   Date: {email['receivedDateTime']}\n"
                result_line += f"   Read: {'Yes' if email['isRead'] else 'No'}\n\n"
                self.results_text.insert(tk.END, result_line)
        
        self.results_text.config(state='disabled')
    
    def handle_clear(self):
        """Clear search results"""
        self.search_var.set("")
        self.clear_results()
        self.update_status("Results cleared")
    
    def clear_results(self):
        """Clear results and details"""
        self.results_text.config(state='normal')
        self.results_text.delete(1.0, tk.END)
        self.results_text.config(state='disabled')
        
        self.details_text.config(state='normal')
        self.details_text.delete(1.0, tk.END)
        self.details_text.config(state='disabled')
        
        self.current_emails = []
        self.selected_email = None
    
    def run(self):
        """Start the application"""
        logger.info("Starting Yacht Email Reader application")
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Start main loop
        self.root.mainloop()
    
    def on_closing(self):
        """Handle application closing"""
        logger.info("Application closing")
        self.root.destroy()

def main():
    """Entry point for the application"""
    try:
        app = YachtEmailReaderApp()
        app.run()
    except Exception as e:
        logger.error(f"Application error: {str(e)}")
        messagebox.showerror("Application Error", f"Failed to start application: {str(e)}")

if __name__ == "__main__":
    main()