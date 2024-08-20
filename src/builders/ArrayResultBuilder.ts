import { ArraySchema, Schema, SelectSchema } from "../models"
import { ArrayBuilderBase } from "./ArrayBuilderBase"
import { ArrayFilterBuilder } from "./ArrayFilterBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { ObjectBuilder } from "./ObjectBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ArrayFilterResultBuilder extends ArrayBuilderBase {

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

export class ArrayResultBuilder extends ArrayBuilderBase {

    build = () => this.items

    withSchema(schema: ArraySchema | undefined) {
        if(schema) {
            if(Array.isArray(this.items)) {
                this.items = new ArrayFilterResultBuilder(this.items, this.builder).build(schema)
            }
                
            this.items = this.withSelect(schema)
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

            this.items = new ArrayMapBuilder(this.items, this.builder)
                .withSelect(selectSchema)
                .build()
        }

        return this
    }

    private withMapOptions(schema: ArraySchema) {
        const { map, groupJoin } = schema

        this.items = new ArrayMapBuilder(this.items, this.builder)
            .withMap(map)
            .withGroupJoin(groupJoin)
            .build()

        return this
    }
}