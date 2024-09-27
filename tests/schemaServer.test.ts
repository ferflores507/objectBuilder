import { beforeAll, describe, expect, test } from "vitest"
import { SchemaTaskResultBuilder } from "../src/builders/SchemaTaskResultBuilder"
import { Consulta } from "../src/models"
import useConsulta from "../src/helpers/useConsulta"
import { setupServer } from "../src/helpers/schemaServer"

beforeAll(() => {
  const server = setupServer()
  server.listen()
})

describe("schema con consulta", () => {

  test("consulta", { repeats: 1 }, async () => {

    const schema = {
      consulta: {
        url: "http://localhost:8000/numeros"
      }
    }

    const builder = new SchemaTaskResultBuilder()
      .with({ schema })

    const data = await builder.buildAsync()
    const expected = [...Array(10).keys()]

    expect(data).toEqual(expected)
  })
})

describe(("schema server"), () => {

  test("useConsulta", { repeats: 1 }, async () => {

    const consulta: Consulta = {
      url: "http://localhost:8000/numeros"
    }

    const { cargar } = useConsulta()
    const { data } = await cargar(consulta, new AbortController().signal)
    const expected = [...Array(10).keys()]

    expect(data).toEqual(expected)
  })
})
