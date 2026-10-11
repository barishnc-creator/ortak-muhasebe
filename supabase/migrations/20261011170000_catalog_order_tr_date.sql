-- Katalog siparişinin tarihini Türkiye saatine göre yaz.
-- Önceden veritabanının saati (UTC) kullanılıyordu; gece 00:00–03:00 arası
-- verilen siparişler bir önceki güne yazılıyordu. Tek değişiklik 'date' satırı.

CREATE OR REPLACE FUNCTION public.submit_catalog_order(p_workspace_id uuid, p_customer_name text, p_phone text, p_note text, p_items jsonb)
 RETURNS TABLE(order_group text, total numeric, item_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
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
  v_name text := trim(coalesce(p_customer_name,''));
  v_phone text := trim(coalesce(p_phone,''));
BEGIN
  IF v_name = '' THEN
    RAISE EXCEPTION 'Müşteri adı gerekli';
  END IF;
  IF length(v_name) > 120 THEN
    RAISE EXCEPTION 'Müşteri adı çok uzun';
  END IF;
  IF v_phone = '' THEN
    RAISE EXCEPTION 'Telefon numarası gerekli';
  END IF;
  IF length(v_phone) > 40 THEN
    RAISE EXCEPTION 'Telefon numarası çok uzun';
  END IF;

  IF coalesce(jsonb_typeof(p_items),'') <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sepet boş';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) e
    GROUP BY e->>'product_id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Sepette yinelenen ürün var';
  END IF;

  SELECT * INTO v_book
  FROM public.books
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF v_book.workspace_id IS NULL THEN
    RAISE EXCEPTION 'Katalog bulunamadı';
  END IF;

  v_orders := coalesce(v_book.data->'ord','[]'::jsonb);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF coalesce(v_item->>'product_id','') = '' THEN
      RAISE EXCEPTION 'Ürün bilgisi eksik';
    END IF;

    BEGIN
      v_qty := (v_item->>'qty')::integer;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Sipariş miktarı geçersiz';
    END;

    IF v_qty < 1 OR v_qty > 999 THEN
      RAISE EXCEPTION 'Sipariş miktarı 1 ile 999 arasında olmalı';
    END IF;

    SELECT p INTO v_prod
    FROM jsonb_array_elements(
      coalesce(v_book.data->'prod','[]'::jsonb)
    ) p
    WHERE p->>'id' = v_item->>'product_id'
      AND coalesce((p->>'catalogVisible')::boolean,true)
      AND coalesce((p->>'catalogActive')::boolean,true)
      AND coalesce((p->>'price')::numeric,0) > 0
    LIMIT 1;

    IF v_prod IS NULL THEN
      RAISE EXCEPTION 'Sepetteki ürün artık satışta değil';
    END IF;

    v_min := greatest(
      1, coalesce((v_prod->>'catalogMin')::integer,25)
    );
    v_step := greatest(
      1, coalesce((v_prod->>'catalogStep')::integer,25)
    );

    IF v_qty < v_min OR (v_qty - v_min) % v_step <> 0 THEN
      RAISE EXCEPTION
        'Geçersiz miktar. Minimum % adet, artış % adet olmalı',
        v_min, v_step;
    END IF;

    v_price := (v_prod->>'price')::numeric;
    v_total := v_total + v_price * v_qty;
    v_count := v_count + v_qty;

    v_new_orders := v_new_orders || jsonb_build_array(
      jsonb_build_object(
        'id', substr(replace(gen_random_uuid()::text,'-',''),1,10),
        'cust', v_name,
        'prod', v_prod->>'id',
        'qty', v_qty,
        'price', v_price,
        'paid', 0,
        'st', 'Sipariş alındı',
        'ded', false,
        'date', (now() AT TIME ZONE 'Europe/Istanbul')::date::text,
        'source', 'catalog',
        'orderGroup', v_group,
        'phone', v_phone,
        'note', left(trim(coalesce(p_note,'')),500)
      )
    );
  END LOOP;

  UPDATE public.books
  SET data = jsonb_set(
    v_book.data,
    '{ord}',
    v_orders || v_new_orders,
    true
  ),
  updated_at = now()
  WHERE workspace_id = p_workspace_id;

  RETURN QUERY SELECT v_group, v_total, v_count;
END;
$function$;
