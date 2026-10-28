-- İndirimler bölümü: kampanyalar ve düzenlenebilir toptan adet kademeleri.
-- Kampanya (data.promos): {name, pct, start, end, all, prods[], on}. Bugün (İstanbul)
-- start..end aralığındaysa ve ürünü kapsıyorsa uygulanır; çakışırsa en yüksek yüzde.
-- Kademe (data.set.catTiers) toplam adede göre. set.promoStack=false ise kalem başına
-- büyük olan indirim, true ise ikisi birlikte (çarpımsal) uygulanır.

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
  v_stack boolean := false;
  v_today text := to_char((now() at time zone 'Europe/Istanbul')::date, 'YYYY-MM-DD');
  v_promo jsonb;
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

    -- Bugün geçerli, bu ürünü kapsayan en yüksek kampanya
    select x into v_promo
    from jsonb_array_elements(coalesce(v_book.data->'promos', '[]'::jsonb)) x
    where coalesce((x->>'on')::boolean, true)
      and (case when x->>'pct' ~ '^[0-9]+(\.[0-9]+)?$' then (x->>'pct')::numeric else 0 end) between 0.01 and 90
      and (coalesce(x->>'start', '') = '' or x->>'start' <= v_today)
      and (coalesce(x->>'end', '') = '' or x->>'end' >= v_today)
      and (coalesce((x->>'all')::boolean, false) or coalesce(x->'prods', '[]'::jsonb) ? (v_prod->>'id'))
    order by (case when x->>'pct' ~ '^[0-9]+(\.[0-9]+)?$' then (x->>'pct')::numeric else 0 end) desc
    limit 1;

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
      'note', left(trim(coalesce(p_note,'')),500),
      '_pp', coalesce((v_promo->>'pct')::numeric, 0),
      '_pn', coalesce(v_promo->>'name', '')
    ));
    v_promo := null;
  end loop;

  -- Kademeli indirim: toplam adede göre en yüksek uygun yüzde.
  v_tiers := coalesce(v_book.data->'set'->'catTiers', '[{"min":100,"pct":10},{"min":200,"pct":15},{"min":300,"pct":20}]'::jsonb);
  if jsonb_typeof(v_tiers) = 'array' then
    select coalesce(max(least(90, greatest(0, (t->>'pct')::numeric))), 0) into v_pct
    from jsonb_array_elements(v_tiers) t
    where t->>'min' ~ '^[0-9]+$' and t->>'pct' ~ '^[0-9]+(\.[0-9]+)?$'
      and (t->>'min')::integer <= v_count;
  end if;

  v_stack := coalesce((v_book.data->'set'->>'promoStack')::boolean, false);

  -- Kampanya ve kademe: ayara göre ya büyük olan ya da ikisi birlikte uygulanır.
  select jsonb_agg(
           (x.o - '_pp' - '_pn')
           || case when x.unit < x.list then jsonb_build_object('price', x.unit, 'gp', x.list, 'dp', round((1 - x.unit / x.list) * 100, 2)) else '{}'::jsonb end
           || case when x.pp > 0 then jsonb_build_object('promo', x.pn) else '{}'::jsonb end
           order by x.n)
  into v_new_orders
  from (
    select e.o, e.n, (e.o->>'price')::numeric as list, (e.o->>'_pp')::numeric as pp, e.o->>'_pn' as pn,
      case when v_stack
           then round((e.o->>'price')::numeric * (1 - (e.o->>'_pp')::numeric / 100) * (1 - v_pct / 100), 2)
           else round((e.o->>'price')::numeric * (1 - greatest((e.o->>'_pp')::numeric, v_pct) / 100), 2)
      end as unit
    from jsonb_array_elements(v_new_orders) with ordinality as e(o, n)
  ) x;

  select coalesce(sum((o->>'price')::numeric * (o->>'qty')::numeric), 0) into v_total
  from jsonb_array_elements(v_new_orders) o;

  update public.books
  set data = jsonb_set(v_book.data, '{ord}', v_orders || v_new_orders, true),
      updated_at = now()
  where workspace_id = p_workspace_id;

  return query select v_group, v_total, v_count;
end;
$function$;
