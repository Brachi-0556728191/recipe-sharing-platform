from database import db
from models.base_model import BaseModel
from sqlalchemy.ext.hybrid import hybrid_property
from werkzeug.security import generate_password_hash, check_password_hash


class User(BaseModel):
    __tablename__ = 'users'

    # ------------------- שדות פיזיים (נשמרים ב-DB) -------------------
    # שדות שם פרטי ומשפחה (משמשים כבסיס ל-username)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    is_approved_uploader = db.Column(db.Boolean, nullable=True)
    #כשמשתמש ישלח בקשה יהפוך להיות true, ולאחר אישור / דחיה יהפוך בחזרה ל false
    pending_content_role_request = db.Column(db.Boolean, default=False, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128), nullable=False)#רק הסיסמה המגובבת נשמרת במסד
    role = db.Column(db.Integer, default=1)

    # יחסים (Relationships)
    recipes = db.relationship('Recipe', backref='author', lazy=True)
    ratings = db.relationship('Rating', backref='rater', lazy=True)
    comments = db.relationship('Comment', backref='commenter', lazy=True, cascade="all, delete-orphan")
    # db.relationship('Comment', ...):
    # ✅ מחברת את User ל-Comment דרך foreign key (user_id)
    # ✅ עכשיו אפשר לעשות: user.comments כדי לקבל את כל התגובות של משתמש
    #
    # backref='commenter':
    # ✅ יוצר reference הפוך: comment.commenter יחזיר את ה-User שכתב
    # ✅ זה בדיוק כמו שיש comment.author ב-Recipe
    #
    # lazy=True:
    # ✅ תגובות נטענות רק כשמבקשים אותן (לא בקריאה ראשונה של User)
    # ✅ חוסך זמן טעינה
    #
    # cascade="all, delete-orphan":
    # ✅ אם משתמש נמחק, כל התגובות שלו נמחקות אוטומטית
    # ✅ "orphan" = תגובה ללא משתמש (בן יתום)
    # ✅ זה שמור ומשמעותי - לא נשאיר תגובות בלא בעלים



    # ------------------- שדה וירטואלי (Virtual Field) -------------------
    # ההגדרה: @ hybrid_property  - מאפשרת ליצור שדה "וירטואלי" שאינו נשמר ב-DB, אלא מחושב אוטומטית
    @hybrid_property
    def username(self):
        """שדה מחושב: מחזיר את שם המשתמש כצירוף של שם פרטי ומשפחה."""
        # לדוגמה: "John Doe"
        return f"{self.first_name} {self.last_name}"
       # חשוב: שדה username עכשיו אינו נשמר ב-DB, אלא מחושב בכל פעם שקוראים לו!

    # ------------------- מנגנון הצפנת סיסמאות -------------------
    @hybrid_property
    def password(self):
        return self._password_hash

#המושג: setter - מגדיר מה קורה מאחורי הקלעים כאשר אנו מעדכנים את המאפיין user.password (לדוגמה: user.password = '123')
    @password.setter
    # הפונקציה הבאה בצע גיבוב (Hashing) לסיסמה שהתקבלה ושומר את המחרוזת המוצפנת ב-DB.
    def password(self, password):
        self._password_hash = generate_password_hash(password)
    #הפונקציה הבאה בודק האם הסיסמה הלא-מגובבת שהתקבלה מהלקוח תואמת את הגיבוב השמור ב-_password_hash
    def check_password(self, password):
        return check_password_hash(self._password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

