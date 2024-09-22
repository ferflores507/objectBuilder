import type { ArraySchema, Schema } from "../models"
import { Options } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { PlainResultBuilder } from "./PlainResultBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ArrayBuilder } from "./ArrayBuilder"

export class SchemaTaskResultBuilder {
    constructor(private target: any, options?: Options) {
        this.options = options ?? {
            store: {},
            siblings: {},
            sources: {}
        }
    }

    tasks: any[] = []

    add(task: () => any) {
        this.tasks.push(task)

        return this
    }

    readonly options: Options

    build() {
        for(const task of this.tasks) {
            this.target = task()
        }

        return this.target
    }

    with(options: Options) {
        options = { ...this.options, ...options }
        const target = options.target ?? this.target
        
        return new SchemaTaskResultBuilder(target, options)
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

        return schema ?
            this.with({})
                .withPaths(schema)
                .withInitialSchema(schema)
                .withSchemaFrom(schemaFrom)
                .withSelectSet(selectSet)
                .withNot(not)
                .withIncrement(increment)
                // .withDecrement(decrement)
                .withConditional(schema)
                .withDefinitions(definitions)
                .withPropiedades(propiedades)
                .withSpread(spread)
                .withEndSchema(schema)
                .withReduce(reduce)
                // .withReduceMany(reduceMany)
                // .withCheckout(checkout)
            : this
    }

    withSpread(schema: Schema | undefined) {
        if(schema) {
            this.add(() => {
                const source = this.withSchema(schema).build()
                
                return varios.spread(this.target, source)
            })
        }

        return this
    }

    withConditional(schema: Schema | undefined) {
        if(schema?.if) {
            const condition = schema.if

            this.add(() => {
                const result = typeof(condition) == "string"
                    ? this.getStoreValue(condition)
                    : this.withSchema(condition).build()

                return this.withSchema(result ? schema.then : schema.else).build()
            })
        }

        return this
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
            // .withIncludes(includes)
            .withSet(set)
            // .withUse(use)
    }

    withNot(schema: Schema | undefined) {
        if(schema) {
            this.target = ! this.withSchema(schema).build()
        }

        return this
    }

    withReduce(schema: Schema | undefined) {
        return schema
            ? this.add(() => this.withSchema(schema).build())
            : this
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

    withEquals(schema: Schema | undefined) {
        return schema
            ? this.add(() => varios.esIgual(this.target, this.withSchema(schema).build()))
            : this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {
        return propiedades
            ? this.add(() => new PropiedadesBuilder(propiedades, this).build())
            : this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        const task = () => schemas?.map(schema => this.withSchema(schema).build())

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

    withSchemaFrom(source: Schema | undefined) {
        const task = () => {
            const schema = this.withSchema(source).build() as Schema            
            
            return this.withSchema(schema).build()
        }

        return source ? this.add(task) : this
    }

    getInitialValue(schema: Schema | undefined) {        
        return schema?.const ?? schema?.schema ?? this.target
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