-- Backfill camp_registrations.children[].selectedSessions from a flat array
-- into a per-date map keyed by selectedDates, so the Attendance tab reads the
-- correct session type per date.
--
-- Logic for each child:
--   - If selectedSessions is already an object (map), leave it alone.
--   - If selectedSessions is an array, pick the first value (or fall back to a
--     sensible default based on camp_type / location / activityType) and build
--     { date: value } for each entry in selectedDates.

DO $$
DECLARE
  reg RECORD;
  new_children jsonb;
  child jsonb;
  sessions jsonb;
  dates jsonb;
  default_session text;
  picked text;
  session_map jsonb;
  d text;
  changed boolean;
BEGIN
  FOR reg IN
    SELECT id, camp_type, location, children
    FROM public.camp_registrations
    WHERE children IS NOT NULL
      AND jsonb_typeof(children) = 'array'
  LOOP
    new_children := '[]'::jsonb;
    changed := false;

    FOR child IN SELECT * FROM jsonb_array_elements(reg.children)
    LOOP
      sessions := child -> 'selectedSessions';
      dates := child -> 'selectedDates';

      -- Only convert when sessions is a flat array
      IF sessions IS NOT NULL
         AND jsonb_typeof(sessions) = 'array'
         AND dates IS NOT NULL
         AND jsonb_typeof(dates) = 'array'
         AND jsonb_array_length(dates) > 0
      THEN
        -- Determine default
        IF reg.camp_type = 'little-forest'
           OR COALESCE(reg.location, '') = 'Ngong Sanctuary'
           OR (child ->> 'activityType') = 'archery'
        THEN
          default_session := 'half';
        ELSE
          default_session := 'full';
        END IF;

        -- Pick first value from array, else default
        IF jsonb_array_length(sessions) > 0 THEN
          picked := sessions ->> 0;
          IF picked IS NULL OR picked = '' OR picked NOT IN ('half', 'full') THEN
            picked := default_session;
          END IF;
        ELSE
          picked := default_session;
        END IF;

        -- Build map { date: picked }
        session_map := '{}'::jsonb;
        FOR d IN SELECT jsonb_array_elements_text(dates)
        LOOP
          session_map := session_map || jsonb_build_object(d, picked);
        END LOOP;

        child := jsonb_set(child, '{selectedSessions}', session_map, true);
        changed := true;
      END IF;

      new_children := new_children || jsonb_build_array(child);
    END LOOP;

    IF changed THEN
      UPDATE public.camp_registrations
      SET children = new_children,
          updated_at = NOW()
      WHERE id = reg.id;
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
