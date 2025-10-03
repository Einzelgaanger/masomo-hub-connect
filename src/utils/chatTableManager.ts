// Chat Table Manager
// This handles chat functionality without relying on SQL scripts

import { supabase } from '@/integrations/supabase/client';

export class ChatTableManager {
  private static instance: ChatTableManager;
  private tableExists: boolean | null = null;

  public static getInstance(): ChatTableManager {
    if (!ChatTableManager.instance) {
      ChatTableManager.instance = new ChatTableManager();
    }
    return ChatTableManager.instance;
  }

  // Check if chat table exists
  public async checkTableExists(): Promise<boolean> {
    if (this.tableExists !== null) {
      return this.tableExists;
    }

    try {
      const { data, error } = await supabase
        .from('class_chat_messages')
        .select('id')
        .limit(1);

      if (error) {
        console.log('Chat table does not exist:', error.message);
        this.tableExists = false;
        return false;
      }

      console.log('Chat table exists and is accessible');
      this.tableExists = true;
      return true;
    } catch (error) {
      console.log('Error checking chat table:', error);
      this.tableExists = false;
      return false;
    }
  }

  // Send message with fallback handling
  public async sendMessage(classId: string, message: string, senderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if table exists
      const tableExists = await this.checkTableExists();
      if (!tableExists) {
        return {
          success: false,
          error: 'Chat table does not exist. Please create the class_chat_messages table in your Supabase dashboard.'
        };
      }

      // Try to send the message
      const { data, error } = await supabase
        .from('class_chat_messages')
        .insert({
          class_id: classId,
          sender_id: senderId,
          message: message.trim(),
          message_type: 'text'
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        return {
          success: false,
          error: `Failed to send message: ${error.message}`
        };
      }

      console.log('Message sent successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  // Get messages with fallback handling
  public async getMessages(classId: string, limit: number = 50): Promise<{ messages: any[]; error?: string }> {
    try {
      const tableExists = await this.checkTableExists();
      if (!tableExists) {
        return {
          messages: [],
          error: 'Chat table does not exist'
        };
      }

      const { data, error } = await supabase
        .from('class_chat_messages')
        .select(`
          id,
          class_id,
          sender_id,
          message,
          message_type,
          file_url,
          file_name,
          created_at,
          profiles!inner(
            full_name,
            profile_picture_url
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return {
          messages: [],
          error: `Failed to fetch messages: ${error.message}`
        };
      }

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.message,
        message_type: msg.message_type,
        file_url: msg.file_url,
        file_name: msg.file_name,
        created_at: msg.created_at,
        sender_name: msg.profiles?.full_name || 'Unknown User',
        sender_avatar: msg.profiles?.profile_picture_url
      })) || [];

      return { messages: formattedMessages.reverse() };
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
      return {
        messages: [],
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  // Setup realtime subscription with error handling
  public setupRealtimeSubscription(classId: string, onMessage: (message: any) => void): () => void {
    console.log('Setting up realtime subscription for class:', classId);
    
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_chat_messages',
          filter: `class_id=eq.${classId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as any;
          
          // Fetch sender profile information
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, profile_picture_url')
              .eq('user_id', newMessage.sender_id)
              .single();

            onMessage({
              id: newMessage.id,
              sender_id: newMessage.sender_id,
              message: newMessage.message,
              message_type: newMessage.message_type,
              file_url: newMessage.file_url,
              file_name: newMessage.file_name,
              created_at: newMessage.created_at,
              sender_name: profile?.full_name || 'Unknown User',
              sender_avatar: profile?.profile_picture_url
            });
          } catch (error) {
            console.error('Error fetching sender profile:', error);
            // Add message without profile info
            onMessage({
              id: newMessage.id,
              sender_id: newMessage.sender_id,
              message: newMessage.message,
              message_type: newMessage.message_type,
              file_url: newMessage.file_url,
              file_name: newMessage.file_name,
              created_at: newMessage.created_at,
              sender_name: 'Unknown User',
              sender_avatar: undefined
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }

  // Get table creation instructions
  public getTableCreationInstructions(): string {
    return `
To fix the chat functionality, please create the class_chat_messages table manually:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor
3. Click "Create a new table"
4. Set table name: class_chat_messages
5. Add these columns:
   - id (uuid, Primary Key, Default: gen_random_uuid())
   - class_id (uuid, Not Null)
   - sender_id (uuid, Not Null)
   - message (text, Not Null)
   - message_type (text, Default: 'text')
   - file_url (text, Nullable)
   - file_name (text, Nullable)
   - created_at (timestamptz, Default: now())

6. Enable RLS (Row Level Security)
7. Create a policy: "Allow all operations" for authenticated users

After creating the table, refresh the page and try sending a message again.
    `;
  }
}
