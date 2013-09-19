import csv

with open('data.csv', 'rb') as csvfile:
    reader = csv.reader(csvfile)
    for line in reader:
      print line
