-- Eksekusi skrip ini di SQL Editor dashboard Supabase Anda.

-- ==========================================
-- 1. Membuat Storage Buckets
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('site-images', 'site-images', true) 
on conflict (id) do nothing;

-- ==========================================
-- 2. Mengatur RLS untuk Buckets
-- ==========================================
-- Mengizinkan akses baca (read) ke publik untuk produk
create policy "Public Access to product-images" 
on storage.objects for select 
using (bucket_id = 'product-images');

-- Mengizinkan akses insert/delete ke product-images (Asumsi admin saat ini dapat insert tanpa auth ketat, atau silakan sesuaikan auth.uid())
create policy "Allow Insert to product-images" 
on storage.objects for insert 
with check (bucket_id = 'product-images');

create policy "Public Access to site-images" 
on storage.objects for select 
using (bucket_id = 'site-images');

create policy "Allow Insert to site-images" 
on storage.objects for insert 
with check (bucket_id = 'site-images');

-- ==========================================
-- 3. Membuat Tabel site_content
-- ==========================================
create table if not exists site_content (
  key text primary key,
  image_url text,
  updated_at timestamptz not null default now()
);

-- Inisialisasi data site_content
insert into site_content (key, image_url) values
  ('hero_image', null),
  ('banner_cta_image', null)
on conflict (key) do nothing;

-- ==========================================
-- 4. Modifikasi Tabel products (Jika sudah ada)
-- ==========================================
-- Catatan: Pastikan Anda sudah memiliki tabel products.
-- Script di bawah ini akan menambahkan kolom is_spotlight dan image_urls.
alter table products 
add column if not exists is_spotlight boolean not null default false;

alter table products 
add column if not exists image_urls text[];

-- Jika Anda BELUM memiliki tabel products, silakan jalankan query pembuatan tabel berikut:
/*
create table if not exists products (
  id text primary key,
  slug text not null,
  name text not null,
  brand text not null,
  price numeric not null,
  size text not null,
  grade integer not null,
  lotNumber text not null,
  description text not null,
  defects text,
  images jsonb,
  image_urls text[],
  status text not null,
  category text not null,
  createdAt timestamptz not null default now(),
  is_spotlight boolean not null default false
);
*/
