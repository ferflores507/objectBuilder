import { describe, expect, test } from "vitest"
import { Schema } from "../.."
import { buildResultsAsync, expectToEqualAsync } from "./buildResultsASync"

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
        console.log("onbort executed")
        reject()
      };

      controller.abort()
      console.log("abort called")
    })
  }

  try {
    await waitForEvent()
  }
  catch {
    console.log("Request aborted");
  }
})

test("abortcontroller abort", () => {
  const controller = new AbortController();
  const signal = controller.signal;

  signal.onabort = () => {
    console.log("Request aborted");
  };

  controller.abort()
  console.log("abort called")
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
        console.log("Request aborted");
        resolve(true)
      });

      controller.abort()
      console.log("abort called")
    })
  }

  await waitForEvent()
})

type Case = {
  name: string,
  source: any,
  schema: Schema,
  expected: any
}

const cases: Case[] = [
  {
    name: "stringify",
    options: {
      target: { id: 1 }
    },
    schema: {
      stringify: true
    },
    expected: JSON.stringify({ id: 1 })
  },
  {
    name: "parse",
    options: {
      target: JSON.stringify({ id: 1 })
    },
    schema: {
      parse: true
    },
    expected: { id: 1 }
  },
  {
    name: "schemaFrom",
    source: {
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
    source: {},
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
    source: {
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
    source: {
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
    source: {},
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
    source: {},
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
    source: {},
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
    source: {
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
        source: {
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
        ...caseArg.source,
        detalles: {
          id: 1
        }
      }
  
      expect(caseArg.source).toEqual(expected)
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
          source: {},
          schema,
          expected: true
        })
      })
    })
      
  })