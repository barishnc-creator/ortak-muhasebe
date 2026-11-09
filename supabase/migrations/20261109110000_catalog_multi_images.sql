-- Katalogda çoklu ürün fotoğrafı: ürünün catalogImages listesi üç katalog yanıtına
-- 'images' olarak eklenir. 'image' (kapak = listenin ilki) geriye dönük olarak kalır.
-- Gövdeler canlı tanımlardan alındı; tek fark 'images' satırı.

create or replace function public.get_public_catalog(p_workspace_id uuid)
 returns jsonb
 language sql
 security definer
 set search_path to 'public', 'extensions'
as $function$
  select jsonb_build_object(
    'workspace_id', w.id,
    'name', w.name,
    'tiers', coalesce(b.data->'set'->'catTiers', '[{"min":100,"pct":10},{"min":200,"pct":15},{"min":300,"pct":20}]'::jsonb),
    'promoStack', coalesce((b.data->'set'->>'promoStack')::boolean, false),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p->>'id',
          'name', p->>'n',
          'price', coalesce((p->>'price')::numeric, 0),
          'description', coalesce(p->>'catalogDescription', ''),
          'image', coalesce(p->>'catalogImage', ''),
          'images', case when jsonb_typeof(p->'catalogImages') = 'array' then p->'catalogImages' else '[]'::jsonb end,
          'video', coalesce(p->>'catalogVideo', ''),
          'catalogMin', greatest(1, coalesce((p->>'catalogMin')::integer, 25)),
          'catalogStep', greatest(1, coalesce((p->>'catalogStep')::integer, 25)),
          'catalogCategory', coalesce(p->>'catalogCategory', ''),
          'catalogActive', coalesce((p->>'catalogActive')::boolean, true),
          'catalogBestSeller', coalesce((p->>'catalogBestSeller')::boolean, false),
          'promo', (
            select jsonb_build_object('pct', (x->>'pct')::numeric, 'name', coalesce(x->>'name', ''), 'end', coalesce(x->>'end', ''))
            from jsonb_array_elements(coalesce(b.data->'promos', '[]'::jsonb)) x
            where coalesce((x->>'on')::boolean, true)
              and (case when x->>'pct' ~ '^[0-9]+(\.[0-9]+)?$' then (x->>'pct')::numeric else 0 end) between 0.01 and 90
              and (coalesce(x->>'start', '') = '' or x->>'start' <= to_char((now() at time zone 'Europe/Istanbul')::date, 'YYYY-MM-DD'))
              and (coalesce(x->>'end', '') = '' or x->>'end' >= to_char((now() at time zone 'Europe/Istanbul')::date, 'YYYY-MM-DD'))
              and (coalesce((x->>'all')::boolean, false) or coalesce(x->'prods', '[]'::jsonb) ? (p->>'id'))
            order by (case when x->>'pct' ~ '^[0-9]+(\.[0-9]+)?$' then (x->>'pct')::numeric else 0 end) desc
            limit 1
          )
        )
        order by lower(coalesce(p->>'n', ''))
      )
      from jsonb_array_elements(coalesce(b.data->'prod', '[]'::jsonb)) p
      where coalesce((p->>'catalogVisible')::boolean, true)
        and coalesce((p->>'catalogActive')::boolean, true)
        and coalesce((p->>'price')::numeric, 0) > 0
    ), '[]'::jsonb)
  )
  from public.workspaces w
  left join public.books b on b.workspace_id = w.id
  where w.id = p_workspace_id
  limit 1;
$function$;

create or replace function public.get_public_showcase(p_workspace_id uuid)
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
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
          'images', case when jsonb_typeof(p->'catalogImages') = 'array' then p->'catalogImages' else '[]'::jsonb end,
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
$function$;

create or replace function public.get_partner_catalog(p_workspace_id uuid, p_key text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_num  text := '^[0-9]+(\.[0-9]+)?$';
  v_data jsonb;
  v_pa   jsonb;
begin
  if length(coalesce(p_key, '')) < 12 then
    return null;
  end if;

  select b.data into v_data from public.books b where b.workspace_id = p_workspace_id limit 1;
  if v_data is null then
    return null;
  end if;

  select x into v_pa
  from jsonb_array_elements(coalesce(v_data->'partners', '[]'::jsonb)) x
  where x->>'catKey' = p_key
    and coalesce((x->>'catOff')::boolean, false) = false
  limit 1;
  if v_pa is null then
    return null;
  end if;

  return jsonb_build_object(
    'partner', jsonb_build_object('name', coalesce(v_pa->>'name', 'Partner')),
    'company', jsonb_build_object(
      'name',   coalesce(nullif(v_data->'company'->>'name', ''), 'Tidex Technology'),
      'slogan', coalesce(nullif(v_data->'company'->>'slogan', ''), 'Geleceğin Teknolojileri')
    ),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p->>'id',
          'name', p->>'n',
          'price', coalesce((
            select (pp->>'sale')::numeric
            from jsonb_array_elements(coalesce(v_data->'pprices', '[]'::jsonb)) pp
            where pp->>'partner' = v_pa->>'id'
              and pp->>'prod' = p->>'id'
              and pp->>'sale' ~ v_num
              and (pp->>'sale')::numeric > 0
            limit 1
          ), (p->>'price')::numeric),
          'description', coalesce(p->>'catalogDescription', ''),
          'image', coalesce(p->>'catalogImage', ''),
          'images', case when jsonb_typeof(p->'catalogImages') = 'array' then p->'catalogImages' else '[]'::jsonb end,
          'video', coalesce(p->>'catalogVideo', ''),
          'catalogMin', greatest(1, coalesce((p->>'catalogMin')::integer, 25)),
          'catalogStep', greatest(1, coalesce((p->>'catalogStep')::integer, 25)),
          'catalogCategory', coalesce(p->>'catalogCategory', ''),
          'catalogActive', true,
          'catalogBestSeller', coalesce((p->>'catalogBestSeller')::boolean, false)
        )
        order by lower(coalesce(p->>'n', ''))
      )
      from jsonb_array_elements(coalesce(v_data->'prod', '[]'::jsonb)) p
      where coalesce((p->>'catalogVisible')::boolean, true)
        and coalesce((p->>'catalogActive')::boolean, true)
        and p->>'price' ~ v_num
        and (p->>'price')::numeric > 0
    ), '[]'::jsonb)
  );
end;
$function$;
