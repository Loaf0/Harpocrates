from flask import Flask, flash, render_template, request, redirect, send_from_directory, url_for, session, abort

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('home.html')

if __name__ == '__main__':
    app.run(port=8080)