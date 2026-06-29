"use server";

// Customer account server actions: sign up, sign in, sign out, and editing the
// signed-in user's own profile. These mirror the admin auth actions but are NOT
// admin-gated — any visitor can create a customer account, and any signed-in
// user may sign in here and manage their own profile/order history.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Only ever follow internal paths (never an attacker-supplied absolute URL).
function safeNext(next, fallback = "/account") {
  const n = String(next ?? "");
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

// useActionState-compatible: (prevState, formData) => newState
// Signs an existing user in (customer OR admin) and sends them on. Unlike the
// admin sign-in this does not reject non-admins — it's the public customer door.
export async function customerSignIn(_prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(next);
}

// useActionState-compatible: (prevState, formData) => newState
// Creates a new CUSTOMER account (role defaults to 'customer' via the DB
// signup trigger). If email confirmation is on there's no session yet, so we
// show a "check your email" screen; otherwise the user is signed in already.
export async function customerSignUp(_prevState, formData) {
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

  if (!data.session) {
    return { ok: true, needsConfirm: true };
  }

  redirect("/account");
}

export async function customerSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// useActionState-compatible: (prevState, formData) => newState
// Updates the signed-in user's own profile. RLS (`profiles_update_own`) makes
// sure a user can only ever touch their own row.
export async function updateProfile(_prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in first." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const defaultAddress = String(formData.get("default_address") ?? "").trim();

  if (fullName.length > 80) {
    return { error: "Name is too long (80 characters max)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      default_address: defaultAddress || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message || "Could not save your profile." };
  }

  revalidatePath("/account");
  return { ok: true };
}
