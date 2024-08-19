import type { ArraySchema } from "../models";
import { ArrayBuilderBase } from "./ArrayBuilderBase";
import { ArrayResultBuilder } from "./ArrayResultBuilder";

export class ArrayBuilder extends ArrayBuilderBase {

    validar(schema: ArraySchema | undefined) {
        const { filter, find, items, contains, map, groupJoin } = schema ?? {}

        const isEmpty = [filter, find, items, contains, map, groupJoin].every(x => x == null)
        const isArray = Array.isArray(this.items)

        return isArray || isEmpty
    }

    build(schema: ArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo."
        }

        return new ArrayResultBuilder(this.items, this.builder)
            .withSchema(schema)
            .build()
    }
}