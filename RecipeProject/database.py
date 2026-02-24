from flask_sqlalchemy import SQLAlchemy #מייבא את ספריית הקישור בין Flask למסדי נתונים (ORM).
db = SQLAlchemy()  ##אתחול: יוצר את אובייקט ה-DB. הוא עדיין לא מחובר לשרת Flask (החיבור יתבצע ב-app.py).