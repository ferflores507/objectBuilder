import { expect } from "vitest"
import { Schema } from "../.."
import { SchemaTaskResultBuilder } from "../../src/builders/SchemaTaskResultBuilder"
import { BuilderOptions } from "../../src/builders/ObjectBuilder"

export const buildResultsAsync = async (caseArg: CaseBase) => {
    const { source, schema, options } = caseArg
    const builder = new SchemaTaskResultBuilder(options?.target)
        .with({
            store: source,
            functions: options?.functions,
            sources: options?.sources
        })

    return [builder.with({ schema }).build(), await builder.with({ schema }).buildAsync()]
}

export type CaseBase = {
    source?: Record<string, any>
    schema: Schema
    options?: BuilderOptions
}

export type Case = { expected: any } & CaseBase

export const expectToEqualAsync = async (caseArg: Case) => {
    const { expected } = caseArg
    const results = await buildResultsAsync(caseArg)

    expect(results).toEqual([expected, expected])
}