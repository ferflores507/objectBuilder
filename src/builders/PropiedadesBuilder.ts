import { Schema } from "../..";
import { ObjectBuilder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Record<string, Schema>, private builder: ObjectBuilder) {
        this.result = { ...propiedades }
        this.builder = this.builder.with({ siblings: this.result })

        const [entries, computedEntries] = this.partition(propiedades)

        this.entries = entries
    }

    private readonly result: Record<string, any>
    private entries: [string, Schema][]

    partition(propiedades: Record<string, Schema>) {
        const { stopPropiedades } = this.builder.options

        const validEntries = Object.entries(propiedades)
            .filter(([k]) => !stopPropiedades?.includes(k))

        const computedEntries: any[] = []

        return [
            validEntries,
            computedEntries
        ]
    }

    getResult() {
        return this.result
    }
    
    trySetComputed(key: string, schema: Schema | undefined) {
        const { isComputed = false } = schema ?? {}

        if(isComputed) {
            const builder = this.builder
            
            Object.defineProperty(this.result, key, {
                get() {
                    return builder.build(schema)
                }
            })
        }

        return isComputed
    }
 
    build() {
        for (const [k, v] of this.entries) {
            if(this.trySetComputed(k, v) === false) {
                this.result[k] = this.builder.build(v)
            }
        }

        return this.getResult()
    }

    async buildAsync() {        
        for (const [k, v] of this.entries) {
            if(this.trySetComputed(k, v) === false) {
                this.result[k] = await this.builder.buildAsync(v)
            }
        }

        return this.getResult()
    }
}