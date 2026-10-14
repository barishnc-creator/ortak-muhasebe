-- Fiyatsız vitrin kataloğu.
-- Yalnızca ürün adı, açıklama, kategori, fotoğraf ve videoyu döndürür.
-- Fiyat, en az adet ve maliyet bilgisi bu fonksiyonun çıktısında hiç yer almaz
-- (tarayıcının ağ kayıtlarında da görünmez). Firma adı, alt başlığı ve
-- iletişim bilgileri (Ayarlar → Firma bilgileri) iletişim düğmesi için döner.

create or replace function public.get_public_showcase(p_workspace_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'company', jsonb_build_object(
      'name',   coalesce(nullif(b.data->'company'->>'name', ''), 'Tidex Technology'),
      'slogan', coalesce(nullif(b.data->'company'->>'slogan', ''), 'Geleceğin Teknolojileri'),
      'phone',  coalesce(b.data->'company'->>'phone', ''),
      'email',  coalesce(b.data->'company'->>'email', ''),
      'web',    coalesce(b.data->'company'->>'web', '')
    ),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p->>'id',
          'name', p->>'n',
          'description', coalesce(p->>'catalogDescription', ''),
          'image', coalesce(p->>'catalogImage', ''),
          'video', coalesce(p->>'catalogVideo', ''),
          'catalogCategory', coalesce(p->>'catalogCategory', ''),
          'catalogBestSeller', coalesce((p->>'catalogBestSeller')::boolean, false)
        )
        order by lower(coalesce(p->>'n', ''))
      )
      from jsonb_array_elements(coalesce(b.data->'prod', '[]'::jsonb)) p
      where coalesce((p->>'catalogVisible')::boolean, true)
        and coalesce((p->>'catalogActive')::boolean, true)
    ), '[]'::jsonb)
  )
  from public.workspaces w
  left join public.books b on b.workspace_id = w.id
  where w.id = p_workspace_id
  limit 1;
$$;

revoke all on function public.get_public_showcase(uuid) from public;
grant execute on function public.get_public_showcase(uuid) to anon, authenticated;
