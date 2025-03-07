import { ObjectBuilder } from "./ObjectBuilder";

export class ArrayBuilderBase {
    constructor(protected items: any[], readonly builder: ObjectBuilder) {
    }
}