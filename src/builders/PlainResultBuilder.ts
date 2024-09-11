import { Calc } from "../helpers/calc"
import * as helpers from "../helpers/varios"
import { CalcMethod, Schema } from "../models"

export class PlainResultBuilder {
    constructor(private target: any) {}

    build() {
        return this.target
    }

    withSchema(schema: Schema | undefined) {
        const {
            "const": value,
            entries, 
            calc, 
            unpack,
            stringify,
            parse,
            isNullOrWhiteSpace,
            trim,
            UUID
        } = schema ?? {}

        this.target = this.withEntries(entries)
            .withCalc(calc)
            .withUnpack(unpack)
            .withStringify(stringify)
            .withParse(parse)
            .withIsNullOrWhiteSpace(isNullOrWhiteSpace)
            .withTrim(trim)
            .withUUID(UUID)
            .build()

        return this
    }

    withStringify(stringify: true | undefined) {
        if(stringify) {
            this.target = JSON.stringify(this.target)
        }

        return this
    }

    withParse(parse: true | undefined) {
        if(parse) {
            this.target = JSON.parse(this.target as string)
        }

        return this
    }

    withUUID(uuid: true | undefined) {
        if(uuid) {
            this.target = crypto.randomUUID()
        }

        return this
    }

    withIsNullOrWhiteSpace(isNullOrWhiteSpace: true | undefined) {
        if(isNullOrWhiteSpace) {
            this.target = ((this.target ?? "").toString()).trim() === ""
        }

        return this
    }

    withTrim(trim: true | undefined) {
        if(trim) {
            this.target = (this.target as string).trim()
        }

        return this
    }

    withUnpack(keys: string[] | undefined) {
        if (keys) {
            const target = this.target as Record<string, object>
            
            this.target = keys.reduce((obj, key) => {
                return { ...obj, [key]: target[key] }
            }, {})
        }

        return this
    }

    withCalc(method: CalcMethod | undefined) {

        if (method) {

            const calc = new Calc(...this.target as [])

            const metodos: Record<CalcMethod, () => number> = {
                "sumar": () => calc.sumar(),
                "restar": () => calc.restar(),
                "multiplicar": () => calc.multiplicar(),
                "dividir": () => calc.dividir()
            }

            this.target = metodos[method]()
        }

        return this
    }

    withEntries(entries: true | undefined){
        if(entries){
          this.target = helpers.entries(this.target as {})
        }
  
        return this
      }
    
    withPath(source: {}, path: string | undefined) {
        if(path) {
            this.target = helpers.getPathValue(source, path)
        }

        return this
    }
}