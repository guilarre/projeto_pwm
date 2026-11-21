import time
import requests

import os # necessario pro load_dotenv:
from dotenv import load_dotenv

load_dotenv()

APPLICATION_ID = os.getenv("EXPO_PUBLIC_BACK4APP_APP_ID")
REST_API_KEY = os.getenv("EXPO_PUBLIC_BACK4APP_REST_KEY")
BASE_URL = "https://parseapi.back4app.com"

print("\nDEBUG:")
print(APPLICATION_ID)
print(REST_API_KEY)
print(BASE_URL)
print("\n\n")

headers = {
    'X-Parse-Application-Id': APPLICATION_ID,
    'X-Parse-REST-API-Key': REST_API_KEY,
    'Content-Type': 'application/json',
}

# IMPORTANTE: sempre migrar para uma colunaNumeric NOVA, pra não apagarmos a colunaString antiga
# NOTE: função genérica pra migrar colunas string pra numéricas

def migrar_col_string_to_numeric(class_name, coluna_string, coluna_numeric, limite_por_execucao=5000):
    url = f"{BASE_URL}/functions/migrarStringNumeric"
    payload = {
        "className": class_name,
        "colunaString": coluna_string,
        "colunaNumeric": coluna_numeric,
        "limitePorExecucao": limite_por_execucao
    }

    print(f"Iniciando migração em '{class_name}': '{coluna_string}' -> '{coluna_numeric}'...")
    lote = 1

    while True:
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)

            if response.status_code != 200:
                print(f"Erro HTTP {response.status_code}: {response.text}")
                break

            result = response.json().get("result", {})
            atualizados = result.get("atualizadosNestaExecucao", 0)
            restantes = result.get("restantes", 0)
            concluido = result.get("concluido", False)

            print(f"[Lote {lote}] Atualizados: {atualizados} | Restantes: {restantes}")

            if concluido or atualizados == 0:
                print(f"Migração de '{class_name}.{coluna_numeric}' finalizada!")
                break

            lote += 1
            time.sleep(1)  # Pausa curta entre lotes para não sobrecarregar o servidor

        except requests.exceptions.Timeout:
            print(f"[Lote {lote}] Timeout atingido. Como o processo é incremental, tentando novamente em 3s...")
            time.sleep(3)
        except Exception as e:
            print(f"Erro inesperado: {e}")
            break

# REMEMBER: comenta depois q terminar
# if __name__ == "__main__":
    # migrar_col_string_to_numeric("StopTimes", "stop_sequence", "stop_sequence_num")
    # migrar_col_string_to_numeric("Shapes", "shape_pt_sequence", "shape_pt_sequence_num")
    # migrar_col_string_to_numeric("Shapes", "shape_pt_lat", "lat")
    # migrar_col_string_to_numeric("Shapes", "shape_pt_lon", "lon")
