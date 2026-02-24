import os
from flask import Flask
from database import db  # ייבוא ה-DB שהוגדר בקובץ database.py
from flask_cors import CORS

# הגדרת שם לקובץ מסד הנתונים שלנו
DB_NAME = 'recipes_platform.db'


def create_app():
    # יצירת מופע של Flask
    app = Flask(__name__)

    # 1. הגדרות קונפיגורציה
    app.config['SECRET_KEY'] = 'somerandomsecretkeyforencryption'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

    # # =================================================================
    # # 2. Session / Cookies (חשוב ל-Angular cross-origin)
    # # =================================================================
    # app.config['SESSION_COOKIE_NAME'] = 'session'
    # app.config['SESSION_COOKIE_HTTPONLY'] = True
    # app.config['SESSION_COOKIE_SECURE'] = False  # HTTP פיתוח בלבד
    # app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # חובה ל-cross-origin עם Angular

    # =================================================================
    # 2. Session / Cookies - הגדרות חשובות!
    # =================================================================
    app.config['SESSION_COOKIE_NAME'] = 'session'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = False  # HTTP בפיתוח, HTTPS בייצור
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # ✅ שינוי: Lax במקום None
    app.config['SESSION_COOKIE_DOMAIN'] = None  # ✅ חשוב: אל תקבע domain ספציפי
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 שעות
    app.config['SESSION_REFRESH_EACH_REQUEST'] = True  # ✅ חשוב: רענן כל בקשה

    # 2. אתחול SQLAlchemy (חיבור אובייקט ה-DB למופע השרת app)
    db.init_app(app)

    # הקוד הבא עבד נכון אבל רץ ספציפי על הניתוב: http://localhost:4200
    # ואם פעם אנגולר ירוץ על ניתוב אחר כמו http://localhost:4201
    # יצטרכו לשנות ידנית את הקובץ
    # CORS(app,
    #      resources={r"/api/*": {"origins": "http://localhost:4200"}},
    #      supports_credentials=True
    #      )


    # --- הגדרת CORS דינמית ---
    # קריאת כתובת ה-Frontend ממשתנה סביבה
    #(משתנה סביבה = משתנה שקיים מחוץ לקוד, ברמת מערכת ההפעלה.)
    # os.environ - מילון שמכיל את כל משתני הסביבה של המערכת
    # .get('FRONTEND_URL', 'http://localhost:4200') - ניסיון לקרוא משתנה בשם FRONTEND_URL
    # הפרמטר השני ('http://localhost:4200') הוא ברירת מחדל אם המשתנה לא קיים

    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:4200')
    # FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:52065')
    print(f"Server is accepting requests from: {FRONTEND_URL}")  # הוספתי הדפסה כדי שתראי בלוג
    # שימוש במשתנה בהגדרת CORS
    CORS(app,
         resources={r"/api/*": {"origins": FRONTEND_URL}},
         supports_credentials=True,  # ← חובה לקוקיס!
         allow_headers=["Content-Type"],
         expose_headers=["Content-Type"],
         methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"],
         max_age=3600
         )

    # 3. ייבוא ורישום ה-Blueprints (הניתובים)
    from routes.auth_routes import auth
    from routes.recipes_routes import recipes
    from routes.connection_status_routes import connection_status
    from routes.ratings_routes import ratings
    from routes.comments_routes import comments
    from routes.ingredient_routes import ingredient
    from routes.profile_routes import profile

    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(recipes, url_prefix='/api/recipes')
    app.register_blueprint(connection_status, url_prefix='/api/status')
    app.register_blueprint(ratings, url_prefix='/api/ratings')
    app.register_blueprint(comments, url_prefix='/api/comments')
    app.register_blueprint(ingredient, url_prefix='/api/recipes/ingredient')
    app.register_blueprint(profile,url_prefix='/api/profile')


    # 4. ייבוא המודלים (נדרש כדי ש-SQLAlchemy יכיר את הטבלאות)
    from models.user import User
    from models.recipe import Recipe
    from models.ingredient import Ingredient
    from models.rating import Rating
    from models.comment import Comment

    # 5. יצירת מסד הנתונים (יוצר את הקובץ recipes_platform.db אם לא קיים)
    with app.app_context():
        db.create_all()
        print('Created Database!')

    # נחזיר את מופע האפליקציה שהוכן
    return app

# יצירת האפליקציה בפועל
app = create_app()

# הרצת השרת במצב פיתוח
if __name__ == '__main__':
    app.run(debug=True, port=5000)
