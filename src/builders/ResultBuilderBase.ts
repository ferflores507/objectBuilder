import type { ArraySchema, Schema } from "../models"
import { ArrayBuilder } from "./ArrayBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import * as varios from "../helpers/varios"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { getPathValue } from "../helpers/varios"

export type Options = {
    store: Record<string, any>
    siblings: Record<string, any>
    sources: Record<string, any>
}

export class SchemaResultBuilder {
    constructor(private target: any, options?: Options) {
        this.options = options ?? {
            store: {},
            siblings: {},
            sources: {}
        }
    }

    readonly options: Options

    build() {
        return this.target
    }

    with(options: Options) {
        options = { ...this.options, ...options }
        const target = options.target ?? this.target
        return new SchemaResultBuilder(target, options)
    }

    clone() {
        return this.with({})
    }

    withSchema(schema: Schema | undefined) {
        if(schema) {

            const { 
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
                decrement
            } = schema ?? {}

            this.withPaths(schema)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withNot(not)
                .withIncrement(increment)
                .withDecrement(decrement)
                .withConditional(schema)
                .withDefinitions(definitions)
                .withPropiedades(propiedades)
                .withSpread(spread)
                .withEndSchema(schema)
                .withReduce(reduce)
                .withReduceMany(reduceMany)
                .withCheckout(checkout)
        }

        return this
    }

    getStoreValue(path: string) {
        return getPathValue(this.options.store, path)
    }

    set(path: string, value: any) {
        varios.setPathValue(this.options.store, path, value)

        return value
    }

    withSelectSet(path: string | undefined) {
        if(path) {
            const items = this.getStoreValue(path) as any[]
            const newItems = new ArrayMapBuilder(items, this)
                .withSelect({ value: this.target })
                .build()
            
            this.target = this.set(path, newItems)
        }

        return this
    }

    withCheckout(schema: Schema | undefined) {
        if(schema) {
            this.target = this
                .with({ store: this.target })
                .withSchema(schema)
                .build()
        }

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        if(path) {
            const value = (this.getStoreValue(path) ?? 0) + amount

            this.target = this.set(path, value)
        }

        return this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
    }

    withNot(schema: Schema | undefined) {
        if(schema) {
            this.target = ! this.withSchema(schema).build()
        }

        return this
    }

    withConditional(schema: Schema | undefined) {
        if(schema?.if) {
            const condition = schema.if

            const result = typeof(condition) == "string"
                ? this.getStoreValue(condition)
                : this.withSchema(condition).build()

            this.target = this.withSchema(result ? schema.then : schema.else).build()
        }

        return this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        if(schemas) {
            this.target = schemas?.map(schema => this.clone().withSchema(schema).build())
        }

        return this
    }

    withSpread(schema: Schema | undefined) {
        if(schema) {  
            const source = this.clone().withSchema(schema).build()
            this.target = varios.spread(this.target, source)
        }

        return this
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

    withReduce(schema: Schema | undefined) {
        if(schema) {
            this.target = this.withSchema(schema).build()
        }

        return this
    }

    withReduceMany(schemas: Schema[] | undefined) {
        if(schemas) {
            for (const schema of schemas) {
                this.target = this.withSchema(schema).build()
            }
        }

        return this
    }

    withIncludes(schema: Schema | undefined) {
        if(schema) {
            this.target = (this.target as any[]).includes(this.withSchema(schema).build())
        }

        return this
    }

    withUse(path: string | undefined) {
        if(path) {
            const { functions } = this.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()
            this.target = func(this.target, this)
        }

        return this
    }

    withSet(path: string | undefined) {
        if(path) {
            this.set(path, this.target)
        }

        return this
    }

    withEquals(schema: Schema | undefined) {
        if(schema) {
            this.target = varios.esIgual(this.target, this.withSchema(schema).build())
        }

        return this
    }

    withArraySchema(schema: ArraySchema | undefined) {
        this.target = new ArrayBuilder(this.target as [], this)
            .build(schema)

        return this
    }

    withSchemaFrom(source: Schema | undefined) {
        if(source) {
            const schema = this.withSchema(source).build() as Schema            
            const result = this.withSchema(schema).build()

            this.target = result
        }

        return this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {

        if (propiedades) {            
            this.target = new PropiedadesBuilder(propiedades, this).build()
          }

        return this
    }

    getInitialValue(schema: Schema | undefined) {        
        return schema?.const ?? schema?.schema ?? this.target
    }

    withInitialSchema(schema: Schema | undefined) {
        this.target = new PlainResultBuilder(this.getInitialValue(schema))
            .withSchema(schema)
            .build()

        return this
    }

    withPaths(schema: Schema | undefined) {
        const { path, targetPath, sibling, source } = schema ?? {}
        
        this.target = new PlainResultBuilder(this.target)
            .withPath(this.options.store, path)
            .withPath(this.target, targetPath)
            .withPath(this.options.siblings, sibling)
            .withPath(this.options.sources, source)
            .build()

        return this
    }
}

export abstract class ResultBuilderBase {
    constructor(target: any, builder: ObjectBuilder) {
        this.target = target
        this.builder = builder
      }

    protected target: unknown
    protected readonly builder: ObjectBuilder
    private get options() {
        return this.builder.options
    }

    abstract withConditional(schema: Schema | undefined) : this | Promise<this>

    getTarget = () => this.target

    withBaseSchema(schema: Schema | undefined) {
        const {
            schemaFrom, 
            selectSet,
            not,
            increment,
            decrement,
        } = schema ?? {}

        return this.withPlainResult(schema)
            .withSelectSet(selectSet)
            .withNot(not)
            .withIncrement(increment)
            .withDecrement(decrement)
    }

    withPlainResult(schema: Schema | undefined) {

        this.target = new SchemaResultBuilder(this.target)
            .with({
                store: this.builder.getSource(),
                siblings: this.builder.options.siblings ?? {},
                sources: this.builder.options.sources ?? {}
            })
            .withPaths(schema)
            .withInitialSchema(schema)
            .withSchemaFrom(schema?.schemaFrom)
            .build()

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        if(path) {
            const value = (this.builder.getSourcePathValue(path) ?? 0) + amount

            this.target = this.set(path, value)
        }

        return this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
    }

    withNot(schema: Schema | undefined) {
        if(schema) {
            this.target = ! this.builder.build(schema)
        }

        return this
    }

    withEndSchema(schema: Schema | undefined) {
        const { equals, set, use, includes } = schema ?? {}

        return this.withArraySchema(schema)
            .withEquals(equals)
            .withIncludes(includes)
            .withSet(set)
            .withUse(use)
    }

    set(path: string, value: any) {
        const source = this.builder.getSource()

        varios.setPathValue(source as {}, path, value)

        return value
    }

    withSelectSet(path: string | undefined) {
        if(path) {
            const items = this.builder.getSourcePathValue(path) as any[]
            const newItems = new ArrayMapBuilder(items, this.builder)
                .withSelect({ value: this.target })
                .build()
            
            this.set(path, newItems)
        }

        return this
    }

    withIncludes(schema: Schema | undefined) {
        if(schema) {
            this.target = (this.target as any[]).includes(this.builder.build(schema))
        }

        return this
    }

    withUse(path: string | undefined) {
        if(path) {
            const { functions } = this.builder.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()
            this.target = func(this.target, this.builder)
        }

        return this
    }

    withCheckout(schema: Schema | undefined) {
        if(schema) {
            this.target = new ObjectBuilder(this.target as {}).build(schema)
        }

        return this
    }

    withSet(path: string | undefined) {
        if(path) {
            this.set(path, this.target)
        }

        return this
    }

    withEquals(schema: Schema | undefined) {
        if(schema) {
            this.target = varios.esIgual(this.target, this.builder.build(schema))
        }

        return this
    }

    withArraySchema(schema: ArraySchema | undefined) {
        this.target = new ArrayBuilder(this.target as [], this.builder)
            .build(schema)

        return this
    }
}