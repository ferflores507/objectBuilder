import { assignAll } from "../helpers/varios";
import { Propiedades, SchemaDefinition, SchemaPrimitive } from "../models";
import { Builder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Propiedades, private readonly builder: Builder, target = {}) {
        const { $bind, $getters = {}, ...rest } = propiedades

        this.entries = Object.entries(rest)
        this.result = assignAll(target, ...this.getGetters(Object.entries($getters)))
        this.builder = builder.with({ siblings: this.result })

        if($bind) {
            assignAll(this.result, this.builder.with({ schema: $bind }).build())
        }
    }

    private readonly result: Record<string, any>
    private readonly entries: [string, SchemaDefinition | SchemaPrimitive][]

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
            assignAll(this.result, { [k]: this.builder.withSchemaOrDefault(v).build() })
        }

        return this.getResult()
    }

    async buildAsync() {        
        for (const [k, v] of this.entries) {
            assignAll(this.result, { [k]: await this.builder.withSchemaOrDefault(v).buildAsync() })
        }

        return this.getResult()
    }
}