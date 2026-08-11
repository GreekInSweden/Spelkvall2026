-- Säker serverside-poängsättning. Körs redan i Supabase-projektet sedan
-- tidigare (se konversationshistorik) — den här filen finns bara här som
-- referens/dokumentation i det nya repot. Om den INTE redan körts, kör den
-- i Supabase SQL Editor (Spelkväll-projektet, inte något av de andra).

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'scores' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.scores', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_score_range(p_game_id text, p_score numeric)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE p_game_id
    WHEN 'reaktion'     THEN p_score BETWEEN 80 AND 5000
    WHEN 'ordel5'       THEN p_score BETWEEN 10000 AND 79999
    WHEN 'ordel6'       THEN p_score BETWEEN 10000 AND 79999
    WHEN 'minne'        THEN p_score BETWEEN 80000 AND 5009999
    WHEN 'skrambel'     THEN p_score BETWEEN 0 AND 509999
    WHEN 'uppskatta'    THEN p_score >= 0
    WHEN 'bokstavsjakt' THEN p_score BETWEEN 0 AND 400
    ELSE false
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_score(
  p_player_id uuid, p_game_id text, p_score numeric, p_group_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_already_played boolean;
BEGIN
  IF NOT public.validate_score_range(p_game_id, p_score) THEN
    RAISE EXCEPTION 'Ogiltigt resultat för %', p_game_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.scores
    WHERE player_id = p_player_id AND game_id = p_game_id AND group_id = p_group_id
      AND (created_at AT TIME ZONE 'Europe/Stockholm')::date =
          (now() AT TIME ZONE 'Europe/Stockholm')::date
  ) INTO v_already_played;

  IF v_already_played THEN
    RAISE EXCEPTION 'Redan spelat idag';
  END IF;

  INSERT INTO public.scores (player_id, game_id, score, group_id)
  VALUES (p_player_id, p_game_id, p_score, p_group_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_score(uuid, text, numeric, uuid) TO anon;
