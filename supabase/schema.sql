-- ============================================================================
-- IweHub - Supabase schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: it drops and recreates the policies.
-- ============================================================================

-- Shared catalogue: every user sees every row.
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  file_url text,
  file_name text,
  summary text,
  subjects text[],
  created_by uuid default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Upgrade an older table created before auth / file uploads existed.
alter table public.books
  add column if not exists created_by uuid default auth.uid()
    references auth.users (id) on delete cascade;

alter table public.books
  add column if not exists file_url text;

alter table public.books
  add column if not exists file_name text;

alter table public.books
  add column if not exists summary text;

alter table public.books
  add column if not exists subjects text[];

alter table public.books enable row level security;

-- READ: everyone (including anonymous visitors).
drop policy if exists "Books are viewable by everyone" on public.books;
create policy "Books are viewable by everyone"
  on public.books for select
  using (true);

-- INSERT: only signed-in users, and the row must belong to them.
drop policy if exists "Anyone can add a book" on public.books;
drop policy if exists "Authenticated users can add books" on public.books;
create policy "Authenticated users can add books"
  on public.books for insert
  to authenticated
  with check (auth.uid() = created_by);

-- DELETE: only the user who added the book.
drop policy if exists "Anyone can delete a book" on public.books;
drop policy if exists "Users can delete their own books" on public.books;
create policy "Users can delete their own books"
  on public.books for delete
  to authenticated
  using (auth.uid() = created_by);

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
drop policy if exists "Authenticated users can upload covers" on storage.objects;
create policy "Authenticated users can upload covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers');

-- DELETE: only the user who uploaded the object. This lets removing a book
-- also clean up its cover instead of leaving it orphaned in Storage.
-- (`owner_id` is the current ownership column; `owner` is deprecated.)
drop policy if exists "Users can delete their own covers" on storage.objects;
create policy "Users can delete their own covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'covers' and owner_id = (select auth.uid()::text));

-- ---------------------------------------------------------------------------
-- Storage bucket for the uploaded book files themselves.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-files', 'book-files', true)
on conflict (id) do nothing;

drop policy if exists "Book files are publicly readable" on storage.objects;
create policy "Book files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'book-files');

drop policy if exists "Authenticated users can upload book files" on storage.objects;
create policy "Authenticated users can upload book files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-files');

-- DELETE: only the user who uploaded the file, so removing a book can also
-- clean up the book file instead of leaving it orphaned in Storage.
drop policy if exists "Users can delete their own book files" on storage.objects;
create policy "Users can delete their own book files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-files' and owner_id = (select auth.uid()::text));
