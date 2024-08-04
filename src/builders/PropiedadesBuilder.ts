import { Schema } from "../..";
import { ObjectBuilder } from "./ObjectBuilder";

export class PropiedadesBuilder {
    constructor(private propiedades: Record<string, Schema>, private builder: ObjectBuilder) {
        this.result = { ...this.propiedades }
        this.builder = this.builder.with({ siblings: this.result })
    }

    private result: Record<string, any>
    private entries = () => {
        const validPropiedades = this.propiedades // replace with valid propiedades from builder options
        
        return Object.entries(validPropiedades)
    }

    getResult() {
        return this.result
    }

    // // usar solo si tests fallan por hacer spread de propiedades en constructor
    // getResult() {
    //     // result contains only overwrited propiedades
    //     return { ...this.propiedades, ...this.result }
    // }
 
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