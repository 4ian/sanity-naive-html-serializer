import {
  ObjectField,
  ObjectSchemaType,
  BlockSchemaType,
  SanityDocument,
} from '@sanity/types'

export type SerializedDocument = {
  name: string
  content: string
}

export interface Serializer {
  serializeDocument: (
    doc: SanityDocument,
    translationLevel: string,
    baseLang?: string,
    stopTypes?: string[],
    serializers?: Record<string, any>,
    outputName?: string
  ) => SerializedDocument
  fieldFilter: (
    obj: Record<string, any>,
    objFields: ObjectField[],
    stopTypes: string[]
  ) => Record<string, any>
  languageObjectFieldFilter: (
    obj: Record<string, any>,
    baseLang: string
  ) => Record<string, any>
  serializeArray: (
    fieldContent: Record<string, any>[],
    fieldName: string,
    stopTypes: string[],
    serializers: Record<string, any>
  ) => string
  serializeObject: (
    obj: Record<string, any>,
    topFieldName: string | null,
    stopTypes: string[],
    serializers: Record<string, any>
  ) => string
}

export interface Deserializer {
  deserializeDocument: (
    serializedDoc: string,
    deserializers?: Record<string, any>,
    blockDeserializers?: Array<any>
  ) => Record<string, any>
  deserializeHTML: (
    html: string,
    target: ObjectSchemaType | BlockSchemaType,
    deserializers: Record<string, any>,
    blockDeserializers: Array<any>
  ) => Record<string, any> | any[]
}

export interface Merger {
  fieldLevelMerge: (
    translatedFields: Record<string, any>,
    baseDoc: SanityDocument,
    localeId: string,
    baseLang: string
  ) => Record<string, any>
  documentLevelMerge: (
    translatedFields: Record<string, any>,
    baseDoc: SanityDocument
  ) => Record<string, any>
  reconcileArray: (origArray: any[], translatedArray: any[]) => any[]
  reconcileObject: (
    origObject: Record<string, any>,
    translatedObject: Record<string, any>
  ) => Record<string, any>
}
