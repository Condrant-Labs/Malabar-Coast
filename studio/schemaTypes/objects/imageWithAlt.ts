import {defineField, defineType} from 'sanity'

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describe the image for people using screen readers.',
      validation: (rule) => rule.required().min(3).max(180),
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
})
