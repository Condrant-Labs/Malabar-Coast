import {getSanityClient} from './client'
import {activePromotionsQuery} from './queries'
import {sanitisePublicLink} from './links'

export type Promotion = {
  _id: string
  title: string
  badge?: string
  summary?: string
  offerCode?: string
  validityLabel?: string
  startsAt?: string
  endsAt?: string
  showOnHomepage?: boolean
  terms?: string
  callToAction?: {label: string; href: string; openInNewTab?: boolean}
  poster: {
    url: string
    alt: string
    caption?: string
    lqip?: string
    dimensions?: {width: number; height: number; aspectRatio: number}
  }
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const client = getSanityClient()
  if (!client) return []

  try {
    const records = await client.fetch(activePromotionsQuery, {}, {
      next: {revalidate: 60, tags: ['sanity-promotions']},
    }) as Promotion[]

    return records
      .filter((promotion) => Boolean(promotion._id && promotion.title && promotion.poster?.url && promotion.poster?.alt))
      .map((promotion) => ({...promotion, callToAction: sanitisePublicLink(promotion.callToAction)}))
  } catch (error) {
    console.error('Sanity promotions fetch failed; hiding the offers surface.', error instanceof Error ? error.name : 'UnknownError')
    return []
  }
}
