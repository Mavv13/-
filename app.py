from flask import Flask
from flask import request
import re
import os
import string
import json
import psycopg2

DATABASE_URL = os.environ['DATABASE_URL']
conn = psycopg2.connect(
    DATABASE_URL,
    sslmode='require')
cursor = conn.cursor()
cursor.execute("CREATE TABLE IF NOT EXISTS excel("
               "title TEXT PRIMARY KEY NOT NULL,"
               "data TEXT)")

app = Flask(__name__)


def make_index(col):
    num = 0
    for c in col:
        if c in string.ascii_letters:
            num = num * 26 + (ord(c.upper()) - ord('A')) + 1
    return num


def make_excel(n):
    res = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        res = chr(65 + remainder) + res
    return res


def make_matrix(get_list):
    sorted_list = sorted(get_list, key=lambda tup: tup[0])
    max_row = 0
    index_list = []
    index = []
    for elem in sorted_list:
        temp = re.compile("([a-zA-Z]+)([0-9]+)")
        index = temp.match(elem[0]).groups()
        index_list.append(index)
        if int(index[1]) > int(max_row):
            max_row = int(index[1])
    max_letter = index[0]
    max_col = make_index(max_letter)

    temp = [[{'key': ''+make_excel(count+1)+str(count2+1), 'value': ''} for count in range(max_col)]for count2 in range(max_row)]

    res = []
    res.extend(temp)

    for elem, replacement in zip(index_list, sorted_list):
        res[int(elem[1])-1][make_index(elem[0])-1]['value'] = str(replacement[1])

    return json.dumps(res)


def get_data():
    cursor.execute("""DELETE FROM excel WHERE title = ''""")
    cursor.execute("""SELECT * FROM excel""")
    res = make_matrix(cursor.fetchall())
    conn.commit()
    return res


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/api/table', methods=['GET'])
def get_table():
    return json.dumps(str(get_data()))

@app.route('/api/table', methods=['POST'])
def update_table():
    content = request.json
    cols = ''
    vals = ''
    for key in content:
        cols = str(key)
        vals = str(content[key])
        temp = re.compile("([A-Z]+)([0-9]+)")
        if temp.match(cols):
            req = """insert into excel values ('{}','{}')
                    on conflict (title) do update set data='{}' """.format(cols, vals, vals)
            cursor.execute(req)
    conn.commit()
    return json.dumps(str(get_data()))


if __name__ == '__main__':
    app.run()
