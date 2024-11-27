function isJsonString(str: string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const jsonOrString = (str: string) => {
    if(isJsonString(str) === false){
        return str
    }

    return JSON.parse(str)
}

export default function useFetchData() {
    
    const fetchData = async (url: string, opciones: RequestInit | undefined, signal: AbortSignal) => {

        // if(opciones.method === "get"){
        //     opciones.body = undefined
        // }

        const res = await fetch(url, { ...opciones, signal })
        const respuesta = await res.text()
        const { ok, status } = res

        return { ok, status, data: jsonOrString(respuesta) }
    }

    return {
        fetchData
    }
}