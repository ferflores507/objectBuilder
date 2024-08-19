import { ObjectBuilder } from "./ObjectBuilder"

export class ArrayBuilderBase {
    constructor(items: any[], builder: ObjectBuilder) {
        this.items = items
        this.builder = builder
    }

    readonly items: any[]
    readonly builder: ObjectBuilder
}