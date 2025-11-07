#!/usr/bin/env python3
"""
Simple test GUI to diagnose widget display issues
"""

import tkinter as tk
from tkinter import ttk

def test_gui():
    # Create root window
    root = tk.Tk()
    root.title("TEST - Email Reader for Microsoft Outlook")
    root.geometry("800x600")
    root.configure(bg='lightgray')
    
    # Create a simple label
    label1 = tk.Label(root, text="TEST LABEL - Can you see this?", 
                     font=('Arial', 16, 'bold'), 
                     bg='yellow', fg='black')
    label1.pack(pady=20)
    
    # Create a button
    button1 = tk.Button(root, text="TEST BUTTON - Login to Microsoft", 
                       font=('Arial', 12), 
                       bg='lightblue', fg='black',
                       width=20, height=2)
    button1.pack(pady=10)
    
    # Create another label
    label2 = tk.Label(root, text="If you can see this text, GUI is working", 
                     font=('Arial', 12), 
                     bg='lightgreen', fg='black')
    label2.pack(pady=10)
    
    # Create a frame with content
    frame = tk.Frame(root, bg='white', relief='sunken', bd=2)
    frame.pack(fill='both', expand=True, padx=20, pady=20)
    
    frame_label = tk.Label(frame, text="This is inside a frame", 
                          font=('Arial', 10), 
                          bg='white', fg='blue')
    frame_label.pack(pady=10)
    
    print("Test GUI widgets created and packed")
    root.mainloop()

if __name__ == "__main__":
    test_gui()