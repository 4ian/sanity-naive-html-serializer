import Schema from '@sanity/schema'
// const Schema = require('@sanity/schema')

const arrayField = {
  name: 'arrayField',
  title: 'Array Field',
  type: 'array',
  of: [{ type: 'block' }, { type: 'objectField' }],
}

const childObjectField = {
  name: 'childObjectField',
  title: 'Child Object Field',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
}

const objectField = {
  name: 'objectField',
  title: 'Object Field',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'objectAsField',
      title: 'Object As Field',
      type: 'childObjectField',
    },
    {
      name: 'nestedArrayField',
      title: 'Nested Array Field',
      type: 'array',
      of: [{ type: 'block' }, { type: 'childObjectField' }],
    },
  ],
}

const documentLevelArticle = {
  name: 'documentLevelArticle',
  title: 'Document Level Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'meta',
      title: 'Meta',
      type: 'string',
      localize: false,
    },
    {
      name: 'snippet',
      title: 'Snippet',
      type: 'text',
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
    },
    {
      name: 'config',
      title: 'Config',
      type: 'objectField',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'arrayField',
    },

    // Test a inline object, with nested  array and object:
    {
      name: 'nested_inline_arrays_and_objects',
      title: 'Cloud features list',
      type: 'object',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'copy', type: 'string' },
        {
          name: 'features',
          type: 'array',
          of: [
            {
              name: 'feature',
              title: 'Feature',
              type: 'object',
              fields: [
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string' },
              ],
            },
          ],
        },
        { name: 'see_all_label', title: '"See all" label', type: 'string' },
      ],
    },
  ],
}

function createLocaleFields(locales: string[], fieldType: Record<string, any>) {
  return locales.map(locale => ({
    ...{ name: locale },
    ...fieldType,
  }))
}

const fieldLevelArticle = {
  name: 'fieldLevelArticle',
  title: 'Field Level Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: createLocaleFields(['en', 'fr', 'de'], { type: 'string' }),
    },
    {
      name: 'meta',
      title: 'Meta',
      type: 'string',
      localize: false,
    },
    {
      name: 'snippet',
      title: 'Snippet',
      type: 'object',
      fields: createLocaleFields(['en', 'fr', 'de'], { type: 'text' }),
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'object',
      fields: createLocaleFields(['en', 'fr', 'de'], {
        type: 'array',
        of: [{ type: 'string' }],
      }),
    },
    {
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
    },
    {
      name: 'config',
      title: 'Config',
      type: 'object',
      fields: createLocaleFields(['en', 'fr', 'de'], { type: 'objectField' }),
    },
    {
      name: 'content',
      title: 'Content',
      type: 'object',
      fields: createLocaleFields(['en', 'fr', 'de'], { type: 'arrayField' }),
    },
  ],
}

const types = [
  arrayField,
  childObjectField,
  objectField,
  documentLevelArticle,
  fieldLevelArticle,
]

module.exports = new Schema({
  name: 'test',
  types,
})
