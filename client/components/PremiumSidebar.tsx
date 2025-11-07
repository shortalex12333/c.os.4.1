import React, { useState } from 'react';

interface Folder {
  id: string;
  name: string;
  count?: number;
  expanded?: boolean;
}

interface RecentChat {
  id: string;
  title: string;
  timestamp: Date;
}

interface PremiumSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function PremiumSidebar({ collapsed, onToggle }: PremiumSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([
    { id: '1', name: 'Work Projects', expanded: true },
    { id: '2', name: 'Personal Research', expanded: false },
    { id: '3', name: 'Archived', count: 12, expanded: false }
  ]);
  
  const [recentChats] = useState<RecentChat[]>([
    { id: '1', title: 'Hydraulic System Troubleshooting', timestamp: new Date() },
    { id: '2', title: 'Generator Load Analysis', timestamp: new Date() },
    { id: '3', title: 'Safety Protocol Review', timestamp: new Date() }
  ]);
  
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('1');

  const toggleFolder = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, expanded: !folder.expanded }
        : folder
    ));
  };

  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        <div className="logo-section">
          <button onClick={onToggle} className="p-2">
            ☰
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="logo-section">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded brand-gradient flex items-center justify-center text-white font-semibold">
            C7
          </div>
          <span className="font-semibold text-[var(--text-primary)]">CelesteOS</span>
        </div>
        <button 
          onClick={onToggle}
          className="ml-auto p-2 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
        >
          ←
        </button>
      </div>
      
      {/* New Chat Button */}
      <div className="p-4">
        <button className="w-full py-2 px-4 bg-[var(--c7-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
          + New chat
        </button>
      </div>
      
      {/* Folders Section */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Folders</h3>
        <div className="space-y-1">
          {folders.map(folder => (
            <div key={folder.id}>
              <button
                onClick={() => {
                  setActiveFolder(folder.id);
                  toggleFolder(folder.id);
                }}
                className={`sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors ${
                  activeFolder === folder.id ? 'active bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-50 transition-transform" 
                        style={{ transform: folder.expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    ▶
                  </span>
                  <span>{folder.name}</span>
                </div>
                {folder.count && (
                  <span className="badge text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full">
                    {folder.count}
                  </span>
                )}
              </button>
              
              {/* Expanded folder content would go here */}
              {folder.expanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {/* Folder items */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Chats Section */}
      <div className="sidebar-section flex-1 overflow-y-auto">
        <h3 className="sidebar-section-title">Recent Chats</h3>
        <div className="space-y-1">
          {recentChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`sidebar-item w-full text-left px-3 py-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors ${
                activeChat === chat.id ? 'active bg-[var(--bg-tertiary)]' : ''
              }`}
            >
              <div className="text-sm truncate">{chat.title}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Yacht Selection */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Active Vessel</h3>
        <select className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-md text-sm">
          <option>M/Y Excellence (75m)</option>
          <option>M/Y Serenity (60m)</option>
          <option>M/Y Aurora (55m)</option>
        </select>
      </div>
      
      {/* Bottom Actions */}
      <div className="sidebar-section border-t">
        <button className="sidebar-item w-full text-left px-3 py-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
        <button className="sidebar-item w-full text-left px-3 py-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2">
          <span>💬</span>
          <span>Chat</span>
        </button>
      </div>
    </aside>
  );
}