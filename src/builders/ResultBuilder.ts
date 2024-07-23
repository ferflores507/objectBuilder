import type { Schema } from "../models"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"

export class ResultBuilder extends ResultBuilderBase {

    build(schema: Schema | undefined) {

        const { propiedades, spread, reduce, definitions, equals, set, checkout } = schema ?? {}

        return this.withSchema(schema)
            .withDefinitions(definitions)
            .withPropiedades(propiedades)
            .withSpread(spread)
            .withArraySchema(schema)
            .withEquals(equals)
            .withReduce(reduce)
            .withSet(set)
            .withCheckout(checkout)
            .getTarget()
    }

    withDefinitions(schemas: Schema[] | undefined) {
        if(schemas) {
            this.target = schemas?.map(schema => this.builder.build(schema))
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
            const obj: Record<string, any> = {}
            const builder = this.builder.withTarget(this.target)
      
            for (const [k, v] of Object.entries(propiedades)) {
              obj[k] = builder.build(v);
            }
      
            this.target = obj
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