import { describe, expect, test } from "vitest"
import { ObjectBuilder, Schema } from "../.."

type Case = {
  name: string,
  source: any,
  schema: Schema,
  expected: any
}

const cases: Case[] = [
  {
    name: "stringify",
    source: { id: 1 },
    schema: {
      stringify: true
    },
    expected: JSON.stringify({ id: 1 })
  },
  {
    name: "parse",
    source: JSON.stringify({ id: 1 }),
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
  // {
  //   name: "set", // no es posible porque se tiene que hacer expect a source que se muto
  //   source: {
  //     nombre: "Melany",
  //     apellido: "Flores"
  //   },
  //   schema: {
  //     const: 1,
  //     set: "detalles.id"
  //   },
  //   expected: {
  //     nombre: "Melany",
  //     apellido: "Flores",
  //     detalles: {
  //       id: 1
  //     }
  //   }
  // },
  {
    name: "definitions", // no es posible porque se tiene que hacer expect a source que se muto
    source: {},
    schema: {
      const: {
        detalles: {
          nombre: "Melany",
          activo: true
        }
      },
      checkout: {
        propiedades: {
          inner: {
            definitions: [
              {
                const: false
              },
              {
                path: "detalles.activo"
              },
              {
                const: false
              }
            ]
          }
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
      checkout: {
        definitions: [
          {
            propiedades: {
              titulo: {
                path: "nombre"
              }
            }
          },
          {
            propiedades: {
              habilitado: {
                path: "activo"
              }
            }
          }
        ]
      }
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

const buildResultsAsync = async (builder: ObjectBuilder, schema: Schema) => {
  return [builder.build(schema), await builder.buildAsync(schema)]
}

describe("basico", () => {

  test.each(cases)("$name", async ({ name, source, schema, expected }) => {

    const builder = new ObjectBuilder(source)
    const results = await buildResultsAsync(builder, schema)
  
    expect(results).toEqual([expected, expected]) // until an everyIsEqual or toEqualAll is implemented
  })

})

describe("basico old", () => {
  
    test("set", async () => {
      const source = {
        nombre: "Melany",
        apellido: "Flores"
      }
  
      const schema = {
        const: 1,
        set: "detalles.id"
      }
      const builder = new ObjectBuilder(source)
      
      await buildResultsAsync(builder, schema)
  
      const expected = {
        ...source,
        detalles: {
          id: 1
        }
      }
  
      expect(source).toEqual(expected)
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
        const builder = new ObjectBuilder({})
        const results = await buildResultsAsync(builder, schema)

        expect(results.every(r => r === true)).toBe(true)
      })
    })
      
  })