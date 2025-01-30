import { SchemaTaskResultBuilder } from "./SchemaTaskResultBuilder";

export class ArrayBuilderBase {
    constructor(protected items: any[], readonly builder: SchemaTaskResultBuilder) {
    }
}