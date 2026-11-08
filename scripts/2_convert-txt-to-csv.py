import csv
import json

def csv_to_json(csv_path, json_path):
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as csv_file:
            f_reader = csv.DictReader(csv_file)
            data = list(f_reader)

        with open(json_path, mode='w', encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=2)

        print(f"Sucesso! Gerou o arquivo: {json_path}")
    except Exception as e:
        print(f"ERRO ao converter {csv_path}: {e}")


csv_paths = [
    '../relevant-entries/routes.txt',
    '../relevant-entries/stops.txt',
    '../relevant-entries/stop_times.txt',
    '../relevant-entries/shapes.txt',
    '../relevant-entries/trips.txt',
    '../relevant-entries/calendar.txt',
    '../relevant-entries/calendar_dates.txt',
]

json_paths = [
    '../jsons/routes.json',
    '../jsons/stops.json',
    '../jsons/stop_times.json',
    '../jsons/shapes.json',
    '../jsons/trips.json',
    '../jsons/calendar.json',
    '../jsons/calendar_dates.json',
]

for csv_path, json_path in zip(csv_paths, json_paths):
    csv_to_json(csv_path, json_path)
