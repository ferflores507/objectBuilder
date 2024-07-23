import { describe, expect, test } from 'vitest'
import { ObjectBuilder, Schema } from "../"

describe.each([true, false])("spread", (useAsync) => {

  const cases: Array<{ tipo: string, schema: Schema, expected: any }> = [
    {
      tipo: "simple",
      schema: {
        spread: {
          path: "dos"
        }
      },
      expected: {
        subUno: 1,
        subDos: 2
      }
    },
    {
      tipo: "con reduce",
      schema: {
        reduce: [
          {
            spread: {
              path: "dos"
            }
          },
          {
            spread: {
              path: "tres"
            }
          },
        ]
      },
      expected: {
        subUno: 1,
        subDos: 2,
        subTres: 3
      }
    }
  ]

  test.each(cases)("spread $tipo", async ({ schema, expected }) => {

    const source = {
      dos: {
        subDos: 2
      },
      tres: {
        subTres: 3
      }
    }

    const initialTarget = {
      subUno: 1
    }

    const builder = new ObjectBuilder(source, initialTarget)
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toEqual(expected)
  })
})

describe("entries", () => {
  test("default key, value", () => {
    const source = {
      nombre: "Melany",
      cedula: "9-123-456",
      fechaDeNacimiento: "18/09/2019"
    }

    const schema: Schema = {
      entries: true
    }

    const builder = new ObjectBuilder(source)
    const resultado = builder.build(schema)

    const expected = [
      {
        key: "nombre",
        value: "Melany"
      },
      {
        key: "cedula",
        value: "9-123-456"
      },
      {
        key: "fechaDeNacimiento",
        value: "18/09/2019"
      }
    ]

    expect(resultado).toEqual(expected)
  })
})

describe.each([true, false])("calc", (useAsync) => {

  test.each([
    ["sumar", 115],
    ["restar", 85],
    ["multiplicar", 5000],
    ["dividir", 2]
  ])("%s 100, 10, 5 da: %s", async (calc, total) => {

    const schema: Schema = {
      const: [100, 10, 5],
      calc
    }

    const builder = new ObjectBuilder({})
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toBe(total)
  })
})

describe("nested propiedades", () => {

  test("nested with parent definition works with both relative = true and regular path", async () => {

    const source = {
      objOne: { 
        id: 1 
      },
      objTwo: {
        id: 1
      },
      publicacion: {
        mensaje: "prueba"
      }
    }
  
    const schema: Schema = {
      propiedades: {
        mensajeRoot: {
          path: "publicacion.mensaje",
        },
        nested: {
          propiedades: {
            mensaje: {
              path: "publicacion.mensaje"
            },
            objectsIdsAreEqual: {
              path: "objOne.id",
              equals: {
                path: "objTwo.id"
              }
            }
          }
        }
      }
    }
  
    const builder = new ObjectBuilder(source)
    const resultado = await builder.build(schema)

    const expected = { 
      mensajeRoot: "prueba", 
      nested: { 
        mensaje: "prueba", 
        objectsIdsAreEqual: true 
      } 
    }
    
    expect(resultado).toEqual(expected)
  })
})

describe.each([true, false])("test simple", (useAsync) => {

  test('validacion manual: nombre en source es igual a valor retornado por build', async () => {

    const source = { nombre: "Melany" }

    const schema: Schema = {
      path: "nombre"
    }

    const builder = new ObjectBuilder(source)
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toBe(source.nombre)
  })

})

describe("comparacion", () => {

  describe("equal: nombre en source (Melany)", () => {

    test.each([
      ["Melany", true],
      ["Fernando", false]
    ])('es igual a %s => %s', async (nombre: string, expected: boolean) => {

      const source = { nombre: "Melany" }

      const schema: Schema = {
        path: "nombre",
        equals: {
          const: nombre
        }
      }

      const builder = new ObjectBuilder(source)
      const resultado = await builder.build(schema)

      expect(resultado).toBe(expected)
    })

  })

})

describe("array", () => {

  test("groupJoin", () => {

    const schema: Schema = { // 33 lineas (pero hace falta el map con flat: true)
      const: [
        {
          nameId: 1,
          nombre: "nombre",
        },
        {
          nameId: 2,
          nombre: "cedula",
        }
      ],
      groupJoin: {
        items: {
          const: [
            {
              nombre: "nombre",
              valor: "Melany"
            },
            {
              nombre: "nombre",
              valor: "Melany"
            }
          ]
        },
        match: {
          find: {
            path: "inner.nombre",
            equals: {
              path: "outer.nombre"
            }
          }
        }
      }
    }

    const builder = new ObjectBuilder({})
    const resultado = builder.build(schema)

    const expected = [
      {
        inner: {
          nameId: 1,
          nombre: "nombre",
        },
        group: {
          nombre: "nombre",
          valor: "Melany"
        }
      },
      {
        inner: {
          nameId: 2,
          nombre: "cedula"
        },
        group: undefined
      }
    ]
    
    expect(resultado).toEqual(expected)
  })

  test("map join dos", () => {
    
    const schema = { // 36 lineas
      const: [
        {
          nameId: 1,
          nombre: "nombre",
        },
        {
          nameId: 2,
          nombre: "cedula",
        }
      ],
      map: {
        path: "inner",
        checkout: {
          spread: {
            const: [
              {
                nombre: "nombre",
                valor: "Melany"
              },
              {
                nombre: "nombre",
                valor: "Melany"
              }
            ],
            find: {
              path: "inner.nombre",
              equals: {
                path: "outer.nombre"
              }
            }
          }
        }
      }
    }

    const expected = [
      {
        nameId: 1,
        nombre: "nombre",
        valor: "Melany"
      },
      {
        nameId: 2,
        nombre: "cedula"
      }
    ]

    const builder = new ObjectBuilder({})
    const resultado = builder.build(schema)
    
    expect(resultado).toEqual(expected)
  })

  test("map join", () => {

    const ids = [2, 3, 4].map(id => ({ id }))
    
    const schema = {
      const: [{ id: 1}, ...ids],
      map: {
        propiedades: {
          id: {
            path: "inner.id"
          }
        },
        checkout: {
          spread: {
            const: [
              {
                id: 1,
                nombre: "Melany"
              }
            ],
            find: {
              path: "inner.id",
              equals: {
                path: "outer.id"
              }
            }
          }
        }
      }
    }

    const expected = [{ id: 1, nombre: "Melany" }, ...ids]
    const builder = new ObjectBuilder({})
    const resultado = builder.build(schema)
    
    expect(resultado).toEqual(expected)
  })

  test("map", () => {

    const numbers = [1, 2, 3, 4]
    
    const schema = {
      const: numbers,
      map: {
        propiedades: {
          id: {
            path: "inner"
          }
        }
      }
    }

    const expected = numbers.map(id => ({ id }))
    const builder = new ObjectBuilder({})
    const resultado = builder.build(schema)
    
    expect(resultado).toEqual(expected)
  })

  test("find", () => {
    const expected = { nombre: "Melany" }
    const source = [1, "dos", { nombre: "Mari"}, expected]

    const schema = {
      find: {
        path: "inner.nombre",
        equals: {
          const: expected.nombre
        }
      }
    }

    const builder = new ObjectBuilder(source)
    const resultado = builder.build(schema)
    
    expect(resultado).toEqual({ ...expected })
  })

  test("some are true: from inner definition", async () => {
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
            ],
            contains: {
              path: "inner",
              equals: {
                const: true
              }
            }
          }
        }
      }
    }

    const builder = new ObjectBuilder({})
    const resultado = await builder.build(schema)

    expect(resultado.inner).toBe(true)
  })

  describe("array item validation (source items are all equal to filterSchema)", () => {

    test.each([
      "all",
      "some"
    ])("%s equal -> true", async (method) => {

      const source = { nombre: "Melany" }

      const schema: Schema = {
        const: Array(2).fill(source),
        contains: {
          path: "inner.nombre",
          equals: {
            const: "Melany"
          }
        }
      }

      const definitionBuilder = new ObjectBuilder(source)
      const resultado = await definitionBuilder.build(schema)

      expect(resultado).toBe(true)
    })

  })

  describe("all equal (sin itemSchema)", () => {

    test.each([
      ["const", { const: ["Melany", "Melany", "Melany"] }],
      ["path", { path: "store.items" }]
    ])("con definition %s", async (tipo, schema: Schema) => {

      const source = { store: { items: [] } }

      schema = {
        ...schema,
        items: {
          path: "inner",
          equals: {
            const: "Melany"
          }
        }
      }

      const builder = new ObjectBuilder(source)
      const resultado = await builder.build(schema)

      expect(resultado).toBe(true)
    })

  })

  test("filtrar por nombre de item es igual a store.nombre", async () => {

    const source = { nombre: "Fernando" }

    const schema: Schema = {
      const: Array(3).fill({ nombre: "Melany" }).toSpliced(1, 0, source),
      filter: {
        path: "inner.nombre",
        equals: {
          path: "outer.nombre"
        }
      }
    }

    const definitionBuilder = new ObjectBuilder(source)
    const resultado = await definitionBuilder.build(schema)
    const expected = [source]

    expect(resultado).toEqual(expected)
  })

  test("reduce: filtrar array y luego asignar length a propiedad total por medio de target", async () => {
    const melany = { nombre: "Melany" }

    const source = [melany, { nombre: "Fernando" }, melany, melany]

    const schema: Schema = {
      const: source,
      filter: {
        path: "inner.nombre",
        equals: {
          const: "Melany"
        }
      },
      checkout: {
        propiedades: {
          total: {
            path: "length"
          }
        }
      }
    }

    const builder = new ObjectBuilder(source)
    const { total } = await builder.build(schema)

    expect(total).toBe(source.length - 1)
  })

  describe.todo("orderBy", () => {
    const source = [
      [[2, 3, 8, 10].map(id => ({ id })), true],
      [[3, 2, 10, 8].map(id => ({ id })), false]
    ]

    test.each(source)("%o is ordered by id => %s", async (items, value) => {

      const schema: Schema = {
        const: [10, 2, 8, 3].map(id => ({ id })),
        // array: {
        //   orderBy: true
        // }
      }

      const builder = new ObjectBuilder({})
      const resultado = builder.build(schema)

      value ? expect(items).toEqual(resultado) : expect(items).not.toEqual(resultado)
    })
  })
})

describe("reduce", () => {

  test.todo("orderBy y después filter", async () => {
    const source = { nombre: "Melany" }

    const schema: Schema = {
      const: [3, 10, 2, 4, 1].map(id => ({ id, nombre: [4, 10].includes(id) ? "Melany" : "Fernando" })),
      reduce: [
        {
          // array: {
          //   orderBy: "id"
          // }
        },
        {
          // array: {
          //   filter: {
          //     path: "inner.nombre",
          //     comparacion: {
          //       method: "equal",
          //       schema: {
          //         path: "outer.source.nombre"
          //       }
          //     }
          //   }
          // }
        }
      ]
    }

    const builder = new ObjectBuilder(source)
    const resultado = await builder.build(schema)
    const expected = [4, 10].map(id => ({ id, nombre: "Melany" }))

    expect(resultado).toEqual(expected)
  })

})

describe("relative path", () => {

  test("propiedad nombre asignada con path nombre y relative = true es igual a detalles.personal.nombre (Melany)", async () => {

    const source = { detalles: { personal: { nombre: "Melany" } } }
    const schema: Schema = {
      path: "detalles.personal",
      checkout: {
        propiedades: {
          nombre: {
            path: "nombre"
          }
        }
      }
    }

    const builder = new ObjectBuilder(source)
    const resultado = await builder.build(schema)

    expect(resultado).toEqual({ nombre: "Melany" })
  })

})

test.todo("flat", async () => {

  const schema: Schema = {
    flat: true,
    propiedades: {
      propsA: {
        const: { nombre: "Melany" },
      }
    }
  }

  const builder = new ObjectBuilder({})
  const resultado = await builder.build(schema)

  expect(resultado).toEqual({ nombre: "Melany" })
})

test.todo("flat (path)", async () => {

  const source = {
    usuario: {
      personal: { nombre: "Melany" },
      direccion: { provincia: "Santiago" }
    }
  }

  const schema: Schema = {
    flat: true,
    path: "usuario"
  }

  const builder = new ObjectBuilder(source)
  const resultado = await builder.build(schema)

  expect(resultado).toEqual({ nombre: "Melany", provincia: "Santiago" })
})

describe.each([true, false])("unpack", (useAsync) => {

  test("propiedades", async () => {

    const schema: Schema = {
      propiedades: {
        nombre: {
          const: "Melany",
        },
        cedula: {
          const: "9-123",
        },
        id: {
          const: 7
        }
      },
      reduce: [
        {
          unpack: ["nombre", "id"],
        }
      ]
    }

    const builder = new ObjectBuilder({})
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toEqual({ nombre: "Melany", id: 7 })
  })

  test("const", async () => {

    const schema: Schema = {
      unpack: ["nombre", "id"],
      const: {
        nombre: "Fernando",
        apellido: "Flores",
        id: 7
      }
    }

    const builder = new ObjectBuilder({})
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toEqual({ nombre: "Fernando", id: 7 })
  })

  test("path", async () => {

    const source = {
      usuario: { nombre: "Melany", id: 1, cedula: "9-123" }
    }

    const schema: Schema = {
      unpack: ["nombre", "id"],
      path: "usuario"
    }

    const builder = new ObjectBuilder(source)
    const resultado = useAsync ? await builder.buildAsync(schema) : builder.build(schema)

    expect(resultado).toEqual({ nombre: "Melany", id: 1 })
  })

})

describe.each([true, false])("basico", (useAsync) => {

  test("schemaFrom", async () => {
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

  test("definitions", async () => {
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

  test("definitions con propiedades", async () => {
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
    const resultado = useAsync ? builder.build(schema) : builder.build(schema)
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

  test("definitions con varios paths", async () => {
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

  test("spread", async () => {

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

  test("propiedades", async () => {

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

  test("const", async () => {

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