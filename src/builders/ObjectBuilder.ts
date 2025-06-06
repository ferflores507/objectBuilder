import type { ArraySchema, Builder, BuilderOptions, Propiedades, Schema, SchemaDefinition, SchemaPrimitive, TaskOptions, WithTaskOptions } from "../models"
import * as varios from "../helpers/varios"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"
import { Task, TaskBuilder, BuilderBase } from "./TaskBuilder"
import { assignAll, getterTrap, isNotPrimitive, Path } from "../helpers/varios"
import { Operators } from "./Operators"
import { ComparisonTasks } from "./ComparisonTasks"

const comparisonTasks: WithTaskOptions<ComparisonTasks> = new ComparisonTasks(new Operators())
const imported = new Map()

export class ObjectBuilder implements Builder {
    constructor(private target?: any, options?: Partial<BuilderOptions>) {
        this.options = options ?? {
            store: {},
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
        const isBuilder = (value: any) => value instanceof ObjectBuilder

        return this
            .add(task)
            .add(result => isBuilder(result) ? this.unshift(result) : result)
    }

    withUnshiftArray(task: (a: any, b: any) => ObjectBuilder[]) {
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

    with(options: Partial<BuilderOptions>) {
        const { operators, schema, ...rest } = options
        const newOptions = assignAll(
            {}, 
            this.options, 
            rest, 
            { operators: operators ? new Operators(operators) : this.options.operators }
        )

        const builder = new ObjectBuilder(this.target, newOptions)

        return schema ? builder.withSchema(schema) : builder
    }

    set(path: Path, value: any) {
        const store = (typeof path == "string" && path.startsWith("stores")) 
            ? this.options 
            : this.options.store

        varios.entry(store).set(path, value)

        return value
    }

    setValueOrGetter(path: Path, valueOrGetter: any) {
        varios.entry(this.options.store).setValueOrGetter(path, valueOrGetter)

        return valueOrGetter
    }

    withSchema(schema: SchemaDefinition | undefined): ObjectBuilder {

        schema = Array.isArray(schema) ? { definitions: schema } : schema

        const {
            bindArg,
            delay,
            path,
            pathFrom,
            propiedades,
            getters,
            reduceOrDefault,
            reduce,
            definitions,
            schemaFrom,
            selectSet,
            increment,
            init,
            decrement,
            import: importPath,
            useStore,
            ...rest
        } = schema ?? {}

        return schema ?
            this
                .withInit(init)
                .withUses(rest)
                .withDelay(delay)
                .withBinary({ useStore, path, pathFrom })
                .withImport(importPath)
                .withDefault(schema)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withIncrement(increment)
                .withDecrement(decrement)
                .withDefinitions(definitions)
                .withPropiedades(propiedades)
                .withGetters(getters)
                .withFunction(schema)
                .withBindArg(bindArg)
                .withBinary(rest)
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
                .withPropiedades(propiedades)
                .add((current, prev) => {
                    const entries = Object.entries(current).map(([key, val]) => ["$" + key, val])
                    Object.assign(this.options.variables, Object.fromEntries(entries))

                    return prev
                })
            : this
    }

    withDefault(schema: Schema | undefined) {
        return schema?.hasOwnProperty("default")
            ? this.withUnshift(initial => initial ?? this.with({ initial }).withSchemaOrDefault(schema.default))
            : this
    }

    filterTasks(tasks: Record<string, TaskOptions>, schema: Schema | undefined) {
        return Object.entries(tasks)
            .map(([key, options]) => ({
                options,
                definition: schema?.hasOwnProperty(key) ? schema[key as keyof Schema] : null
            }))
            .filter(({ definition }) => definition != null)
            .map(({ options, definition }) => typeof options == "function"
                ? { definition, task: options }
                : {
                    ...options,
                    definition: options.transform(definition, this),
                })
    }

    withSchemaOrDefault(value: SchemaDefinition | SchemaPrimitive | undefined) {
        return this.withUnshift((initial: any) => isNotPrimitive(value)
            ? this.with({ initial, schema: value })
            : value)
    }

    withBinary(schema: Schema | undefined) {
        this.filterTasks(this.options.operators ?? {}, schema)
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
            ? this.withUnshift(initial => {
                return !!initial === condition
                    ? this.with({ initial }).withSchemaOrDefault(schema[operator])
                    : initial
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

    withUses(uses: Schema | undefined) {
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
            ? this.add(() => (arg: any, options?: BuilderOptions) => {
                const builder = this.with({
                    arg,
                    ...options
                })
                .withSchemaOrDefault(targetSchema)

                return asyncFunction ? builder.buildAsync() : builder.build()
            })
            : this
    }

    withDelay(ms: number | undefined) {
        return ms
            ? this.add(current => new Promise<void>(resolve => {
                setTimeout(() => resolve(current), ms)
            }))
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

    withConditional(schema: Schema | undefined) {
        const schemaOrPath = (value: string | SchemaDefinition) => {
            return typeof (value) == "string" ? { path: value } : value
        }

        return schema?.if
            ? this
                .addMerge()
                .withSchema(schemaOrPath(schema.if))
                .withUnshift((result, prev) => {
                    const { then, else: elseSchema } = {
                        then: { const: prev },
                        else: { const: prev },
                        ...schema
                    }

                    return this
                        .with({ initial: prev })
                        .withSchemaOrDefault(result ? then : elseSchema)
                })
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

    withReduceOrDefault(schema: SchemaDefinition | undefined) {
        return schema
            ? this.withUnshift(initial => initial != null ? this.with({ initial, schema }) : initial)
            : this
    }

    withReduce(schema: Schema | Schema[] | undefined) {
        return schema ? this.add(current => this.target = current).withManySchemas(schema) : this
    }

    withManySchemas(definition: Schema | Schema[]) {
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
            ? this
                .withDefinitions(Object.entries({ $bind: null, ...propiedades }))
                .add(([[key, $bind], ...entries]) => {
                    return assignAll({}, $bind ?? {}, Object.fromEntries(entries))
                })
            : this
    }

    withGetters(propiedades: Propiedades | undefined) {
        return propiedades
            ? this.add(initial => {
                return Object.entries(propiedades).reduce((getters, [key, schema]) => {
                    const descriptor = {
                        get: () => this.withSchemaOrDefault(schema).build()
                    }
                    
                    return Object.defineProperty(getters, key, descriptor)
                }, {})
            })
            : this
    }

    withDefinitions(schemas: (SchemaDefinition | SchemaPrimitive)[] | undefined) {
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

    withSchemaFrom(source: SchemaDefinition | undefined) {
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

    get(path: string, current?: any) {
        const sources = [{ current }, this.options, this.options.variables]
        const proxy = getterTrap(this.options.store, ...sources)

        return varios.entry(proxy).get(path)
    }

    withPath(path: string | undefined) {
        return path
            ? this.add(current => this.get(path, current))
            : this
    }
}