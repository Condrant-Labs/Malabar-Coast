import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'Search and sharing',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Page title', type: 'string', validation: (rule) => rule.max(70)}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (rule) => rule.max(170)}),
    defineField({name: 'image', title: 'Sharing image', type: 'imageWithAlt'}),
    defineField({name: 'noIndex', title: 'Hide from search engines', type: 'boolean', initialValue: false}),
  ],
})
