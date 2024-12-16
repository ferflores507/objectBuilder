export type CalcMethod = "sumar" | "restar" | "multiplicar" | "dividir"

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
    add: Schema
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
    plus: SchemaDefinition | number
    minus: SchemaDefinition | number
    times: SchemaDefinition | number
    dividedBy: SchemaDefinition | number
    asyncFunction: SchemaDefinition
    bindArg: SchemaDefinition
    consulta: Consulta
    calc: CalcMethod
    call: string
    checkout: SchemaDefinition | true
    const: any
    decrement: string
    default: SchemaDefinition | SchemaPrimitive
    definitions: Schema[]
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
    import: string
    join: SchemaDefinition | SchemaPrimitive
    log: SchemaDefinition
    not: SchemaDefinition
    path: string
    parse: true
    propiedades: Propiedades
    reduce: SchemaDefinition
    reduceOrDefault: SchemaDefinition
    required: string[]
    schemaFrom: SchemaDefinition
    selectSet: string
    set: string
    schema: SchemaDefinition
    sibling: string
    some: any
    source: string
    status: string
    store: Schema
    stringify: true
    spread: SchemaDefinition
    spreadFlat: Schema[]
    then: SchemaDefinition
    trim: true
    unpack: string[]
    unpackAsGetters: SchemaDefinition
    use: string
    UUID: true
}> & ArraySchema