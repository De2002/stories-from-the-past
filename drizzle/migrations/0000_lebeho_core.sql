CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text NOT NULL,
  story text NOT NULL DEFAULT '',
  era text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Objects',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable" ON public.posts FOR SELECT USING (true);
CREATE POLICY "own posts insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own posts update" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own posts delete" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE TABLE public.saves (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.likes, public.follows, public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes, public.follows, public.comments, public.saves TO authenticated;
GRANT ALL ON public.likes, public.follows, public.comments, public.saves TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes readable" ON public.likes FOR SELECT USING (true);
CREATE POLICY "own likes ins" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own likes del" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own saves read" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own saves ins" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own saves del" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "follows readable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "own follows ins" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "own follows del" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE POLICY "comments readable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "own comments ins" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own comments del" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; uname text; n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
  IF base = '' THEN base := 'user'; END IF;
  uname := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    n := n + 1; uname := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (new.id, uname, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', uname), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "post images public read" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "post images own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.profiles (id, username, display_name, bio) VALUES
('11111111-1111-1111-1111-111111111111','the_archivist','Margit Halvorsen','Retired museum registrar in Bergen. I catalogue the machines that wrote the 20th century.'),
('22222222-2222-2222-2222-222222222222','analog_amara','Amara Okafor','Lagos-born, London-based. Cameras, cassettes, and the people who loved them.'),
('33333333-3333-3333-3333-333333333333','kyoto_attic','Kenji Morimoto','Third-generation antiques dealer. Every object has a previous owner.');

INSERT INTO public.posts (user_id, image_url, title, era, location, category, story, created_at) VALUES
('11111111-1111-1111-1111-111111111111','/seed/enigma.jpg','Enigma I cipher machine','1930s–1945','Germany','Technology','The three-rotor Enigma I was adopted by the German Army in the early 1930s. Each keypress stepped the rotors, so the same letter never encrypted the same way twice. Polish mathematicians Marian Rejewski, Jerzy Różycki and Henryk Zygalski first broke it in 1932, and handed their work to Britain and France in July 1939 — the foundation for Alan Turing''s Bombe at Bletchley Park.', now() - interval '2 hours'),
('22222222-2222-2222-2222-222222222222','/seed/walkman.jpg','Sony Walkman TPS-L2','1979','Tokyo, Japan','Music','Released on 1 July 1979, the blue-and-silver TPS-L2 was the first Walkman. It had two headphone jacks and an orange "hotline" button that dimmed the music so you could talk to the person next to you. My uncle bought this one in Tokyo in 1980 and played Fela Kuti on it the whole flight home.', now() - interval '5 hours'),
('33333333-3333-3333-3333-333333333333','/seed/brownie.jpg','Kodak Brownie No. 2','1901–1935','Rochester, USA','Photography','Kodak''s Brownie line launched in 1900 for one dollar, putting photography in ordinary hands. The No. 2 followed in 1901 and introduced 120 roll film — a format still made today. This one belonged to a family in Osaka; the original leatherette is cracked but the shutter still clicks.', now() - interval '9 hours'),
('11111111-1111-1111-1111-111111111111','/seed/lettera.jpg','Olivetti Lettera 22','1950','Ivrea, Italy','Technology','Designed by Marcello Nizzoli and launched in 1950, the Lettera 22 weighed under 4 kg and won the Compasso d''Oro in 1954. Reporters carried it to wars; Leonard Cohen wrote on one. Mine came from an estate sale with a half-typed letter still in the platen.', now() - interval '1 day'),
('22222222-2222-2222-2222-222222222222','/seed/sx70.jpg','Polaroid SX-70','1972','Cambridge, USA','Photography','Edwin Land unveiled the SX-70 in 1972: a folding single-lens reflex that ejected a self-developing print seconds after you pressed the shutter. Its integral film had no peel-apart waste. Artists from Andy Warhol to Walker Evans used it. Folded flat, it fits in a coat pocket.', now() - interval '1 day 6 hours'),
('33333333-3333-3333-3333-333333333333','/seed/phone.jpg','Western Electric Model 500','1949','USA','Technology','The Model 500 desk telephone was introduced by the Bell System in 1949 and became the most common phone in America, with tens of millions made. Its rotary dial had letters beside the numbers — exchange names like PEnnsylvania 6-5000. Bell leased them rather than sold them, so many were built to last decades.', now() - interval '2 days'),
('11111111-1111-1111-1111-111111111111','/seed/singer.jpg','Singer Model 27 sewing machine','1880s–1910s','Elizabethport, USA','Household','Singer''s Model 27 "vibrating shuttle" machines were sold worldwide on instalment plans — one of the first big consumer-credit schemes. The gold decals (this pattern is called "Sphinx") were applied by hand. Serial numbers let you date the exact year; this one is 1905.', now() - interval '3 days'),
('22222222-2222-2222-2222-222222222222','/seed/gramophone.jpg','HMV horn gramophone','1900s','London, UK','Music','The Gramophone Company adopted Francis Barraud''s painting of his dog Nipper listening to a horn — "His Master''s Voice" — as its trademark around 1900. Horn gramophones like this played 78 rpm shellac discs with no electricity at all: the needle''s vibration was amplified purely by the horn.', now() - interval '4 days');

INSERT INTO public.follows VALUES
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222', now()),
('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333', now()),
('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111', now());

INSERT INTO public.likes (user_id, post_id) SELECT p2.id, po.id FROM public.posts po CROSS JOIN public.profiles p2 WHERE p2.id <> po.user_id;

INSERT INTO public.comments (post_id, user_id, body)
SELECT id, '22222222-2222-2222-2222-222222222222', 'The Polish contribution is so often forgotten. Thank you for telling it.' FROM public.posts WHERE title LIKE 'Enigma%';
INSERT INTO public.comments (post_id, user_id, body)
SELECT id, '33333333-3333-3333-3333-333333333333', 'The hotline button! My father had the TPS-L2 too.' FROM public.posts WHERE title LIKE 'Sony%';