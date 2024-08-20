import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayBuilderBase {
    constructor(items: any[], builder: ObjectBuilder) {
        this.items = items
        this.builder = builder
    }

    items: any[]
    readonly builder: ObjectBuilder
}