# Backend Run Guide

1. `cd backend`
2. `python -m venv .venv`
3. `.venv\\Scripts\\activate`
4. `pip install -r requirements.txt`
5. `python manage.py makemigrations sensors hazards incidents`
6. `python manage.py migrate`
7. `python manage.py runserver`
