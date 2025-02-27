import { expect } from "vitest"
import { SchemaTaskResultBuilder } from "../../src/builders/SchemaTaskResultBuilder"
import { BuilderOptions, SchemaDefinition } from "../../src/models"

type CaseOptions = Partial<BuilderOptions> & { schema: SchemaDefinition }

export const buildResultsAsync = async (options: CaseOptions) => {

    const builder = new SchemaTaskResultBuilder()

    return [builder.with(options).build(), await builder.with(options).buildAsync()]
}

export type Case = { expected: any } & CaseOptions

export const expectToEqualAsync = async (caseArg: Case) => {
    const { expected, ...options } = caseArg
    const results = await buildResultsAsync(options)

    expect(results).toEqual([expected, expected])
}