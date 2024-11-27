import { describe, expect, test } from "vitest"
import { Schema } from "../.."
import { buildResultsAsync, Case, expectToEqualAsync } from "./buildResultsASync"

test.fails("in operator in primitive fails", () => {
  const isIn = "id" in true
  
  expect(isIn).toBe(true)
})

test("destructure primitive does not throw", () => {
  const { prueba } = true
  
  expect(prueba).toBe(undefined)
})

test("flatMap components", () => {
  const obj = [
    {
      names: ["btn"],
      loader: "provider/components/btn"
    },
    {
      names: ["card", "cardTitle"],
      loader: "provider/components/card"
    }
  ]
  .flatMap(({ names, loader }) => names.map(name => ({ [name]: loader })))
  .reduce((obj, curr) => ({ ...obj, ...curr }))

  expect(obj).toEqual({
    btn: "provider/components/btn",
    card: "provider/components/card",
    cardTitle: "provider/components/card"
  })
})

test("flatMap with inner map", () => {
  const result = [
    {
      numbers: [1, 2],
      group: "digits"
    },
    {
      numbers: [20, 30],
      group: "ten"
    }
  ]
  .flatMap(obj => obj.numbers.map(number => ({ number, group: obj.group })))

  expect(result).toEqual([
    {
      number: 1,
      group: "digits"
    },
    {
      number: 2,
      group: "digits"
    },
    {
      number: 20,
      group: "ten"
    },
    {
      number: 30,
      group: "ten"
    }
  ])
})

test("map with inner map then flat", () => {
  const result = [
    {
      names: ["uno", "dos"]
    },
    {
      names: ["tres"]
    }
  ]
  .map(obj => obj.names.map(name => ({ name })))
  .flat()

  expect(result).toEqual([
    {
      name: "uno"
    },
    {
      name: "dos"
    },
    {
      name: "tres"
    }
  ])
})

test("map then flat", () => {
  const names = [
    {
      names: ["uno", "dos"]
    },
    {
      names: ["tres"]
    }
  ]
  .map(obj => obj.names)
  .flat()

  expect(names).toEqual(["uno", "dos", "tres"])
})

describe("string includes", () => {
  test.each([null, undefined])("textual %s", value => {
    const str = "hello, " + value + " is included"
    expect(str.includes(value)).toBe(true)
  })
})

test("abortcontroller onabort catch", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const waitForEvent = () => {
    return new Promise<any>((resolve, reject) => {
      
      signal.onabort = () => {
        reject()
      };

      controller.abort()
    })
  }

  try {
    await waitForEvent()
  }
  catch {
    // Request aborted
  }
})

test("abortcontroller abort", () => {
  const controller = new AbortController();
  const signal = controller.signal;

  signal.onabort = () => {
  };

  controller.abort()
})

test("abortcontroller onabort", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const waitForEvent = () => {
    return new Promise<any>((resolve, reject) => {
      
      // signal.onabort = () => {
      //   console.log("Request aborted");
      //   resolve()
      // };

      signal.addEventListener("abort", () => {
        resolve(true)
      });

      controller.abort()
    })
  }

  await waitForEvent()
})

const cases: ({ name: string } & Case)[] = [
  {
    name: "stringify",
    target: { id: 1 },
    schema: {
      stringify: true
    },
    expected: JSON.stringify({ id: 1 })
  },
  {
    name: "parse",
    target: JSON.stringify({ id: 1 }),
    schema: {
      parse: true
    },
    expected: { id: 1 }
  },
  {
    name: "schemaFrom",
    store: {
      info: {
        nombre: "Melany",
      },
      schemas: {
        usuario: {
          propiedades: {
            nombre: {
              path: "info.nombre"
            },
            id: {
              const: 4
            }
          }
        }
      }
    },
    schema: {
      schemaFrom: {
        path: "schemas.usuario"
      }
    },
    expected: {
      nombre: "Melany",
      id: 4
    }
  },
  {
    name: "definitions",
    store: {},
    schema: {
      const: {
        detalles: {
          nombre: "Melany",
          activo: true
        }
      },
      propiedades: {
        inner: {
          definitions: [
            {
              const: false
            },
            {
              path: "current.detalles.activo"
            },
            {
              const: false
            }
          ]
        }
      }
    },
    expected: {
      inner: [
        false,
        true,
        false
      ]
    }
  },
  {
    name: "definitions con propiedades",
    store: {
      detalles: {
        nombre: "Melany",
        activo: true
      }
    },
    schema: {
      path: "detalles",
      definitions: [
        {
          propiedades: {
            titulo: {
              path: "current.nombre"
            }
          }
        },
        {
          propiedades: {
            habilitado: {
              path: "current.activo"
            }
          }
        }
      ]
    },
    expected: [
      {
        titulo: "Melany"
      },
      {
        habilitado: true
      }
    ]
  },
  {
    name: "definitions con varios paths",
    store: {
      detalles: {
        nombre: "Melany",
        apellido: "Flores"
      }
    },
    schema: {
      definitions: [
        {
          path: "detalles.nombre"
        },
        {
          path: "detalles.apellido"
        }
      ]
    },
    expected: ["Melany", "Flores"]
  },
  {
    name: "spread",
    store: {},
    schema: {
      const: {
        nombre: "Melany"
      },
      spread: {
        const: {
          id: 1
        }
      }
    },
    expected: { 
      nombre: "Melany", 
      id: 1 
    }
  },
  {
    name: "propiedades",
    store: {},
    schema: {
      propiedades: {
        nombre: {
          const: "Melany",
        },
        id: {
          const: 1,
        }
      }
    },
    expected: { 
      nombre: "Melany", 
      id: 1 
    }
  },
  {
    name: "const",
    store: {},
    schema: {
      const: {
        nombre: "Fernando",
        id: 7
      }
    },
    expected: { 
      nombre: "Fernando", 
      id: 7 
    }
  },
  {
    name: "path",
    store: {
      usuario: { 
        nombre: "Melany", 
        id: 1 
      }
    },
    schema: {
      path: "usuario"
    },
    expected: { 
      nombre: "Melany", 
      id: 1 
    }
  }
]

describe("basico", () => {

  test.each(cases)("$name", async (caseArg) => {  
    await expectToEqualAsync(caseArg)
  })

})

describe("basico old", () => {
  
    test("set", async () => {
      const caseArg = {
        store: {
          nombre: "Melany",
          apellido: "Flores"
        },
        schema: {
          const: 1,
          set: "detalles.id"
        }
      }
      
      await buildResultsAsync(caseArg)
  
      const expected = {
        ...caseArg.store,
        detalles: {
          id: 1
        }
      }
  
      expect(caseArg.store).toEqual(expected)
    })
  
    describe("equals", () => {
  
      const cases: Schema[] = [
        {
          const: 123,
          equals: {
            const: 123
          }
        },
        {
          const: "Melany",
          equals: {
            const: "Melany"
          }
        },
        {
          propiedades: {
            lucky: {
              const: 7
            }
          },
          equals: {
            propiedades: {
              lucky: {
                const: 7
              }
            }
          }
        }
      ]
  
      test.each(cases)("case", async (schema) => {
        await expectToEqualAsync({
          store: {},
          schema,
          expected: true
        })
      })
    })
      
  })