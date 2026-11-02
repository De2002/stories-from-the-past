CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "send own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND NOT is_read AND public.account_active(auth.uid()));
CREATE POLICY "recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE OR REPLACE FUNCTION public.messages_guard_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.body <> OLD.body OR NEW.sender_id <> OLD.sender_id OR NEW.recipient_id <> OLD.recipient_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only the read flag can change';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_guard_update BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.messages_guard_update();
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;