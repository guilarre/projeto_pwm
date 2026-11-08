import json
import requests

APPLICATION_ID = "zenOCth3xZBRr7GmIe6ykDt51QGk7yZm9dHTvIpZ"
REST_API_KEY = "S5WfC4RiNVJeAt8a0s6DIaEJjiD4djBsxH1a5PgS"

headers = {
    'X-Parse-Application-Id': APPLICATION_ID,
    'X-Parse-REST-API-Key': REST_API_KEY,
    'Content-Type': 'application/json',
}


def importar_json_back4app(json_path, class_name):
    url = f"https://parseapi.back4app.com/classes/{class_name}"

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"Iniciando importação de {len(data)} registros para a classe {class_name}...")

        sucessos = 0
        erros = 0

        for i, item in enumerate(data):
            response = requests.post(url, headers=headers, json=item)

            if response.status_code == 201:
                sucessos += 1
            else:
                erros += 1
                print(f"Erro no item {i}: {response.text}")

            if (i + 1) % 100 == 0:
                print(f'Processados {i + 1}/{len(data)}...')

        print(f"Concluído para {class_name}! Sucessos: {sucessos} | Erros: {erros}")

    except Exception as e:
        print(f"ERRO ao processar o arquivo {json_path}: {e}")


json_paths = [
    '../jsons/calendar.json',
    '../jsons/calendar_dates.json',
    '../jsons/routes.json',
    '../jsons/stops.json',
    '../jsons/trips.json',
    '../jsons/stop_times.json',
    '../jsons/shapes.json',
]

class_names = [
    'calendar',
    'calendar_dates',
    'routes',
    'stops',
    'trips',
    'stop_times',
    'shapes',
]

for json_path, class_name in zip(json_paths, class_names):
    importar_json_back4app(json_path, class_name)
