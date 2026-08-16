import {createClient} from "next-sanity";
import {sanityApiVersion, sanityConfigured, sanityDataset, sanityProjectId} from "../env";

let client: ReturnType<typeof createClient> | null | undefined;

export function getSanityClient() {
  if (!sanityConfigured) return null;
  if (client !== undefined) return client;

  const token = process.env.SANITY_API_TOKEN?.trim();
  client = createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    perspective: "published",
    useCdn: !token,
    token: token || undefined,
  });

  return client;
}
