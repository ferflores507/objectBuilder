import { describe, expect, test } from 'vitest'
import { ObjectBuilder, Schema } from "../.."
import { buildResultsAsync, Case, expectToEqualAsync } from './buildResultsASync'
import { PropiedadesBuilder } from '../../src/builders/PropiedadesBuilder'
import { getPathValue } from '../../src/helpers/varios'
import { SchemaTaskResultBuilder } from '../../src/builders/SchemaTaskResultBuilder'
import { ArrayBuilder } from '../../src/builders/ArrayBuilder'

test("map builder with undefined", async () => {
  const items = [1, undefined, 2, 3]
  const result = items.map(x => {
    return new SchemaTaskResultBuilder()
      .with({
        target: 100,
        initial: x,
        schema: {
          propiedades: {
            id: {
              path: "current"
            }
          }
        }
      })
      .build()
  })

  const expected = items.map(id => ({ id }))
  expect(result).toEqual(expected)
})

test("target defined and const with undefined", async () => {
  await expectToEqualAsync({
    schema: {
      const: undefined,
    },
    expected: undefined,
    options: {
      // initial: undefined, // stops failing
      target: 1
    }
  })
})

test("map targetPath", async () => {

  await expectToEqualAsync({
    schema: {
      const: [1, 2, 3, 4],
      map: {
        path: "target"
      }
    },
    expected: [1, 1, 1, 1],
    options: {
      target: 1
    }
  })

})

test("includes", async () => {
  const schema = {
    path: "local.selectedItems",
    includes: {
      path: "target.id"
    }
  }

  await expectToEqualAsync({
    source: {
      local: {
        selectedItems: [1]
      }
    },
    schema,
    expected: true,
    options: {
      target: { id: 1 }
    }
  })
})

test("path target", async () => {

  const items = [1, 2, 3]

  await expectToEqualAsync({
    schema: {
      const: items,
      map: {
        propiedades: {
          id: {
            path: "current"
          }
        }
      }
    },
    expected: items.map(id => ({ id }))
  })
})

test("not", () => {
  const result = new SchemaTaskResultBuilder()
    .with({
      target: { activated: true }
    })
    .withSchema({
      targetPath: "activated", 
      not: {
      }
    })
    .build()

  expect(result).toBe(false)
})

test("array builder with undefined schema", () => {
  const schema = {
    find: {
      path: "current.nombre",
      equals: {
        const: "Melany"
      }
    }
  }

  const target = [
    1, 
    "dos", 
    { nombre: "Mari" }, 
    { nombre: "Melany" }
  ]

  const builder = new SchemaTaskResultBuilder()
    .with({ 
      target: [
        1, 
        "dos", 
        { nombre: "Mari" }, 
        { nombre: "Melany" }
      ]
    })
    .withSchema(schema)
    // .build()

  const result = new ArrayBuilder(target, builder).build(schema)

  expect(result).toEqual({ nombre: "Melany" })
  
})

describe.skip("schema task result builder", () => {

  test("set", () => {
    const result = new SchemaTaskResultBuilder()
      .withSchema({
        const: "Melany",
        set: "nombre",
        reduce: {
          path: "nombre"
        }
      })
      .build()

    expect(result).toEqual("Melany")
  })

  test("not", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { active: false }
      })
      .withSchema({
        not: {
          path: "active"
        }
      })
      .build()

    expect(result).toBe(true)
  })

  test("increment and reduce", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { total: 7 }
      })
      .withSchema({
        increment: "total",
        reduce: {
          path: "total"
        } 
      })
      .build()

    expect(result).toEqual(8)
  })

  test("equals", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { nombre: "Melany"}
      })
      .withSchema({
        path: "nombre",
        equals: {
          const: "Melany"
        } 
      })
      .build()

    expect(result).toBe(true)
  })

  test("select set", () => {
    const store = { selected: [2] }

    const builder = new SchemaTaskResultBuilder()
      .with({ store })
      .withSchema({
        const: 3,
        selectSet: "selected"
      })

    builder.build()

    expect(store.selected).toEqual([3])

    builder.build()

    expect(store.selected).toEqual([])
  })

  test("definitions", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { tres: 3 }
      })
      .withSchema({
        definitions: [
          {
            const: "1"
          },
          {
            const: "dos"
          },
          {
            path: "tres"
          }
        ]
      })
      .build()

    const expected = ["1", "dos", 3]

    expect(result).toEqual(expected)
  })

  test("propiedades", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { nombre: "Melany" }
      })
      .withSchema({
        propiedades: {
          id: {
            const: 1
          },
          nombre: {
            path: "nombre"
          }
        }
      })
      .build()

    const expected = {
      id: 1,
      nombre: "Melany"
    }

    expect(result).toEqual(expected)
  })

  test("schemaFrom", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { nombre: "Melany" }
      })
      .withSchema({
        schemaFrom: {
          const: {
            path: "nombre"
          }
        }
      })
      .build()

    expect(result).toEqual("Melany")
  })

  test("path", () => {
    const result = new SchemaTaskResultBuilder()
      .with({
        store: { nombre: "Melany"}
      })
      .withSchema({ path: "nombre" })
      .build()

    expect(result).toEqual("Melany")
  })

  test("simple const", () => {
    const result = new SchemaTaskResultBuilder()
      .withSchema({ const: 1 })
      .build()

    expect(result).toEqual(1)
  })
})

describe("array filter property 'keywords' contains string", () => {

  const items = [
    {
      match: true,
      keywords: ["Melany", "uno"]
    },
    {
      match: false,
      keywords: ["uno", "dos"]
    },
    {
      match: true,
      keywords: ["uno", "Melany"]
    },
    {
      match: false,
      keywords: ["tres", "cuatro"]
    }
  ]

  const cases = [
    {
      items,
      expected: items.filter(i => i.match === true)
    },
    {
      items: items.filter(i => i.match === false),
      expected: []
    }
  ]

  test.each(cases)("case", async ({ items, expected }) => {
  
    await expectToEqualAsync({
      source: {},
      schema: {
        const: items,
        filter: {
          path: "current.keywords",
          contains: {
            equals: {
              const: "Melany"
            }
          }
        }
      },
      expected
    })
  })

})

test("schema as value", async () => {
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
    source: {},
    schema,
    expected: schema.schema
  })
})

test("add", async () => {
  await expectToEqualAsync({
    source: {},
    schema: {
      const: [
        1, 2, 3
      ],
      add: {
        const: 4
      }
    },
    expected: [1, 2, 3, 4]
  })
})

test("UUID", async () => {
  const source = {}
  const schema: Schema = {
    UUID: true
  }
  
  await expect(buildResultsAsync({ source, schema })).resolves.not.toThrow()
})

describe("increment or decrement", () => {

  const operations = ["increment", "decrement"]
  
  test.each(operations)("%s", async (operation) => {
    const source = { total: 7 }
    const schema: Schema = {
      [operation]: "total",
      reduce: {
        path: "total"
      }
    }
    const builder = new SchemaTaskResultBuilder()
      .with({ 
        store: source, 
        schema
      })
    const amount = schema.increment ? 1 : -1
    const expected = source.total + amount
    const resultados = [builder.build(), await builder.buildAsync()]
    
    expect(resultados).toEqual([expected, expected + amount])
  })

})

describe("trim", () => {
  const cases = [
    "  hello   ", 
    "  this is a test", 
    "", 
    "   "
  ].map(val => [val, val.trim()])

  test.each(cases)("(%s).trim equals: (%s)", async (value, expected) => {
    await expectToEqualAsync({
      source: { value },
      schema: {
        path: "value",
        trim: true
      },
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
    await expectToEqualAsync({
      source: { value },
      schema: {
        path: "value",
        isNullOrWhiteSpace: true
      },
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

    const expected = source.map(x => !x)

    await expectToEqualAsync({
      schema: {
        map: {
          not: {}
        }
      },
      options: {
        target: [
          true,
          false,
          false,
          true
        ]
      },
      expected
    })
  })

  test("propiedades", async () => {
    await expectToEqualAsync({
      source: {},
      schema: {
        propiedades: {
          activated: {
            not: {
              source: "activated"
            }
          }
        }
      },
      expected: {
        activated: true
      },
      options: {
        sources: {
          activated: false
        }
      }
    })
  })

  describe("simple not", () => {
    const schemas: Schema[] = [
      {
        const: false
      },
      {
        path: "activated"
      }
    ]

    test.each(schemas)("schema: $schema", async (schema: Schema) => {
      const source = { activated: false }
      const builder = new SchemaTaskResultBuilder()
        .with({ store: source })

      const results = [
        !builder.with({ schema }).build(),
        !(await builder.with({ schema }).buildAsync()),
        builder.with({ schema: { not: schema } }).build(),
        await builder.with({ schema: { not: schema } }).buildAsync()
      ]

      expect(new Set(results).size).toBe(1)
    })
  })
})

describe("add schema", () => {

  test("multiple with max", async () => {
    await expectToEqualAsync({
      source: {},
      schema: {
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
      },
      expected: [1, 2]
    })
  })

  test("multiple with value only", async () => {  
    await expectToEqualAsync({
      source: {},
      schema: {
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
      },
      expected: [1, 2, 3]
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
      set: "items",
      reduce: { // same without reduce
        path: "items"
      }
    }
  
    const result = new SchemaTaskResultBuilder()
      .withSchema(schema)
      .build()
    const expected = [3]
  
    expect(result).toEqual(expected)
  
  })

  test("with value only", async () => {  
    await expectToEqualAsync({
      source: {},
      schema: {
        const: [],
        select: {
          value: {
            const: 3
          }
        }
      },
      expected: [3]
    })
  })

})

describe("if schema", () => {
  const [ok, invalid] = ["ok", "invalid"]
  const cases = [1, 2, 3].map(num => {
    return [num, num % 2 == 0 ? ok : invalid] as [number, string]
  })

  test.each(cases)("if as string (path)", async (id: number, expected: string) => {
    await expectToEqualAsync({
      source: {
        isValid: id % 2 == 0
      },
      schema: {
        if: "isValid",
        then: {
          const: ok
        },
        else: {
          const: invalid
        }
      },
      expected
    })
  })

  const modCases = [1, 2, 3].map(num => {
    const mod = num % 2

    return [mod, mod == 0 ? ok : invalid] as [number, string]
  })

  test.each(modCases)("if as schema", async (mod: number, expected: string) => {
    await expectToEqualAsync({
      source: { mod },
      schema: {
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
      },
      expected
    })
  })
})

test("getPathValue throws on null source", () => {
  const source = null

  expect(() => getPathValue(source, "test")).toThrow()
})

describe("select", () => {
  const builder = new SchemaTaskResultBuilder()
    .with({ 
      store: {
        selected: [2]
      },
      target: { id: 3 }
    })

  const cases = [
    { selected: [3] },
    { selected: [] }
  ]

  test.each(cases)("select value", ({ selected }) => {
    const resultado = builder
      .with({ 
        schema: {
          targetPath: "id",
          selectSet: "selected",
          reduce: {
            path: "selected"
          }
        }
      })
      .build()

    expect(resultado).toEqual(selected)
  })
})

test("includes", async () => {
  await expectToEqualAsync({
    source: {
      id: 2
    },
    schema: {
      const: [
        1,
        2,
        3
      ],
      includes: {
        path: "id"
      }
    },
    expected: true,
    options: {
      target: {
        id: 2
      }
    }
  })
})

test.skip("stopPropiedades", async () => {
  const caseArg = {
    source: { 
      evaluatedTitle: "evaluated" 
    },
    schema: {
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
  }
  const [result] = await buildResultsAsync(caseArg)
  const [resultWithStop] = await buildResultsAsync({
    ...caseArg,
    options: {
      stopPropiedades: ["dos"]
    }
  })

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

  expect(result).not.toEqual(expected)
  expect(resultWithStop).toEqual(expected)
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
    await expectToEqualAsync({
      source: {
        items: ["a", "b", "c"]
      },
      schema: {
        path: "items",
        use
      },
      expected,
      options: {
        functions: {
          first: (array: any[]) => array[0],
          last: (array: any[]) => array[array.length - 1]
        }
      }
    })
  })

})

test("sibling nested", async () => {
  const idCopy = {
    sibling: "id"
  }
  let id = 1

  await expectToEqualAsync({
    source: {},
    schema: {
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
    },
    expected: {
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
  })
})

describe("sibling", () => {

  test("set value from a sibling property", async () => {
    await expectToEqualAsync({
      source: {},
      schema: {
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
      },
      expected: {
        title: "One",
        value: 1,
        titleCopy: "One"
      }
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
    await expectToEqualAsync({
      source: {
        dos: {
          subDos: 2
        },
        tres: {
          subTres: 3
        }
      },
      schema,
      expected,
      options: {
        target: {
          subUno: 1
        }
      }
    })
  })
})

describe("entries", () => {
  test("default key, value", async () => {    
    await expectToEqualAsync({
      schema: {
        entries: true
      },
      options: {
        target: {
          nombre: "Melany",
          cedula: "9-123-456",
          fechaDeNacimiento: "18/09/2019"
        }
      },
      expected: [
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

    await expectToEqualAsync({
      source: {},
      schema: {
        const: [100, 10, 5],
        calc
      },
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
      
      await expectToEqualAsync({
        source: { nombre: "Melany" },
        schema: {
          path: "nombre",
          equals: {
            const: nombre
          }
        },
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
                  path: "current.nombre",
                  equals: {
                    targetPath: "nombre"
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
        schema: {
          find: {
            path: "current.nombre",
            equals: {
              const: "Melany"
            }
          }
        },
        options: {
          target: [
            1, 
            "dos", 
            { nombre: "Mari" }, 
            { nombre: "Melany" }
          ]
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
            path: "current.nombre",
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
              path: "current.id",
              equals: {
                targetPath: "id"
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

    await expectToEqualAsync({
      source: {},
      schema: {
        const: numbers,
        map: {
          propiedades: {
            id: {}
          }
        }
      },
      expected: numbers.map(id => ({ id }))
    })
  })

  describe("array item validation (source items are all equal to filterSchema)", () => {

    test.each([
      "all",
      "some"
    ])("%s equal -> true", async (method) => {

      const source = { nombre: "Melany" }

      await expectToEqualAsync({
        source,
        schema: {
          const: Array(2).fill(source),
          contains: {
            path: "current.nombre",
            equals: {
              const: "Melany"
            }
          }
        },
        expected: true
      })
    })

  })

  describe("all equal (sin itemSchema)", () => {

    test.each([
      ["const", { const: ["Melany", "Melany", "Melany"] }],
      ["path", { path: "store.items" }]
    ])("con definition %s", async (tipo, schema: Schema) => {

      await expectToEqualAsync({
        source: { 
          store: { items: [] } 
        },
        schema: {
          ...schema,
          items: {
            equals: {
              const: "Melany"
            }
          }
        },
        expected: true
      })
    })

  })

  test("reduce: filtrar array y luego asignar length a propiedad total por medio de target", async () => {
    const melany = { nombre: "Melany" }
    const source = [melany, { nombre: "Fernando" }, melany, melany]

    await expectToEqualAsync({
      source,
      schema: {
        const: source,
        filter: {
          path: "current.nombre",
          equals: {
            const: "Melany"
          }
        },
        reduce: {
          propiedades: {
            total: {
              path: "current.length"
            }
          }
        }
      },
      expected: { total: source.length - 1 }
    })
  })

  describe.todo("orderBy", () => {
    const source = [
      [[2, 3, 8, 10].map(id => ({ id })), true],
      [[3, 2, 10, 8].map(id => ({ id })), false]
    ]

    test.each(source)("%o is ordered by id => %s", async (expectedItem, value) => {

      const schema: Schema = {
        const: [10, 2, 8, 3].map(id => ({ id })),
        // array: {
        //   orderBy: true
        // }
      }

      const resultados = await buildResultsAsync({ source: {}, schema })
      const expected = [expectedItem, expectedItem]

      value 
      ? expect(resultados).toEqual(expected) 
      : expect(resultados).not.toEqual(expected)
    })
  })
})

describe("mixed", () => {

  test.todo("reduce, orderBy and filter", async () => {
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

    await expectToEqualAsync({
      source: { nombre: "Melany" },
      schema,
      expected: [4, 10].map(id => ({ id, nombre: "Melany" }))
    })
  })

  describe("checkout", () => {

    test("path", async () => {
      await expectToEqualAsync({
        source: { 
          detalles: { 
            personal: { nombre: "Melany" } 
          } 
        },
        schema: {
          path: "detalles.personal",
          checkout: {
            propiedades: {
              nombre: {
                targetPath: "nombre"
              }
            }
          }
        },
        expected: { nombre: "Melany" }
      })
    })

  })

  describe.todo("flat", () => {

    test("flat", async () => {
      await expectToEqualAsync({
        source: {},
        schema: {
          flat: true,
          propiedades: {
            propsA: {
              const: { nombre: "Melany" },
            }
          }
        },
        expected: { nombre: "Melany" }
      })
    })

    test("flat (path)", async () => {
      await expectToEqualAsync({
        source: {
          usuario: {
            personal: { nombre: "Melany" },
            direccion: { provincia: "Santiago" }
          }
        },
        schema: {
          flat: true,
          path: "usuario"
        },
        expected: { nombre: "Melany", provincia: "Santiago" }
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