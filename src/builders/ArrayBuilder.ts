import type { ArraySchema, Schema } from "../models";
import { ArrayBuilderBase } from "./ArrayBuilderBase";
import { ArrayFilterResultBuilder, ArrayResultBuilder } from "./ArrayResultBuilder";

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

        const { add } = schema ?? {}

        this.withAdd(add)
            .withFilterResult(schema)
            .withArrayResult(schema)

        return this.items
    }

    withAdd(schema: Schema | undefined) {
        if(schema) {
            const item = this.builder.with({ schema }).build()
            this.items = [...this.items, item]
        }

        return this
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