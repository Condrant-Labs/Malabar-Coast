import {defineField, defineType} from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'href', title: 'URL or site path', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'openInNewTab', title: 'Open in a new tab', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})
