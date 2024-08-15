import { Schema } from "../..";
import { ObjectBuilder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(private propiedades: Record<string, Schema>, private builder: ObjectBuilder) {
        this.result = { ...this.propiedades }
        this.builder = this.builder.with({ siblings: this.result })
    }

    private readonly result: Record<string, any>
    private entries = () => {
        const { stopPropiedades } = this.builder.options
        
        return Object.entries(this.propiedades)
            .filter(([k]) => !stopPropiedades?.includes(k))
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
        for (const [k, v] of this.entries()) {
            this.result[k] = this.builder.build(v)
        }

        return this.getResult()
    }

    async buildAsync() {
        for (const [k, v] of this.entries()) {
            this.result[k] = await this.builder.buildAsync(v)
        }

        return this.getResult()
    }
}