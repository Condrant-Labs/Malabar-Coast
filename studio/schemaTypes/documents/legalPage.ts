import {defineArrayMember, defineField, defineType} from 'sanity'

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({name: 'pageKey', title: 'Page', type: 'string', options: {list: [
      {title: 'Privacy policy', value: 'privacy'},
      {title: 'Cookie policy', value: 'cookie'},
      {title: 'Returns and refunds', value: 'returns'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({name: 'lastUpdated', title: 'Last updated', type: 'date'}),
    defineField({name: 'body', title: 'Content', type: 'array', of: [defineArrayMember({type: 'block'})], validation: (rule) => rule.required()}),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageKey'}},
})
