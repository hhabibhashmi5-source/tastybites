"use server";

// Admin server actions. Every action re-verifies the caller is a signed-in
// admin — Server Actions are reachable by direct POST, so the proxy guard
// alone is not enough (see Next.js "Mutating Data" security note).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_STATUSES } from "@/lib/order-status";
import { detectCategoryName } from "@/lib/detect-category";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Upload a menu photo to the public `menu-images` bucket and return its public
// URL. Uses the service-role client so it isn't blocked by storage RLS.
async function uploadMenuImage(file) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 5 MB).");
  }
  if (!file.type?.startsWith("image/")) {
    throw new Error("That file isn't an image.");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `items/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("menu-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = admin.storage.from("menu-images").getPublicUrl(path);
  return publicUrl;
}

// Returns the Supabase client if the caller is an admin, otherwise null.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return supabase;
}

// Resolve a category by name, creating it if it doesn't exist yet. Returns id.
async function resolveCategoryId(supabase, name) {
  const clean = name.trim();
  if (!clean) return null;

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", clean)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ name: clean })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

// useActionState-compatible: (prevState, formData) => newState
export async function addMenuItem(_prevState, formData) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return { ok: false, error: "Not authorized. Sign in as an admin." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  let imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageFile = formData.get("image_file");
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const manualCategory = String(formData.get("category_id") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "on";

  // ---- Validation ----
  if (name.length < 1 || name.length > 120) {
    return { ok: false, error: "Name is required (max 120 chars)." };
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Enter a valid price (e.g. 6.99)." };
  }
  const rating = ratingRaw === "" ? 4.5 : Number(ratingRaw);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { ok: false, error: "Rating must be between 0 and 5." };
  }

  // Pick the category: an explicit manual choice wins; otherwise auto-detect
  // it from the item name (pizza → Fast Food, coffee → Drinks, …).
  let categoryId = manualCategory || null;
  let categoryName = null;
  try {
    // An uploaded photo wins over a typed URL.
    if (imageFile && typeof imageFile === "object" && imageFile.size > 0) {
      imageUrl = await uploadMenuImage(imageFile);
    }

    if (categoryId) {
      const { data: c } = await supabase
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .maybeSingle();
      categoryName = c?.name ?? null;
    } else {
      categoryName = detectCategoryName(name);
      categoryId = await resolveCategoryId(supabase, categoryName);
    }

    const { error } = await supabase.from("menu_items").insert({
      name,
      description: description || null,
      price,
      image_url: imageUrl || null,
      rating,
      is_featured: isFeatured,
      category_id: categoryId,
    });

    if (error) throw error;
  } catch (err) {
    console.error("addMenuItem failed:", err);
    return { ok: false, error: err.message || "Could not add the item." };
  }

  // Menu page caches for 60s — bust it so the new item shows immediately.
  revalidatePath("/menu");
  revalidatePath("/admin");
  return { ok: true, error: null, addedName: name, category: categoryName };
}

export async function setItemAvailability(formData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  const available = formData.get("available") === "true";
  if (!id) return;

  await supabase
    .from("menu_items")
    .update({ is_available: available })
    .eq("id", id);

  revalidatePath("/menu");
  revalidatePath("/admin");
}

export async function deleteMenuItem(formData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("menu_items").delete().eq("id", id);

  revalidatePath("/menu");
  revalidatePath("/admin");
}

// Approve (show on the home page) or hide a customer review.
export async function setReviewApproval(formData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  const approved = formData.get("approved") === "true";
  if (!id) return;

  await supabase
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", id);

  revalidatePath("/"); // home testimonials
  revalidatePath("/admin");
}

export async function deleteReview(formData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("reviews").delete().eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

// Move an order along its lifecycle (paid → preparing → out_for_delivery →
// delivered). RLS lets only admins update orders; we double-check here too.
export async function updateOrderStatus(formData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !ORDER_STATUSES.includes(status)) return;

  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

// useActionState-compatible: (prevState, formData) => newState
// Signs the user in, then confirms they're an admin before letting them in.
export async function signIn(_prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin") || "/admin";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { error: "Invalid email or password." };
  }

  // Only admins may use this area — sign back out if the role isn't admin.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }

  // Only redirect to internal paths (never an attacker-supplied URL).
  redirect(next.startsWith("/admin") ? next : "/admin");
}

// useActionState-compatible: (prevState, formData) => newState
// Creates a new account. New accounts are always CUSTOMERS (role defaults to
// 'customer' via the DB signup trigger) — admin access is never self-granted.
// To make someone an admin, an existing admin sets profiles.role = 'admin'
// (e.g. via supabase/migrations/0004_make_admin.sql). This is what keeps the
// admin area separated from regular customers.
export async function signUp(_prevState, formData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) return { error: "Enter your email." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    return { error: error.message || "Could not create the account." };
  }

  // If email confirmation is ON there's no session yet — show the "check your
  // email" screen. If it's OFF the customer is signed in; send them to the
  // home page (NOT /admin — they're a customer and would just be bounced).
  if (!data.session) {
    return { ok: true, needsConfirm: true };
  }

  redirect("/");
}

// useActionState-compatible: (prevState, formData) => newState
// Lets the signed-in admin set a new password for their own account.
export async function changePassword(_prevState, formData) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return { error: "Not authorized. Sign in as an admin." };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message || "Could not update the password." };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
