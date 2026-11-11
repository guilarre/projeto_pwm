import json
import time
import requests
import os
from dotenv import load_dotenv

load_dotenv()

APPLICATION_ID = os.getenv("EXPO_PUBLIC_BACK4APP_APP_ID")
REST_API_KEY = os.getenv("EXPO_PUBLIC_BACK4APP_REST_KEY")

headers = {
    'X-Parse-Application-Id': APPLICATION_ID,
    'X-Parse-REST-API-Key': REST_API_KEY,
    'Content-Type': 'application/json',
}


# start_index pra retomarmos o upload de onde parou, em caso de erro
def importar_em_batches(json_path, nome_classe, start_index=0):
    url = 'https://parseapi.back4app.com/batch'

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        total = len(data)

        print(f"Iniciando importação de {total} registros para '{nome_classe}' a partir do índice {start_index}...")

        # fatia os dados caso queira retomar de onde parou
        dados_para_enviar = data[start_index:]
        # o Parse aceita até 50 operações por lote em /batch
        chunk_size = 50  

        for i in range(0, len(dados_para_enviar), chunk_size):
            chunk = dados_para_enviar[i : i + chunk_size]
            indice_atual = start_index + i

            # monta o payload em lote exigido pela API do Parse
            requests_list = []
            for item in chunk:
                requests_list.append(
                    {'method': 'POST', 'path': f'/classes/{nome_classe}', 'body': item}
                )

            payload = {'requests': requests_list}

            # mecanismo de tentativas caso tenha problemas de conexão
            tentativas = 3
            sucesso = False
            while tentativas > 0 and not sucesso:
                try:
                    response = requests.post(url, headers=headers, json=payload, timeout=30)
                    if response.status_code == 200:
                        sucesso = True
                    else:
                        print(f"ERRO no batch a partir do índice {indice_atual}: {response.status_code} - {response.text}")
                        time.sleep(2)
                        tentativas -= 1
                except Exception as e:
                    print(f'FALHA de conexão no índice {indice_atual}: {e}')
                    time.sleep(3)
                    tentativas -= 1

            if not sucesso:
                # printa onde tá qnd parar por erro de conexão
                print(f"FALHA definitiva no índice {indice_atual}. ANOTE ESTE NÚMERO para retomar depois!")
                return indice_atual

            processados_teoricos = min(indice_atual + chunk_size, total)
            print(f'Processados {processados_teoricos}/{total}...')
            time.sleep(0.3)  #pausa curta para aliviar o servidor

        print(f'CONCLUÍDO COM SUCESSO para {nome_classe}!!!1!!1111  :D')
        return None

    except Exception as e:
        print(f'ERRO FATAL: {e}')
        return None


# NOTE: comentar conforme for tendo sucesso
# json_paths = [
#     '../jsons/calendar.json',
#     '../jsons/calendar_dates.json',
#     '../jsons/routes.json',
#     '../jsons/stops.json',
#     '../jsons/trips.json',
#     '../jsons/stop_times.json',
#     '../jsons/shapes.json',
# ]

# NOTE: comentar conforme for tendo sucesso
# class_names = [
#     'Calendar',
#     'CalendarDates',
#     'Routes',
#     'Stops',
#     'Trips',
#     'StopTimes',
#     'Shapes',
# ]

# aqui agt pode alterar conforme for falhando e pegando os índices pra continuar..
# ATTENTION: lembrar de sempre checar no back4app se recomeçar do índice q parou não geraria duplicada
# start_indices = [
#     0, # Calendar
#     0, # CalendarDates
#     0, # Routes
#     0, # Stops
#     0, # Trips
#     0, # StopTimes
#     0, # Shapes
# ]

# for json_path, class_name, start_index in zip(json_paths, class_names, start_indices):
#     importar_em_batches(json_path, class_name, start_index=start_index)

# importando os endereços em addresses.json
importar_em_batches('../data/addresses.json', 'Addresses', 0)
