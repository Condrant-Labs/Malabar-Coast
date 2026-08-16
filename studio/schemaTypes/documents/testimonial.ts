import {defineField, defineType} from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'name', title: 'Guest name or attribution', type: 'string'}),
    defineField({name: 'source', title: 'Source', type: 'string'}),
    defineField({name: 'rating', title: 'Rating', type: 'number', validation: (rule) => rule.min(1).max(5)}),
    defineField({name: 'displayOrder', title: 'Display order', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: true}),
  ],
  preview: {select: {title: 'name', subtitle: 'quote'}},
})
