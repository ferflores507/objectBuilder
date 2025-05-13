import type { ArraySchema, Schema } from "../models";
import { ArrayBuilderBase } from "./ArrayBuilderBase";
import { ArrayFilterResultBuilder, ArrayResultBuilder } from "./ArrayResultBuilder";

export class ArrayBuilder extends ArrayBuilderBase {

    validar(schema: ArraySchema | undefined) {
        const keys: (keyof Schema)[] = ["filter", "items", "contains", "groupJoin"]
        const isEmpty = keys.every(x => schema?.[x] == null)

        return Array.isArray(this.items) || isEmpty
    }

    build(schema: ArraySchema | undefined) {
        if(this.validar(schema) == false) {
            throw "El elemento debe ser de tipo arreglo."
        }

        this.withFilterResult(schema)
            .withArrayResult(schema)

        return this.items
    }

    withFilterResult(schema: ArraySchema | undefined) {                
        this.items = new ArrayFilterResultBuilder(this.items, this.builder).build(schema)

        return this
    }

    withArrayResult(schema: ArraySchema | undefined) {
        this.items = new ArrayResultBuilder(this.items, this.builder)
            .withSchema(schema)
            .build()

        return this
    }
}