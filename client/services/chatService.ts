/**
 * Chat Service for CelesteOS - Handles chat persistence
 * Connects React components to Supabase chat tables
 */

import { supabase } from '../config/supabaseConfig';

// Types matching our database schema
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  folder?: string;
  yacht_id?: string;
  search_type: 'yacht' | 'email' | 'nas';
  message_count: number;
  is_archived: boolean;
  deleted: boolean;
  session_metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  message_index: number;
  sources?: any[];
  metadata?: Record<string, any>;
  tokens_used?: number;
  confidence_score?: number;
}

export interface ChatSessionSummary {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  folder?: string;
  yacht_id?: string;
  search_type: 'yacht' | 'email' | 'nas';
  message_count: number;
  is_archived: boolean;
  deleted: boolean;
  first_message_preview?: string;
  last_message_at?: string;
}

class ChatService {
  /**
   * Get all chat sessions for the current user
   */
  async getChatSessions(limit = 50): Promise<ChatSessionSummary[]> {
    try {
      console.log('🔍 Fetching chat sessions from chat_session_summaries view...');

      const { data: sessions, error } = await supabase
        .from('chat_session_summaries')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching chat sessions:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        return [];
      }

      console.log(`✅ Fetched ${sessions?.length || 0} chat sessions:`, sessions);
      return sessions || [];
    } catch (error) {
      console.error('❌ Chat service error:', error);
      return [];
    }
  }

  /**
   * Create a new chat session
   */
  async createChatSession(
    title: string = 'New Chat',
    searchType: 'yacht' | 'email' | 'nas' = 'yacht',
    folder?: string
  ): Promise<ChatSession | null> {
    try {
      console.log('🆕 Creating new chat session:', { title, searchType, folder });

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User not authenticated:', userError);
        return null;
      }

      console.log('👤 Creating chat for user:', user.id);

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          title,
          search_type: searchType,
          folder,
          user_id: user.id,
          yacht_id: 'YACHT_001' // TODO: Get from yacht configuration
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating chat session:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        return null;
      }

      console.log('✅ Chat session created:', session);
      return session;
    } catch (error) {
      console.error('❌ Chat service error:', error);
      return null;
    }
  }

  /**
   * Get messages for a specific chat session
   */
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Chat service error:', error);
      return [];
    }
  }

  /**
   * Add a message to a chat session
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    sources?: any[],
    metadata?: Record<string, any>
  ): Promise<ChatMessage | null> {
    try {
      // Get the next message index
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('message_index')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: false })
        .limit(1)
        .single();

      const nextIndex = (lastMessage?.message_index || -1) + 1;

      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          message_index: nextIndex,
          sources: sources || [],
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding chat message:', error);
        return null;
      }

      return message;
    } catch (error) {
      console.error('Chat service error:', error);
      return null;
    }
  }

  /**
   * Update chat session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Soft delete a chat session (sets deleted=true)
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      console.log('🗑️  Attempting to delete chat session:', sessionId);

      const { data, error } = await supabase
        .from('chat_sessions')
        .update({
          deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select();

      if (error) {
        console.error('❌ Error deleting chat session:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        return false;
      }

      console.log('✅ Chat session soft deleted successfully:', data);
      console.log('🔄 Deleted flag set to true for session:', sessionId);
      return true;
    } catch (error) {
      console.error('❌ Chat service error during deletion:', error);
      return false;
    }
  }

  /**
   * Permanently delete a chat session and all its messages
   * WARNING: This cannot be undone!
   */
  async permanentlyDeleteSession(sessionId: string): Promise<boolean> {
    try {
      // Delete session (messages will be cascade deleted)
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error permanently deleting chat session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Restore a deleted chat session
   */
  async restoreSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          deleted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error restoring chat session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Get deleted chat sessions (trash)
   */
  async getDeletedSessions(limit = 50): Promise<ChatSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('deleted', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching deleted sessions:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Chat service error:', error);
      return [];
    }
  }

  /**
   * Rename a folder (updates all chats in that folder)
   */
  async renameFolder(oldFolderName: string, newFolderName: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return false;
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          folder: newFolderName,
          updated_at: new Date().toISOString()
        })
        .eq('folder', oldFolderName)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Delete all chats in a folder (soft delete)
   */
  async deleteFolderChats(folderName: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return false;
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('folder', folderName)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting folder chats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Archive a chat session
   */
  async archiveSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error archiving chat session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Get chat sessions grouped by folder
   */
  async getChatSessionsByFolder(): Promise<Record<string, ChatSessionSummary[]>> {
    try {
      const sessions = await this.getChatSessions();
      const grouped: Record<string, ChatSessionSummary[]> = {};

      sessions.forEach(session => {
        const folder = session.folder || 'General';
        if (!grouped[folder]) {
          grouped[folder] = [];
        }
        grouped[folder].push(session);
      });

      return grouped;
    } catch (error) {
      console.error('Chat service error:', error);
      return {};
    }
  }

  /**
   * Move chat session to folder
   */
  async moveChatToFolder(sessionId: string, folderName: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          folder: folderName,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error moving chat to folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Chat service error:', error);
      return false;
    }
  }

  /**
   * Get all unique folder names for current user
   */
  async getUserFolders(): Promise<string[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return [];
      }

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('folder')
        .eq('user_id', user.id)
        .not('folder', 'is', null);

      if (error) {
        console.error('Error getting folders:', error);
        return [];
      }

      // Get unique folder names
      const folders = [...new Set(sessions.map(s => s.folder).filter(Boolean))];
      return folders.sort();
    } catch (error) {
      console.error('Chat service error:', error);
      return [];
    }
  }

  /**
   * Search chat messages
   */
  async searchMessages(query: string, limit = 20): Promise<{
    session: ChatSessionSummary;
    messages: ChatMessage[];
  }[]> {
    try {
      // Note: This is a simple search. In production, you'd want full-text search
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions!inner(*)
        `)
        .ilike('content', `%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching messages:', error);
        return [];
      }

      // Group by session
      const grouped: Record<string, {
        session: ChatSessionSummary;
        messages: ChatMessage[];
      }> = {};

      messages?.forEach((msg: any) => {
        const sessionId = msg.session_id;
        if (!grouped[sessionId]) {
          grouped[sessionId] = {
            session: msg.chat_sessions,
            messages: []
          };
        }
        grouped[sessionId].messages.push(msg);
      });

      return Object.values(grouped);
    } catch (error) {
      console.error('Chat service error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;