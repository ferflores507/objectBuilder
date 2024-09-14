import type { Consulta, Schema } from "../models"
import { ObjectBuilder } from "./ObjectBuilder"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import useConsulta from "../helpers/useConsulta"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ResultBuilderAsync extends ResultBuilderBase {

    constructor(target: any, builder: ObjectBuilder, controller: AbortController) {
        super(target, builder)
        this.controller = controller
      }

      private readonly controller: AbortController

    clone() {
        return new ResultBuilderAsync(this.target, this.builder, this.controller)
    }

    async buildAsync(schema: Schema | undefined) {
        const { 
            propiedades, 
            spread, 
            definitions, 
            reduce,
            reduceMany,
            delay, 
            consulta, 
            checkout 
        } = schema ?? {}

        this.withBaseSchema(schema)
        await this.withConditional(schema)
        await this.withDelay(delay)
        await this.withConsultaAsync(consulta)
        await this.withDefinitionsAsync(definitions)
        await this.withPropiedadesAsync(propiedades)
        await this.withSpreadAsync(spread)
        await this.withEndSchema(schema) // await solo para alinear 
        await this.withReduceAsync(reduce)
        await this.withReduceManyAsync(reduceMany)
        await this.withCheckout(checkout)
        
        return this.getTarget()
    }

    async withConditional(schema: Schema | undefined) {
        if(schema?.if) {
            const condition = schema.if

            const result = typeof(condition) == "string"
                ? this.builder.getSourcePathValue(condition)
                : await this.builder.buildAsync(condition)

            this.target = await this.builder.buildAsync(result ? schema.then : schema.else)
        }

        return this
    }

    async withConsultaAsync(consulta: Consulta | undefined) {
        if(consulta) {
            const { cargar } = useConsulta()
            this.target = await cargar(consulta, this.controller.signal)
        }

        return this
    }

    async withDelay(ms: number | undefined) {

        const delay = (ms: number) => new Promise<void>((resolve, reject) => {

            const timeoutID = setTimeout(() => {
                console.log("delay resolved")
                resolve()
            }, ms)

            this.controller.signal.addEventListener("abort", (e) => {
                console.log("abort con event listener ejecutado")
                clearTimeout(timeoutID)
                reject(e.target)
            })
        })

        if(ms) {
            await delay(ms)
        }
    }

    async withDefinitionsAsync(schemas: Schema[] | undefined) {
        if(schemas) {
            const promises = schemas.map(schema => this.clone().buildAsync(schema))
                
            this.target = await Promise.all(promises)
        }
    }

    async withReduceAsync(schema: Schema | undefined) {
        if(schema) {
            this.target = await this.buildAsync(schema)
        }
    }

    async withReduceManyAsync(schemas: Schema[] | undefined) {
        if(schemas) {
            for (const schema of schemas) {
                this.target = await this.buildAsync(schema)
            }
        }
    }

    async withPropiedadesAsync(propiedades: Record<string, any> | undefined) {

        if (propiedades) {
            const builder = this.builder.with({ target: this.target })
      
            this.target = await new PropiedadesBuilder(propiedades, builder).buildAsync()
          }

        return this
    }

    async withSpreadAsync(schema: Schema | undefined) {
        if(schema) {
            const source = await this.builder.buildAsync(schema)
            this.target = varios.spread(this.target, source)
        }
    }
}