// Server-side menu data, fetched from Supabase via the Data API (publishable key).
// Replaces the old static lib/menu.js for all menu reads.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ITEM_SELECT =
  "id,name,description,price,image_url,rating,is_featured,categories(name)";

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    // Revalidate at most once a minute, so menu edits appear without a deploy.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Supabase request failed (${res.status}): ${path}`);
  }
  return res.json();
}

// PostgREST returns numerics as strings and nests embedded rows — normalize to
// the shape the components already expect.
function normalize(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image_url,
    rating: Number(row.rating),
    featured: row.is_featured,
    category: row.categories?.name ?? "",
  };
}

export async function getCategories() {
  const rows = await rest("categories?select=name&order=sort_order");
  return rows.map((r) => r.name);
}

export async function getMenuItems() {
  const rows = await rest(
    `menu_items?select=${ITEM_SELECT}&is_available=eq.true&order=created_at`
  );
  return rows.map(normalize);
}

export async function getMenuItem(id) {
  // A malformed id (not a valid UUID) makes PostgREST error out. Treat any such
  // failure as "not found" so the dish page renders a clean 404 instead of a 500.
  try {
    const rows = await rest(
      `menu_items?select=${ITEM_SELECT}&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    return rows[0] ? normalize(rows[0]) : null;
  } catch {
    return null;
  }
}

// Approved customer reviews for the home page. The anon key can only read rows
// where is_approved = true (enforced by RLS), so this never leaks pending ones.
// Degrades gracefully to [] if the reviews table isn't set up yet (migration
// 0005 not applied), so the home page just shows its built-in fallback reviews.
export async function getApprovedReviews(limit = 6) {
  try {
    const rows = await rest(
      `reviews?select=id,name,rating,comment&is_approved=eq.true&order=created_at.desc&limit=${limit}`
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      rating: Number(r.rating),
      comment: r.comment,
    }));
  } catch (err) {
    console.warn("getApprovedReviews failed (using fallback):", err.message);
    return [];
  }
}
