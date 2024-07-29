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

describe("basico new", () => {

  test.each(cases)("$name", async ({ name, source, schema, expected }) => {

    const builder = new ObjectBuilder(source)
    const resultado = builder.build(schema)
    const resultadoAsync = await builder.buildAsync(schema)
  
    expect(resultado).toEqual(expected)
    expect(resultadoAsync).toEqual(expected)
  })

})

describe.each([true, false])("basico", (useAsync) => {

    test.skip("stringify", async () => {
      const source = { id: 1 }
      const schema = {
        stringify: true
      }
  
      const builder = new ObjectBuilder(source)
      const result = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
      const expected = JSON.stringify(source)
  
      expect(result).toBe(expected)
    })
  
    test.skip("parse", async () => {
      const expected = { id: 1 }
      const source = JSON.stringify(expected)
      const schema = {
        parse: true
      }
  
      const builder = new ObjectBuilder(source)
      const result = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      expect(result).toEqual(expected)
    })
  
    test.skip("schemaFrom", async () => {
      const source = {
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
      }
  
      const schema = {
        schemaFrom: {
          path: "schemas.usuario"
        }
      }
  
      const builder = new ObjectBuilder(source)
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      const expected = {
        nombre: "Melany",
        id: 4
      }
  
      expect(resultado).toEqual(expected)
    })
  
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
      useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
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
  
      test.each(cases)("case", (schema) => {
        const builder = new ObjectBuilder({})
        const resultado = builder.build(schema)
  
        expect(resultado).toBe(true)
      })
    })
  
    test.skip("definitions", async () => {
      const schema: Schema = {
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
      }
  
      const builder = new ObjectBuilder({})
      const resultado = useAsync ? builder.build(schema) : builder.build(schema)
      const expected = {
        inner: [
          false,
          true,
          false
        ]
      }
  
      expect(resultado).toEqual(expected)
    })
  
    test.skip("definitions con propiedades", async () => {
      const source = {
        detalles: {
          nombre: "Melany",
          activo: true
        }
      }
  
      const schema: Schema = {
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
      }
  
      const builder = new ObjectBuilder(source)
      const resultado = useAsync ? builder.build(schema) : await builder.buildAsync(schema)
      const expected = [
        {
          titulo: "Melany"
        },
        {
          habilitado: true
        }
      ]
  
      expect(resultado).toEqual(expected)
    })
  
    test.skip("definitions con varios paths", async () => {
      const source = {
        detalles: {
          nombre: "Melany",
          apellido: "Flores"
        }
      }
  
      const schema: Schema = {
        definitions: [
          {
            path: "detalles.nombre"
          },
          {
            path: "detalles.apellido"
          }
        ]
      }
  
      const builder = new ObjectBuilder(source)
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
      const expected = ["Melany", "Flores"]
  
      expect(resultado).toEqual(expected)
    })
  
    test.skip("spread", async () => {
  
      const schema: Schema = {
        const: {
          nombre: "Melany"
        },
        spread: {
          const: {
            id: 1
          }
        }
      }
  
      const builder = new ObjectBuilder({})
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      expect(resultado).toEqual({ nombre: "Melany", id: 1 })
    })
  
    test.skip("propiedades", async () => {
  
      const schema: Schema = {
        propiedades: {
          nombre: {
            const: "Melany",
          },
          id: {
            const: 1,
          }
        }
      }
  
      const builder = new ObjectBuilder({})
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      expect(resultado).toEqual({ nombre: "Melany", id: 1 })
    })
  
    test.skip("const", async () => {
  
      const schema: Schema = {
        const: {
          nombre: "Fernando",
          id: 7
        }
      }
  
      const builder = new ObjectBuilder({})
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      expect(resultado).toEqual({ nombre: "Fernando", id: 7 })
    })
  
    test("path", async () => {
  
      const source = {
        usuario: { nombre: "Melany", id: 1 }
      }
  
      const schema: Schema = {
        path: "usuario"
      }
  
      const builder = new ObjectBuilder(source)
      const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)
  
      expect(resultado).toEqual({ nombre: "Melany", id: 1 })
    })
  
  })