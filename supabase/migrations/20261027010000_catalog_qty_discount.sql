-- Kademeli toptan indirim (genel katalog).
-- Sepetteki toplam adet (farklı ürünler dahil) eşiği geçince bütün kalemlere
-- indirim uygulanır. Kademeler deftere (set.catTiers) yazılabilir; yoksa
-- varsayılan: 100+ adet %10, 200+ adet %15, 300+ adet %20.
-- İndirim sunucuda hesaplanır; sipariş kalemine price (indirimli birim fiyat),
-- gp (liste fiyatı) ve dp (indirim yüzdesi) yazılır.

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
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p->>'id',
          'name', p->>'n',
          'price', coalesce((p->>'price')::numeric, 0),
          'description', coalesce(p->>'catalogDescription', ''),
          'image', coalesce(p->>'catalogImage', ''),
          'video', coalesce(p->>'catalogVideo', ''),
          'catalogMin', greatest(1, coalesce((p->>'catalogMin')::integer, 25)),
          'catalogStep', greatest(1, coalesce((p->>'catalogStep')::integer, 25)),
          'catalogCategory', coalesce(p->>'catalogCategory', ''),
          'catalogActive', coalesce((p->>'catalogActive')::boolean, true),
          'catalogBestSeller', coalesce((p->>'catalogBestSeller')::boolean, false)
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


create or replace function public.submit_catalog_order(p_workspace_id uuid, p_customer_name text, p_phone text, p_note text, p_items jsonb)
returns table(order_group text, total numeric, item_count integer)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_book public.books%rowtype;
  v_item jsonb;
  v_prod jsonb;
  v_orders jsonb;
  v_new_orders jsonb := '[]'::jsonb;
  v_group text := 'CAT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  v_qty integer;
  v_min integer;
  v_step integer;
  v_price numeric;
  v_total numeric := 0;
  v_count integer := 0;
  v_tiers jsonb;
  v_pct numeric := 0;
  v_name text := trim(coalesce(p_customer_name,''));
  v_phone text := trim(coalesce(p_phone,''));
begin
  if v_name = '' then raise exception 'Müşteri adı gerekli'; end if;
  if length(v_name) > 120 then raise exception 'Müşteri adı çok uzun'; end if;
  if v_phone = '' then raise exception 'Telefon numarası gerekli'; end if;
  if length(v_phone) > 40 then raise exception 'Telefon numarası çok uzun'; end if;

  if coalesce(jsonb_typeof(p_items),'') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sepet boş';
  end if;

  if exists (select 1 from jsonb_array_elements(p_items) e group by e->>'product_id' having count(*) > 1) then
    raise exception 'Sepette yinelenen ürün var';
  end if;

  select * into v_book from public.books where workspace_id = p_workspace_id for update;
  if v_book.workspace_id is null then raise exception 'Katalog bulunamadı'; end if;

  v_orders := coalesce(v_book.data->'ord','[]'::jsonb);

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'product_id','') = '' then raise exception 'Ürün bilgisi eksik'; end if;
    begin
      v_qty := (v_item->>'qty')::integer;
    exception when others then
      raise exception 'Sipariş miktarı geçersiz';
    end;
    if v_qty < 1 or v_qty > 999 then raise exception 'Sipariş miktarı 1 ile 999 arasında olmalı'; end if;

    select p into v_prod
    from jsonb_array_elements(coalesce(v_book.data->'prod','[]'::jsonb)) p
    where p->>'id' = v_item->>'product_id'
      and coalesce((p->>'catalogVisible')::boolean,true)
      and coalesce((p->>'catalogActive')::boolean,true)
      and coalesce((p->>'price')::numeric,0) > 0
    limit 1;
    if v_prod is null then raise exception 'Sepetteki ürün artık satışta değil'; end if;

    v_min := greatest(1, coalesce((v_prod->>'catalogMin')::integer,25));
    v_step := greatest(1, coalesce((v_prod->>'catalogStep')::integer,25));
    if v_qty < v_min or (v_qty - v_min) % v_step <> 0 then
      raise exception 'Geçersiz miktar. Minimum % adet, artış % adet olmalı', v_min, v_step;
    end if;

    v_price := (v_prod->>'price')::numeric;
    v_count := v_count + v_qty;

    v_new_orders := v_new_orders || jsonb_build_array(jsonb_build_object(
      'id', substr(replace(gen_random_uuid()::text,'-',''),1,10),
      'cust', v_name,
      'prod', v_prod->>'id',
      'qty', v_qty,
      'price', v_price,
      'paid', 0,
      'st', 'Sipariş alındı',
      'ded', false,
      'date', (now() at time zone 'Europe/Istanbul')::date::text,
      'source', 'catalog',
      'orderGroup', v_group,
      'phone', v_phone,
      'note', left(trim(coalesce(p_note,'')),500)
    ));
  end loop;

  -- Kademeli indirim: toplam adede göre en yüksek uygun yüzde.
  v_tiers := coalesce(v_book.data->'set'->'catTiers', '[{"min":100,"pct":10},{"min":200,"pct":15},{"min":300,"pct":20}]'::jsonb);
  if jsonb_typeof(v_tiers) = 'array' then
    select coalesce(max(least(90, greatest(0, (t->>'pct')::numeric))), 0) into v_pct
    from jsonb_array_elements(v_tiers) t
    where t->>'min' ~ '^[0-9]+$' and t->>'pct' ~ '^[0-9]+(\.[0-9]+)?$'
      and (t->>'min')::integer <= v_count;
  end if;

  if v_pct > 0 then
    select jsonb_agg(o || jsonb_build_object(
             'price', round((o->>'price')::numeric * (1 - v_pct / 100), 2),
             'gp', (o->>'price')::numeric,
             'dp', v_pct) order by n)
    into v_new_orders
    from jsonb_array_elements(v_new_orders) with ordinality as x(o, n);
  end if;

  select coalesce(sum((o->>'price')::numeric * (o->>'qty')::numeric), 0) into v_total
  from jsonb_array_elements(v_new_orders) o;

  update public.books
  set data = jsonb_set(v_book.data, '{ord}', v_orders || v_new_orders, true),
      updated_at = now()
  where workspace_id = p_workspace_id;

  return query select v_group, v_total, v_count;
end;
$function$;
