import { Calc } from "../helpers/calc"
import type { ArraySchema, CalcMethod, Schema } from "../models"
import { ArrayBuilder } from "./ArrayBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import * as varios from "../helpers/varios"
import { getObjPath } from "../helpers/varios"

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
            sibling
        } = schema ?? {}

        return this.withConst(value)
            .withPath(this.builder.getSource(), path)
            .withPath(this.target, targetPath)
            .withPath(this.options?.siblings, sibling)
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
            this.target = func(this.target)
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
            this.target = new ObjectBuilder(this.target).build(schema)
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

            varios.setUpdateProp(source, paths, this.target)
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
            .withSchema(schema)
            .build()

        return this
    }

    withUnpack(keys: string[] | undefined) {
        if (keys) {
            this.target = keys.reduce((prev: {}, key) => ({ ...prev, [key]: this.target[key] }), {})
        }

        return this
    }

    withCalc(method: CalcMethod | undefined) {

        if (method) {

            const calc = new Calc(...this.target)

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
          this.target = varios.entries(this.target)
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
            this.target = getObjPath(source, path)
        }

        return this
    }
}