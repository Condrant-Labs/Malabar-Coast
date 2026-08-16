import {defineField, defineType} from 'sanity'

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Frequently asked question',
  type: 'document',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 5, validation: (rule) => rule.required()}),
    defineField({name: 'category', title: 'Category', type: 'string'}),
    defineField({name: 'displayOrder', title: 'Display order', type: 'number', validation: (rule) => rule.required().integer().min(0)}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: true}),
  ],
  orderings: [{title: 'Page order', name: 'pageOrder', by: [{field: 'displayOrder', direction: 'asc'}]}],
  preview: {select: {title: 'question', subtitle: 'category'}},
})
