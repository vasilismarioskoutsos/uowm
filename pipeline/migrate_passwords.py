import csv, os
from werkzeug.security import generate_password_hash

INFILE = "pipeline/dataset/users.csv"
OUTFILE = INFILE + ".tmp"

with open(INFILE, newline="", encoding="utf-8") as inf, \
     open(OUTFILE, "w", newline="", encoding="utf-8") as outf:

    reader = csv.DictReader(inf)
    writer = csv.DictWriter(outf, fieldnames=reader.fieldnames)
    writer.writeheader()

    for row in reader:
        pw = row["password"]
        if not pw.startswith("pbkdf2:sha256:"):
            row["password"] = generate_password_hash(pw)
        writer.writerow(row)

# replace the old file
os.replace(OUTFILE, INFILE)
print("complete")