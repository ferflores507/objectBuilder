import type { ArraySchema, Consulta, Schema } from "../models"
import { Options } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"
import useConsulta from "../helpers/useConsulta"

export class SchemaTaskResultBuilder {
    constructor(private target?: any, options?: Options) {
        this.options = options ?? {
            store: {},
            siblings: {},
            sources: {}
        }
    }

    tasks: any[] = []

    add(task: (controller: AbortController) => any) {
        this.tasks.push(task)

        return this
    }

    readonly options: Options

    build() {
        for(const task of this.tasks) {
            const value = task()
            const isPromise = typeof value?.then === "function"

            this.target = isPromise ? this.target : value
        }

        return this.target
    }

    async buildAsync() {
        const controller = this.startStatus()

        try {
            for(const task of this.tasks) {
                this.target = await task(controller)
            }
        }
        catch (ex) {
            if (controller.signal.aborted === false) {
                // this.setStatus({ error })
                // this.with({ target: ex }).withSchema(errorSchema).build()
            }
        }
        finally {
            // this.setStatus({ loading: false })
        }

        return this.target
    }

    startStatus() {
        // this.setStatus({ loading: true })
        return new AbortController()
    }

    with(options: Partial<Options & { schema?: Schema, functions?: {} }>) : SchemaTaskResultBuilder {
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

    withSchema(schema: Schema | undefined) {
        const {
            delay,
            propiedades, 
            spread, 
            reduce, 
            reduceMany,
            definitions, 
            checkout,
            schemaFrom,
            selectSet,
            not,
            increment,
            decrement,
            consulta
        } = schema ?? {}

        return schema ?
            this
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
                .withEndSchema(schema)
                .withReduce(reduce)
                .withReduceMany(reduceMany)
                .withCheckout(checkout)
            : this
    }

    withConsulta(consulta: Consulta | undefined) {
        if(consulta) {
            const { cargar } = useConsulta()

            this.add(async (controller: AbortController) => {
                const response = await cargar(consulta, controller.signal)
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
            ? this.add(async () => {
                await delay(ms)

                return this.target
            })
            : this
    }

    withCheckout(schema: Schema | undefined) : SchemaTaskResultBuilder {
        if(schema) {
            this.add(() => {
                this.options.store = this.target

                return this.target
            })
            
            this.withSchema(schema)
        }

        return this
    }

    withIncludes(schema: Schema | undefined) {
        return schema 
            ? this.add(() => (this.target as any[]).includes(this.with({ schema }).build()))
            : this
    }

    withUse(path: string | undefined) {
        const task = () => {
            const { functions } = this.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()
            
            return func(this.target, this)
        }

        return path ? this.add(task) : this
    }

    withSpread(schema: Schema | undefined) {
        if(schema) {
            this.add(() => {
                const source = this.with({ schema }).build()
                
                return varios.spread(this.target, source)
            })
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
            () => new ArrayBuilder(this.target as [], this).build(schema)
        )

        return this
    }

    withSet(path: string | undefined) {
        return path
            ? this.add(() => this.set(path, this.target))
            : this
    }

    withEndSchema(schema: Schema | undefined) {
        const { equals, set, use, includes } = schema ?? {}

        return this
            .withArraySchema(schema)
            .withEquals(equals)
            .withIncludes(includes)
            .withSet(set)
            .withUse(use)
    }

    withNot(schema: Schema | undefined) {
        return schema
            ? this.add(() => ! this.with({ schema }).build()) 
            : this
    }

    withReduce(schema: Schema | undefined) : SchemaTaskResultBuilder {
        return schema ? this.withSchema(schema) : this
    }

    withReduceMany(schemas: Schema[] | undefined) {
        schemas?.map(s => this.withReduce(s))

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        if(path) {
            this.add(() => {
                const value = (this.getStoreValue(path) ?? 0) + amount

                this.target = this.set(path, value)
            })
        }

        return this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
    }

    withEquals(schema: Schema | undefined) {
        return schema
            ? this.add(() => varios.esIgual(this.target, this.with({ schema }).build()))
            : this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {
        return propiedades
            ? this.add(() => new PropiedadesBuilder(propiedades, this).build())
            : this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        const task = () => schemas?.map(schema => this.with({ schema }).build())

        return schemas ? this.add(task) : this
    }

    withSelectSet(path: string | undefined) {
        if(path) {
            const task = () => {
                const items = this.getStoreValue(path) as any[]
                const newItems = new ArrayMapBuilder(items, this)
                    .withSelect({ value: this.target })
                    .build()
                
                return this.set(path, newItems)
            }

            this.add(task)
        }

        return this
    }

    withSchemaFrom(source: Schema | undefined) : SchemaTaskResultBuilder {
        const schema = this.with({ schema: source }).build() as Schema

        return source ? this.withSchema(schema) : this
    }

    getInitialValue(schema: Schema | undefined) {        
        return [schema?.const, schema?.schema, this.target].find(val => val !== undefined)
    }

    withInitialSchema(schema: Schema | undefined) {
        return this.add(() => 
            new PlainResultBuilder(this.getInitialValue(schema))
                .withSchema(schema)
                .build()
        )
    }

    withPaths(schema: Schema | undefined) {
        const { path, targetPath, sibling, source } = schema ?? {}

        return this.add(() =>
            new PlainResultBuilder(this.target)
                .withPath(this.options.store, path)
                .withPath(this.target, targetPath)
                .withPath(this.options.siblings, sibling)
                .withPath(this.options.sources, source)
                .build()
        )
    }
}