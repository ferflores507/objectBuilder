import { beforeAll, describe, expect, test } from "vitest"
import { ObjectBuilder } from "../src/builders/ObjectBuilder"
import { Consulta } from "../src/models"
import useConsulta from "../src/helpers/useConsulta"
import { setupServer } from "../src/helpers/schemaServer"
import { RequestWithUrl } from "../src/helpers/varios"

beforeAll(() => {
  const server = setupServer()
  server.listen()
})

describe("reduce fetch check requests length after each request", async () => {
  const store: Record<string, any> = {}
  const cases = [
    {
      id: 1,
      description: "wrong url",
      url: "http://localhost:8000/numeros2",
      length: 1
    },
    {
      id: 2,
      description: "saludo url",
      url: "http://localhost:8000/saludo",
      length: 1
    },
    {
      id: 1,
      description: "wrong url",
      url: "http://localhost:8000/numeros2",
      length: 1 
    },
    {
      id: 1,
      description: "correct url",
      url: "http://localhost:8000/numeros",
      length: 0
    }
  ]

  test.each(cases)("expect length to equal: $length with id: $id and $description", async ({ id, url, length }) => {
    const promise = new ObjectBuilder()
      .with({ 
        store,
        schema: {
          request: {
            propiedades: { url }
          },
          reduceFetch: id
        }
      })
      .build()

    await Promise.allSettled([promise])

    expect(store.requests).lengthOf(length)
  })
})

test("reduce fetch", async () => {
  const result = await new ObjectBuilder()
    .withSchema({
      request: {
        propiedades: {
          url: "http://localhost:8000/numeros"
        }
      },
      reduceFetch: 1
    })
    .build()

  const expected = [...Array(10).keys()]

  expect(result).toEqual(expected)
})

test("schema request", async () => {
  const request = new ObjectBuilder()
    .withSchema({
      request: {
        propiedades: {
          url: "http://localhost:8000/numeros"
        }
      }
    })
    .build()
  
  const response = await fetch(new RequestWithUrl(request))
  const data = await response.json()
  const expected = [...Array(10).keys()]

  expect(data).toEqual(expected)
})

describe("schema con consulta", () => {

  test("consulta", { repeats: 1 }, async () => {

    const schema = {
      consulta: {
        url: "http://localhost:8000/numeros"
      }
    }

    const builder = new ObjectBuilder()
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
