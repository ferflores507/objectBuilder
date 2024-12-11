import { assignAll, isNotPrimitive } from "../helpers/varios";
import { Propiedades, Schema, SchemaDefinition } from "../models";
import { Builder } from "./SchemaTaskResultBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Propiedades, private readonly builder: Builder) {
        const allEntries = this.getWithDefault(propiedades)
        const { entries = [], computedEntries = [] } = this.groupByComputed(allEntries)

        this.entries = entries
        this.result = assignAll({}, ...this.getGetters(computedEntries))
        this.builder = builder.with({ siblings: this.result })
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, SchemaDefinition][]

    getWithDefault(propiedades: Propiedades): [string, SchemaDefinition][] {
        return Object.entries(propiedades)
            .map(([k,v]) => [k as string, isNotPrimitive(v) ? v as SchemaDefinition : { const: v } ])
    }

    groupByComputed(entries: [string, SchemaDefinition][]) {
        return Object.groupBy(entries, ([k, v]) => {
            return (v as Schema)?.isComputed ? "computedEntries" : "entries"
        })
    }

    getGetters(entries: [string, SchemaDefinition][]) {        
        return entries.map(([key, schema]) => Object.defineProperty({}, key, {
            get: () => this.builder.with({ schema }).build()
        }))
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