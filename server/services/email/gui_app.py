"""
Main GUI Application for Yacht Email Reader
Tkinter-based interface for authentication and email browsing
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import logging
from typing import List, Dict, Any, Optional
from config import APP_NAME, WINDOW_WIDTH, WINDOW_HEIGHT
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
        self.root.configure(bg='white')  # Set background color
        
        # Initialize managers
        self.auth_manager = AuthManager()
        self.graph_client = GraphClient(self.auth_manager)
        
        # Application state
        self.user_info = None
        self.current_emails = []
        self.selected_email = None
        
        # GUI components
        self.setup_styles()
        self.create_widgets()
        self.setup_layout()
        
        # Check initial authentication state
        self.check_auth_status()
    
    def setup_styles(self):
        """Configure ttk styles"""
        style = ttk.Style()
        style.theme_use('default')  # Use default theme for better visibility
        
        # Configure custom styles with explicit colors
        style.configure('Main.TFrame', background='white')
        style.configure('TFrame', background='white')
        style.configure('TLabelFrame', background='white', foreground='black')
        style.configure('TLabel', background='white', foreground='black')
        style.configure('TButton', background='lightblue', foreground='black')
        style.configure('Title.TLabel', font=('Helvetica', 16, 'bold'), foreground='black', background='white')
        style.configure('Subtitle.TLabel', font=('Helvetica', 12), foreground='black', background='white')
        style.configure('Success.TLabel', foreground='green', background='white')
        style.configure('Error.TLabel', foreground='red', background='white')
    
    def create_widgets(self):
        """Create all GUI widgets"""
        
        # Main container
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.configure(style='Main.TFrame')
        
        # Header section
        self.header_frame = ttk.Frame(self.main_frame)
        
        self.title_label = ttk.Label(
            self.header_frame, 
            text=APP_NAME, 
            style='Title.TLabel'
        )
        
        self.status_label = ttk.Label(
            self.header_frame,
            text="Not authenticated",
            style='Error.TLabel'
        )
        
        self.user_label = ttk.Label(
            self.header_frame,
            text="",
            style='Subtitle.TLabel'
        )
        
        # Authentication section
        self.auth_frame = ttk.LabelFrame(self.main_frame, text="Authentication", padding="10")
        
        self.login_button = ttk.Button(
            self.auth_frame,
            text="Login to Microsoft",
            command=self.handle_login,
            width=20
        )
        
        self.logout_button = ttk.Button(
            self.auth_frame,
            text="Logout",
            command=self.handle_logout,
            width=20,
            state=tk.DISABLED
        )
        
        # Search section
        self.search_frame = ttk.LabelFrame(self.main_frame, text="Email Search", padding="10")
        
        self.search_label = ttk.Label(self.search_frame, text="Search emails:")
        
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(
            self.search_frame,
            textvariable=self.search_var,
            width=40
        )
        self.search_entry.bind('<Return>', lambda e: self.handle_search())
        
        self.search_button = ttk.Button(
            self.search_frame,
            text="Search",
            command=self.handle_search,
            state=tk.DISABLED
        )
        
        self.clear_button = ttk.Button(
            self.search_frame,
            text="Clear",
            command=self.handle_clear,
            state=tk.DISABLED
        )
        
        # Filter options
        self.filter_frame = ttk.Frame(self.search_frame)
        
        self.days_label = ttk.Label(self.filter_frame, text="Days back:")
        self.days_var = tk.StringVar(value="30")
        self.days_entry = ttk.Entry(self.filter_frame, textvariable=self.days_var, width=10)
        
        self.max_results_label = ttk.Label(self.filter_frame, text="Max results:")
        self.max_results_var = tk.StringVar(value="50")
        self.max_results_entry = ttk.Entry(self.filter_frame, textvariable=self.max_results_var, width=10)
        
        # Results section
        self.results_frame = ttk.LabelFrame(self.main_frame, text="Email Results", padding="10")
        
        # Email list
        self.email_tree = ttk.Treeview(
            self.results_frame,
            columns=('Subject', 'From', 'Date', 'Read'),
            show='tree headings',
            height=12
        )
        
        self.email_tree.heading('#0', text='#')
        self.email_tree.heading('Subject', text='Subject')
        self.email_tree.heading('From', text='From')
        self.email_tree.heading('Date', text='Date')
        self.email_tree.heading('Read', text='Read')
        
        self.email_tree.column('#0', width=50)
        self.email_tree.column('Subject', width=300)
        self.email_tree.column('From', width=200)
        self.email_tree.column('Date', width=150)
        self.email_tree.column('Read', width=60)
        
        self.email_tree.bind('<<TreeviewSelect>>', self.on_email_select)
        self.email_tree.bind('<Double-1>', self.on_email_double_click)
        
        # Scrollbar for email list
        self.email_scrollbar = ttk.Scrollbar(self.results_frame, orient=tk.VERTICAL, command=self.email_tree.yview)
        self.email_tree.configure(yscrollcommand=self.email_scrollbar.set)
        
        # Email details section
        self.details_frame = ttk.LabelFrame(self.main_frame, text="Email Details", padding="10")
        
        self.details_text = scrolledtext.ScrolledText(
            self.details_frame,
            height=10,
            wrap=tk.WORD,
            state=tk.DISABLED
        )
        
        # Status bar
        self.status_frame = ttk.Frame(self.main_frame)
        self.status_var = tk.StringVar(value="Ready")
        self.status_bar = ttk.Label(self.status_frame, textvariable=self.status_var)
    
    def setup_layout(self):
        """Arrange widgets using grid layout"""
        
        self.main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure root grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # Configure main frame grid weights
        self.main_frame.columnconfigure(0, weight=1)
        self.main_frame.rowconfigure(2, weight=1)  # Search frame
        self.main_frame.rowconfigure(3, weight=2)  # Results frame
        self.main_frame.rowconfigure(4, weight=1)  # Details frame
        
        # Header layout
        self.header_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.header_frame.columnconfigure(0, weight=1)
        
        self.title_label.grid(row=0, column=0, sticky=tk.W)
        self.status_label.grid(row=0, column=1, sticky=tk.E)
        self.user_label.grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(5, 0))
        
        # Authentication layout
        self.auth_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.auth_frame.columnconfigure(0, weight=1)
        
        auth_button_frame = ttk.Frame(self.auth_frame)
        auth_button_frame.grid(row=0, column=0)
        
        self.login_button.grid(row=0, column=0, padx=(0, 10))
        self.logout_button.grid(row=0, column=1)
        
        # Search layout
        self.search_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.search_frame.columnconfigure(1, weight=1)
        
        self.search_label.grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        self.search_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        self.search_button.grid(row=0, column=2, padx=(0, 5))
        self.clear_button.grid(row=0, column=3)
        
        # Filter layout
        self.filter_frame.grid(row=1, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=(10, 0))
        
        self.days_label.grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        self.days_entry.grid(row=0, column=1, padx=(0, 20))
        self.max_results_label.grid(row=0, column=2, sticky=tk.W, padx=(0, 5))
        self.max_results_entry.grid(row=0, column=3)
        
        # Results layout
        self.results_frame.grid(row=3, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        self.results_frame.columnconfigure(0, weight=1)
        self.results_frame.rowconfigure(0, weight=1)
        
        self.email_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.email_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Details layout
        self.details_frame.grid(row=4, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        self.details_frame.columnconfigure(0, weight=1)
        self.details_frame.rowconfigure(0, weight=1)
        
        self.details_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Status bar layout
        self.status_frame.grid(row=5, column=0, sticky=(tk.W, tk.E))
        self.status_frame.columnconfigure(0, weight=1)
        self.status_bar.grid(row=0, column=0, sticky=tk.W)
    
    def check_auth_status(self):
        """Check and update authentication status"""
        if self.auth_manager.is_authenticated():
            self.update_status("Authenticated", success=True)
            self.login_button.config(state=tk.DISABLED)
            self.logout_button.config(state=tk.NORMAL)
            self.search_button.config(state=tk.NORMAL)
            self.clear_button.config(state=tk.NORMAL)
            
            # Get user info
            threading.Thread(target=self.load_user_info, daemon=True).start()
        else:
            self.update_status("Not authenticated", success=False)
            self.login_button.config(state=tk.NORMAL)
            self.logout_button.config(state=tk.DISABLED)
            self.search_button.config(state=tk.DISABLED)
            self.clear_button.config(state=tk.DISABLED)
    
    def update_status(self, message: str, success: bool = True):
        """Update status display"""
        self.status_label.config(
            text=message,
            style='Success.TLabel' if success else 'Error.TLabel'
        )
        self.status_var.set(message)
    
    def handle_login(self):
        """Handle login button click"""
        self.update_status("Authenticating...")
        self.login_button.config(state=tk.DISABLED, text="Logging in...")
        
        def login_thread():
            success = self.auth_manager.login(callback=self.on_login_complete)
        
        threading.Thread(target=login_thread, daemon=True).start()
    
    def on_login_complete(self, success: bool, message: str):
        """Callback for login completion"""
        def update_ui():
            if success:
                self.update_status("Authenticated", success=True)
                self.login_button.config(state=tk.DISABLED, text="Login to Microsoft")
                self.logout_button.config(state=tk.NORMAL)
                self.search_button.config(state=tk.NORMAL)
                self.clear_button.config(state=tk.NORMAL)
                
                # Load user info
                threading.Thread(target=self.load_user_info, daemon=True).start()
            else:
                self.update_status(f"Login failed: {message}", success=False)
                self.login_button.config(state=tk.NORMAL, text="Login to Microsoft")
                messagebox.showerror("Authentication Error", message)
        
        # Schedule UI update on main thread
        self.root.after(0, update_ui)
    
    def handle_logout(self):
        """Handle logout button click"""
        if self.auth_manager.logout():
            self.update_status("Logged out", success=True)
            self.login_button.config(state=tk.NORMAL)
            self.logout_button.config(state=tk.DISABLED)
            self.search_button.config(state=tk.DISABLED)
            self.clear_button.config(state=tk.DISABLED)
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
            self.root.after(0, lambda: self.user_label.config(text="Failed to load user info"))
    
    def handle_search(self):
        """Handle search button click"""
        search_query = self.search_var.get().strip()
        
        try:
            days_back = int(self.days_var.get()) if self.days_var.get().strip() else None
            max_results = int(self.max_results_var.get()) if self.max_results_var.get().strip() else 50
        except ValueError:
            messagebox.showerror("Invalid Input", "Days back and max results must be numbers")
            return
        
        self.update_status("Searching emails...")
        self.search_button.config(state=tk.DISABLED, text="Searching...")
        
        def search_thread():
            try:
                emails = self.graph_client.search_emails(
                    search_query=search_query if search_query else None,
                    days_back=days_back,
                    max_results=max_results
                )
                
                self.root.after(0, lambda: self.display_emails(emails))
                self.root.after(0, lambda: self.update_status(f"Found {len(emails)} emails"))
                
            except Exception as e:
                error_msg = f"Search failed: {str(e)}"
                logger.error(error_msg)
                self.root.after(0, lambda: self.update_status(error_msg, success=False))
                self.root.after(0, lambda: messagebox.showerror("Search Error", error_msg))
            finally:
                self.root.after(0, lambda: self.search_button.config(state=tk.NORMAL, text="Search"))
        
        threading.Thread(target=search_thread, daemon=True).start()
    
    def handle_clear(self):
        """Handle clear button click"""
        self.search_var.set("")
        self.clear_results()
        self.update_status("Results cleared")
    
    def display_emails(self, emails: List[Dict[str, Any]]):
        """Display email results in the tree view"""
        self.current_emails = emails
        self.clear_results()
        
        for i, email in enumerate(emails):
            self.email_tree.insert(
                '',
                'end',
                text=str(i + 1),
                values=(
                    email['subject'][:50] + '...' if len(email['subject']) > 50 else email['subject'],
                    email['from'][:30] + '...' if len(email['from']) > 30 else email['from'],
                    email['receivedDateTime'],
                    'Yes' if email['isRead'] else 'No'
                )
            )
    
    def clear_results(self):
        """Clear all results from the display"""
        for item in self.email_tree.get_children():
            self.email_tree.delete(item)
        
        self.details_text.config(state=tk.NORMAL)
        self.details_text.delete(1.0, tk.END)
        self.details_text.config(state=tk.DISABLED)
        
        self.current_emails = []
        self.selected_email = None
    
    def on_email_select(self, event):
        """Handle email selection in tree view"""
        selection = self.email_tree.selection()
        if selection:
            item = self.email_tree.item(selection[0])
            email_index = int(item['text']) - 1
            
            if 0 <= email_index < len(self.current_emails):
                email = self.current_emails[email_index]
                self.show_email_preview(email)
    
    def on_email_double_click(self, event):
        """Handle double-click on email for full details"""
        selection = self.email_tree.selection()
        if selection:
            item = self.email_tree.item(selection[0])
            email_index = int(item['text']) - 1
            
            if 0 <= email_index < len(self.current_emails):
                email = self.current_emails[email_index]
                self.load_email_details(email['id'])
    
    def show_email_preview(self, email: Dict[str, Any]):
        """Show email preview in details pane"""
        preview_text = f"""Subject: {email['subject']}
From: {email['from']}
Date: {email['receivedDateTime']}
Read: {'Yes' if email['isRead'] else 'No'}
Has Attachments: {'Yes' if email['hasAttachments'] else 'No'}
Importance: {email['importance']}

Preview:
{email['bodyPreview']}

(Double-click email to view full content)"""
        
        self.details_text.config(state=tk.NORMAL)
        self.details_text.delete(1.0, tk.END)
        self.details_text.insert(1.0, preview_text)
        self.details_text.config(state=tk.DISABLED)
    
    def load_email_details(self, message_id: str):
        """Load and display full email details"""
        self.update_status("Loading email details...")
        
        def load_thread():
            try:
                email_details = self.graph_client.get_email_details(message_id)
                self.root.after(0, lambda: self.show_email_details(email_details))
                self.root.after(0, lambda: self.update_status("Email details loaded"))
                
            except Exception as e:
                error_msg = f"Failed to load email details: {str(e)}"
                logger.error(error_msg)
                self.root.after(0, lambda: self.update_status(error_msg, success=False))
                self.root.after(0, lambda: messagebox.showerror("Load Error", error_msg))
        
        threading.Thread(target=load_thread, daemon=True).start()
    
    def show_email_details(self, email: Dict[str, Any]):
        """Show full email details"""
        details_text = f"""Subject: {email['subject']}
From: {email['from']}
To: {', '.join(email['to'])}"""
        
        if email['cc']:
            details_text += f"\nCC: {', '.join(email['cc'])}"
        
        details_text += f"""
Sent: {email['sentDateTime']}
Received: {email['receivedDateTime']}
Read: {'Yes' if email['isRead'] else 'No'}
Importance: {email['importance']}
Has Attachments: {'Yes' if email['hasAttachments'] else 'No'}"""
        
        if email['categories']:
            details_text += f"\nCategories: {', '.join(email['categories'])}"
        
        details_text += f"\n\n--- Email Body ---\n{email['body']}"
        
        self.details_text.config(state=tk.NORMAL)
        self.details_text.delete(1.0, tk.END)
        self.details_text.insert(1.0, details_text)
        self.details_text.config(state=tk.DISABLED)
    
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