export function nextId(lista) {
    if (lista.length > 0) {    
        return Math.max(...lista.map( item => item.id )) + 1;
    } else {
        return 1;
    }    
}