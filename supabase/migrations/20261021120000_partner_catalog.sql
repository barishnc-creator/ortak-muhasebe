-- Partner katalogları.
-- Her partnerin gizli bir katalog anahtarı (catKey) vardır. Katalog sayfası
-- ?w=<defter>&p=<anahtar> ile açılır; partnerin adı ve partnerin kendi satış
-- fiyatları (pprices.sale) görünür. Partnere verilen fiyat (pprices.price)
-- bu fonksiyonların hiçbir çıktısında yer almaz.
-- Sipariş, partnerin siparişi olarak (müşteri: partner, fiyat: partner fiyatı)
-- kaydedilir; son müşterinin adı ve telefonu endCust / endPhone alanlarındadır.

create or replace function public.get_partner_catalog(p_workspace_id uuid, p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
$$;

revoke all on function public.get_partner_catalog(uuid, text) from public;
grant execute on function public.get_partner_catalog(uuid, text) to anon, authenticated;


create or replace function public.submit_partner_order(
  p_workspace_id uuid, p_key text, p_customer_name text, p_phone text, p_note text, p_items jsonb)
returns table(order_group text, total numeric, item_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num   text := '^[0-9]+(\.[0-9]+)?$';
  v_book  public.books%rowtype;
  v_pa    jsonb;
  v_item  jsonb;
  v_prod  jsonb;
  v_pp    jsonb;
  v_new   jsonb := '[]'::jsonb;
  v_group text := 'CAT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_qty   integer;
  v_min   integer;
  v_step  integer;
  v_list  numeric;
  v_sale  numeric;
  v_bill  numeric;
  v_disc  numeric;
  v_total numeric := 0;
  v_count integer := 0;
  v_name  text := trim(coalesce(p_customer_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_note  text := trim(coalesce(p_note, ''));
begin
  if v_name = '' then raise exception 'Müşteri adı gerekli'; end if;
  if length(v_name) > 120 then raise exception 'Müşteri adı çok uzun'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then raise exception 'Telefon numarası gerekli'; end if;
  if length(v_phone) > 40 then raise exception 'Telefon numarası çok uzun'; end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sepet boş';
  end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Sepette çok fazla ürün var'; end if;
  if exists (select 1 from jsonb_array_elements(p_items) e group by e->>'product_id' having count(*) > 1) then
    raise exception 'Sepette yinelenen ürün var';
  end if;
  if length(coalesce(p_key, '')) < 12 then raise exception 'Katalog bulunamadı'; end if;

  select * into v_book from public.books where workspace_id = p_workspace_id for update;
  if v_book.workspace_id is null then raise exception 'Katalog bulunamadı'; end if;

  select x into v_pa
  from jsonb_array_elements(coalesce(v_book.data->'partners', '[]'::jsonb)) x
  where x->>'catKey' = p_key and coalesce((x->>'catOff')::boolean, false) = false
  limit 1;
  if v_pa is null then raise exception 'Katalog bulunamadı'; end if;

  v_disc := case when v_pa->>'disc' ~ v_num then least(99, (v_pa->>'disc')::numeric) else 0 end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'product_id', '') = '' then raise exception 'Ürün bilgisi eksik'; end if;
    begin
      v_qty := (v_item->>'qty')::integer;
    exception when others then
      raise exception 'Sipariş miktarı geçersiz';
    end;
    if v_qty < 1 or v_qty > 9999 then raise exception 'Sipariş miktarı geçersiz'; end if;

    select p into v_prod
    from jsonb_array_elements(coalesce(v_book.data->'prod', '[]'::jsonb)) p
    where p->>'id' = v_item->>'product_id'
      and coalesce((p->>'catalogVisible')::boolean, true)
      and coalesce((p->>'catalogActive')::boolean, true)
      and p->>'price' ~ v_num
      and (p->>'price')::numeric > 0
    limit 1;
    if v_prod is null then raise exception 'Sepetteki ürün artık satışta değil'; end if;

    v_min  := greatest(1, coalesce((v_prod->>'catalogMin')::integer, 25));
    v_step := greatest(1, coalesce((v_prod->>'catalogStep')::integer, 25));
    if v_qty < v_min or (v_qty - v_min) % v_step <> 0 then
      raise exception 'Geçersiz miktar. Minimum % adet, artış % adet olmalı', v_min, v_step;
    end if;

    select pp into v_pp
    from jsonb_array_elements(coalesce(v_book.data->'pprices', '[]'::jsonb)) pp
    where pp->>'partner' = v_pa->>'id' and pp->>'prod' = v_prod->>'id'
    limit 1;

    v_list := (v_prod->>'price')::numeric;
    -- Son müşterinin gördüğü fiyat: partnerin satış fiyatı, yoksa liste fiyatı.
    v_sale := case when v_pp->>'sale' ~ v_num and (v_pp->>'sale')::numeric > 0 then (v_pp->>'sale')::numeric else v_list end;
    -- Partnere yazılan fiyat: partner fiyatı, yoksa liste fiyatından partnerin varsayılan indirimi.
    v_bill := case when v_pp->>'price' ~ v_num then (v_pp->>'price')::numeric else round(v_list * (1 - v_disc / 100), 2) end;

    v_total := v_total + v_sale * v_qty;
    v_count := v_count + v_qty;

    v_new := v_new || jsonb_build_array(jsonb_build_object(
      'id', substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
      'cust', coalesce(v_pa->>'name', 'Partner'),
      'prod', v_prod->>'id',
      'qty', v_qty,
      'price', v_bill,
      'sp', v_sale,
      'paid', 0,
      'st', 'Sipariş alındı',
      'ded', false,
      'date', (now() at time zone 'Europe/Istanbul')::date::text,
      'source', 'partner',
      'partner', v_pa->>'id',
      'orderGroup', v_group,
      'endCust', v_name,
      'endPhone', v_phone,
      'note', left(v_note, 500)
    ));
  end loop;

  update public.books
  set data = jsonb_set(v_book.data, '{ord}', coalesce(v_book.data->'ord', '[]'::jsonb) || v_new, true),
      updated_at = now()
  where workspace_id = p_workspace_id;

  return query select v_group, v_total, v_count;
end;
$$;

revoke all on function public.submit_partner_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.submit_partner_order(uuid, text, text, text, text, jsonb) to anon, authenticated;


-- Sipariş takibi: partner katalogundan gelen siparişte son müşterinin telefonu
-- ve adı kullanılır; tutar son müşterinin gördüğü fiyatla (sp) hesaplanır,
-- böylece partnere verilen fiyat takip ekranında görünmez.
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
      case when o->>'qty' ~ v_num then (o->>'qty')::numeric else 0 end as qty,
      case when o->>'sp' ~ v_num then (o->>'sp')::numeric
           when o->>'price' ~ v_num then (o->>'price')::numeric else 0 end as price,
      -- Partner siparişinde partnerin yaptığı ödeme son müşteriye gösterilmez.
      case when o->>'source' = 'partner' then 0
           when o->>'paid' ~ v_num then (o->>'paid')::numeric else 0 end as paid,
      case when (o->>'kons') = 'true'
           then case when o->>'sold' ~ v_num then (o->>'sold')::numeric else 0 end
           else case when o->>'qty' ~ v_num then (o->>'qty')::numeric else 0 end
      end as billed
    from public.books b
    cross join lateral jsonb_array_elements(coalesce(b.data->'ord', '[]'::jsonb)) o
    where o->>'orderGroup' = v_code
      and right(regexp_replace(coalesce(o->>'endPhone', o->>'phone', ''), '\D', '', 'g'), 10) = v_phone
  )
  select jsonb_build_object(
    'code',     v_code,
    'date',     min(o->>'date'),
    'customer', min(coalesce(o->>'endCust', o->>'cust')),
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


-- Bildirim kuyruğu: partner katalogundan gelen siparişler de anında bildirilir.
create or replace function public.enqueue_catalog_push()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_order jsonb;
  v_rows  integer;
  v_new   boolean := false;
begin
  for v_order in
    select value
    from jsonb_array_elements(coalesce(new.data->'ord', '[]'::jsonb))
  loop
    if v_order->>'source' in ('catalog', 'partner')
       and coalesce(v_order->>'orderGroup', '') <> ''
       and not exists (
         select 1
         from jsonb_array_elements(coalesce(old.data->'ord', '[]'::jsonb)) as old_order(value)
         where old_order.value->>'id' = v_order->>'id'
       )
    then
      insert into public.catalog_push_queue (workspace_id, order_group)
      values (new.workspace_id, v_order->>'orderGroup')
      on conflict (workspace_id, order_group) do nothing;

      get diagnostics v_rows = row_count;
      if v_rows > 0 then
        v_new := true;
      end if;
    end if;
  end loop;

  if v_new then
    begin
      perform net.http_post(
        url := 'https://woogrfdcjonaurwgwoor.supabase.co/functions/v1/catalog-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'catalog_service_role_key' limit 1),
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'catalog_service_role_key' limit 1),
          'x-catalog-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'catalog_push_secret' limit 1)
        ),
        body := '{"mode":"process"}'::jsonb
      );
    exception when others then
      raise warning 'Anında bildirim tetiklenemedi (dakikalık görev yakalayacak): %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;
