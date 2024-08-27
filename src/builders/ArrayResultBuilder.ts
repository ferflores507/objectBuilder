import { ArraySchema, SelectSchema } from "../models"
import { ArrayBuilderBase } from "./ArrayBuilderBase"
import { ArrayFilterBuilder } from "./ArrayFilterBuilder"
import { ArrayMapBuilder } from "./ArrayMapBuilder"
import { PropiedadesBuilder } from "./PropiedadesBuilder"

export class ArrayFilterResultBuilder extends ArrayBuilderBase {

    validar(schema: ArraySchema | undefined) {
        const { filter, find, items, contains } = schema ?? {}

        const isEmpty = [filter, find, items, contains].every(x => x == null)
        const isArray = Array.isArray(this.items)

        return isArray || isEmpty
    }

    build(schema: ArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo o contener algun filtro"
        }

        const { find } = schema ?? {}
        const result = Array.isArray(this.items) ? this.filter(schema) : this.items

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