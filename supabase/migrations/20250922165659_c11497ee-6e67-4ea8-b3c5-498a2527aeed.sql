-- Add missing RLS policies for remaining tables

-- Events policies
CREATE POLICY "Users can view events in their class" ON public.events
  FOR SELECT TO authenticated USING (
    unit_id IN (
      SELECT u.id 
      FROM public.units u
      JOIN public.profiles p ON u.class_id = p.class_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users and lecturers can delete events" ON public.events
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('lecturer', 'admin', 'super_admin')
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments on uploads in their class" ON public.comments
  FOR SELECT TO authenticated USING (
    upload_id IN (
      SELECT up.id 
      FROM public.uploads up
      JOIN public.units u ON up.unit_id = u.id
      JOIN public.profiles p ON u.class_id = p.class_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (commented_by = auth.uid());

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE TO authenticated USING (commented_by = auth.uid());

CREATE POLICY "Users and lecturers can delete comments" ON public.comments
  FOR DELETE TO authenticated USING (
    commented_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('lecturer', 'admin', 'super_admin')
    )
  );

-- Upload reactions policies
CREATE POLICY "Users can view reactions on uploads in their class" ON public.upload_reactions
  FOR SELECT TO authenticated USING (
    upload_id IN (
      SELECT up.id 
      FROM public.uploads up
      JOIN public.units u ON up.unit_id = u.id
      JOIN public.profiles p ON u.class_id = p.class_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own reactions" ON public.upload_reactions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Daily visits policies
CREATE POLICY "Users can manage their own daily visits" ON public.daily_visits
  FOR ALL TO authenticated USING (user_id = auth.uid());