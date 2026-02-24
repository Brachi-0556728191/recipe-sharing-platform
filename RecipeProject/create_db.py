# create_db.py

import os
from app import create_app, DB_NAME
from database import db

# !!! חובה לייבא את כל המודלים כדי ש-SQLAlchemy יכיר אותם !!!
from models.user import User
from models.recipe import Recipe
from models.ingredient import Ingredient
from models.rating import Rating
from models.comment import Comment

app = create_app()

def create_database():
    """מוחק ויוצר מחדש את מסד הנתונים והטבלאות על פי המודלים המעודכנים."""
    with app.app_context():
        # --- אזהרה: מחיקת קובץ ה-DB הקיים ---
        # אם יש לך נתונים חשובים, אנא גבה את recipes_platform.db לפני ההרצה!
        if os.path.exists(DB_NAME):
            print(f"Deleting existing database file: {DB_NAME}")
            os.remove(DB_NAME)

        print("Creating all database tables based on models...")
        # הפקודה שיוצרת את כל הטבלאות
        db.create_all()
        print("Database tables created successfully! recipes_platform.db is ready.")

        # === יצירת משתמש אדמין ראשוני (Seed Data) ===
        try:
            # הסיסמה '123' תוצפן אוטומטית ע"י ה-Setter שהגדרת ב-user.py
            admin = User(first_name='Admin', last_name='User',
                         email='admin@recipe.com',
                         password='Aa!12345',
                         role=3) # Role=3 הוא מנהל
            admin.save()

            new_user = User(
                first_name='AA',
                last_name='BB',
                email='ab@gmail.com',
                role=2  # הגדרת הרשאת יצירת מתכון
            )
            # שימי לב: ה-setter של הסיסמה מצפין אותה אוטומטית!
            new_user.password = 'Aa!12345'
            new_user.save()

            new_user2 = User(
                    first_name='QQ',
                last_name='WW   ',
                email='qw@gmail.com',
                role=1  # הגדרת הרשאת יצירת מתכון
            )
            # שימי לב: ה-setter של הסיסמה מצפין אותה אוטומטית!
            new_user2.password = 'Aa!12345'
            new_user2.save()


            print("Initial Admin user created (email: admin@recipe.com, pass: 123).")
        except Exception as e:
            # נתפוס שגיאות אם הטבלה כבר קיימת (אם לא מחקת את הקובץ), או בעיות אחרות
            print(f"Could not create initial admin user: {e}")

if __name__ == '__main__':
    create_database()