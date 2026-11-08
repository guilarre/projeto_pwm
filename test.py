import csv
with open("./gtfs/routes.txt", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    print(fieldnames)
