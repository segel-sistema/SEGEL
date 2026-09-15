// =====================================================
// SEGEL - APLICATIVO
// Sistema de Segurança de Galerias Elétricas
// =====================================================


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const distanciaLiga = 10;
const distanciaDesliga = 30;

// ID DO SEU CANAL THINGSPEAK
const CHANNEL_ID = "3477526";

// Como seu canal é público, não precisamos colocar
// a Read API Key aqui.
const API_URL =
    `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`;


// =====================================================
// VARIÁVEIS
// =====================================================

let bombaLigada = false;
let alarmeLigado = false;
let emergencia = false;

let ultimoEstado = "";


// =====================================================
// ELEMENTOS DA PÁGINA
// =====================================================

const distanceElement =
    document.getElementById("distance");

const statusText =
    document.getElementById("statusText");

const statusDescription =
    document.getElementById("statusDescription");

const statusCard =
    document.getElementById("statusCard");

const statusIcon =
    document.getElementById("statusIcon");

const pumpStatus =
    document.getElementById("pumpStatus");

const alarmStatus =
    document.getElementById("alarmStatus");

const sensorStatus =
    document.getElementById("sensorStatus");

const waterProgress =
    document.getElementById("waterProgress");

const lastUpdate =
    document.getElementById("lastUpdate");

const connectionText =
    document.getElementById("connectionText");


// =====================================================
// BUSCAR DADOS DO THINGSPEAK
// =====================================================

async function buscarDadosThingSpeak() {

    try {

        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error(
                "Erro ao acessar o ThingSpeak"
            );
        }

        const dados = await resposta.json();

        console.log("Dados recebidos:");
        console.log(dados);


        // ---------------------------------------------
        // VERIFICAR SE EXISTEM DADOS
        // ---------------------------------------------

        if (!dados || !dados.field1) {

            sensorStatus.textContent =
                "SEM DADOS";

            sensorStatus.className =
                "equipment-status off";

            connectionText.textContent =
                "Aguardando dados";

            return;
        }


        // ---------------------------------------------
        // DISTÂNCIA - FIELD 1
        // ---------------------------------------------

        const distancia =
            parseFloat(dados.field1);


        if (isNaN(distancia)) {

            throw new Error(
                "Distância inválida"
            );
        }


        // ---------------------------------------------
        // BOMBA - FIELD 2
        // ---------------------------------------------

        bombaLigada =
            String(dados.field2) === "1";


        // ---------------------------------------------
        // ALARME - FIELD 3
        // ---------------------------------------------

        alarmeLigado =
            String(dados.field3) === "1";


        // ---------------------------------------------
        // ATUALIZAR DISTÂNCIA
        // ---------------------------------------------

        distanceElement.textContent =
            distancia.toFixed(1);


        // ---------------------------------------------
        // SENSOR ONLINE
        // ---------------------------------------------

        sensorStatus.textContent =
            "ONLINE";

        sensorStatus.className =
            "equipment-status on";


        // ---------------------------------------------
        // CONEXÃO
        // ---------------------------------------------

        connectionText.textContent =
            "ESP8266 conectado";


        // ---------------------------------------------
        // ATUALIZAR SISTEMA
        // ---------------------------------------------

        atualizarSistema(
            distancia,
            bombaLigada,
            alarmeLigado
        );


        // ---------------------------------------------
        // HORÁRIO DO ÚLTIMO DADO
        // ---------------------------------------------

        atualizarHorario(
            dados.created_at
        );

    }

    catch (erro) {

        console.error(
            "Erro:",
            erro
        );


        // ---------------------------------------------
        // ERRO DE CONEXÃO
        // ---------------------------------------------

        connectionText.textContent =
            "Sem conexão com o ThingSpeak";


        sensorStatus.textContent =
            "OFFLINE";

        sensorStatus.className =
            "equipment-status off";


        statusText.textContent =
            "SEM CONEXÃO";

        statusDescription.textContent =
            "Não foi possível receber dados do ESP8266.";

        statusCard.classList.add(
            "critical"
        );

        statusIcon.textContent =
            "!";

    }

}


// =====================================================
// ATUALIZAR SISTEMA
// =====================================================

function atualizarSistema(
    distancia,
    bomba,
    alarme
) {

    // Se emergência estiver ativada,
    // o site mostra a condição de emergência.
    if (emergencia) {

        atualizarInterface(
            "EMERGÊNCIA ATIVADA",
            "Sistema desligado pelo botão de emergência.",
            true,
            false,
            false
        );

        return;
    }


    // =================================================
    // NÍVEL CRÍTICO
    // =================================================

    if (distancia < distanciaLiga) {

        atualizarInterface(
            "NÍVEL CRÍTICO",
            "Nível de água elevado. Verifique o sistema de drenagem.",
            true,
            bomba,
            alarme
        );


        registrarEstado(
            "Nível crítico detectado",
            "CRÍTICO"
        );

    }


    // =================================================
    // NÍVEL NORMAL
    // =================================================

    else if (distancia > distanciaDesliga) {

        atualizarInterface(
            "SISTEMA NORMAL",
            "Nenhum risco de alagamento detectado.",
            false,
            bomba,
            alarme
        );


        registrarEstado(
            "Nível normal detectado",
            "NORMAL"
        );

    }


    // =================================================
    // NÍVEL DE MONITORAMENTO
    // =================================================

    else {

        if (bomba) {

            atualizarInterface(
                "BOMBA EM OPERAÇÃO",
                "Sistema realizando drenagem.",
                true,
                bomba,
                alarme
            );

        }

        else {

            atualizarInterface(
                "MONITORAMENTO",
                "Nível intermediário. Sistema monitorando.",
                false,
                bomba,
                alarme
            );

        }

    }


    // =================================================
    // BARRA DE NÍVEL
    // =================================================

    atualizarProgresso(
        distancia
    );

}


// =====================================================
// ATUALIZAR INTERFACE
// =====================================================

function atualizarInterface(
    titulo,
    descricao,
    critico,
    bomba,
    alarme
) {

    statusText.textContent =
        titulo;

    statusDescription.textContent =
        descricao;


    // =================================================
    // STATUS PRINCIPAL
    // =================================================

    if (critico) {

        statusCard.classList.add(
            "critical"
        );

        statusIcon.textContent =
            "!";

    }

    else {

        statusCard.classList.remove(
            "critical"
        );

        statusIcon.textContent =
            "✓";

    }


    // =================================================
    // BOMBA
    // =================================================

    if (bomba) {

        pumpStatus.textContent =
            "LIGADA";

        pumpStatus.className =
            "equipment-status critical";

    }

    else {

        pumpStatus.textContent =
            "DESLIGADA";

        pumpStatus.className =
            "equipment-status off";

    }


    // =================================================
    // ALARME
    // =================================================

    if (alarme) {

        alarmStatus.textContent =
            "LIGADO";

        alarmStatus.className =
            "equipment-status critical";

    }

    else {

        alarmStatus.textContent =
            "DESLIGADO";

        alarmStatus.className =
            "equipment-status off";

    }

}


// =====================================================
// BARRA DE NÍVEL DA ÁGUA
// =====================================================

function atualizarProgresso(
    distancia
) {

    let porcentagem =
        100 - ((distancia / 40) * 100);


    if (porcentagem < 0) {
        porcentagem = 0;
    }


    if (porcentagem > 100) {
        porcentagem = 100;
    }


    waterProgress.style.width =
        porcentagem + "%";


    // =================================================
    // CORES
    // =================================================

    if (distancia < 10) {

        waterProgress.style.background =
            "#ef4444";

    }

    else if (distancia <= 30) {

        waterProgress.style.background =
            "#f59e0b";

    }

    else {

        waterProgress.style.background =
            "#22c55e";

    }

}


// =====================================================
// BOTÃO DE EMERGÊNCIA
// =====================================================

function emergencyStop() {

    emergencia =
        !emergencia;


    const button =
        document.getElementById(
            "emergencyButton"
        );


    // =================================================
    // EMERGÊNCIA ATIVADA
    // =================================================

    if (emergencia) {

        bombaLigada =
            false;

        alarmeLigado =
            false;


        button.innerHTML =
            "⚠️ <span>REARMAR SISTEMA</span>";


        atualizarInterface(
            "EMERGÊNCIA ATIVADA",
            "A bomba e o alarme foram desligados no painel.",
            true,
            false,
            false
        );


        adicionarHistorico(
            "Botão de emergência acionado",
            "CRÍTICO"
        );

    }


    // =================================================
    // REARMAR
    // =================================================

    else {

        button.innerHTML =
            "🚨 <span>DESLIGAR EMERGÊNCIA</span>";


        buscarDadosThingSpeak();


        adicionarHistorico(
            "Sistema rearmado",
            "NORMAL"
        );

    }

}


// =====================================================
// HISTÓRICO
// =====================================================

function adicionarHistorico(
    mensagem,
    tipo
) {

    const historyList =
        document.getElementById(
            "historyList"
        );


    const agora =
        new Date();


    const hora =
        agora.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "history-item";


    const classe =
        tipo === "CRÍTICO"
            ? "history-critical"
            : "history-normal";


    item.innerHTML = `
        <span class="history-time">
            ${hora}
        </span>

        <span>
            ${mensagem}
        </span>

        <span class="${classe}">
            ${tipo}
        </span>
    `;


    historyList.prepend(
        item
    );

}


// =====================================================
// EVITAR REPETIÇÃO NO HISTÓRICO
// =====================================================

function registrarEstado(
    mensagem,
    tipo
) {

    const novoEstado =
        mensagem + "-" + tipo;


    if (
        novoEstado !== ultimoEstado
    ) {

        adicionarHistorico(
            mensagem,
            tipo
        );


        ultimoEstado =
            novoEstado;

    }

}


// =====================================================
// LIMPAR HISTÓRICO
// =====================================================

function clearHistory() {

    document.getElementById(
        "historyList"
    ).innerHTML = "";

}


// =====================================================
// HORÁRIO
// =====================================================

function atualizarHorario(
    dataThingSpeak
) {

    let data;


    if (dataThingSpeak) {

        data =
            new Date(
                dataThingSpeak
            );

    }

    else {

        data =
            new Date();

    }


    const hora =
        data.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    lastUpdate.textContent =
        "Última atualização: " +
        hora;

}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

console.log(
    "SEGEL iniciado"
);


console.log(
    "Canal ThingSpeak:",
    CHANNEL_ID
);


// Busca os dados imediatamente
buscarDadosThingSpeak();


// =====================================================
// ATUALIZAÇÃO AUTOMÁTICA
// =====================================================

// Busca novos dados a cada 20 segundos

setInterval(
    buscarDadosThingSpeak,
    20000
);