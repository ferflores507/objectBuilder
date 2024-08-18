import { Calc } from "../helpers/calc"
import type { ArraySchema, CalcMethod, Schema } from "../models"
import { ArrayBuilder } from "./ArrayBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import * as varios from "../helpers/varios"
import { getPathValue } from "../helpers/varios"
import { ArrayMapBuilder } from "./ArrayMapBuilder"

export abstract class ResultBuilderBase {
    constructor(target: any, builder: ObjectBuilder) {
        this.target = target
        this.builder = builder
      }

    protected target: unknown
    protected readonly builder: ObjectBuilder
    private get options() {
        return this.builder.options
    }

    abstract withConditional(schema: Schema | undefined) : this | Promise<this>

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
            source,
            selectSet,
            not,
            isNullOrWhiteSpace,
            trim
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
            .withSelectSet(selectSet)
            .withNot(not)
            .withIsNullOrWhiteSpace(isNullOrWhiteSpace)
            .withTrim(trim)
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

    withNot(schema: Schema | undefined) {
        if(schema) {
            this.target = ! this.builder.build(schema)
        }

        return this
    }

    withEndSchema(schema: Schema | undefined) {
        const { equals, set, use, includes } = schema ?? {}

        return this.withArraySchema(schema)
            .withEquals(equals)
            .withIncludes(includes)
            .withSet(set)
            .withUse(use)
    }

    set(path: string, value: any) {
        const source = this.builder.getSource()

        varios.setPathValue(source as {}, path, value)
    }

    withSelectSet(path: string | undefined) {
        if(path) {
            const items = this.builder.getSourcePathValue(path) as any[]
            const newItems = new ArrayMapBuilder(items, this.builder)
                .withSelect({ value: this.target })
                .build()
            
            this.set(path, newItems)
        }

        return this
    }

    withIncludes(schema: Schema | undefined) {
        if(schema) {
            this.target = (this.target as any[]).includes(this.builder.build(schema))
        }

        return this
    }

    withUse(path: string | undefined) {
        if(path) {
            const { functions } = this.builder.options
            const func = functions?.[path] ?? (() => { throw `La función ${path} no está definida.` })()
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
            this.target = this.builder.with({ target: this.target }).build(schema)
        }

        return this
    }

    withSet(path: string | undefined) {
        if(path) {
            this.set(path, this.target)
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