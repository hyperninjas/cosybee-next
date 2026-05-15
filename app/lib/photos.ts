/**
 * All photo URLs used in marketing sections. Swap any of these for a path
 * under `/public/` when final assets are ready — no other code needs to
 * change.
 */

const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const PHOTOS = {
  // Hero background (atmospheric wide shot)
  heroBg: UNSPLASH("photo-1466611653911-95081537e5b7", 2400),
  // Hero hex cluster
  windTurbine: UNSPLASH("photo-1532601224476-15c79f2f7a51", 900),
  sunflower: UNSPLASH("photo-1597848212624-a19eb35e2651", 900),
  // EnergyMonitoring shared image
  phonesDesk: UNSPLASH("photo-1567427017947-545c5f8d16ad", 1400),
  // EnergyAnalytics shared image
  worker: UNSPLASH("photo-1611365892117-bce8ed8d4eb6"),
  // WhyChoose shared image
  installer: UNSPLASH("photo-1605698335068-09f3fbbcfae5"),
} as const;
