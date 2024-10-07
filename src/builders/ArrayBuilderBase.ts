import { Builder } from "./SchemaTaskResultBuilder";

export class ArrayBuilderBase {
    constructor(protected items: any[], readonly builder: Builder) {
    }
}