import { Calc } from "../helpers/calc"
import type { ArraySchema, CalcMethod, Schema } from "../models"
import { ArrayBuilder } from "./ArrayBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import * as varios from "../helpers/varios"
import { getPathValue } from "../helpers/varios"

export class ResultBuilderBase {
    constructor(target: any, builder: ObjectBuilder) {
        this.target = target
        this.builder = builder
      }

    protected target: unknown
    protected builder: ObjectBuilder
    private get options() {
        return this.builder.options
    }

    getTarget = () => this.target

    withSchema(schema: Schema | undefined) {
        const { 
            path,
            targetPath,
            "const": value,
            schemaFrom, 
            entries, 
            calc, 
            unpack,
            stringify,
            parse,
            sibling,
            source
        } = schema ?? {}

        return this.withConst(value)
            .withPath(this.builder.getSource(), path)
            .withPath(this.target as {}, targetPath)
            .withPath(this.options?.siblings as {}, sibling)
            .withPath(this.options?.sources ?? {}, source)
            .withSchemaFrom(schemaFrom)
            .withEntries(entries)
            .withCalc(calc)
            .withUnpack(unpack)
            .withStringify(stringify)
            .withParse(parse)
    }

    withUse(path: string | undefined) {
        if(path) {
            const func = this.builder.getSourcePathValue(path)
            this.target = func(this.target, this.builder)
        }

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

    withCheckout(schema: Schema | undefined) {
        if(schema) {
            this.target = new ObjectBuilder(this.target as {}).build(schema)
        }

        return this
    }

    withSchemaFrom(source: Schema | undefined) {
        if(source) {
            const schema = this.builder.build(source) as Schema
            this.target = this.builder.build(schema)
        }

        return this
    }

    withSet(path: string | undefined) {
        if(path) {
            const paths = path.split(".")
            const source = this.builder.getSource()

            varios.setUpdateProp(source as {}, paths, this.target)
        }

        return this
    }

    withEquals(schema: Schema | undefined) {
        if(schema) {
            this.target = varios.esIgual(this.target, this.builder.build(schema))
        }

        return this
    }

    withArraySchema(schema: ArraySchema | undefined) {
        this.target = new ArrayBuilder(this.target as [], this.builder)
            .build(schema)

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
          this.target = varios.entries(this.target as {})
        }
  
        return this
      }

    withConst(value: any) {

        if(value !== undefined) {
            this.target = value
        }

        return this
    }

    withPath(source: {}, path: string | undefined) {
        if(path) {
            this.target = getPathValue(source, path)
        }

        return this
    }
}