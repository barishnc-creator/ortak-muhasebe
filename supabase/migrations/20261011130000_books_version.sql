-- Defter (books) için sürüm numarası.
-- Her güncellemede sürüm otomatik artar. Uygulama kaydederken
-- "en son gördüğüm sürüm hâlâ bu mu?" diye kontrol eder; değilse
-- önce yeni veriyi alıp kendi değişiklikleriyle birleştirir.
-- Böylece katalogdan gelen sipariş veya ortağın kaydı ezilmez.

alter table public.books
  add column if not exists version bigint not null default 1;

create or replace function public.bump_book_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  return new;
end;
$$;

drop trigger if exists books_bump_version on public.books;
create trigger books_bump_version
  before update on public.books
  for each row execute function public.bump_book_version();
