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
            "const": value,
            schemaFrom, 
            entries, 
            calc, 
            unpack,
            stringify,
            parse,
            selectSet,
            not,
            isNullOrWhiteSpace,
            trim,
            increment,
            decrement,
            UUID,
            schema: schemaAsValue
        } = schema ?? {}

        return this.withConst(value)
            .withPaths(schema)
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
            .withIncrement(increment)
            .withDecrement(decrement)
            .withUUID(UUID)
            .withSchemaAsValue(schemaAsValue)
    }

    withSchemaAsValue(schema: Schema | undefined) {
        if(schema) {
            this.target = schema
        }

        return this
    }

    withUUID(uuid: true | undefined) {
        if(uuid) {
            this.target = crypto.randomUUID()
        }

        return this
    }

    withIncrement(path: string | undefined, amount = 1) {
        if(path) {
            const value = (this.builder.getSourcePathValue(path) ?? 0) + amount

            this.target = this.set(path, value)
        }

        return this
    }

    withDecrement(path: string | undefined) {
        return this.withIncrement(path, -1)
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

        return value
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

    withPaths(schema: Schema | undefined) {
        const { path, targetPath, sibling, source } = schema ?? {}
        
        return this.withPath(this.builder.getSource(), path)
            .withPath(this.target as {}, targetPath)
            .withPath(this.options?.siblings as {}, sibling)
            .withPath(this.options?.sources ?? {}, source)
    }

    withPath(source: {}, path: string | undefined) {
        if(path) {
            this.target = getPathValue(source, path)
        }

        return this
    }
}