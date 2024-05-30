import os
import signal
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/shutdown', methods=['POST'])
def shutdown():
    if request.method == 'POST':
        shutdown_server()
    return 'Server shutting down...'

def shutdown_server():
    pid = os.getpid()
    os.kill(pid, signal.SIGINT)

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('home.html')

def run_flask():
    app.run(port=8080)

if __name__ == '__main__':
    run_flask()