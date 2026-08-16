import {defineField, defineType} from 'sanity'

export const menuCategory = defineType({
  name: 'menuCategory',
  title: 'Menu category',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Category name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'shortTitle', title: 'Short navigation label', type: 'string'}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'orderRank', title: 'Display order', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
    defineField({name: 'published', title: 'Show on menu', type: 'boolean', initialValue: true}),
  ],
  orderings: [{title: 'Menu order', name: 'menuOrder', by: [{field: 'orderRank', direction: 'asc'}]}],
  preview: {select: {title: 'title', order: 'orderRank'}, prepare: ({title, order}) => ({title, subtitle: `Position ${order ?? '—'}`})},
})
