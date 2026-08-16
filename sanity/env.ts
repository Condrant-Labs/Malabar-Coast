export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "";
export const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
export const sanityApiVersion = "2025-02-19";

export const sanityConfigured = Boolean(sanityProjectId && sanityDataset);
