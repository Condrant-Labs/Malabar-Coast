import {callToAction} from './objects/callToAction'
import {contentSection} from './objects/contentSection'
import {imageWithAlt} from './objects/imageWithAlt'
import {link} from './objects/link'
import {seo} from './objects/seo'
import {faqItem} from './documents/faqItem'
import {legalPage} from './documents/legalPage'
import {marketingPage} from './documents/marketingPage'
import {menuCategory} from './documents/menuCategory'
import {menuItem} from './documents/menuItem'
import {menuPage} from './documents/menuPage'
import {siteSettings} from './documents/siteSettings'
import {testimonial} from './documents/testimonial'
import {promotion} from './documents/promotion'

export const schemaTypes = [
  imageWithAlt,
  link,
  seo,
  callToAction,
  contentSection,
  siteSettings,
  menuCategory,
  menuItem,
  menuPage,
  marketingPage,
  faqItem,
  legalPage,
  testimonial,
  promotion,
]
