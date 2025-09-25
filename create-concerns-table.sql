-- Create concerns table for user feedback and ideas
CREATE TABLE IF NOT EXISTS concerns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'addressed')),
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own concerns" ON concerns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all concerns" ON concerns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update concerns" ON concerns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_concerns_created_at ON concerns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concerns_status ON concerns(status);
CREATE INDEX IF NOT EXISTS idx_concerns_user_id ON concerns(user_id);
