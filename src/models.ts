import { Path } from "./helpers/varios"

type Modify<T, R> = Omit<T, keyof R> & R;

export type RequestInitWithUrl = Modify<RequestInit, { url: string }>

export type RequestPlainOptions = { url: string } & Partial<Modify<Request, {
    contentType: string
    query: Record<string, unknown>
    body: Record<string, any>
    formData: Record<string, any>
}>>

export type RequestPlainOptionsSchema = { url: Schema }
    & {
        [P in keyof RequestPlainOptions]: Schema
    }
    & Partial<{
        body: SchemaDefinition
        formData: SchemaDefinition
    }>

export type RequestSchema = {
    [P in keyof RequestPlainOptionsSchema]: RequestPlainOptions[P] | RequestPlainOptionsSchema[P]
} & { 
    $bind?: Schema 
}

export type ChildrenSchema = Partial<{
    setup: SchemaDefinition
    schema: SchemaDefinition
    children: Record<string, ChildrenSchema>
}>

export type BuilderOptions = {
    store: Record<string, any>
    siblings: Record<string, any>
    target: any
    functions: Record<string, Function>
    schema: SchemaDefinition
    initial: any
    operators: Record<string, TaskOptions>
    arg: any
    variables: Record<string, any>
}

export type Builder = {
    options: Partial<BuilderOptions>
    with: (options: Partial<BuilderOptions>) => Builder
    withSchema: (schema: SchemaDefinition | undefined) => Builder
    withSchemaOrDefault(value: SchemaDefinition | SchemaPrimitive | undefined): Builder
    build: () => any
    buildAsync: () => Promise<any>
    set: (path: Path, value: any) => any
}

export type SubsetOptions = {
    container: any[]
    match: (value: { item: string, containerItem : string }) => boolean
}

export type OperatorTask = (current: any, previous: any, builder: Builder) => any

export type TaskOptions = OperatorTask | {
    task: OperatorTask,
    transform: (schema: Schema, builder: Builder) => any
}

export type WithTaskOptions<T> = { [key in keyof T]: TaskOptions }

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
        [P in keyof SelectSchema]: Schema | SelectSchema[P];
    },
    filter: Schema,
    find: SchemaDefinition,
    items: Schema,
    contains: Schema,
    // minMatches: number,
    // maxMatches: number
    map: SchemaDefinition
    mapAsync: SchemaDefinition
    groupJoin: Join
}>

export type SchemaDefinition = Schema | Array<Schema | SchemaPrimitive>

export type SchemaPrimitive = string | number | bigint | boolean | null
export type Propiedades = Record<string, SchemaDefinition | SchemaPrimitive> | {
    $getters?: Record<string, SchemaDefinition | SchemaPrimitive>
}
export type DebounceOptions = {
    function: Function
    ms: number | true
    report?: true
}

export type DebounceSchema = {
    ms: SchemaDefinition | number
    report: SchemaDefinition | true
} & ({
    function: SchemaDefinition
    target?: undefined
} | {
    function?: undefined
    target: SchemaDefinition
})

export type MapReduceOption = {
    items: Record<string, any>
} & Partial<{
    key: string
    leftKey: string
    target: string
}>

type MapReduceOptionsSchema = {
    items: SchemaDefinition
} & Partial<{
    key: MapReduceOption["key"] | Schema
    leftKey: MapReduceOption["leftKey"] | Schema
    target: MapReduceOption["target"] | Schema
}>

type MapReduceSchema = [Schema, ...MapReduceOptionsSchema[]]

export type PatchOptions = { 
    key?: string
    value: any
    preserver?: (value: any) => boolean
    replacer?: (options: { previousValue: any, newValue: any }) => any
    checkNotFound?: boolean
}

export type PatchOptionsSchema = { 
    key?: Schema | PatchOptions["key"]
    value: SchemaDefinition
    preserver?: Schema
    replacer?: Schema
    checkNotFound?: Schema | PatchOptions["checkNotFound"]
}

export type Schema = Partial<{
    allEqual: boolean
    allEqualTo: SchemaDefinition | SchemaPrimitive
    and: SchemaDefinition | SchemaPrimitive
    assign: Schema
    plus: SchemaDefinition | number
    minus: SchemaDefinition | number
    times: SchemaDefinition | number
    dividedBy: SchemaDefinition | number
    asyncFunction: SchemaDefinition | SchemaPrimitive
    bindArg: SchemaDefinition
    boolean: SchemaDefinition | true
    call: string | Propiedades | string[]
    childrenSchema: SchemaDefinition
    const: any
    date: Schema | SchemaPrimitive
    debounce: Schema | SchemaPrimitive
    debounceWith: DebounceSchema
    decrement: string
    default: SchemaDefinition | SchemaPrimitive
    definitions: (Schema | SchemaPrimitive)[]
    delay: number
    else: SchemaDefinition | SchemaPrimitive
    entries: true
    equals: SchemaDefinition | SchemaPrimitive
    filterPropiedades: SchemaDefinition | SchemaPrimitive
    formatPropiedades: Schema
    flat: true
    function: SchemaDefinition | SchemaPrimitive
    greaterThan: SchemaDefinition | SchemaPrimitive
    lessThan: SchemaDefinition | SchemaPrimitive
    if: SchemaDefinition | string
    isEmpty: Schema | SchemaPrimitive
    isNull: Schema | SchemaPrimitive
    isNullOrEmpty: Schema | SchemaPrimitive
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
    mapKeyValue: SchemaDefinition | true
    mapObject: Propiedades
    mapReduce: MapReduceSchema
    mergeItemsWithSameKey: Schema | SchemaPrimitive
    mergeByKeys: SchemaDefinition | SchemaPrimitive
    not: SchemaDefinition
    or: SchemaDefinition | SchemaPrimitive
    path: SchemaDefinition | string
    pathFrom: SchemaDefinition | string
    parse: true
    patch: Schema
    patchOrAdd: SchemaDefinition
    patchWith: PatchOptionsSchema
    prepend: Schema | SchemaPrimitive
    promiseAll: SchemaDefinition
    propiedadesAsync: Propiedades
    propiedades: Propiedades
    propiedadesFunction: Propiedades
    reduce: Schema | Schema[]
    reduceOrDefault: SchemaDefinition
    removeAccents: true
    request: RequestSchema
    reduceFetch: Schema | SchemaPrimitive
    required: string[]
    schemaFrom: SchemaDefinition
    selectSet: string
    set: SchemaDefinition | SchemaPrimitive
    schema: SchemaDefinition
    sibling: string
    some: any
    sort: Schema | SchemaPrimitive
    sortBy: SchemaDefinition
    source: string
    useStore: Schema
    stringify: true
    spread: SchemaDefinition | SchemaPrimitive
    spreadStart: SchemaDefinition | SchemaPrimitive
    spreadFlat: SchemaDefinition
    then: SchemaDefinition | SchemaPrimitive
    trim: true
    unpack: string[]
    unpackAsGetters: SchemaDefinition
    use: string
    UUID: true
    validate: SchemaDefinition
    values: true
    with: Schema
}> & ArraySchema