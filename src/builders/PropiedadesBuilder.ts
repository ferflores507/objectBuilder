import { Schema } from "../..";
import { partition } from "../helpers/varios";
import { BuilderOptions, ObjectBuilder } from "./ObjectBuilder";

type Builder = {
    options: BuilderOptions
    with: (options: BuilderOptions) => Builder
    withSchema: (schema: Schema | undefined) => Builder
    build: () => any
}

export class PropiedadesBuilder {
    constructor(propiedades: Record<string, Schema>, builder: Builder) {
        const [computedEntries, entries] = this.filterEntries(propiedades, builder.options)
        
        this.entries = entries
        this.result = { ...propiedades }
        this.builder = builder.with({ ...builder.options, siblings: this.result })
        this.setComputed(this.result, computedEntries)   
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, Schema][]
    private readonly builder: Builder

    filterEntries(propiedades: Record<string, Schema>, options: BuilderOptions) {
        const initialEntries = Object.entries(propiedades)
            .filter(([k]) => !options.stopPropiedades?.includes(k))

        const passPredicate = ([k, v]: [string, Schema]) => v.isComputed
        
        return partition(initialEntries, passPredicate)
    }

    setComputed(obj: {}, entries: [string, Schema][]) {
        const builder = this.builder
        
        return entries.reduce((obj, [key, schema]) => {
            return Object.defineProperty(obj, key, {
                get() {
                    return builder.build(schema)
                }
            })
        }, obj)
    }

    getResult() {
        return this.result
    }
     
    build() {
        for (const [k, v] of this.entries) {
            this.result[k] = this.builder.with({ schema: v }).build()
        }

        return this.getResult()
    }

    async buildAsync() {        
        for (const [k, v] of this.entries) {
            this.result[k] = await this.builder.buildAsync(v)
        }

        return this.getResult()
    }
}