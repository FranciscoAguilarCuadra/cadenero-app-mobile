import NetInfo from "@react-native-community/netinfo";

let listeners = [];
let online = true;

function calcularEstado(state) {
    return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

NetInfo.addEventListener((state) => {
    const conectado = calcularEstado(state);

    if (conectado !== online) {
        online = conectado;
        listeners.forEach((fn) => fn(online));
    }
});

NetInfo.fetch().then((state) => {
    online = calcularEstado(state);
});

export function isOnline() {
    return online;
}

export function onConnectivityChange(callback) {
    listeners.push(callback);

    return () => {
        listeners = listeners.filter((fn) => fn !== callback);
    };
}
