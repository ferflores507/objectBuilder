import { Schema } from "../..";
import { ObjectBuilder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(propiedades: Record<string, Schema>, private builder: ObjectBuilder) {
        this.result = { ...propiedades }
        this.builder = this.builder.with({ siblings: this.result })

        const { stopPropiedades } = this.builder.options

        const initialEntries = Object.entries(propiedades)
            .filter(([k]) => !stopPropiedades?.includes(k))

        const [entries, computedEntries] = this.partition(initialEntries)

        this.entries = entries
    }

    private readonly result: Record<string, any>
    private entries: [string, Schema][]

    partition(entries: [string, Schema][]) {

        const passedEntries = entries
        const failedEntries: any[] = []

        return [
            passedEntries,
            failedEntries
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