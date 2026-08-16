import {defineArrayMember, defineField, defineType} from 'sanity'

export const marketingPage = defineType({
  name: 'marketingPage',
  title: 'Marketing page',
  type: 'document',
  fields: [
    defineField({name: 'pageKey', title: 'Page', type: 'string', options: {list: [
      {title: 'Home', value: 'home'},
      {title: 'Restaurant', value: 'restaurant'},
      {title: 'Private hall', value: 'hall'},
      {title: 'Story', value: 'story'},
      {title: 'Calicut story', value: 'story-calicut'},
      {title: 'Payments information', value: 'payments'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'title', title: 'Internal title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'eyebrow', title: 'Hero eyebrow', type: 'string'}),
    defineField({name: 'heroHeading', title: 'Hero heading', type: 'string'}),
    defineField({name: 'heroText', title: 'Hero text', type: 'text', rows: 4}),
    defineField({name: 'heroImage', title: 'Hero image', type: 'imageWithAlt'}),
    defineField({name: 'heroPrimaryLink', title: 'Primary action', type: 'link'}),
    defineField({name: 'heroSecondaryLink', title: 'Secondary action', type: 'link'}),
    defineField({name: 'sections', title: 'Page sections', type: 'array', of: [
      defineArrayMember({type: 'contentSection'}),
      defineArrayMember({type: 'callToAction'}),
    ]}),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageKey', media: 'heroImage'}},
})
