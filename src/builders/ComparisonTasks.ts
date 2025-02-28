import { esIgual, isEmpty, Path } from "../helpers/varios"
import { SubsetOptions, WithTaskOptions } from "../models"
import { Operators } from "./Operators"

export class ComparisonTasks implements WithTaskOptions<ComparisonTasks> {
    constructor(private operators: Operators) {}
    
    equals = esIgual
    allEqualTo = (obj: any[], value: any) => {
        return this.operators.values(obj).every(item => this.equals(item, value))
    }
    allEqual = (obj: any[], allEqual: boolean) => {
        const values = this.operators.values(obj)

        return this.allEqualTo(values, values[0]) === allEqual
    }
    includes = (a: any[] | string, b: any) => a.includes(b)
    isNullOrWhiteSpace = (value: any, boolValue: boolean | undefined) => {
        return typeof(boolValue) == "boolean"
            ? ((value as string ?? "").toString().trim() === "") === boolValue
            : value
    }
    isSubsetOf = (array: any[], { container, match }: SubsetOptions) => {
        return array.every(item => container.some(containerItem => match({ item, containerItem })))
    }
    isKeywordsOf = (keywords: Path, container: Path) => {
        [keywords, container] = [keywords, container].map(this.operators.keywordsOrDefault)
        
        return this.isSubsetOf(keywords, {
            container,
            match: ({ item, containerItem }) => containerItem.includes(item)
        })
    }
    isEmpty = (value: any, condition: boolean) => {
        return isEmpty(value) === condition
    }
    isNull = (value: any, condition: boolean) => {
        return (value == null) === condition
    }
    isNullOrEmpty = (value: any, condition: boolean) => {
        return (value == null || isEmpty(value)) === condition
    }
    not = (a: any, b: any) => !b
    greaterThan = (a: any, b: any) => a > b
    lessThan = (a: any, b: any) => a < b
}