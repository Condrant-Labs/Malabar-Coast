import {createClient} from '@sanity/client'

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})

const definitions = [
  {key: 'kozhikode', sourceKey: 'biriyani-chicken', area: 'Kozhikode', region: 'North Malabar', coordinates: '11.2588° N · 75.7804° E', yearLabel: 'The biriyani capital', courseLabel: 'Malabar rice', description: 'Kozhikode is one of Malabar cuisine’s great centres, celebrated for fragrant dum biriyani and generous coastal hospitality.'},
  {key: 'kannur', sourceKey: 'malabar-coast-signature-konju-coconut-fry', area: 'Kannur', region: 'North Kerala coast', coordinates: '11.8745° N · 75.3704° E', yearLabel: 'Coconut and coast', courseLabel: 'Coastal fry', description: 'A northern coastal plate of prawns, coconut and curry leaves, carrying the bold savoury character of Kerala’s Arabian Sea shore.'},
  {key: 'palakkad', sourceKey: 'desserts-palada-payasam', area: 'Palakkad', region: 'The Kerala gap', coordinates: '10.7867° N · 76.6548° E', yearLabel: 'Rice and harvest', courseLabel: 'Festive sweet', description: 'Slow-cooked rice ada and milk give this beloved festive payasam its gentle sweetness and unmistakably Keralite finish.'},
  {key: 'kochi', sourceKey: 'malabar-coast-signature-prawn-moilee', area: 'Kochi', region: 'Central Kerala coast', coordinates: '9.9312° N · 76.2673° E', yearLabel: 'Harbour kitchen', courseLabel: 'Coconut curry', description: 'A harbour-side style of mild coconut curry, bright with ginger, green chilli and curry leaf around tender prawns.'},
  {key: 'kuttanad', sourceKey: 'malabar-coast-signature-fish-pollichathu', area: 'Kuttanad', region: 'Alappuzha backwaters', coordinates: '9.4981° N · 76.3388° E', yearLabel: 'Below sea level', courseLabel: 'Banana-leaf fish', description: 'Kuttanad’s backwater cooking is closely associated with fish pollichathu: spice-coated fish wrapped in banana leaf and cooked until aromatic.'},
  {key: 'kottayam', sourceKey: 'malabar-coast-signature-beef-roast', area: 'Kottayam', region: 'Central Travancore', coordinates: '9.5916° N · 76.5222° E', yearLabel: 'Pepper country', courseLabel: 'Slow roast', description: 'Deep-roasted meat, black pepper, coconut and curry leaves evoke the robust Syrian-Christian kitchens of central Travancore.'},
] as const

async function main() {
const sourceKeys = definitions.map((definition) => definition.sourceKey)
const [page, dishes] = await Promise.all([
  client.fetch<{voyageStops?: Array<{_key?: string; image?: unknown}>} | null>(`*[_id == "menuPage"][0]{voyageStops[]{_key,image}}`),
  client.fetch<Array<{_id: string; sourceKey: string}>>(`*[_type == "menuItem" && sourceKey in $sourceKeys]{_id,sourceKey}`, {sourceKeys}),
])

if (!page) throw new Error('The menuPage singleton does not exist.')
const dishByKey = new Map(dishes.map((dish) => [dish.sourceKey, dish._id]))
const missing = sourceKeys.filter((sourceKey) => !dishByKey.has(sourceKey))
if (missing.length) throw new Error(`Missing menu dishes: ${missing.join(', ')}`)

const oldStops = page.voyageStops || []
const voyageStops = definitions.map((definition, index) => ({
  _key: oldStops[index]?._key || definition.key,
  _type: 'object',
  dish: {_type: 'reference', _ref: dishByKey.get(definition.sourceKey)},
  // Keep port populated until every deployed frontend reads the new area field.
  area: definition.area,
  port: definition.area,
  region: definition.region,
  coordinates: definition.coordinates,
  yearLabel: definition.yearLabel,
  courseLabel: definition.courseLabel,
  description: definition.description,
  ...(oldStops[index]?.image ? {image: oldStops[index].image} : {}),
}))

const update = {
  eyebrow: 'A taste of Kerala · North to South',
  headingLineOne: 'Six regions.',
  headingLineTwo: 'One Kerala.',
  introduction: 'Travel through six Kerala food landscapes, from Malabar’s biriyani kitchens to Kuttanad’s banana-leaf fish and the coconut-rich curries of the southern coast.',
  journeyLinkLabel: 'Explore Kerala',
  voyageStops,
}

if (!apply) {
  console.log(JSON.stringify({mode: 'dry-run', headings: [update.headingLineOne, update.headingLineTwo], areas: voyageStops.map((stop) => stop.area)}, null, 2))
  return
}

const updated = await client.patch('menuPage').set(update).commit({returnDocuments: true})
console.log(JSON.stringify({mode: 'applied', updatedAt: updated._updatedAt, headings: [updated.headingLineOne, updated.headingLineTwo], areas: updated.voyageStops.map((stop: {area: string}) => stop.area)}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu-region migration failed.')
  process.exit(1)
})
