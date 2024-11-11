import { expect } from "vitest"
import { Schema } from "../.."
import { BuilderOptions, SchemaTaskResultBuilder } from "../../src/builders/SchemaTaskResultBuilder"

export const buildResultsAsync = async (caseArg: CaseBase) => {
    const { source, schema, options } = caseArg
    const builder = new SchemaTaskResultBuilder()
        .with({
            store: source,
            ...options
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