# Database changes

Every SQL change made to the Supabase database is saved here as a numbered file
in `migrations/`, in the order it was applied.

- Never edit an old file. To change something, add a new file with the next number.
- Keep files safe to run twice (use "if not exists" and "create or replace").
- Never put passwords or keys in these files.