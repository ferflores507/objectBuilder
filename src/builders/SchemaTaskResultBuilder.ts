import type { ArraySchema, Consulta, Schema, SchemaDefinition } from "../models"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"
import useConsulta from "../helpers/useConsulta"
import { Task, TaskBuilder, BuilderBase } from "./TaskBuilder"
import { assign } from "../helpers/varios"

export type BuilderOptions = {
    store: Record<string, any>
    siblings: Record<string, any>
    sources: Record<string, any>

    target: any
    functions: Record<string, Function>
    schema: SchemaDefinition
    initial: any
}

export type Builder = {
    options: Partial<BuilderOptions>
    with: (options: Partial<BuilderOptions>) => Builder
    withSchema: (schema: SchemaDefinition | undefined) => Builder
    build: () => any
    buildAsync: () => Promise<any>
}

export class SchemaTaskResultBuilder implements Builder {
    constructor(private target?: any, options?: BuilderOptions) {
        this.options = options ?? {
            store: {},
            siblings: {},
            sources: {}
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
        const newOptions = assign(assign({}, this.options), options)

        const builder = new SchemaTaskResultBuilder(this.target, newOptions)
        const { schema } = options

        return schema ? builder.withSchema(schema) : builder

    }

    getStoreValue(path: string) {
        return varios.entry(this.options.store).get(path)
    }

    set(path: string, value: any) {
        const store = path.startsWith("stores") ? this.options : this.options.store

        varios.entry(store).set(path, value)

        return value
    }

    withSchema(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {

        schema = Array.isArray(schema) ? { definitions: schema } : schema

        const {
            join,
            bindArg,
            status,
            delay,
            path,
            propiedades,
            spread,
            reduceOrDefault,
            reduce,
            reduceMany,
            definitions,
            checkout,
            schemaFrom,
            selectSet,
            not,
            increment,
            decrement,
            consulta,
            import: importPath,
            store,
            ...rest
        } = schema ?? {}

        return schema ?
            this
                .withStatus(status)
                .withUses(rest)
                .withStore(store)
                .withDelay(delay)
                .withPath(path)
                .withImport(importPath)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withIncrement(increment)
                .withDecrement(decrement)
                .withConditional(schema)
                .withConsulta(consulta)
                .withDefinitions(definitions)
                .withPropiedades(propiedades)
                .withSpread(spread)
                .withFunction(schema)
                .withBindArg(bindArg)
                .withEndSchema(schema)
                .withJoin(join)
                .withReduceOrDefault(reduceOrDefault)
                .withReduce(reduce)
                .withReduceMany(reduceMany)
                .withCheckout(checkout)
            : this
    }

    withJoin(schema: SchemaDefinition | true | undefined) {
        if (schema) {
            this.addMerge()
                .withUnshift(initial =>
                    schema === true ? "" : this.with({ initial, schema })
                )
                .add((separator, prev: []) => prev.join(separator))
        }

        return this
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
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([name, val]) => functions?.[name]?.(val, this))

        return this
    }

    withCall(path: string | undefined) {
        const throwError = () => { throw `La función ${path} no está definida.` }

        return path
            ? this
                .addMerge()
                .withPath(path)
                .add((func, prev) => (func ?? throwError)(prev))
            : this
    }

    withStore(schema: Schema | undefined) {
        if (schema) {
            this.add(current => {
                this.setStore(this.with({ initial: current, schema }).build())

                return current
            })
        }

        return this
    }

    withImport(path: string | undefined) {
        return path ? this.withSchemaFrom({ path }) : this
    }

    withFunction(schema: Schema | undefined) {
        const { asyncFunction } = schema ?? {}
        const targetSchema = asyncFunction ?? schema?.function

        return targetSchema
            ? this.add(() => (initial: any) => this.with({
                initial,
                schema: targetSchema
            })[asyncFunction ? "buildAsync" : "build"]())
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
        if (consulta) {
            const { cargar } = useConsulta()

            this.add(async (target: any) => {
                const response = await cargar(consulta, new AbortController().signal)
                const { ok, data } = response

                return ok ? data : (() => { throw response })
            })
        }

        return this
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

    withCheckout(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        if (schema) {
            this.add((target) => {
                this.target = target

                return target
            })

            this.withSchema(schema)
        }

        return this
    }

    withUse(path: string | undefined) {
        const task = (target) => {
            const { functions } = this.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()

            return func(target, this)
        }

        return path ? this.add(task) : this
    }

    withSpread(schema: SchemaDefinition | undefined) {
        if (schema) {
            this.addMerge()
                .withSchema(schema)
                .add((current, prev) => varios.spread(prev, current))
        }

        return this
    }

    withConditional(schema: Schema | undefined): SchemaTaskResultBuilder {
        const condition = schema?.if

        const result = typeof (condition) == "string"
            ? this.getStoreValue(condition)
            : this.with({ schema: condition }).build() // safe copy build

        return this.withSchema(result ? schema?.then : schema?.else)
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
        const { set, use, call } = schema ?? {}

        return this
            .withArraySchema(schema)
            .withComparison(schema)
            .withCall(call)
            .withUse(use)
            .withSet(set)
    }

    withReduceOrDefault(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        return schema
            ? this.add(current => {
                if (current != null) {
                    const builder = this.with({ initial: current, schema })
                    this.unshift(builder)
                }

                return current
            })
            : this
    }

    withReduce(schema: SchemaDefinition | undefined): SchemaTaskResultBuilder {
        return schema ? this.add(current => this.target = current).withSchema(schema) : this
    }

    withReduceMany(schemas: Schema[] | undefined) {
        schemas?.map(s => this.withReduce(s))

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

        const comparison: Record<string, any> = {
            equals: varios.esIgual,
            includes: (target: any[] | string, result: any) => target.includes(result),
            not: (target: any) => !target
        }

        const entries = Object.entries(schema ?? {})
            .filter(([k]) => comparison.hasOwnProperty(k))

        if (entries.length) {
            this.add(initial => {
                const builders = entries.map(([k, v]) => {
                    return this.with({
                        initial,
                        schema: v
                    })
                        .add(result => comparison[k](initial, result))
                })

                this.taskBuilder.unshiftArray(builders)
            })
                .add((results: []) => results.every(Boolean))
        }

        return this
    }

    withPropiedades(propiedades: Record<string, SchemaDefinition> | undefined) {
        return propiedades
            ? this.add((target) => new PropiedadesBuilder(propiedades, this.with({ initial: target })).build())
            : this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        const task = (target) => schemas?.map(schema => this.with({ initial: target, schema }))

        return schemas
            ? this
                .add(task)
                .add(builders => this.taskBuilder.unshiftArray(builders))
            : this
    }

    withSelectSet(path: string | undefined) {
        if (path) {
            const task = (target) => {
                const items = this.getStoreValue(path) as any[]
                const newItems = new ArrayMapBuilder(items, this)
                    .withSelect({ value: target })
                    .build()

                return this.set(path, newItems)
            }

            this.add(task)
        }

        return this
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
            const initialValue = prop ? schema?.[prop] : target

            return new PlainResultBuilder(initialValue)
                .withSchema(schema)
                .build()
        })
    }

    withPath(path: string | undefined) {
        return path
            ? this.add(current => {
                const sharedSource = assign(assign({}, this.options), {
                    target: this.target,
                    current
                })

                const proxy = new Proxy(sharedSource, {
                    get: (target: Record<string, any>, prop: string) => {
                        return prop in target ? target[prop] : target.store[prop]
                    }
                })

                return varios.entry(proxy).get(path)
            })
            : this
    }
}