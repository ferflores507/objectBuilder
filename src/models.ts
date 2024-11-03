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
    filter: FilterSchema,
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

export type Schema = Partial<{
    consulta: Consulta
    calc: CalcMethod
    checkout: Schema
    const: any
    decrement: string
    definitions: Schema[]
    delay: number
    else: Schema
    entries: true
    equals: Schema
    flat: true
    function: Schema
    if: Schema | string
    isComputed: true
    isNullOrWhiteSpace: true
    includes: Schema
    increment: string
    import: string
    not: Schema
    path: string
    parse: true
    propiedades: Record<string, Schema>
    reduce: Schema
    reduceOrDefault: Schema
    reduceMany: Schema[]
    required: string[]
    schemaFrom: Schema
    selectSet: string
    set: string
    schema: Schema
    sibling: string
    some: any
    source: string
    status: string
    store: Schema
    stringify: true
    spread: Schema
    targetPath: string
    then: Schema
    trim: true
    unpack: string[]
    use: string
    UUID: true
}> & ArraySchema