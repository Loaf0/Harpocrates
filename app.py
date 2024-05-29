import os
import signal
import tkinter as tk
from tkinterweb import HtmlFrame
import threading
from flask import Flask, render_template, request

def run_tkinter():
    def on_closing():
        shutdown_server()
        root.destroy()

    root = tk.Tk()
    root.title("Nyx Messenger")
    root.iconbitmap('Nyx.ico')
    root.geometry("800x600")
    root.resizable(False, False)
    frame = HtmlFrame(root)
    frame.load_website("http://127.0.0.1:8080")
    frame.pack(fill="both", expand=True)
    root.protocol("WM_DELETE_WINDOW", on_closing)

    root.mainloop()

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
    tkinter_thread = threading.Thread(target=run_tkinter)
    flask_thread = threading.Thread(target=run_flask)

    tkinter_thread.start()
    flask_thread.start()

    tkinter_thread.join()
    flask_thread.join()
