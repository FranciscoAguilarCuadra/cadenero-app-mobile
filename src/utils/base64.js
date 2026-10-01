const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const TABLA = (() => {
    const tabla = new Array(128);

    for (let indice = 0; indice < ALFABETO.length; indice += 1) {
        tabla[ALFABETO.charCodeAt(indice)] = indice;
    }

    return tabla;
})();

export function base64ToBytes(base64) {
    const datos = base64.replace(/[^A-Za-z0-9+/]/g, "");
    const largoSalida = Math.floor((datos.length * 3) / 4);
    const bytes = new Uint8Array(largoSalida);

    let indiceSalida = 0;

    for (let indice = 0; indice < datos.length; indice += 4) {
        const a = TABLA[datos.charCodeAt(indice)];
        const b = TABLA[datos.charCodeAt(indice + 1)];
        const c = TABLA[datos.charCodeAt(indice + 2)];
        const d = TABLA[datos.charCodeAt(indice + 3)];

        bytes[indiceSalida] = (a << 2) | (b >> 4);
        indiceSalida += 1;

        if (indiceSalida < largoSalida) {
            bytes[indiceSalida] = ((b & 15) << 4) | (c >> 2);
            indiceSalida += 1;
        }

        if (indiceSalida < largoSalida) {
            bytes[indiceSalida] = ((c & 3) << 6) | d;
            indiceSalida += 1;
        }
    }

    return bytes;
}
