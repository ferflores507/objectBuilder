import { describe, expect, test } from 'vitest'
import { Calc } from '../src/helpers/calc'

describe("calc", () => {

    const calc = new Calc(100, 10, 5)
    const suma = 115
    const resta = 85
    const producto = 5000
    const division = 2

    test("sumar", () => expect(calc.sumar()).toBe(suma))
    test("restar", () => expect(calc.restar()).toBe(resta))
    test("multiplicar", () => expect(calc.multiplicar()).toBe(producto))
    test("dividir", () => expect(calc.dividir()).toBe(division))
})