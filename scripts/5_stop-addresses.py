import csv
import json
import time
import requests
# import os
# from dotenv import load_dotenv

# load_dotenv()

# vamos receber as lat/lon das paradas para fazer a pesquisa reversa dos
# endereços, e depois criaremos uma tabela com os endereços no banco (do
# back4app), para um lookup mais rápido

# credenciais do back4app
# APPLICATION_ID = os.getenv("EXPO_PUBLIC_BACK4APP_APP_ID")
# REST_API_KEY = os.getenv("EXPO_PUBLIC_BACK4APP_REST_KEY")

# back4app_headers = {
#     'X-Parse-Application-Id': APPLICATION_ID,
#     'X-Parse-REST-API-Key': REST_API_KEY,
#     'Content-Type': 'application/json',
# }

# vamos usar o OpenStreetMap (a api do google não é mais gratuita, eu acho)
# aqui mandamos a config do User-Agent obrigatória do Nominatim
nominatim_headers = {
    'User-Agent': 'ProjetoBusUnicap/1.0 (guilherme.00000860657@unicap.br)'
}

stops_data = []

# populando a lista que será enviada
with open('../data/relevant-entries/stops.txt', 'r', encoding='utf-8-sig') as csv_f:
    f_reader = csv.DictReader(csv_f)
    for row in f_reader:
        stops_data.append({
            'stop_id': row['stop_id'],
            'stop_name': row.get('stop_name', ''), #retorna '' se n existir
            'lat': float(row['stop_lat']),
            'lon': float(row['stop_lon'])
        }) #tupla


# requisição ao openstreetmap
print(f"Iniciando o processamento de {len(stops_data)} paradas...")

payload_list = []
failed_stops = [] #pra pegarmos depois os que falharem

for idx, stop in enumerate(stops_data):
    lat = stop['lat']
    lon = stop['lon']

    # URL do Nominatim (usando GET)
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"

    success = False
    retries = 3  # Número máximo de tentativas caso dê erro 503
    
    while not success and retries > 0:
        try:
            response = requests.get(url, headers=nominatim_headers)

            if response.status_code == 200:
                data = response.json()
                display_name = data.get('display_name', 'Endereço não encontrado')

                print(f"[{idx + 1}/{len(stops_data)}] Stop_id {stop['stop_id']}: {display_name}")

                payload = {
                    "stop_id": stop['stop_id'],
                    "stop_name": stop['stop_name'],
                    "address": display_name,
                    "location": {
                        "__type": "GeoPoint",
                        "latitude": lat,
                        "longitude": lon
                    }
                }

                payload_list.append(payload)
                success = True

            elif response.status_code == 429:
                print(f"Rate limit atingido (429) na parada {stop['stop_id']}. O OSM bloqueou temporariamente. Aguardando 30 segundos... ({retries} tentativas restantes)")
                retries -= 1
                time.sleep(30)  # Descanso longo para o IP ser desbanido

            elif response.status_code == 503:
                print(f"Servidor ocupado (503) na parada {stop['stop_id']}. Tentando novamente em 5 segundos... ({retries} tentativas restantes)")
                retries -= 1
                time.sleep(10)  # Espera um pouco mais antes de tentar de novo

            else:
                print(f"Erro na API do OSM para a parada {stop['stop_id']}: Status {response.status_code}")
                break # Se for outro erro (ex: 404), pula para a próxima

        except Exception as e:
            print(f"Erro de conexão na parada {stop['stop_id']}: {e}")
            retries -= 1
            time.sleep(3)

    # se as tentativas esgotaram e ainda deu erro, salva pra pegarmos depois
    if not success:
        print(f"-> FALHA DEFINITIVA na parada {stop['stop_id']}. Adicionada à lista de pendências.")
        failed_stops.append(stop)
        # NOTE: limite de 1 requisição por segundo do Nominatim...
        # deixei em 1.2s pra tentar evitar o erro 503
        time.sleep(1.2)

print("Processamento concluído!")

# salvando pra checarmos se tá ok e depois fazermos o upload...
json_path = '../data/addresses.json'
try:
    with open(json_path, mode='w', encoding='utf-8') as json_file:
        json.dump(payload_list, json_file, ensure_ascii=False, indent=2)

    print(f"Sucesso! Gerou o arquivo: {json_path}")
except Exception as e:
    print(f"ERRO ao salvar {json_path}: {e}")

# salvando os que falharam...
if failed_stops:
    failed_path = '../data/failed_stops.json'
    try:
        with open(failed_path, mode='w', encoding='utf-8') as failed_file:
            json.dump(failed_stops, failed_file, ensure_ascii=False, indent=2)
        print(f"Atenção: {len(failed_stops)} paradas falharam e foram salvas em: {failed_path}")
    except Exception as e:
        print(f"ERRO ao salvar os que falharam em {failed_path}: {e}")
else:
    print("SUCESSO KRAY! Nenhuma parada falhou.")

# failsafe em csv
csv_path = '../data/addresses.csv'
try:
    if payload_list:
        with open(csv_path, 'w', encoding='utf-8', newline='') as csv_file:
                fieldnames = ['stop_id', 'stop_name', 'address', 'location']
                writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                writer.writeheader()

        for item in payload_list:
            row_to_write = {
                'stop_id': item['stop_id'],
                'stop_name': item['stop_name'],
                'address': item['address'],
                'location': {
                    "latitude": item['location']['latitude'],
                    "longitude": item['location']['longitude']
                }
            }
    print(f"SUCESSO!! Gerou CSV failsafe em: {csv_path}")
except Exception as e:
    print(f"ERRO ao salvar CSV failsafe: {e}")
