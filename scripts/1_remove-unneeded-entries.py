import csv

# as linhas que queremos filtrar
target_routes = {
    '2920',
    '030',
    '1940',
    '881',
    '1994',
    '1992',
    '886',
    '1993',
    '202',
    '522'
}

def remove_unneeded():
    # popularemos sets com cada id importante que pudermos extrair a partir
    # dos route_id (lookup de sets são mais eficientes)
    valid_route_ids = set()
    valid_service_ids = set()
    valid_shape_ids = set()
    valid_trip_ids = set()
    valid_stop_ids = set()

    # listas salvando as entradas relevantes que vamos escrever no final
    # routes.txt
    routes_filtered = []
    with open("../gtfs/routes.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        # lista com nomes das colunas
        fieldnames = reader.fieldnames
        for row in reader:
            if row['route_id'] in target_routes or row.get('route_short_name') in target_routes:
                valid_route_ids.add(row['route_id'])
                routes_filtered.append(row) #adicionamos à nossa lista

    print(f"-> Linhas (routes) encontradas: {len(valid_route_ids)}")

    # trips.txt
    trips_filtered = []
    with open("../gtfs/trips.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        trip_fieldnames = reader.fieldnames
        for row in reader:
            if row['route_id'] in valid_route_ids:
                valid_trip_ids.add(row['trip_id'])
                # aproveitando pra pegar mais ids importantes
                if row.get('service_id'):
                    valid_service_ids.add(row['service_id'])
                if row.get('shape_id'):
                    valid_shape_ids.add(row['shape_id'])
                trips_filtered.append(row)

    print(f"-> Viagens (trips) válidas: {len(valid_trip_ids)}")

    # stop_times.txt
    stop_times_filtered = []
    with open("../gtfs/stop_times.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        stop_times_fieldnames = reader.fieldnames
        for row in reader:
            if row['trip_id'] in valid_trip_ids:
                valid_stop_ids.add(row['stop_id'])
                stop_times_filtered.append(row)

    print(f"-> Registros de horários (stop_times): {len(stop_times_filtered)}")

    # stops.txt
    stops_filtered = []
    with open("../gtfs/stops.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        stop_fieldnames = reader.fieldnames
        for row in reader:
            if row['stop_id'] in valid_stop_ids:
                stops_filtered.append(row)

    print(f"-> Pontos de parada (stops): {len(stops_filtered)}")

    # calendar.txt
    cal_filtered = []
    with open("../gtfs/calendar.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cal_fieldnames = reader.fieldnames
        for row in reader:
            if row['service_id'] in valid_service_ids:
                cal_filtered.append(row)

    print("-> Calendário (calendar) registrado com sucesso.")

    # calendar_dates.txt
    cal_dates_filtered = []
    with open("../gtfs/calendar_dates.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cal_dates_fieldnames = reader.fieldnames
        for row in reader:
            if row['service_id'] in valid_service_ids:
                cal_dates_filtered.append(row)

    print("-> Exceções de calendário (calendar_dates) registrado com sucesso.")

    # shapes.txt
    shapes_filtered = []
    with open("../gtfs/shapes.txt", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        shapes_fieldnames = reader.fieldnames
        for row in reader:
            if row['shape_id'] in valid_shape_ids:
                shapes_filtered.append(row)

    print("-> Rotas (shapes) registradas com sucesso.")

    # função pra salvar os arquivos filtrados
    def salvar_csv(filename, fieldnames, data):
        if not data:
            return
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

    # chamando função salvar_csv
    paths_to_write = ["../relevant-entries/routes.txt", "../relevant-entries/trips.txt", "../relevant-entries/stop_times.txt", "../relevant-entries/stops.txt", "../relevant-entries/calendar.txt", "../relevant-entries/calendar_dates.txt", "../relevant-entries/shapes.txt"]

    salvar_csv(paths_to_write[0], fieldnames, routes_filtered)
    salvar_csv(paths_to_write[1], trip_fieldnames, trips_filtered)
    salvar_csv(paths_to_write[2], stop_times_fieldnames, stop_times_filtered)
    salvar_csv(paths_to_write[3], stop_fieldnames, stops_filtered)
    if cal_filtered:
        salvar_csv(paths_to_write[4], cal_fieldnames, cal_filtered)
    if cal_dates_filtered:
        salvar_csv(paths_to_write[5], cal_dates_fieldnames, cal_dates_filtered)
    if shapes_filtered:
        salvar_csv(paths_to_write[6], shapes_fieldnames, shapes_filtered)

    print("Tudo concluído com sucesso!")


# rodando...
remove_unneeded()
