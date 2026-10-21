
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Başarısız bir bildirim en fazla bu kadar denenir (dakikalık görev sonsuza kadar denemesin).
const MAX_ATTEMPTS = 5;
// Telefonun pil tasarrufu modunda bekletmemesi için yüksek öncelik; 1 saat içinde ulaşamazsa düşer.
const PUSH_OPTIONS = { urgency: "high" as const, TTL: 3600 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const subject = Deno.env.get("VAPID_SUBJECT")!;

    if (!url || !serviceKey || !publicKey || !privateKey || !subject) {
      return json({ error: "Missing server secrets" }, 500);
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    const db = createClient(url, serviceKey);

    const body = await req.json();
    const mode = body.mode;
    const pushSecret = Deno.env.get("CATALOG_PUSH_SECRET");
    const suppliedSecret = req.headers.get("x-catalog-push-secret");

    // Uygulamadan gelen istekler (abonelik, açık anahtar) giriş yapmış bir defter
    // üyesinden gelmeli; kuyruk işleme ise yalnızca gizli anahtarla çalışır.
    const userFromRequest = async () => {
      const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!token) return null;
      const { data, error } = await db.auth.getUser(token);
      return error ? null : data.user;
    };

    if (mode === "publicKey") {
      const user = await userFromRequest();
      if (!user) return json({ error: "Unauthorized" }, 401);
      return json({ publicKey });
    }

    if (
      mode !== "subscribe" &&
      (!pushSecret || suppliedSecret !== pushSecret)
    ) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (mode === "subscribe") {
      const workspace_id = body.workspace_id ?? body.workspaceId;
      const { subscription } = body;

      const user = await userFromRequest();
      if (!user) return json({ error: "Giriş yapılmalı" }, 401);
      const { data: member } = await db
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!member) return json({ error: "Bu defterin üyesi değilsiniz" }, 403);

      if (
        typeof workspace_id !== "string" ||
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        return json({ error: "Invalid subscription" }, 400);
      }

      const { error } = await db.from("catalog_push_subscriptions").upsert({
        workspace_id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,endpoint" });

      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, message: "Subscription saved" });
    }

    if (mode !== "process") return json({ error: "Unknown mode" }, 400);

    const { data: jobs, error: jobError } = await db
      .from("catalog_push_queue")
      .select("*")
      .is("processed_at", null)
      .lt("attempts", MAX_ATTEMPTS)
      .order("id", { ascending: true })
      .limit(10);

    if (jobError) return json({ error: jobError.message }, 500);
    if (!jobs?.length) return json({ ok: true, processed: 0 });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of jobs) {
      // İşi kilitle: anında tetikleme ile dakikalık görev aynı anda çalışırsa
      // yalnızca biri bu siparişi alır, böylece çift bildirim gitmez.
      const claimedAt = new Date().toISOString();
      const { data: claimed, error: claimError } = await db
        .from("catalog_push_queue")
        .update({ processed_at: claimedAt })
        .eq("id", job.id)
        .is("processed_at", null)
        .select("id");

      if (claimError || !claimed?.length) {
        skipped++;
        continue;
      }

      const { data: subs, error: subError } = await db
        .from("catalog_push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("workspace_id", job.workspace_id);

      // Bildirimde sipariş kodu yerine müşterinin adı, adet ve tutar görünsün.
      let body = `Yeni sipariş alındı: ${job.order_group}`;
      let title = "Yeni katalog siparişi";
      const { data: book } = await db
        .from("books")
        .select("ord:data->ord")
        .eq("workspace_id", job.workspace_id)
        .maybeSingle();
      const items = (Array.isArray(book?.ord) ? book.ord : [])
        .filter((o: { orderGroup?: string }) => o?.orderGroup === job.order_group);
      if (items.length) {
        const qty = items.reduce((a: number, o: { qty?: number }) => a + (Number(o.qty) || 0), 0);
        const total = items.reduce((a: number, o: { qty?: number; price?: number }) => a + (Number(o.qty) || 0) * (Number(o.price) || 0), 0);
        const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 })
          .format(total).replace(/,00$/, "");
        const cust = String(items[0].cust || "Müşteri").slice(0, 60);
        body = `${cust}: ${items.length > 1 ? items.length + " ürün, " : ""}${qty} adet, ${money}`;
        // Partner katalogundan gelen sipariş: başlıkta partner, metinde son müşteri.
        if (items[0].source === "partner") {
          title = `${cust} kataloğundan sipariş`;
          const end = String(items[0].endCust || "Müşteri").slice(0, 60);
          body = `${end}: ${items.length > 1 ? items.length + " ürün, " : ""}${qty} adet, ${money}`;
        }
      }

      const payload = JSON.stringify({
        title,
        body,
        url: "https://barishnc-creator.github.io/ortak-muhasebe/index.html#ord",
      });

      let allOk = !subError && (subs?.length ?? 0) > 0;
      for (const sub of subError ? [] : subs ?? []) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }, payload, PUSH_OPTIONS);
          sent++;
        } catch (e) {
          allOk = false;
          console.error("Push failed:", e);
          if ((e as { statusCode?: number }).statusCode === 404 ||
              (e as { statusCode?: number }).statusCode === 410) {
            await db.from("catalog_push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      if (!allOk) {
        // Kilidi bırak ve deneme sayısını artır; dakikalık görev tekrar dener.
        failed++;
        await db.from("catalog_push_queue")
          .update({ processed_at: null, attempts: (job.attempts ?? 0) + 1 })
          .eq("id", job.id);
      }
    }

    return json({ ok: true, sent, failed, skipped, jobs: jobs.length });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
