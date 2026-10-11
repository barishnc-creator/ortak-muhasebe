-- Katalog siparişi bildirimini anında gönder.
-- Önceden sipariş kuyruğa giriyor, dakikada bir çalışan görev bekleniyordu (0–60 sn gecikme).
-- Artık kuyruğa yeni bir sipariş girdiği anda gönderim fonksiyonu hemen çağrılıyor.
-- Dakikalık görev yedek olarak kalıyor (anında çağrı başarısız olursa o yakalar).
-- Çağrı hata verse bile sipariş kaydı asla engellenmez.

create or replace function public.enqueue_catalog_push()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_order jsonb;
  v_rows  integer;
  v_new   boolean := false;
begin
  for v_order in
    select value
    from jsonb_array_elements(coalesce(new.data->'ord', '[]'::jsonb))
  loop
    if v_order->>'source' = 'catalog'
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
$$;
