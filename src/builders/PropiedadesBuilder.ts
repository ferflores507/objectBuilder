import { Schema } from "../..";
import { BuilderOptions, ObjectBuilder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Record<string, Schema>, builder: ObjectBuilder) {
        const [computedEntries, entries] = this.getEntries(propiedades, builder.options)
        
        this.entries = entries
        this.result = { ...propiedades }
        this.builder = builder.with({ siblings: this.result })
        this.setComputed(this.result, computedEntries)   
    }

    private readonly result: Record<string, any>
    private entries: [string, Schema][]
    private builder: ObjectBuilder

    getEntries(propiedades: Record<string, Schema>, options: BuilderOptions) {
        const initialEntries = Object.entries(propiedades)
            .filter(([k]) => !options.stopPropiedades?.includes(k))

        const passPredicate = ([k, v]: [string, Schema]) => v.isComputed
        
        return this.partition(initialEntries, passPredicate)
    }

    setComputed(obj: {}, entries: [string, Schema][]) {
        const builder = this.builder
        
        return entries.reduce((obj, [key, schema]) => {
            Object.defineProperty(obj, key, {
                get() {
                    return builder.build(schema)
                }
            })

            return obj
        }, obj)
    }

    partition<T>(items: T[], pass: (item: T) => boolean | undefined) {

        const passed: T[] = []
        const failed: T[] = []
        
        for(const item of items) {
            (pass(item) ? passed : failed).push(item)
        }

        return [
            passed,
            failed
        ]
    }

    getResult() {
        return this.result
    }
     
    build() {
        for (const [k, v] of this.entries) {
            this.result[k] = this.builder.build(v)
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