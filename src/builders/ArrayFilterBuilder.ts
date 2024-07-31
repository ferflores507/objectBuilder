import type { Schema } from "../models"
import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayFilterBuilder {

    constructor(source: unknown, builder: ObjectBuilder) {
        this.source = source
        this.items = source as [] ?? []
        this.builder = builder
        this.min = this.items.length
    }
    
    private readonly source: unknown
    private readonly items: any[]
    private builder: ObjectBuilder
    private isValidation = false
    private schema?: Schema
    private min: number
    private max?: number

    build() {

        let result = this.source

        if(this.schema) {
            const filtered = this.filter()

            result = this.isValidation ? this.validate(filtered) : filtered
        }

        return result
    }

    validate(items: any[]) {
        const { length } = items

        return length >= this.min && length <= (this.max ?? this.items.length)
    }

    filter() {
        const matches = []
        const { max, min } = this

        for(const item of this.items) {

            if(this.builder.with({ target: item }).build(this.schema) === true) {
                matches.push(item)
            }
            
            const { length } = matches 

            if(length >= (max ?? min ?? this.items.length)) {
                break
            }
        }

        return matches
    }

    private withSchema(schema: Schema | undefined, isValidation = false) {
        if(schema) {
            this.isValidation = isValidation
            this.schema = schema
        }

        return this
    }

    withFilter(schema: Schema | undefined) {
        return this.withSchema(schema)
    }

    withValidation(schema: Schema | undefined) {
        return this.withSchema(schema, true)
    }

    withMin(value: number | undefined) {
        if(value !== undefined) {
            this.min = value
        }

        return this
    }

    withMax(value: number | undefined) {
        if(value !== undefined) {
            this.max = value
        }

        return this
    }

    withFind(schema: Schema | undefined) {
        if(schema) {
            this.withFilter(schema)
                .withMax(1)
        }
        
        return this
    }

    withContains(schema: Schema | undefined) {
        if(schema) {
            this.withValidation(schema)
                .withMin(1)
        }
        
        return this
    }
}