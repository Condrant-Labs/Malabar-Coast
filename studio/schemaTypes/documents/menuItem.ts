import {defineArrayMember, defineField, defineType} from 'sanity'

const allergenOptions = ['celery', 'cereals containing gluten', 'crustaceans', 'eggs', 'fish', 'lupin', 'milk', 'molluscs', 'mustard', 'nuts', 'peanuts', 'sesame', 'soya', 'sulphites']

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu item',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: (rule) => rule.required()}),
    defineField({name: 'sourceKey', title: 'Stable ordering key', type: 'string', readOnly: true}),
    defineField({name: 'category', title: 'Category', type: 'reference', to: [{type: 'menuCategory'}], validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3, description: 'Optional until the kitchen approves final dish descriptions.'}),
    defineField({name: 'subheading', title: 'Subheading', type: 'string', description: 'Used for groups such as Whisky, Rum or House Wines.'}),
    defineField({name: 'image', title: 'Dish image', type: 'imageWithAlt'}),
    defineField({name: 'pricePence', title: 'Price in pennies', type: 'number', description: '1295 means £12.95. Leave empty when the price must not be published.', validation: (rule) => rule.integer().min(0)}),
    defineField({name: 'priceLabel', title: 'Optional public price label', type: 'string', description: 'For example “Market price” or “Ask our team”.'}),
    defineField({name: 'hidePrice', title: 'Hide the price', type: 'boolean', initialValue: false}),
    defineField({name: 'isAlcoholic', title: 'Contains alcohol', type: 'boolean', initialValue: false}),
    defineField({name: 'isVegetarian', title: 'Vegetarian', type: 'boolean', initialValue: false}),
    defineField({name: 'isVegan', title: 'Vegan', type: 'boolean', initialValue: false}),
    defineField({
      name: 'dietaryReviewStatus',
      title: 'Dietary information status',
      type: 'string',
      options: {list: [
        {title: 'Confirmed by restaurant', value: 'confirmed'},
        {title: 'Needs restaurant confirmation', value: 'needs-review'},
      ], layout: 'radio'},
      initialValue: 'needs-review',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'dietaryNotes', title: 'Dietary notes', type: 'text', rows: 2}),
    defineField({name: 'allergens', title: 'Confirmed allergens', type: 'array', of: [defineArrayMember({type: 'string'})], options: {list: allergenOptions}}),
    defineField({name: 'allergenNotes', title: 'Allergen and cross-contamination notes', type: 'text', rows: 2}),
    defineField({name: 'spiceLevel', title: 'Spice level', type: 'string', options: {list: ['none', 'gentle', 'warm', 'medium', 'hot', 'aromatic']}}),
    defineField({name: 'available', title: 'Available', type: 'boolean', initialValue: true}),
    defineField({name: 'onlineOrdering', title: 'Allow online ordering', type: 'boolean', initialValue: true}),
    defineField({name: 'featured', title: 'Featured dish', type: 'boolean', initialValue: false}),
    defineField({name: 'displayOrder', title: 'Order within category', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
  ],
  validation: (rule) => rule.custom((item) => {
    if (item?.onlineOrdering && (item.pricePence === undefined || item.pricePence === null)) return 'Online-orderable items need a price.'
    if (item?.isVegan && !item?.isVegetarian) return 'A vegan item must also be marked vegetarian.'
    if (item?.isAlcoholic && item?.onlineOrdering) return 'Alcoholic items are not available for online ordering.'
    return true
  }),
  orderings: [{title: 'Menu order', name: 'menuOrder', by: [{field: 'category.orderRank', direction: 'asc'}, {field: 'displayOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', category: 'category.title', price: 'pricePence', hidden: 'hidePrice', available: 'available', media: 'image'},
    prepare: ({title, category, price, hidden, available, media}) => ({
      title,
      subtitle: `${category || 'Uncategorised'} · ${hidden || price == null ? 'Price hidden' : `£${(price / 100).toFixed(2)}`} · ${available ? 'Available' : 'Unavailable'}`,
      media,
    }),
  },
})
