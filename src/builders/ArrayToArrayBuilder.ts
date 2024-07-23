import type { ArrayToArraySchema, Join, Schema } from "../models";
import { ArrayFilterBuilder } from "./ArrayFilterBuilder";
import { LocalDefinitionBuilder } from "./LocalDefinitionBuilder";

export class ArrayToArrayBuilder {

    constructor(target: [], builder: LocalDefinitionBuilder) {
        this.target = target
        this.builder = builder
    }

    target: any[]
    builder: LocalDefinitionBuilder

    build = () => this.target

    validar(schema: ArrayToArraySchema | undefined) {
        const { filter, find, items, contains, map, groupJoin } = schema ?? {}

        const isEmpty = [filter, find, items, contains, map, groupJoin].every(x => x == null)
        const isArray = Array.isArray(this.target)

        return isArray || isEmpty
    }

    withSchema(schema: ArrayToArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo."
        }

        const { find, map, groupJoin } = schema ?? {}
        
        return this.withFilter(schema)
            .withFind(find)
            .withMap(map)
            .withGroupJoin(groupJoin)
    }

    withFilter(schema: ArrayToArraySchema | undefined) {
        const { filter, find, items, contains } = schema ?? {}

        this.target = new ArrayFilterBuilder(this.target, this.builder)
                .withFilter(filter)
                .withFind(find)
                .withValidation(items)
                .withContains(contains)
                // .withMin(minMatches)
                // .withMax(maxMatches)
                .build()

        return this
    }

    withFind(schema: Schema | undefined) {

        if(schema) { 
            this.target = this.target[0]
        }

        return this
    }

    withMap(schema: Schema | undefined) {
        if(schema) {
            this.target = this.target.map(x => {
                return this.builder.buildWithOuter(x, schema)
            })
        }

        return this
    }

    withGroupJoin(join: Join | undefined) {
        if(join) {
            const schema = {
                const: this.builder.build(join.items),
                ...join.match
            }

            this.target = this.target.map(inner => {
                const group = new LocalDefinitionBuilder(inner)
                    .build(schema)

                return { inner, group }
            })
        }

        return this
    }
}