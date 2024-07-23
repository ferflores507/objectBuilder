import { getFormData, removeNullOrUndefined } from "./varios";
import type { Consulta } from "../models";
import useFetchData from "./useFetchData";

export default function useConsulta() {

    const formatUrl = (url: string, query: Record<string, any> | undefined) => {
        const queryFiltered = removeNullOrUndefined(query ?? {}) as Record<string, string>
        
        return url + new URLSearchParams(queryFiltered)
    }

    const formatBody = (body: Record<string, any>, isFormData: boolean) => {
        return isFormData ? getFormData(body) : JSON.stringify(body)
    }
    
    const cargar = (consulta: Consulta, signal: AbortSignal) => {
        
        const { 
            url, 
            metodo, 
            isFormData = false, 
            contentType = "application/json", 
            query, 
            body, 
            headers 
        } = consulta

        const opciones = {
            method: metodo,
            headers: { 
                ...(isFormData ? {} : { "Content-Type": contentType }),
                ...headers
            },
            body: body ? formatBody(body, isFormData): null
        }

        const { fetchData } = useFetchData()
        const fullUrl = formatUrl(url, query)

        return fetchData(fullUrl, opciones, signal)
    }

    return {
        cargar
    }
}