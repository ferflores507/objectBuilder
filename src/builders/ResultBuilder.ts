import type { Schema } from "../models"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import { PropiedadesBuilder } from "./PropiedadesBuilder"
import { BuilderOptions } from "./ObjectBuilder"

export class ResultBuilder extends ResultBuilderBase {

    with(options: BuilderOptions) {
        const builder = this.builder.with(options)
        
        return new ResultBuilder(this.target, builder)
    }

    clone() {
        return new ResultBuilder(this.target, this.builder)
    }

    build() {
        return this.getTarget()
    }

    withSchema(schema: Schema | undefined) {

        const { 
            propiedades, 
            spread, 
            reduce, 
            reduceMany,
            definitions, 
            checkout 
        } = schema ?? {}

        this.withBaseSchema(schema)
            .withConditional(schema)
            .withDefinitions(definitions)
            .withPropiedades(propiedades)
            .withSpread(spread)
            .withEndSchema(schema)
            .withReduce(reduce)
            .withReduceMany(reduceMany)
            .withCheckout(checkout)
        
        return this
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
            this.target = schemas?.map(schema => this.clone().withSchema(schema).build())
        }

        return this
    }

    withReduce(schema: Schema | undefined) {
        if(schema) {
            this.target = this.withSchema(schema).build()
        }

        return this
    }

    withReduceMany(schemas: Schema[] | undefined) {
        if(schemas) {
            for (const schema of schemas) {
                this.target = this.withSchema(schema).build()
            }
        }

        return this
    }

    withPropiedades(propiedades: Record<string, any> | undefined) {

        if (propiedades) {            
            this.target = new PropiedadesBuilder(propiedades, this).build()
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