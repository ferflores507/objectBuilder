export type CalcMethod = "sumar" | "restar" | "multiplicar" | "dividir"

export type Join = {
    items: Schema
    match: Schema
}

export type ArraySchema = Partial<{
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

export type Schema = Partial<{
    consulta: Consulta
    calc: CalcMethod
    checkout: Schema
    const: any
    definitions: Schema[]
    delay: number
    else: Record<string, any>
    entries: true
    equals: Schema
    flat: true
    if: Record<string, any>
    includes: Schema
    path: string
    parse: true
    propiedades: Record<string, Schema>
    reduce: Schema[]
    required: string[]
    schemaFrom: Schema
    selectTo: string
    set: string
    sibling: string
    some: any
    source: string
    stringify: true
    spread: Schema
    targetPath: string
    then: Record<string, any>
    unpack: string[]
    use: string
}> & ArraySchema