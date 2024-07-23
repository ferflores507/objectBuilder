export class Calc {

    constructor(...numbers: number[]){
        this.numbers = numbers
    }

    numbers: number[]

    sumar = () => this.numbers.reduce((a, b) => a + b)
    restar = () => this.numbers.reduce((a, b) => a - b)
    multiplicar = () => this.numbers.reduce((a, b) => a * b)
    dividir = () => this.numbers.reduce((a, b) => a / b)
}