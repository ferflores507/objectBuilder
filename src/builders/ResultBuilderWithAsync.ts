import type { Consulta, Schema } from "../models"
import { LocalDefinitionBuilder } from "./LocalDefinitionBuilder"
import { ResultBuilderBase } from "./ResultBuilderBase"
import * as varios from "../helpers/varios"
import useConsulta from "../helpers/useConsulta"

export class ResultBuilderWithAsync extends ResultBuilderBase {

    constructor(target: any, builder: LocalDefinitionBuilder, controller: AbortController) {
        super(target, builder)
        this.controller = controller
      }

      controller: AbortController

    async buildAsync(schema: Schema | undefined) {
        const { propiedades, spread, definitions, reduce, equals, set, delay, consulta } = schema ?? {}

        this.withSchema(schema)
        await this.withDelay(delay)
        await this.withConsultaAsync(consulta)
        await this.withDefinitionsAsync(definitions)
        await this.withPropiedadesAsync(propiedades)
        await this.withSpreadAsync(spread)
        await this.withArrayToArraySchema(schema) // await solo para alinear 
        await this.withEquals(equals) // await solo para alinear
        await this.withReduceAsync(reduce)
        await this.withSet(set)

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
            const promises = schemas.map(schema => this.localBuilder.buildAsync(schema, this.controller))
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
            const builder = this.localBuilder.withTarget(this.target)
      
            for (const [k, v] of Object.entries(propiedades)) {
                obj[k] = await builder.buildAsync(v, this.controller);
            }
      
            this.target = obj
          }
    }

    async withSpreadAsync(schema: Schema | undefined) {
        if(schema) {
            const source = await this.localBuilder.buildAsync(schema)
            this.target = varios.spread(this.target, source)
        }
    }
}