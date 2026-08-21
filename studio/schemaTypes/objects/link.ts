import {defineField, defineType} from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'href',
      title: 'URL or site path',
      type: 'string',
      description: 'Use a site path beginning with /, an on-page #anchor, or a secure https:// URL.',
      validation: (rule) => rule.required().custom((value) => {
        if (!value) return true
        const href = value.trim()
        if ((href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#') || /^(mailto|tel):[^\s]+$/i.test(href)) return true
        try {
          return new URL(href).protocol === 'https:' || 'Use an internal path, anchor, email, telephone, or secure HTTPS URL.'
        } catch {
          return 'Use an internal path, anchor, email, telephone, or secure HTTPS URL.'
        }
      }),
    }),
    defineField({name: 'openInNewTab', title: 'Open in a new tab', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})
