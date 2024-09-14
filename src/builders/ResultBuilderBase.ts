import type { ArraySchema, Schema } from "../models"
import { ArrayBuilder } from "./ArrayBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import * as varios from "../helpers/varios"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"

export type Options = {
    store: Record<string, any>
    siblings: Record<string, any>
    sources: Record<string, any>
}

class SchemaResulBuilder {
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
        return new SchemaResulBuilder(this.target, options)
    }

    withSchema(schema: Schema | undefined) {
        if(schema) {
            this
            .withPaths(schema)
            .withInitialSchema(schema)
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
            .withSchemaFrom(schemaFrom)
            .withSelectSet(selectSet)
            .withNot(not)
            .withIncrement(increment)
            .withDecrement(decrement)
    }

    withPlainResult(schema: Schema | undefined) {

        this.target = new SchemaResulBuilder(this.target)
            .with({
                store: this.builder.getSource(),
                siblings: this.builder.options.siblings ?? {},
                sources: this.builder.options.sources ?? {}
            })
            .withPaths(schema)
            .withInitialSchema(schema)
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

    withSchemaFrom(source: Schema | undefined) {
        if(source) {
            const schema = this.builder.build(source) as Schema
            this.target = this.builder.with({ target: this.target }).build(schema)
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