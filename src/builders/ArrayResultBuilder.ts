import { ArraySchema, Schema, SelectSchema } from "../models"
import { ArrayFilterBuilder } from "./ArrayFilterBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ArrayFilterResultBuilder {

    constructor(items: any[], builder: ObjectBuilder) {
        this.items = items
        this.builder = builder
    }

    private items: any[]
    private readonly builder: ObjectBuilder

    build(schema: ArraySchema | undefined) {
        const { find } = schema ?? {}
        const result = this.filter(schema)

        return find ? (result as any[])[0] : result
    }

    filter(schema: ArraySchema | undefined) {
        const { filter, find, items, contains } = schema ?? {}

        return new ArrayFilterBuilder(this.items, this.builder)
            .withValidation(items)
            .withContains(contains)
            .withFilter(filter)
            .withFind(find)
            // .withMin(minMatches)
            // .withMax(maxMatches)
            .build()
    }

}

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
            if(Array.isArray(this.target)) {
                this.target = new ArrayFilterResultBuilder(this.target, this.builder).build(schema)
            }
                
            this.target = this.withSelect(schema)
                .withMapOptions(schema)
                .build()
        }

        return this
    }

    private withSelect(schema: ArraySchema) {
        const { select } = schema
        
        if(select) {
            const selectSchema = new PropiedadesBuilder(select, this.builder)
                .build() as SelectSchema

            this.target = new ArrayMapBuilder(this.target, this.builder)
                .withSelect(selectSchema)
                .build()
        }

        return this
    }

    private withMapOptions(schema: ArraySchema) {
        const { map, groupJoin } = schema

        this.target = new ArrayMapBuilder(this.target, this.builder)
            .withMap(map)
            .withGroupJoin(groupJoin)
            .build()

        return this
    }
}