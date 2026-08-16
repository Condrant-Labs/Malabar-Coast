import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({name: 'restaurantName', title: 'Restaurant name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'legalName', title: 'Legal name', type: 'string'}),
    defineField({name: 'shortDescription', title: 'Short description', type: 'string', validation: (rule) => rule.max(160)}),
    defineField({name: 'description', title: 'Full description', type: 'text', rows: 4}),
    defineField({name: 'logo', title: 'Main logo', type: 'imageWithAlt'}),
    defineField({name: 'lightLogo', title: 'Logo for dark backgrounds', type: 'imageWithAlt'}),
    defineField({name: 'favicon', title: 'Browser icon', type: 'imageWithAlt'}),
    defineField({name: 'siteUrl', title: 'Website URL', type: 'url'}),
    defineField({name: 'phone', title: 'Telephone', type: 'string'}),
    defineField({name: 'email', title: 'Public email', type: 'email'}),
    defineField({name: 'reservationEmail', title: 'Reservation notification email', type: 'email'}),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({name: 'streetAddress', title: 'Street', type: 'string'}),
        defineField({name: 'locality', title: 'Town or city', type: 'string'}),
        defineField({name: 'region', title: 'Region', type: 'string'}),
        defineField({name: 'postalCode', title: 'Postcode', type: 'string'}),
        defineField({name: 'country', title: 'Country code', type: 'string', initialValue: 'GB'}),
      ],
    }),
    defineField({
      name: 'coordinates',
      title: 'Map coordinates',
      type: 'object',
      fields: [defineField({name: 'latitude', type: 'number'}), defineField({name: 'longitude', type: 'number'})],
    }),
    defineField({name: 'mapUrl', title: 'Directions link', type: 'url'}),
    defineField({
      name: 'openingHours',
      title: 'Opening hours',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'days', title: 'Day or range', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'hours', title: 'Hours', type: 'string', validation: (rule) => rule.required()}),
      ], preview: {select: {title: 'days', subtitle: 'hours'}}})],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social profiles',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'platform', title: 'Platform', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'url', title: 'Profile URL', type: 'url', validation: (rule) => rule.required()}),
      ], preview: {select: {title: 'platform', subtitle: 'url'}}})],
    }),
    defineField({name: 'primaryNavigation', title: 'Main navigation', type: 'array', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'footerNavigation', title: 'Footer navigation', type: 'array', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'announcement', title: 'Announcement banner', type: 'string'}),
    defineField({name: 'copyrightText', title: 'Copyright text', type: 'string'}),
    defineField({name: 'defaultSeo', title: 'Default search and sharing', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
