import type { Consulta, Schema } from "../models"
import { ObjectBuilder } from "./ObjectBuilder"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import useConsulta from "../helpers/useConsulta"

export class ResultBuilderAsync extends ResultBuilderBase {

    constructor(target: any, builder: ObjectBuilder, controller: AbortController) {
        super(target, builder)
        this.controller = controller
      }

      controller: AbortController

    clone() {
        return new ResultBuilderAsync(this.target, this.builder, this.controller)
    }

    async buildAsync(schema: Schema | undefined) {
        const { propiedades, spread, definitions, reduce, equals, set, delay, consulta, checkout, use } = schema ?? {}

        this.withSchema(schema)
        await this.withDelay(delay)
        await this.withConsultaAsync(consulta)
        await this.withDefinitionsAsync(definitions)
        await this.withPropiedadesAsync(propiedades)
        await this.withSpreadAsync(spread)
        await this.withArraySchema(schema) // await solo para alinear 
        await this.withEquals(equals) // await solo para alinear
        await this.withReduceAsync(reduce)
        await this.withSet(set)
        await this.withCheckout(checkout)
        await this.withUse(use)

        return this.getTarget()
    }

    async withConsultaAsync(consulta: Consulta | undefined) {
        if(consulta) {
            const { cargar } = useConsulta()
            this.target = await cargar(consulta, this.controller.signal)
        }

        return this
    }

    async withDelay(ms: number | undefined) {

        const delay = (ms: number) => new Promise((resolve, reject) => {

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

    async withReduceAsync(schemas: Schema[] | undefined) {
        if(schemas) {
            for (const schema of schemas) {
                this.target = await this.buildAsync(schema)
            }
        }
    }

    async withPropiedadesAsync(propiedades: Record<string, any> | undefined) {

        if (propiedades) {
            const obj: Record<string, any> = {}
      
            for (const [k, v] of Object.entries(propiedades)) {
              obj[k] = await this.buildAsync(v);
            }
      
            this.target = obj
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