import type { Schema } from "../models"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ResultBuilder extends ResultBuilderBase {

    clone() {
        return new ResultBuilder(this.target, this.builder)
    }

    build(schema: Schema | undefined) {

        const { 
            propiedades, 
            spread, 
            reduce, 
            definitions, 
            checkout 
        } = schema ?? {}

        return this.withSchema(schema)
            .withConditional(schema)
            .withDefinitions(definitions)
            .withPropiedades(propiedades)
            .withSpread(spread)
            .withEndSchema(schema)
            .withReduce(reduce)
            .withCheckout(checkout)
            .getTarget()
    }

    withConditional(schema: Schema | undefined) {
        if(schema?.if) {
            const condition = schema.if

            const result = typeof(condition) == "string"
                ? this.builder.getSourcePathValue(condition)
                : this.builder.build(condition)

            this.target = this.builder.build(result ? schema.then : schema.else)
        }

        return this
    }

    withDefinitions(schemas: Schema[] | undefined) {
        if(schemas) {
            this.target = schemas?.map(schema => this.clone().build(schema))
        }

        return this
    }

    withReduce(schemas: Schema[] | undefined) {
        if(schemas) {
            for (const schema of schemas) {
                this.target = this.build(schema)
            }
        }

        return this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {

        if (propiedades) {
            const builder = this.builder.with({ target: this.target })
            
            this.target = new PropiedadesBuilder(propiedades, builder).build()
          }

        return this
    }

    withSpread(schema: Schema | undefined) {
        if(schema) {  
            const source = this.builder.build(schema)
            this.target = varios.spread(this.target, source)
        }

        return this
    }
}