/* =====================================================================
   AK.FASHION — PRODUCT CATALOG
   =====================================================================
   HOW TO ADD A NEW PRODUCT
   ------------------------------------------------------------------
   1. Copy one whole { ... } block below (including the comma after it).
   2. Paste it into the list, giving it a unique "id".
   3. Change name, price and description.
   4. Replace photo1 / photo2 with your own image paths (see notes).
   5. Optionally set a video path, or leave it as null.
   6. Save the file and refresh the page — no other file needs to change.

   HOW TO REMOVE A PRODUCT
   ------------------------------------------------------------------
   Delete its whole { ... } block (and the id stays free for reuse).

   ABOUT IMAGES & VIDEO
   ------------------------------------------------------------------
   - Put your real photos/videos inside the /assets/products/ folder,
     then point photo1/photo2/video at them, e.g. "assets/products/gold-chrono-1.jpg".
   - Until you add your own files, this catalog uses free placeholder
     images (picsum.photos) so the site looks complete out of the box.
   - photo1 shows by default on the card; photo2 fades in on hover —
     great for a "front / side" or "on-wrist" shot.
   - video is optional. Leave it as null if you don't have one yet;
     the card will simply not show the video toggle for that product.
   OPTIONAL: "tag"
   ------------------------------------------------------------------
   Add a short tag like "Best Seller" or "New" to badge a product on
   its card and in quick view. Leave it out (or set to null) for no badge.

   "category"
   ------------------------------------------------------------------
   Must match one of the entries in CATEGORIES just below (spelled
   exactly the same). Powers the filter chips above the shop grid.
   ===================================================================== */

const CATEGORIES = ["Watches", "Chains", "Rings"];

const PRODUCTS = [
  {
    id: "watch1",
    category: "Watches",
    name: "Cartier Tank Brown Color",
    price: 2600,          // in PKR — shown as "Rs 24,999"
    description: "Iconic Design",
    tag: "Best Seller",
    photo1: "assets/products/watch1/1.jpeg",
    photo2: "assets/products/watch1/2.jpeg",
    video: null
  },
  {
    id: "watch2",
    category: "Watches",
    name: "Cartier Tank Black Color",
    price: 2600,
    description: "Master Piece",
    tag: null,
    photo1: "assets/products/watch2/1.jpeg",
    photo2: "assets/products/watch2/2.jpeg",
    video: null
  },
  {
    id: "watch3",
    category: "Watches",
    name: "Rolex GMT Golden",
    price: 2999,
    description: "Rolex Watch With Rotating Dail",
    tag: "New",
    photo1: "assets/products/watch3/1.jpeg",
    photo2: "assets/products/watch3/2.jpeg",
    video: null
  },
  {
    id: "watch4",
    category: "Watches",
    name: "Rolex Jublee Chain",
    price: 2999,
    description: "Rolex Having Stainless Steel.",
    tag: "Premium" ,
    photo1: "assets/products/watch4/1.jpeg",
    photo2: "assets/products/watch4/2.jpeg",
    video: null
  },
  {
    id: "watch5",
    category: "watch",
    name: "Hublot Strap",
    price: 2499,
    description: "Elegant yet  powerful. Thin case with a comfort-fit rubber strap. Minimal dial, maximum presence.",
    tag: "Premium",
    photo1: "assets/products/watch5/1.jpeg",
    photo2: "assets/products/watch5/2.jpeg",
    video: null
  },
  {
    id: "watch6",
    category: "Watches",
    name: "Hublot Strap",
    price: 2499,
    description: "Elegant yet  powerful. Thin case with a comfort-fit rubber strap. Minimal dial, maximum presence.",
    tag: "New",
    photo1: "assets/products/watch6/1.jpeg",
    photo2: "assets/products/watch6/2.jpeg",
    video: null
  },

  {
    id: "watch7",
    category: "Watches",
    name: "Tissot PRX",
    price: 2700,
    description: "Silver Chain With Saphire Glass.",
    tag: "New",
    photo1: "assets/products/watch7/1.jpeg",
    photo2: "assets/products/watch7/2.jpeg",
    video: null
  },


  {
    id: "watch8",
    category: "Watches",
    name: "Patek Philippe",
    price: 3200,
    description: "Leather Strap With Master Lock",
    tag: "New",
    photo1: "assets/products/watch8/1.jpeg",
    photo2: "assets/products/watch8/2.jpeg",
    video: null
  },


  {
    id: "watch9",
    category: "Watches",
    name: "Hublot Strap",
    price: 2499,
    description: "Elegant yet  powerful. Thin case with a comfort-fit rubber strap. Minimal dial, maximum presence.",
    tag: "New",
    photo1: "assets/products/watch9/1.jpeg",
    photo2: "assets/products/watch9/2.jpeg",
    video: null
  },

  {
    id: "watch10",
    category: "Watches",
    name: "Rolex Daytona",
    price: 4200,
    description: "The King Of Racing Chronograph.",
    tag: "New",
    photo1: "assets/products/watch10/1.jpeg",
    photo2: "assets/products/watch10/2.jpeg",
    video: null
  }
];
