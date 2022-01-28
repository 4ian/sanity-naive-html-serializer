import schemas from 'part:@sanity/base/schema'
import blocksToHtml, { h } from '@sanity/block-content-to-html'
import { defaultStopTypes, customSerializers } from './BaseSerializationConfig'
import { ObjectField, SanityDocument } from '@sanity/types'
import { Serializer } from './types'
import clone from 'just-clone'

/*
 * Helper function that allows us to get metadata (like `localize: false`) from schema fields.
 */
const getSchema = (name: string) =>
  schemas._original.types.find((s: ObjectField) => s.name === name)

/*
 * Main parent function: finds fields to translate, and feeds them to appropriate child serialization
 * methods.
 */
const serializeDocument = (
  doc: SanityDocument,
  translationLevel: string = 'document',
  baseLang = 'en',
  stopTypes = defaultStopTypes,
  serializers = customSerializers,
  outputName = doc?._id
) => {
  let filteredObj: Record<string, any> = {}

  if (translationLevel === 'field') {
    filteredObj = languageObjectFieldFilter(doc, baseLang)
  } else {
    filteredObj = fieldFilter(doc, getSchema(doc._type).fields, stopTypes)
  }

  const serializedFields: Record<string, any> = {}
  for (let key in filteredObj) {
    const value: Record<string, any> | Array<any> = filteredObj[key]
    if (typeof value === 'string') {
      serializedFields[key] = value
    } else if (Array.isArray(value)) {
      serializedFields[key] = serializeArray(value, key, stopTypes, serializers)
    } else {
      const isFieldLevel = value.hasOwnProperty(baseLang)
      const serialized = serializeObject(
        value,
        //top-level objects need an additional layer of nesting for custom serialization etc.
        isFieldLevel ? key : null,
        stopTypes,
        serializers
      )
      if (!isFieldLevel) {
        serializedFields[key] = `<div class='${key}'>${serialized}</div>`
      } else {
        serializedFields[key] = serialized
      }
    }
  }

  const rawHTMLBody = document.createElement('body')
  rawHTMLBody.innerHTML = serializeObject(
    serializedFields,
    doc._type,
    stopTypes,
    serializers
  )

  const rawHTMLHead = document.createElement('head')
  const metaFields = ['_id', '_type', '_rev']
  metaFields.forEach(field => {
    const metaEl = document.createElement('meta')
    metaEl.setAttribute('name', field)
    metaEl.setAttribute('content', doc[field] as string)
    rawHTMLHead.appendChild(metaEl)
  })

  const rawHTML = document.createElement('html')
  rawHTML.appendChild(rawHTMLHead)
  rawHTML.appendChild(rawHTMLBody)

  return {
    name: outputName || doc._id,
    content: rawHTML.outerHTML,
  }
}

/*
 * Helper. If field-level translation pattern used, only sends over
 * content from the base language.
 */
const languageObjectFieldFilter = (
  obj: Record<string, any>,
  baseLang: string
) => {
  const filteredObj: Record<string, any> = {}
  for (let key in obj) {
    const value: any = obj[key]
    if (value.hasOwnProperty(baseLang)) {
      filteredObj[key] = {}
      filteredObj[key][baseLang] = value[baseLang]
    }
  }

  return filteredObj
}

/*
 * Helper. Eliminates stop-types and non-localizable fields.
 */
const fieldFilter = (
  obj: Record<string, any>,
  objFields: ObjectField[],
  stopTypes: string[]
) => {
  const filteredObj: Record<string, any> = {}

  const fieldFilter = (field: Record<string, any>) => {
    if (field.localize === false) {
      return false
    } else if (field.type === 'string' || field.type === 'text') {
      return true
    } else if (Array.isArray(obj[field.name])) {
      return true
    } else if (
      !stopTypes.includes(field.type) &&
      !stopTypes.includes(field.name)
    ) {
      return true
    }
    return false
  }

  const validFields = [
    '_key',
    '_type',
    '_id',
    ...objFields.filter(fieldFilter).map(field => field.name),
  ]
  validFields.forEach(field => {
    if (obj[field]) {
      filteredObj[field] = obj[field]
    }
  })
  return filteredObj
}

const serializeArray = (
  fieldContent: Record<string, any>[],
  fieldName: string,
  stopTypes: string[],
  serializers: Record<string, any>
) => {
  const validBlocks = fieldContent.filter(
    block => !stopTypes.includes(block._type)
  )

  const filteredBlocks = validBlocks.map(block => {
    const schema = getSchema(block._type)
    if (schema) {
      return fieldFilter(block, schema.fields, stopTypes)
    } else {
      return block
    }
  })

  const output = filteredBlocks.map((obj, i) => {
    if (typeof obj === 'string') {
      return `<span>${obj}</span>`
    } else {
      return serializeObject(obj, null, stopTypes, serializers)
    }
  })

  return `<div class="${fieldName}">${output.join('')}</div>`
}

const serializeObject = (
  obj: Record<string, any>,
  topFieldName: string | null = null,
  stopTypes: string[],
  serializers: Record<string, any>
) => {
  if (stopTypes.includes(obj._type)) {
    return ''
  }

  const hasSerializer =
    serializers.types && Object.keys(serializers.types).includes(obj._type)
  if (hasSerializer) {
    return blocksToHtml({ blocks: [obj], serializers: serializers })
  }

  const tempSerializers = clone(serializers)

  if (obj._type !== 'span' && obj._type !== 'block') {
    let innerHTML = ''
    Object.entries(obj).forEach(([fieldName, value]) => {
      let htmlField = ''

      if (!['_key', '_type', '_id'].includes(fieldName)) {
        if (typeof value === 'string') {
          const htmlRegex = /^</
          //this field may have been recursively turned into html already.
          htmlField = value.match(htmlRegex)
            ? value
            : `<span class="${fieldName}">${value}</span>`
        } else if (Array.isArray(value)) {
          htmlField = serializeArray(value, fieldName, stopTypes, serializers)
        } else {
          const schema = getSchema(value._type)
          let toTranslate = value
          if (schema) {
            toTranslate = fieldFilter(value, schema.fields, stopTypes)
          }
          const objHTML = serializeObject(
            toTranslate,
            null,
            stopTypes,
            serializers
          )
          htmlField = `<div class="${fieldName}">${objHTML}</div>`
        }
      }
      innerHTML += htmlField
    })

    if (!innerHTML) {
      return ''
    }
    tempSerializers.types[obj._type] = (props: Record<string, any>) => {
      if (topFieldName || props.node._type) {
        return h('div', {
          className: topFieldName || props.node._type || '',
          id: props.node._key ?? props.node._id,
          innerHTML: innerHTML,
        })
      } else {
        return innerHTML
      }
    }
  }

  let serializedBlock = ''
  try {
    serializedBlock = blocksToHtml({
      blocks: [obj],
      serializers: tempSerializers,
    })
  } catch (err) {
    console.debug(
      `Had issues serializing block of type "${obj._type}". Please specify a serialization method for this block in your serialization config. Received error: ${err}`
    )
  }

  return serializedBlock
}

export const BaseDocumentSerializer: Serializer = {
  serializeDocument,
  fieldFilter,
  languageObjectFieldFilter,
  serializeArray,
  serializeObject,
}
