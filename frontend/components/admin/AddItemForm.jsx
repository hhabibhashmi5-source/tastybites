// Admin "add menu item" form. Calls the `addMenuItem` Server Action and shows
// a toast on success/failure, then clears itself so the next item is quick.
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addMenuItem } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddItemForm({ categories }) {
  const [state, action, pending] = useActionState(addMenuItem, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        state.category
          ? `Added “${state.addedName}” to ${state.category}`
          : `Added “${state.addedName}” to the menu`
      );
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Classic Beef Burger" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Juicy grilled beef, lettuce, tomato…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price">Price ($)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="6.99"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rating">Rating (0–5)</Label>
        <Input
          id="rating"
          name="rating"
          type="number"
          step="0.1"
          min="0"
          max="5"
          placeholder="4.5"
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="category_id">Category</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue=""
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Auto — detect from the name</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Leave on “Auto” to sort by name (pizza → Fast Food, coffee → Drinks),
          or pick a category to place it yourself.
        </p>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="image_file">Photo (upload)</Label>
        <input
          id="image_file"
          name="image_file"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] hover:file:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
        />
        <p className="text-xs text-muted-foreground">
          Upload an image (max 5 MB), or paste a URL below. An upload wins.
        </p>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          placeholder="/images/burger.jpg or https://…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_featured" className="h-4 w-4" />
        Feature on the home page
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-orange px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70 sm:col-span-2 sm:w-fit"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Adding…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add item
          </>
        )}
      </button>
    </form>
  );
}
