-- ============================================================================
-- Gutenberg Books - Supabase schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- ============================================================================

-- Shared catalogue: every user sees every row.
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

-- Anyone (including anonymous visitors) can read the library.
drop policy if exists "Books are viewable by everyone" on public.books;
create policy "Books are viewable by everyone"
  on public.books for select
  using (true);

-- Anyone can add a book.
-- NOTE: this is intentionally open for a demo. Add auth before going live.
drop policy if exists "Anyone can add a book" on public.books;
create policy "Anyone can add a book"
  on public.books for insert
  with check (true);

-- Anyone can delete a book.
-- NOTE: same caveat as above - restrict this once you have user accounts.
drop policy if exists "Anyone can delete a book" on public.books;
create policy "Anyone can delete a book"
  on public.books for delete
  using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for cover images.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "Covers are publicly readable" on storage.objects;
create policy "Covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "Anyone can upload a cover" on storage.objects;
create policy "Anyone can upload a cover"
  on storage.objects for insert
  with check (bucket_id = 'covers');
