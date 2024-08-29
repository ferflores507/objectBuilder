import { describe, expect, test } from 'vitest'
import { ObjectBuilder, Schema } from "../.."
import { buildResultsAsync, Case, expectToEqualAsync } from './buildResultsASync'
import { PropiedadesBuilder } from '../../src/builders/PropiedadesBuilder'
import { getPathValue } from '../../src/helpers/varios'

test("schema as value", async () => {
  const source = {}
  const schema: Schema = {
    schema: {
      propiedades: {
        value: {
          path: "id"
        },
        nombre: {
          const: "Melany"
        }
      }
    }
  }
  
  await expectToEqualAsync({
    source,
    schema,
    expected: schema.schema
  })
})

test("add", async () => {
  const source = {}
  const schema: Schema = {
    const: [
      1, 2, 3
    ],
    add: {
      const: 4
    }
  }

  await expectToEqualAsync({
    source,
    schema,
    expected: [1, 2, 3, 4]
  })
})

test("UUID", async () => {
  const source = {}
  const schema: Schema = {
    UUID: true
  }
  const builder = new ObjectBuilder(source)
  
  expect(() => builder.build(schema)).not.toThrow()
})

test("increment", async () => {
  const source = { total: 7 }
  const schema: Schema = {
    increment: "total",
    reduce: {
      path: "total"
    }
  }
  const builder = new ObjectBuilder(source)
  const expected = source.total + 1
  const resultados = [builder.build(schema), await builder.buildAsync(schema)]
  
  expect(resultados).toEqual([expected, expected + 1])
})

describe("trim", () => {
  const cases = [
    "  hello   ", 
    "  this is a test", 
    "", 
    "   "
  ].map(val => [val, val.trim()])

  test.each(cases)("(%s).trim equals: (%s)", async (value, expected) => {
    const source = { value }
    const schema: Schema = {
      path: "value",
      trim: true
    }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })
})

describe("isNullOrWhiteSpace (value)?", () => {

  const falseValues: [any, false][] = ["hello", 1, false, true].map(val => [val, false])
  const trueValues: [any, true][] = ["", "   ", null, undefined].map(val => [val, true])

  const cases = [
    ...falseValues,
    ...trueValues
  ]

  test.each(cases)("(%s): %s", async (value, expected) => {
    const source = { value }
    const schema: Schema = {
      path: "value",
      isNullOrWhiteSpace: true
    }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })
})

describe("not", () => {

  test("every item is opposite boolean", async () => {
    const source = [
      true,
      false,
      false,
      true
    ]

    const schema = {
      map: {
        not: {}
      }
    }

    await expectToEqualAsync({
      source,
      schema,
      expected: source.map(x => !x)
    })
  })

  test("propiedades", async () => {
    const source = {}
    const schema = {
      propiedades: {
        activated: {
          not: {
            source: "activated"
          }
        }
      }
    }

    const builder = new ObjectBuilder(source)
      .withSource({ activated: false })

    const results = [builder.build(schema), await builder.buildAsync(schema)]
    const expected = {
      activated: true
    }

    expect(results).toEqual([expected, expected])
  })

  describe("simple not", () => {
    const source = { activated: false }
    const builder = new ObjectBuilder(source)
    const schemas: Schema[] = [
      {
        const: false
      },
      {
        path: "activated"
      }
    ]

    test.each(schemas)("schema: $schema", async (schema: Schema) => {
      const results = [
        !builder.build(schema),
        builder.build({ not: schema }),
        !(await builder.buildAsync(schema)),
        await builder.buildAsync({ not: schema })
      ]

      expect(new Set(results).size).toBe(1)
    })
  })
})

describe("add schema", () => {

  test("multiple with max", async () => {
    const source = {}
    const schema: Schema = {
      const: [
        1,
        2
      ],
      select: {
        multiple: {
          const: true
        },
        max: {
          const: 2
        },
        value: {
          const: 3
        }
      }
    }
  
    const expected = [1, 2]

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })

  test("multiple with value only", async () => {
    const source = {}
    const schema: Schema = {
      const: [
        1,
        2
      ],
      select: {
        multiple: {
          const: true
        },
        value: {
          const: 3
        }
      }
    }
  
    const expected = [1, 2, 3]

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  
  })

  test("with value only, already containing an item and then reduce", () => {
    const source = {}
    const schema: Schema = {
      const: [4],
      select: {
        value: {
          const: 3
        }
      },
      reduce: {
        set: "items"
      }
    }
  
    new ObjectBuilder(source).build(schema)
    const expected = [3]
  
    expect(source.items).toEqual(expected)
  
  })

  test("with value only", async () => {
    const source = {}
    const schema: Schema = {
      const: [],
      select: {
        value: {
          const: 3
        }
      }
    }
  
    const expected = [3]

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })

})

describe("if schema", () => {
  const [ok, invalid] = ["ok", "invalid"]
  const cases = [1, 2, 3].map(num => {
    return [num, num % 2 == 0 ? ok : invalid] as [number, string]
  })

  test.each(cases)("if as string (path)", async (id: number, expected: string) => {
    const source = {
      isValid: id % 2 == 0
    }

    const schema = {
      if: "isValid",
      then: {
        const: ok
      },
      else: {
        const: invalid
      }
    }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })

  const modCases = [1, 2, 3].map(num => {
    const mod = num % 2

    return [mod, mod == 0 ? ok : invalid] as [number, string]
  })

  test.each(modCases)("if as schema", async (mod: number, expected: string) => {
    const source = { mod }

    const schema = {
      if: {
        path: "mod",
        equals: {
          const: 0
        }
      },
      then: {
        const: ok
      },
      else: {
        const: invalid
      }
    }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })
})

test("getPathValue throws on null source", () => {
  const source = null

  expect(() => getPathValue(source, "test")).toThrow()
})

test("select", () => {

  const source = {
    selected: [
      2
    ]
  }

  const schema = {
    targetPath: "id",
    selectSet: "selected"
  }

  // select new

  const builder = new ObjectBuilder(source).with({ target: { id: 3 }})
  
  builder.build(schema)
  
  const selected = builder.getSourcePathValue("selected")

  expect(selected).toEqual([3])
})

test("includes", async () => {
  const schema = {
    const: [
      1,
      2,
      3
    ],
    includes: {
      targetPath: "id"
    }
  }

  const builder = new ObjectBuilder({}).with({ target: { id: 2 }})
  const resultados = [builder.build(schema), await builder.buildAsync(schema)]

  expect(resultados).toEqual([true, true])
})

test("stopPropiedades", () => {
  const source = { evaluatedTitle: "evaluated" }
  const schema = {
    propiedades: {
      uno: {
        const: 1
      },
      dos: {
        path: "not evaluated",
      },
      tres: {
        propiedades: {
          title: {
            path: "evaluatedTitle"
          },
          dos: {
            const: "not evaluated"
          },
        }
      },
    }
  }

  const expected = {
    uno: 1,
    dos: {
      path: "not evaluated"
    },
    tres: {
      title: "evaluated",
      dos: {
        const: "not evaluated"
      }
    }
  }

  const builder = new ObjectBuilder(source)
  const result = builder.build(schema)
  const resultWithStopDos = builder.with({ stopPropiedades: ["dos"] }).build(schema)

  expect(result).not.toEqual(expected)
  expect(resultWithStopDos).toEqual(expected)
})

describe("propiedades builder", () => {

  type CaseOptions = {
    target?: any,
    source?: any,
    propiedades: Record<string, Schema>
    expected: Record<string, any>
  }

  const expectResultsAsync = async (options: CaseOptions) => {
    const { source, target, propiedades, expected } = options
    const builder = new ObjectBuilder(source, { target })
    const propiedadesBuilder = new PropiedadesBuilder(propiedades, builder)
    const results = [propiedadesBuilder.build(), await propiedadesBuilder.buildAsync()]

    expect(results).toEqual([expected, expected])
  }

  test("target path", async () => {
    await expectResultsAsync({
      target: { detalles: { titulo: "Hola" } },
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          sibling: "uno"
        },
        tres: {
          const: 3
        },
        saludo: {
          targetPath: "detalles.titulo",
        },
        saludoNested: {
          targetPath: "detalles",
          propiedades: {
            titulo: {
              targetPath: "titulo"
            }
          }
        }
      },
      expected: {
        uno: 1,
        dos: 1,
        tres: 3,
        saludo: "Hola",
        saludoNested: { titulo: "Hola" }
      }
    })
  })

  test("sibling", async () => {
    await expectResultsAsync({
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          sibling: "uno"
        },
        tres: {
          const: 3
        }
      },
      expected: {
        uno: 1,
        dos: 1,
        tres: 3
      }
    })
  })

  test("basico", async () => {
    await expectResultsAsync({
      propiedades: {
        uno: {
          const: 1
        },
        dos: {
          const: 2
        },
        tres: {
          const: 3
        }
      },
      expected: {
        uno: 1,
        dos: 2,
        tres: 3
      }
    })
  })
})

describe("use", () => {

  const cases = [
    {
      use: "first",
      expected: "a"
    },
    {
      use: "last",
      expected: "c"
    }
  ]

  test.each(cases)("use %s", async ({ use, expected }) => {
    const source = {
      items: ["a", "b", "c"]
    }

    const schema = {
      path: "items",
      use
    }

    const builder = new ObjectBuilder(source).withFunctions({
      first: (array: any[]) => array[0],
      last: (array: any[]) => array[array.length - 1]
    })
    const results = await buildResultsAsync(builder, schema)

    expect(results).toEqual([expected, expected])
  })

})

test("sibling nested", async () => {
  const source = {}
  const idCopy = {
    sibling: "id"
  }
  let id = 1
  const schema = {
    propiedades: {
      id: {
        const: id++
      },
      idCopy,
      children: {
        propiedades: {
          id: {
            const: id++
          },
          idCopy,
          children: {
            propiedades: {
              id: {
                const: id++
              },
              idCopy
            }
          }
        }
      }
    }
  }

  const expected = {
    id: 1,
    idCopy: 1,
    children: {
      id: 2,
      idCopy: 2,
      children: {
        id: 3,
        idCopy: 3
      }
    }
  }

  await expectToEqualAsync({
    source,
    schema,
    expected
  })
})

describe("sibling", () => {

  test("set value from a sibling property", async () => {
    const source = {}

    const schema: Schema = {
      propiedades: {
        title: {
          const: "One"
        },
        value: {
          const: 1
        },
        titleCopy: {
          sibling: "title"
        }
      }
    }

    const expected = {
      title: "One",
      value: 1,
      titleCopy: "One"
    }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })

})

describe("spread", () => {

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
        reduceMany: [
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

    const builder = new ObjectBuilder(source, { target: initialTarget })
    const results = await buildResultsAsync(builder, schema)

    expect(results).toEqual([expected, expected])
  })
})

describe("entries", () => {
  test("default key, value", async () => {
    const source = {
      nombre: "Melany",
      cedula: "9-123-456",
      fechaDeNacimiento: "18/09/2019"
    }

    const schema: Schema = {
      entries: true
    }

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
    
    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })
})

describe("calc", () => {

  test.each([
    ["sumar", 115],
    ["restar", 85],
    ["multiplicar", 5000],
    ["dividir", 2]
  ])("%s 100, 10, 5 da: %s", async (calc, expected) => {

    const schema: Schema = {
      const: [100, 10, 5],
      calc
    }

    await expectToEqualAsync({
      source: {},
      schema,
      expected
    })
  })
})

test("nested propiedades", async () => {

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

  const expected = {
    mensajeRoot: "prueba",
    nested: {
      mensaje: "prueba",
      objectsIdsAreEqual: true
    }
  }

  await expectToEqualAsync({
    source,
    schema,
    expected
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
      
      await expectToEqualAsync({
        source,
        schema,
        expected
      })
    })

  })

})

describe("array", () => {

  describe("mixed", () => {
    const cases = [
      {
        name: "groupJoin",
        source: {},
        schema: {
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
                targetPath: "nombre",
                equals: {
                  source: "item.nombre"
                }
              }
            }
          }
        },
        expected: [
          {
            item: {
              nameId: 1,
              nombre: "nombre",
            },
            group: {
              nombre: "nombre",
              valor: "Melany"
            }
          },
          {
            item: {
              nameId: 2,
              nombre: "cedula"
            },
            group: undefined
          }
        ]
      },
      {
        name: "map join dos",
        source: {},
        schema: { // 36 lineas
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
                  targetPath: "nombre",
                  equals: {
                    path: "nombre"
                  }
                }
              }
            }
          }
        },
        expected: [
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
      }
    ]

    test.each(cases)("$name", async (caseArg: Case) => {
      await expectToEqualAsync(caseArg)
    })

  })

  describe("mixed 2", () => {

    const cases = [
      {
        name: "find",
        source: [
          1, 
          "dos", 
          { nombre: "Mari" }, 
          { nombre: "Melany" }
        ],
        schema: {
          find: {
            targetPath: "nombre",
            equals: {
              const: "Melany"
            }
          }
        },
        expected: { nombre: "Melany" }
      },
      {
        name: "some are true: from inner definition",
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
                  targetPath: "detalles.activo"
                },
                {
                  const: false
                }
              ],
              contains: {
                equals: {
                  const: true
                }
              }
            }
          }
        },
        expected: {
          inner: true
        }
      },
      {
        name: "filtrar por nombre de item es igual nombre en source",
        source: { nombre: "Fernando" },
        schema: {
          const: Array(3).fill({ nombre: "Melany" }).toSpliced(1, 0, { nombre: "Fernando" }),
          filter: {
            targetPath: "nombre",
            equals: {
              path: "nombre"
            }
          }
        },
        expected: [{ nombre: "Fernando" }]
      }
    ]

    test.each(cases)("$name", async (caseArg: Case) => {
      await expectToEqualAsync(caseArg)
    })

  })

  test("map join", async () => {

    const ids = [2, 3, 4].map(id => ({ id }))

    const schema = {
      const: [{ id: 1 }, ...ids],
      map: {
        checkout: {
          spread: {
            const: [
              {
                id: 1,
                nombre: "Melany"
              }
            ],
            find: {
              targetPath: "id",
              equals: {
                path: "id"
              }
            }
          }
        }
      }
    }

    const expected = [{ id: 1, nombre: "Melany" }, ...ids]

    await expectToEqualAsync({
      source: {},
      schema,
      expected
    })
  })

  test("map", async () => {

    const numbers = [1, 2, 3, 4]

    const schema = {
      const: numbers,
      map: {
        propiedades: {
          id: {}
        }
      }
    }

    const expected = numbers.map(id => ({ id }))

    await expectToEqualAsync({
      source: {},
      schema,
      expected
    })
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
          targetPath: "nombre",
          equals: {
            const: "Melany"
          }
        }
      }

      const expected = true

      await expectToEqualAsync({
        source,
        schema,
        expected
      })
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
          equals: {
            const: "Melany"
          }
        }
      }

      const expected = true

      await expectToEqualAsync({
        source,
        schema,
        expected
      })
    })

  })

  test("reduce: filtrar array y luego asignar length a propiedad total por medio de target", async () => {
    const melany = { nombre: "Melany" }

    const source = [melany, { nombre: "Fernando" }, melany, melany]

    const schema: Schema = {
      const: source,
      filter: {
        targetPath: "nombre",
        equals: {
          const: "Melany"
        }
      },
      reduce: {
        propiedades: {
          total: {
            targetPath: "length"
          }
        }
      }
    }

    const expected = { total: source.length - 1 }

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
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

describe("mixed", () => {

  test.todo("reduce, orderBy and filter", async () => {
    const source = { nombre: "Melany" }

    const schema: Schema = {
      const: [3, 10, 2, 4, 1].map(id => ({ id, nombre: [4, 10].includes(id) ? "Melany" : "Fernando" })),
      reduceMany: [
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

    const expected = [4, 10].map(id => ({ id, nombre: "Melany" }))

    await expectToEqualAsync({
      source,
      schema,
      expected
    })
  })

  describe("checkout", () => {

    test("path", async () => {

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
      
      const expected = { nombre: "Melany" }

      await expectToEqualAsync({
        source,
        schema,
        expected
      })
    })

  })

  describe.todo("flat", () => {

    test("flat", async () => {

      const schema: Schema = {
        flat: true,
        propiedades: {
          propsA: {
            const: { nombre: "Melany" },
          }
        }
      }

      const expected = { nombre: "Melany" }

      await expectToEqualAsync({
        source: {},
        schema,
        expected
      })
    })

    test("flat (path)", async () => {

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

      const expected = { nombre: "Melany", provincia: "Santiago" }

      await expectToEqualAsync({
        source,
        schema,
        expected
      })
    })

  })

  describe("unpack", () => {
    const cases = [
      {
        name: "propiedades",
        source: {},
        schema: {
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
          reduce: {
            unpack: ["nombre", "id"],
          }
        },
        expected: { nombre: "Melany", id: 7 }
      },
      {
        name: "const",
        source: {},
        schema: {
          const: {
            nombre: "Fernando",
            apellido: "Flores",
            id: 7
          },
          unpack: ["nombre", "id"],
        },
        expected: { nombre: "Fernando", id: 7 }
      },
      {
        name: "path",
        source: {
          usuario: { nombre: "Melany", id: 1, cedula: "9-123" }
        },
        schema: {
          unpack: ["nombre", "id"],
          path: "usuario"
        },
        expected: { nombre: "Melany", id: 1 }
      }
    ]

    test.each(cases)("$name", async ({ name, ...caseArg }) => {
      await expectToEqualAsync(caseArg)
    })
  })

})