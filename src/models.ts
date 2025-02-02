export type Join = {
    items: Schema
    match: Schema
}

export type SelectSchema = {
    value: unknown
    max?: number
    maxReached?: Schema
    multiple?: true
}

export type FilterSchema = {
    source?: Schema,
    item?: Schema,
    match: Schema
}

export type ArraySchema = Partial<{
    select: {
        [P in keyof SelectSchema]: Schema;
    },
    filter: Schema,
    find: Schema,
    items: Schema,
    contains: Schema,
    // minMatches: number,
    // maxMatches: number
    map: Schema
    groupJoin: Join
}>

export type Consulta = { url: string } & Partial<{
    metodo: 'get' | 'post'
    query: Record<string, any>
    body: Record<string, any>
    headers: Record<string, any>
}>

export type SchemaDefinition = Schema | Schema[]

export type SchemaPrimitive = string | number | bigint | boolean | null
export type Propiedades = Record<string, SchemaDefinition | SchemaPrimitive>

export type Schema = Partial<{
    allEqual: boolean
    allEqualTo: SchemaDefinition | SchemaPrimitive
    and: SchemaDefinition | SchemaPrimitive
    assign: Schema
    plus: SchemaDefinition | number
    minus: SchemaDefinition | number
    times: SchemaDefinition | number
    dividedBy: SchemaDefinition | number
    asyncFunction: SchemaDefinition
    bindArg: SchemaDefinition
    boolean: true
    consulta: Consulta
    call: string | Propiedades | string[]
    const: any
    decrement: string
    default: SchemaDefinition | SchemaPrimitive
    definitions: (Schema | SchemaPrimitive)[]
    delay: number
    else: SchemaDefinition
    entries: true
    equals: SchemaDefinition | SchemaPrimitive
    flat: true
    function: SchemaDefinition
    greaterThan: SchemaDefinition | SchemaPrimitive
    lessThan: SchemaDefinition | SchemaPrimitive
    if: SchemaDefinition | string
    isComputed: true
    isNullOrWhiteSpace: boolean
    includes: SchemaDefinition | SchemaPrimitive
    increment: string
    isSubsetOf: SchemaDefinition
    isKeywordsOf: SchemaDefinition
    import: string
    init: Propiedades
    join: SchemaDefinition | SchemaPrimitive
    keywords: true
    log: SchemaDefinition | SchemaPrimitive
    not: SchemaDefinition
    or: SchemaDefinition | SchemaPrimitive
    path: string
    parse: true
    propiedadesAsync: Propiedades
    propiedades: Propiedades
    reduce: SchemaDefinition
    reduceOrDefault: SchemaDefinition
    removeAccents: true
    required: string[]
    schemaFrom: SchemaDefinition
    selectSet: string
    set: string
    schema: SchemaDefinition
    sibling: string
    some: any
    sort: Schema | SchemaPrimitive
    sortBy: SchemaDefinition
    source: string
    status: string
    store: Schema
    stringify: true
    spread: SchemaDefinition
    spreadStart: SchemaDefinition
    spreadFlat: SchemaDefinition
    then: SchemaDefinition
    trim: true
    unpack: string[]
    unpackAsGetters: SchemaDefinition
    use: string
    UUID: true
    with: Schema
    withPatch: Schema
}> & ArraySchema