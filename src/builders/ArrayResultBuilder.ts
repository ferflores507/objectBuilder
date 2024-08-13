import { ArraySchema, Schema, SelectSchema } from "../models"
import { ArrayFilterBuilder } from "./ArrayFilterBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ArrayResultBuilder {
    constructor(items: any[], builder: ObjectBuilder) {
        this.target = items
        this.builder = builder
    }

    private target: any
    private readonly builder: ObjectBuilder

    build = () => this.target

    withSchema(schema: ArraySchema | undefined) {
        if(schema) {
            this.target = this.withFilterOptions(schema)
                .withSelect(schema)
                .withMapOptions(schema)
                .withFind(schema.find)
                .build()
        }

        return this
    }

    private withFilterOptions(schema: ArraySchema) {
        if(Array.isArray(this.target)) {
            const { filter, find, items, contains } = schema
        
            this.target = new ArrayFilterBuilder(this.target, this.builder)
                .withValidation(items)
                .withContains(contains)
                .withFilter(filter)
                .withFind(find)
                // .withMin(minMatches)
                // .withMax(maxMatches)
                .build()
        }

        return this
    }

    private withSelect(schema: ArraySchema) {
        const { select } = schema
        
        if(select && Array.isArray(this.target)) {
            
            const selectSchema = new PropiedadesBuilder(select, this.builder)
                .build() as SelectSchema

            this.target = new ArrayMapBuilder(this.target, this.builder)
                .withSelect(selectSchema)
                .build()
        }

        return this
    }

    private withMapOptions(schema: ArraySchema) {
        if(Array.isArray(this.target)) {
            const { map, groupJoin } = schema

            this.target = new ArrayMapBuilder(this.target, this.builder)
                .withMap(map)
                .withGroupJoin(groupJoin)
                .build()
        }

        return this
    }

    private withFind(schema: Schema | undefined) {

        if(schema) {
            this.target = this.target[0]
        }

        return this
    }
}