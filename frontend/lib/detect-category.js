// Maps a menu item's name to one of the fixed categories by keyword, so admins
// don't have to pick a category by hand (pizza → Fast Food, coffee → Drinks…).
// Anything that doesn't match a keyword falls back to Fast Food.

const RULES = [
  [
    "Drinks",
    [
      "coffee", "latte", "espresso", "cappuccino", "mocha", "americano",
      "frappe", "tea", "chai", "cola", "soda", "juice", "lemonade", "water",
      "milkshake", "shake", "smoothie", "mojito", "cocktail", "drink",
    ],
  ],
  [
    "Desserts",
    [
      "brownie", "cake", "cheesecake", "ice cream", "icecream", "gelato",
      "sundae", "donut", "doughnut", "cookie", "pie", "pudding", "muffin",
      "waffle", "pancake", "pastry", "tart", "cupcake", "mousse", "tiramisu",
      "macaron", "dessert",
    ],
  ],
  [
    "Fast Food",
    [
      "burger", "pizza", "fries", "fry", "wing", "hot dog", "hotdog",
      "sandwich", "nugget", "taco", "burrito", "wrap", "kebab", "shawarma",
      "nachos", "quesadilla", "sausage", "sub", "hoagie", "fried chicken",
    ],
  ],
];

export const DEFAULT_CATEGORY = "Fast Food";

export function detectCategoryName(name) {
  const n = String(name || "").toLowerCase();
  for (const [category, keywords] of RULES) {
    if (keywords.some((k) => n.includes(k))) return category;
  }
  return DEFAULT_CATEGORY;
}
