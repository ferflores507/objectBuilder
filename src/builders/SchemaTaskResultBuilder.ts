import type { ArraySchema, Consulta, Propiedades, Schema, SchemaDefinition, SchemaPrimitive } from "../models"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"
import useConsulta from "../helpers/useConsulta"
import { Task, TaskBuilder, BuilderBase } from "./TaskBuilder"
import { assignAll, formatSortOptions, getterTrap, isNotPrimitive, Path, sortCompare, SortOptions } from "../helpers/varios"

export type OperatorTask = (current: any, previous: any, builder: SchemaTaskResultBuilder) => any

type TaskOptions = OperatorTask | {
    task: OperatorTask,
    transform: (schema: Schema) => any
}

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
}

type KeywordItem = string | string[]
type SubsetOptions = {
    container: any[]
    match: (value: { item: string, containerItem : string }) => boolean
}

export class Operators {
    constructor(otherOperators = {}) {
        Object.assign(this, otherOperators)
    }
    assign : OperatorTask = (current, previous) => Object.assign(current, previous)
    boolean = (value: any) => !!value
    debounce = (fn: (...args: []) => any, ms: number | true) => {
        return varios.createDebounce(fn, ms === true ? 500 : ms)
    }
    entries = varios.entries
    spreadStart = (target: any[], value: any) => {        
        return Array.isArray(value) ? [...value, ...target] : [value, ...target]
    }
    with = (array: any[], { index = 0, value } : { index?: number, value: any }) => {        
        return array.with(index, value)
    }
    patch = (array: any[], value: any) => {        
        return this.patchWith(array, { key: "id", value })
    }
    patchWith = (array: any[], { key = "id", value } : { key?: string, value: any }) => {
        const concreteValue = Array.isArray(value) ? value : [value]
        const matchesToFind = [...concreteValue]
        const resultArray = [...array]

        for(let i = 0; i <= array.length; i++) {
            const index = matchesToFind.findIndex(matchToFind => matchToFind[key] === array[i][key])

            if(index !== -1) {
                resultArray[i] = { ...resultArray[i], ...matchesToFind[index] }
                matchesToFind.splice(index, 1)

                if(!matchesToFind.length) {
                    break
                }
            }
        }

        if(matchesToFind.length) {
            throw {
                msg: `Unable to patch. One or more items were not found.`,
                array,
                itemsNotFound: matchesToFind
            }
        }

        return resultArray
    }
    unpackAsGetters = (obj: {}, b: string[]) => varios.entry(obj).unpackAsGetters(b)
    spread = varios.spread
    spreadFlat = (a: any, b: any[]) => this.spread(a, b.flat())
    join = {
        task: (source: [], separator: any) => source.join(separator),
        transform: (schema: any) => schema === true ? "" : schema
    }
    keywords = (value: string) => {
        return value
            .trim()
            .split(/\s+/)
            .map(word => this.removeAccents(word).toLowerCase())
    }
    keywordsOrDefault = (value: KeywordItem) => Array.isArray(value) ? value : this.keywords(value)
    plus = (a: number, b: number) => a + b
    minus = (a: number, b: number) => a - b
    times = (a: number, b: number) => a * b
    dividedBy = (a: number, b: number) => a / b
    parse = JSON.parse
    trim = (value: string) => value.trim()
    removeAccents = varios.removeAccents
    stringify = JSON.stringify
    sort = (array: any[], option: true | "descending" = true) => {
        return this.sortBy(array, { descending: option === "descending" })
    }
    sortBy = (array: any[], options: SortOptions | SortOptions[]) => {
        const concreteOptions = varios.toArray(options).map(formatSortOptions)
        
        return array.toSorted((a, b) => {
            let result = 0

            for(const option of concreteOptions) {
                result = sortCompare(a, b, option)

                if(result !== 0) break
            }

            return result
        })
    }
    values = (obj: any[]) => {
        try {
            return Array.isArray(obj) ? obj : Object.values(obj)
        }
        catch {
            throw { 
                mensaje: "Error al obtener los valores enumerables",
                fuente: obj
            }
        }
    }
    unpack = (target: Record<string, any>, keys: string[]) => keys.reduce((obj, key) => {
        return { ...obj, [key]: target[key] }
    }, {})
    UUID = () => crypto.randomUUID()
    set: OperatorTask = (initial, value, builder) => {
        const [path, arg] = varios.argsPair(value, initial)

        return builder.set(path, arg)
    }
    log = (initial: any, current: any) => (console.log(current), initial)
};

class ComparisonTasks {
    constructor(private operators: Operators) {}
    
    equals = varios.esIgual
    allEqualTo = (obj: any[], value: any) => {
        return this.operators.values(obj).every(item => this.equals(item, value))
    }
    allEqual = (obj: any[], allEqual: boolean) => {
        const values = this.operators.values(obj)

        return this.allEqualTo(values, values[0]) === allEqual
    }
    includes = (a: any[] | string, b: any) => a.includes(b)
    isNullOrWhiteSpace = (value: any, boolValue: boolean | undefined) => {
        return typeof(boolValue) == "boolean"
            ? ((value as string ?? "").toString().trim() === "") === boolValue
            : value
    }
    isSubsetOf = (array: any[], { container, match }: SubsetOptions) => {
        return array.every(item => container.some(containerItem => match({ item, containerItem })))
    }
    isKeywordsOf = (keywords: KeywordItem, container: KeywordItem) => {
        [keywords, container] = [keywords, container].map(this.operators.keywordsOrDefault)
        
        return this.isSubsetOf(keywords, {
            container,
            match: ({ item, containerItem }) => containerItem.includes(item)
        })
    }
    not = (a: any, b: any) => !b
    greaterThan = (a: any, b: any) => a > b
    lessThan = (a: any, b: any) => a < b
}

const comparisonTasks = new ComparisonTasks(new Operators())

const imported = new Map()

export class SchemaTaskResultBuilder implements Builder {
    constructor(private target?: any, options?: Partial<BuilderOptions>) {
        this.options = options ?? {
            store: {},
            siblings: {},
            operators: new Operators(),
            variables: {}
        }

        this.taskBuilder = new TaskBuilder().with({ target: options?.initial })
    }

    readonly options: Partial<BuilderOptions>
    readonly taskBuilder: TaskBuilder

    setStore(store: Record<string, any> | undefined) {
        return this.options.store = store
    }

    addMerge() {
        this.taskBuilder.merge()

        return this
    }

    unshift(task: Task | BuilderBase) {
        this.taskBuilder.unshift(task)

        return this
    }

    withUnshift(task: Task) {
        const isBuilder = (value: any) => value instanceof SchemaTaskResultBuilder

        return this
            .add(task)
            .add(result => isBuilder(result) ? this.unshift(result) : result)
    }

    withUnshiftArray(task: (a: any, b: any) => SchemaTaskResultBuilder[]) {
        return this
            .add(task)
            .add(result => this.taskBuilder.unshiftArray(result))
    }

    add(task: Task) {
        this.taskBuilder.add(task)

        return this
    }

    build() {
        return this.taskBuilder.build()
    }

    async buildAsync() {
        return this.taskBuilder.buildAsync()
    }

    with(options: Partial<BuilderOptions>): SchemaTaskResultBuilder {
        const { operators, schema, ...rest } = options
        const newOptions = assignAll(
            {}, 
            this.options, 
            rest, 
            { operators: operators ? new Operators(operators) : this.options.operators }
        )

        const builder = new SchemaTaskResultBuilder(this.target, newOptions)

        return schema ? builder.withSchema(schema) : builder
    }

    set(path: Path, value: any) {
        const store = (typeof path == "string" && path.startsWith("stores")) 
            ? this.options 
            : this.options.store

        varios.entry(store).set(path, value)

        return value
    }

    withSchema(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {

        schema = Array.isArray(schema) ? { definitions: schema } : schema

        const {
            bindArg,
            status,
            delay,
            path,
            propiedades,
            propiedadesAsync,
            reduceOrDefault,
            reduce,
            definitions,
            schemaFrom,
            selectSet,
            increment,
            init,
            decrement,
            consulta,
            import: importPath,
            store,
            log,
            default: defaultSchema,
            ...rest
        } = schema ?? {}

        return schema ?
            this
                .withStatus(status)
                .withInit(init)
                .withUses(rest)
                .withStore(store)
                .withDelay(delay)
                .withPath(path)
                .withImport(importPath)
                .withDefault(defaultSchema)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withIncrement(increment)
                .withDecrement(decrement)
                .withConsulta(consulta)
                .withDefinitions(definitions)
                .withPropiedadesAsync(propiedadesAsync)
                .withPropiedades(propiedades)
                .withFunction(schema)
                .withBindArg(bindArg)
                .withBinary(schema)
                .withConditional(schema)
                .withEndSchema(schema)
                .withLogical(schema)
                .withLogical(schema, false)
                .withReduceOrDefault(reduceOrDefault)
                .withReduce(reduce)
            : this
    }

    withInit(propiedades: Propiedades | undefined) {
        return propiedades
            ? this
                .addMerge()
                .withPropiedadesAsync(propiedades)
                .add((current, prev) => {
                    const entries = Object.entries(current).map(([key, val]) => ["$" + key, val])
                    Object.assign(this.options.variables, Object.fromEntries(entries))

                    return prev
                })
            : this
    }

    withDefault(schema: SchemaDefinition | SchemaPrimitive | undefined) {
        return schema != null
            ? this.withUnshift(initial => initial ?? this.with({ initial }).withSchemaOrDefault(schema))
            : this
    }

    filterTasks(tasks: Record<string, TaskOptions>, schema: Schema | undefined) {
        return Object.entries(tasks)
            .map(([key, options]) => ({
                options,
                definition: schema?.hasOwnProperty(key) ? schema[key] : null
            }))
            .filter(({ definition }) => definition != null)
            .map(({ options, definition }) => typeof options == "function"
                ? { definition, task: options }
                : {
                    ...options,
                    definition: options.transform(definition),
                })
    }

    withSchemaOrDefault(value: SchemaDefinition | SchemaPrimitive | undefined) {
        return this.withUnshift((initial: any) => isNotPrimitive(value)
            ? this.with({ initial, schema: value })
            : value)
    }

    withBinary(schema: Schema | undefined) {
        this.filterTasks(this.options.operators, schema)
            .forEach(({ definition, task }) => {
                this.addMerge()
                    .withSchemaOrDefault(definition)
                    .add((current, prev) => task(prev, current, this))
            })

        return this
    }

    withLogical(schema: Schema, condition = true) {
        const operator = condition ? "and" : "or"
        return operator in schema
            ? this.withUnshift((current, previous) => {
                return !!current === condition
                    ? this.with({ initial: previous }).withSchemaOrDefault(schema[operator])
                    : current
            })
            : this
    }
    
    withBindArg(schema: SchemaDefinition | undefined) {
        return schema
            ? this.add(func => (initial: any) => {
                const arg = this.with({ initial, schema }).build()

                return func(arg)
            })
            : this
    }

    withUses(uses: Record<string, SchemaDefinition> | undefined) {
        const { functions } = this.options

        Object.entries(uses ?? {})
            .filter(([name]) => functions?.hasOwnProperty(name))
            .forEach(([name, val]) => functions?.[name]?.(val, this))

        return this
    }

    getCallOptions(propiedades: Propiedades | string | string[]) {
        const typeOptions = {
            string: () => [propiedades],
            object: () => Object.entries(propiedades)[0],
            array: () => {
                const [path, argPath] = propiedades as any[]
                
                return [path, { path: argPath }]
            }
        } as Record<string, any>

        const type = Array.isArray(propiedades) ? "array" : typeof propiedades
        const [path, schema] = typeOptions[type]?.()

        if (!path) {
            throw {
                msg: `La ubicación de la función no está definida.`,
                propiedades
            }
        }

        return {
            path, schema
        }
    }

    withCall(propiedades: Propiedades | string | undefined) {
        const options = propiedades && this.getCallOptions(propiedades)

        return options
            ? this
                .withPropiedades({
                    func: {
                        path: options.path
                    },
                    arg: options.schema
                })
                .add(({ func, arg }) => {
                    if (!func) {
                        throw `La función ${options.path} no está definida.`
                    }

                    return func(arg)
                })
            : this
    }

    withStore(schema: Schema | undefined) {
        return schema 
            ? this.add(initial => {
                this.setStore(this.with({ initial, schema }).build())

                return initial
                })
            : this
    }

    withImport(path: string | undefined) {
        return path 
            ? this
                .withPath(path)
                .addMerge()
                .withUnshift(schema => imported.has(schema) ? imported.get(schema) : this.with({ schema }))
                .add((result, schema) => (imported.set(schema, result), result))
            : this
    }

    withFunction(schema: Schema | undefined) {
        const { asyncFunction, function: functionSchema } = schema ?? {}
        const targetSchema = asyncFunction ?? functionSchema

        return targetSchema
            ? this.add(() => (initial: any) => {
                const builder = this.with({
                    initial,
                    arg: initial,
                    schema: targetSchema
                })

                return asyncFunction ? builder.buildAsync() : builder.build()
            })
            : this
    }

    withStatus(path: string | undefined) {
        if (path) {
            this.add(target => {
                // const value = this.getStoreValue(path) as number
                // this.set(path, { loading: value + 1 })

                // this.with({}).withIncrement(path).build()

                this.with({ schema: { increment: path } }).build()

                return target
            })
        }

        return this
    }

    withConsulta(consulta: Consulta | undefined) {
        return consulta
            ? this.add(async () => {
                const { cargar } = useConsulta()
                const response = await cargar(consulta, new AbortController().signal)
                const { ok, data } = response

                return ok ? data : (() => { throw response })
                })
            : this
    }

    withDelay(ms: number | undefined) {
        const delay = (ms: number) => new Promise<void>((resolve, reject) => {
            setTimeout(resolve, ms)
        })

        return ms
            ? this.add(async (target) => {
                await delay(ms)

                return target
            })
            : this
    }

    withUse(path: string | undefined) {
        return path
            ? this.add((target) => {
                const func = this.options.functions?.[path]
                const throwMsg = () => { throw `La función ${path} no está definida.` }

                return (func ?? throwMsg)(target, this)
            })
            : this
    }

    withConditional(schema: Schema | undefined): SchemaTaskResultBuilder {
        const schemaOrPath = (value: string | SchemaDefinition) => {
            return typeof (value) == "string" ? { path: value } : value
        }

        const { if: condition, then: thenCondition, else: elseCondition } = schema ?? {}

        return condition
            ? this
                .addMerge()
                .withSchema(schemaOrPath(condition))
                .withUnshift((result, prev) => this.with({
                    initial: prev,
                    schema: result ? thenCondition : elseCondition
                }))
            : this
    }

    withArraySchema(schema: ArraySchema | undefined) {
        this.add(
            (target) => new ArrayBuilder(target as [], this).build(schema)
        )

        return this
    }

    withSet(path: string | undefined) {
        return path
            ? this.add((target) => this.set(path, target))
            : this
    }

    withEndSchema(schema: Schema | undefined) {
        const { use, call } = schema ?? {}

        return this
            .withArraySchema(schema)
            .withComparison(schema)
            .withCall(call)
            .withUse(use)
    }

    withReduceOrDefault(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        return schema
            ? this.withUnshift(initial => initial != null ? this.with({ initial, schema }) : initial)
            : this
    }

    withReduce(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        return schema ? this.add(current => this.target = current).withManySchemas(schema) : this
    }

    withManySchemas(definition: SchemaDefinition) {
        Array.isArray(definition) ? definition.map(schema => this.withSchema(schema)) : this.withSchema(definition)

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        return path
            ? this
                .withPath(path)
                .add(value => (value ?? 0) + amount)
                .withSet(path)
            : this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
    }

    withComparison(schema: Schema | undefined) {
        const entries = this.filterTasks(comparisonTasks, schema)

        return entries.length
            ? this
                .addMerge()
                .withUnshiftArray(initial => {
                    return entries.map(({ definition, task }) => this
                        .with({ initial })
                        .withSchemaOrDefault(definition)
                        .add((current, prev) => task(prev, current))
                    )
                })
                .add((results: []) => results.every(Boolean))
            : this
    }

    withPropiedades(propiedades: Propiedades | undefined) {
        return propiedades
            ? this.add(initial => new PropiedadesBuilder(propiedades, this.with({ initial })).build())
            : this
    }

    withPropiedadesAsync(propiedades: Propiedades | undefined) {
        return propiedades
            ? this.withUnshift(initial => {
                    const entries = Object.entries(propiedades)
                    const definitions = entries.map(([key, schema]) => schema)

                    return this
                        .with({ initial })
                        .withDefinitions(definitions)
                        .add((values: []) => entries.reduce((prev, [key], index) => {
                            return { ...prev, [key]: values[index] }
                        }, {})) 
                })
            : this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        return schemas
            ? this.withUnshiftArray(initial => schemas?.map(schema => {
                return this.with({ initial }).withSchemaOrDefault(schema)
            }))
            : this
    }

    withSelectSet(path: string | undefined) {
        return path
            ? this
                .addMerge()
                .withPath(path)
                .add((items, prev) => new ArrayMapBuilder(items, this)
                    .withSelect({ value: prev })
                    .build()
                )
                .withSet(path)
            : this
    }

    withSchemaFrom(source: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        return source
            ? this
                .addMerge()
                .withSchema(source)
                .withUnshift((schema, initial) => this.with({ initial, schema }))
            : this
    }

    withInitialSchema(schema: Schema | undefined) {
        return this.add((target) => {
            const prop = (["schema", "const"] as const).find(str => str in (schema ?? {}))
            
            return prop ? schema?.[prop] : target
        })
    }

    withPath(path: string | undefined) {
        return path
            ? this.add(current => {
                const sources = [{ current, target: this.target }, this.options, this.options.variables]
                const proxy = getterTrap(this.options.store, ...sources)

                return varios.entry(proxy).get(path)
            })
            : this
    }
}