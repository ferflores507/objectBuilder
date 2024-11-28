import { Schema } from "../..";
import { partition } from "../helpers/varios";
import { Builder } from "./SchemaTaskResultBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Record<string, Schema>, builder: Builder) {
        const [computedEntries, entries] = partition(
            Object.entries(propiedades), 
            ([k, v]: [string, Schema]) => v.isComputed
        )
        
        this.entries = entries
        this.result = { ...propiedades }
        this.builder = builder.with({ ...builder.options, siblings: this.result })
        this.setComputed(this.result, computedEntries)   
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, Schema][]
    private readonly builder: Builder

    setComputed(obj: {}, entries: [string, Schema][]) {
        const builder = this.builder
        
        return entries.reduce((obj, [key, schema]) => {
            return Object.defineProperty(obj, key, {
                get() {
                    return builder.with({ schema }).build()
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
            this.result[k] = await this.builder.with({ schema: v }).buildAsync()
        }

        return this.getResult()
    }
}