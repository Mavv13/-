from flask import Flask
import sqlite3

conn = sqlite3.connect("mydatabase.db")  # или :memory: чтобы сохранить в RAM
cursor = conn.cursor()

cursor.execute("""SELECT * FROM albums""")
print(cursor.fetchall())

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


if __name__ == '__main__':
    app.run()
