import type { ArraySchema, Consulta, Schema } from "../models"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"
import useConsulta from "../helpers/useConsulta"
import { Task, TaskBuilder, BuilderBase } from "./TaskBuilder"

export type BuilderOptions = {
    store: Record<string, any>
    siblings: Record<string, any>
    sources: Record<string, any>

    target: any
    stopPropiedades: string[]
    functions: Record<string, Function>
    schema: Schema
    initial: any
}

export type Builder = {
    options: Partial<BuilderOptions>
    with: (options: Partial<BuilderOptions>) => Builder
    withSchema: (schema: Schema | undefined) => Builder
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

        this.taskBuilder = new TaskBuilder().with({ target: "initial" in this.options ? this.options.initial : target })
    }

    readonly options: Partial<BuilderOptions>
    readonly taskBuilder: TaskBuilder

    addMerge() {
        this.taskBuilder.merge()

        return this
    }

    unshift(task: Task | BuilderBase) {
        this.taskBuilder.unshift(task)

        return this
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

    with(options: Partial<BuilderOptions>) : SchemaTaskResultBuilder {
        const { schema, target = this.target, ...rest } = options 
        const newOptions = { ...this.options, ...rest }
        const builder = new SchemaTaskResultBuilder(target, newOptions)
        
        return schema ? builder.withSchema(schema) : builder 

    }

    getStoreValue(path: string) {
        return varios.getPathValue(this.options.store, path)
    }

    set(path: string, value: any) {
        varios.setPathValue(this.options.store, path, value)

        return value
    }

    withSchema(schema: Schema | undefined) : SchemaTaskResultBuilder {
        const {
            status,
            delay,
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
            function: functionSchema
        } = schema ?? {}

        return schema ?
            this
                .withStatus(status)
                .withDelay(delay)
                .withPaths(schema)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withNot(not)
                .withIncrement(increment)
                .withDecrement(decrement)
                .withConditional(schema)
                .withConsulta(consulta)
                .withDefinitions(definitions)
                .withPropiedades(propiedades)
                .withSpread(spread)
                .withFunction(functionSchema)
                .withEndSchema(schema)
                .withReduceOrDefault(reduceOrDefault)
                .withReduce(reduce)
                .withReduceMany(reduceMany)
                .withCheckout(checkout)
            : this
    }

    withFunction(functionSchema: Schema | undefined) {
        if(functionSchema) {
            this.add(() => (initial: any) => this.with({ 
                initial, 
                schema: functionSchema 
            }).build())
        }

        return this
    }

    withStatus(path: string | undefined) {
        if(path) {
            this.add(target => {
                // const value = this.getStoreValue(path) as number
                // this.set(path, { loading: value + 1 })

                // this.with({}).withIncrement(path).build()
                
                this.with({ schema: { increment: path }}).build()

                return target
            })
        }

        return this
    }

    withConsulta(consulta: Consulta | undefined) {
        if(consulta) {
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

    withCheckout(schema: Schema | undefined) : SchemaTaskResultBuilder {
        if(schema) {
            this.add((target) => {
                this.target = target

                return target
            })
            
            this.withSchema(schema)
        }

        return this
    }

    withIncludes(schema: Schema | undefined) {
        return schema 
            ? this.add((target) => target.includes(this.with({ schema }).build()))
            : this
    }

    withUse(path: string | undefined) {
        const task = (target) => {
            const { functions } = this.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()
            
            return func(target, this)
        }

        return path ? this.add(task) : this
    }

    withSpread(schema: Schema | undefined) {
        if(schema) {
            this.addMerge()
                .withSchema(schema)
                .add((current, prev) => varios.spread(prev, current))
        }

        return this
    }

    withConditional(schema: Schema | undefined) : SchemaTaskResultBuilder {
        const condition = schema?.if

        const result = typeof(condition) == "string"
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
        const { equals, set, use, includes } = schema ?? {}

        return this
            .withArraySchema(schema)
            .withEquals(equals)
            .withIncludes(includes)
            .withUse(use)
            .withSet(set)
    }

    withNot(schema: Schema | undefined) {
        return schema ? 
            this.withSchema(schema)
                .add((target) => !target)
            : this
    }

    withReduceOrDefault(schema: Schema | undefined) : SchemaTaskResultBuilder {
        return schema 
            ? this.add(current => {
                if(current != null) {
                    const { taskBuilder } = this.with({ initial: current, schema })
                    this.unshift(taskBuilder)
                }

                return current
            }) 
            : this
    }

    withReduce(schema: Schema | undefined) : SchemaTaskResultBuilder {
        return schema ? this.addMerge().withSchema(schema) : this
    }

    withReduceMany(schemas: Schema[] | undefined) {
        schemas?.map(s => this.withReduce(s))

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        if(path) {
            this.add(() => {
                const value = (this.getStoreValue(path) ?? 0) + amount

                return this.set(path, value)
            })
        }

        return this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
    }

    withEquals(schema: Schema | undefined) {
        return schema
            ? this.add((target, prev) => {
                    const { taskBuilder } = this.with({ initial: prev, schema })
                        .add(result => varios.esIgual(target, result))

                    this.unshift(taskBuilder)
                })
            : this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {
        return propiedades
            ? this.add((target) => new PropiedadesBuilder(propiedades, this.with({ initial: target })).build())
            : this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        const task = (target) => schemas?.map(schema => this.with({ initial: target, schema }).taskBuilder)

        return schemas 
            ? this
                .add(task)
                .add(builders => this.taskBuilder.unshiftArray(builders))
            : this
    }

    withSelectSet(path: string | undefined) {
        if(path) {
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

    withSchemaFrom(source: Schema | undefined) : SchemaTaskResultBuilder {
        return source 
            ? this
                .addMerge()
                .withSchema(source)
                .add((current, prev) => {
                    return this.with({ initial: prev, schema: current }).build()
            }) 
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

    withPaths(schema: Schema | undefined) {
        const { path, targetPath, sibling, source } = schema ?? {}

        return this.add((target) =>
            new PlainResultBuilder(target)
                .withPath(path ? { ...this.options, ...this.options.store, target: this.target, current: target } : {}, path)
                .withPath(this.target, targetPath)
                .withPath(this.options.siblings, sibling)
                .withPath(this.options.sources, source)
                .build()
        )
    }
}