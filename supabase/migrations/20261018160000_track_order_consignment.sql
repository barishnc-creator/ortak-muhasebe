-- Sipariş takibi: konsinye siparişlerde toplam tutar yalnızca satılan adet
-- üzerinden hesaplanır (uygulamadaki otot ile aynı kural). Gönderilen adet
-- ürün listesinde görünmeye devam eder.

create or replace function public.track_catalog_order(p_code text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code   text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_phone  text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_stages text[] := array['Sipariş alındı', 'Baskıda', 'Hazır', 'Teslim edildi'];
  v_num    text := '^-?[0-9]+(\.[0-9]+)?$';
  v_result jsonb;
begin
  if v_code ~ '^[0-9A-F]{8}$' then
    v_code := 'CAT-' || v_code;
  end if;

  if v_code !~ '^CAT-[0-9A-F]{8}$' or length(v_phone) < 10 then
    return null;
  end if;

  with items as (
    select
      o,
      b.data as d,
      case when o->>'qty'   ~ v_num then (o->>'qty')::numeric   else 0 end as qty,
      case when o->>'price' ~ v_num then (o->>'price')::numeric else 0 end as price,
      case when o->>'paid'  ~ v_num then (o->>'paid')::numeric  else 0 end as paid,
      -- Konsinyede yalnızca satıldığı bildirilen adet borca yazılır.
      case when (o->>'kons') = 'true'
           then case when o->>'sold' ~ v_num then (o->>'sold')::numeric else 0 end
           else case when o->>'qty' ~ v_num then (o->>'qty')::numeric else 0 end
      end as billed
    from public.books b
    cross join lateral jsonb_array_elements(coalesce(b.data->'ord', '[]'::jsonb)) o
    where o->>'orderGroup' = v_code
      and right(regexp_replace(coalesce(o->>'phone', ''), '\D', '', 'g'), 10) = v_phone
  )
  select jsonb_build_object(
    'code',     v_code,
    'date',     min(o->>'date'),
    'customer', min(o->>'cust'),
    'stage',    min(coalesce(array_position(v_stages, o->>'st'), 1)) - 1,
    'stages',   to_jsonb(v_stages),
    'total',    sum(billed * price),
    'paid',     sum(paid),
    'items',    jsonb_agg(
                  jsonb_build_object(
                    'name', coalesce(
                      (select p->>'n'
                         from jsonb_array_elements(coalesce(d->'prod', '[]'::jsonb)) p
                        where p->>'id' = o->>'prod'
                        limit 1),
                      'Ürün'),
                    'qty', qty,
                    'status', coalesce(o->>'st', 'Sipariş alındı'))
                  order by o->>'id')
  )
  into v_result
  from items
  having count(*) > 0;

  return v_result;
end;
$$;

revoke all on function public.track_catalog_order(text, text) from public;
grant execute on function public.track_catalog_order(text, text) to anon, authenticated;
