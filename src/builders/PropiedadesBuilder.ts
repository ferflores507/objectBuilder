import { assignAll, isNotPrimitive } from "../helpers/varios";
import { Propiedades, Schema, SchemaDefinition } from "../models";
import { Builder } from "./SchemaTaskResultBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Propiedades, private readonly builder: Builder) {
        const allEntries = Object.entries(propiedades)
            .map(([k,v]) => [k, isNotPrimitive(v) ? v : { const: v }])
        
        const { entries = [], computedEntries = [] } = Object.groupBy(allEntries, ([k, v]) => {
            return (v as Schema)?.isComputed ? "computedEntries" : "entries"
        })

        this.entries = entries
        this.result = this.getInitialResult(computedEntries)
        this.builder = builder.with({ siblings: this.result })
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, SchemaDefinition][]

    getInitialResult(entries: [string, SchemaDefinition][]) {        
        const getters = entries.map(([key, schema]) => Object.defineProperty({}, key, {
            get: () => this.builder.with({ schema }).build()
        }))

        return assignAll({}, ...getters)
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