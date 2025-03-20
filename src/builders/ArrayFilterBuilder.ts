import type { Schema } from "../models"
import { ArrayBuilderBase } from "./ArrayBuilderBase"
import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayFilterBuilder extends ArrayBuilderBase {

    constructor(items: any[], builder: ObjectBuilder) {
        super(items, builder)
        this.min = this.items.length
    }
    
    private isValidation = false
    private schema?: Schema
    private min: number
    private max?: number

    build() {

        const result = this.schema ? this.filter() : this.items

        return this.isValidation ? this.validate(result) : result
    }

    validate(items: any[]) {
        const { length } = items

        return length >= this.min && length <= (this.max ?? this.items.length)
    }

    filter() {
        const matches: any[] = []
        const { max, min } = this

        const matchFn = this.builder
            .with({})
            .withFunction({ function: this.schema })
            .build()

        for(const item of this.items) {

            const isMatch = matchFn(item)

            if(isMatch) {
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

    withContains(schema: Schema | undefined) {
        if(schema) {
            this.withValidation(schema)
                .withMin(1)
        }
        
        return this
    }
}