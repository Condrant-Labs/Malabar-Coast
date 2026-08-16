import {defineField, defineType} from 'sanity'

export const callToAction = defineType({
  name: 'callToAction',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
    defineField({name: 'primaryLink', title: 'Primary link', type: 'link'}),
    defineField({name: 'secondaryLink', title: 'Secondary link', type: 'link'}),
    defineField({name: 'image', title: 'Background or supporting image', type: 'imageWithAlt'}),
  ],
  preview: {select: {title: 'heading', subtitle: 'eyebrow', media: 'image'}},
})
