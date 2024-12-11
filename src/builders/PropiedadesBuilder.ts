import { isNotPrimitive } from "../helpers/varios";
import { Propiedades, Schema, SchemaDefinition } from "../models";
import { Builder } from "./SchemaTaskResultBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Propiedades, builder: Builder) {
        const allEntries = Object.entries(propiedades)
            .map(([k,v]) => [k, isNotPrimitive(v) ? v : { const: v }])
        
        const { entries = [], computedEntries = [] } = Object.groupBy(allEntries, ([k, v]) => {
            return (v as Schema)?.isComputed ? "computedEntries" : "entries"
        })

        this.entries = entries
        this.result = { ...propiedades }
        this.builder = builder.with({ ...builder.options, siblings: this.result })
        this.setComputed(this.result, computedEntries)   
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, SchemaDefinition][]
    private readonly builder: Builder

    setComputed(obj: {}, entries: [string, SchemaDefinition][]) {
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