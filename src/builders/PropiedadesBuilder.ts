import { assignAll } from "../helpers/varios";
import { Propiedades, Schema, SchemaDefinition, SchemaPrimitive } from "../models";
import { Builder } from "./SchemaTaskResultBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Propiedades, private readonly builder: Builder) {
        const allEntries = Object.entries(propiedades)
        const { entries = [], computedEntries = [] } = this.groupByComputed(allEntries)

        this.entries = entries
        this.result = assignAll({}, ...this.getGetters(computedEntries))
        this.builder = builder.with({ siblings: this.result })
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, SchemaDefinition | SchemaPrimitive][]

    groupByComputed(entries: [string, SchemaDefinition | SchemaPrimitive][]) {
        return Object.groupBy(entries, ([k, v]) => {
            return (v as Schema)?.isComputed ? "computedEntries" : "entries"
        })
    }

    getGetters(entries: [string, SchemaDefinition | SchemaPrimitive][]) {        
        return entries.map(([key, schema]) => Object.defineProperty({}, key, {
            get: () => this.builder.withSchemaOrDefault(schema).build()
        }))
    }

    getResult() {
        return this.result
    }
     
    build() {
        for (const [k, v] of this.entries) {
            this.result[k] = this.builder.withSchemaOrDefault(v).build()
        }

        return this.getResult()
    }

    async buildAsync() {        
        for (const [k, v] of this.entries) {
            this.result[k] = await this.builder.withSchemaOrDefault(v).buildAsync()
        }

        return this.getResult()
    }
}