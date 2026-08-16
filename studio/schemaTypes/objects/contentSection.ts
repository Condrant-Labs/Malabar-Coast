import {defineArrayMember, defineField, defineType} from 'sanity'

export const contentSection = defineType({
  name: 'contentSection',
  title: 'Page section',
  type: 'object',
  fields: [
    defineField({name: 'internalName', title: 'Internal name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'array', of: [defineArrayMember({type: 'block'})]}),
    defineField({name: 'image', title: 'Main image', type: 'imageWithAlt'}),
    defineField({name: 'secondaryImage', title: 'Secondary image', type: 'imageWithAlt'}),
    defineField({name: 'links', title: 'Links', type: 'array', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'shortLabel', title: 'Short label or coordinate', type: 'string'}),
    defineField({name: 'note', title: 'Supporting note', type: 'text', rows: 2}),
    defineField({name: 'theme', title: 'Visual theme', type: 'string', options: {list: ['dark', 'light', 'green', 'copper']}}),
  ],
  preview: {select: {title: 'internalName', subtitle: 'heading', media: 'image'}},
})
