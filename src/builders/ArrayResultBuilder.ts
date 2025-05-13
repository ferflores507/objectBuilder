import { ArraySchema, Schema, SelectSchema } from "../models"
import { ArrayBuilderBase } from "./ArrayBuilderBase"
import { ArrayFilterBuilder } from "./ArrayFilterBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ArrayFilterResultBuilder extends ArrayBuilderBase {

    validar(schema: ArraySchema | undefined) {
        const array: (keyof Schema)[] = ["filter", "items", "contains"]
        const isEmpty = array.every(x => schema?.[x] == null)

        return Array.isArray(this.items) || isEmpty
    }

    build(schema: ArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo o contener algun filtro"
        }

        return Array.isArray(this.items) ? this.filter(schema) : this.items
    }

    filter(schema: ArraySchema | undefined) {
        const { filter, items, contains } = schema ?? {}

        return new ArrayFilterBuilder(this.items, this.builder)
            .withValidation(items)
            .withContains(contains)
            .withFilter(filter)
            // .withMin(minMatches)
            // .withMax(maxMatches)
            .build()
    }

}

export class ArrayResultBuilder extends ArrayBuilderBase {

    build = () => this.items

    withSchema(schema: ArraySchema | undefined) {
        if(schema) {                
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
        const { groupJoin } = schema

        this.items = new ArrayMapBuilder(this.items, this.builder)
            .withGroupJoin(groupJoin)
            .build()

        return this
    }
}