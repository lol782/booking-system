from pyngrok import ngrok
import sys
import os
from pathlib import Path

# Add the project directory to Python path
current_dir = Path(__file__).resolve().parent
project_dir = current_dir / 'myproject'  # Point to the myproject directory
sys.path.append(str(project_dir))

# Set your authtoken here (get it from https://dashboard.ngrok.com/auth)
NGROK_AUTH_TOKEN = "30TFHOd7UIg3Vu9Yowpk6091r5c_XSwvPp8Rt6qdMvZwNaTw"  # Replace with your actual token

def start_ngrok():
    print("Configuring ngrok authentication...")
    ngrok.set_auth_token(NGROK_AUTH_TOKEN)
    
    # Check if Django server is responding
    import requests
    try:
        response = requests.get("http://127.0.0.1:8000")
        print("Django server is running!")
    except requests.exceptions.ConnectionError:
        print("Warning: Django server doesn't seem to be running on port 8000")
        print("Waiting 5 seconds for Django to start...")
        import time
        time.sleep(5)
    
    # Open an HTTP tunnel on the default port 8000
    print("Starting ngrok tunnel...")
    public_url = ngrok.connect(8000)
    print(f"✅ ngrok tunnel established!")
    print(f"Public URL: {public_url}")
    print(f"Local URL: http://127.0.0.1:8000")

    try:
        # Keep the script running
        ngrok_process = ngrok.get_ngrok_process()
        try:
            # Block until CTRL-C or some other terminating event
            ngrok_process.proc.wait()
        except KeyboardInterrupt:
            print(" Shutting down server.")
    finally:
        # Kill the ngrok process
        ngrok.kill()

if __name__ == "__main__":
    # Change to the directory containing manage.py
    os.chdir(project_dir)  # Use the project_dir we defined above
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    
    try:
        import django
        django.setup()
        from django.core.management import execute_from_command_line
        print("Django setup successful!")
    except ImportError as exc:
        print(f"Error importing Django: {exc}")
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Start Django server first
    import threading
    django_thread = threading.Thread(target=lambda: execute_from_command_line(['manage.py', 'runserver']))
    django_thread.daemon = True
    django_thread.start()

    # Give Django a moment to start
    import time
    time.sleep(2)

    # Start ngrok after Django is running
    try:
        start_ngrok()
    except Exception as e:
        print(f"Error starting ngrok: {e}")
        sys.exit(1)
