UPDATE stick_notes
SET visibility = 'secret', reviewed_at = COALESCE(reviewed_at, NOW())
WHERE note_kind = 'reflection' AND visibility = 'published';

ALTER TABLE stick_notes
  DROP CONSTRAINT IF EXISTS stick_notes_reflections_not_public;

ALTER TABLE stick_notes
  ADD CONSTRAINT stick_notes_reflections_not_public
  CHECK (note_kind <> 'reflection' OR visibility <> 'published');
