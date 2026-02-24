from database import db
import json  # הוסף את הייבוא הזה לשימוש ב-json.dumps/loads
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import func # עבור פונקציה חישוב הדירוג
from models.base_model import BaseModel
from models.rating import Rating

# מילון הממפה את ה-ID שיישמר ב-DB לערך הטקסטואלי המוצג למשתמש
# הערכים האלה  מתאימים לאפשרויות שהגדרנו גם ב-Angular
# הגדרת קבועים עבור שדה קטגורית מתכון
CATEGORY_CHOICES = {
    0: 'Main Dishes',
    1: 'Desserts',
    2: 'Cakes',
    3: 'Cookies',
    4: 'Salads',
    5: 'Soups',
    6: 'Breads',
    7: 'Ice creams',
    8: 'Pies and tarts',
    9: 'Main courses',
    10: 'Side dishes',
}
# +++++ קבועים חדשים לדרגת קושי (1-5) +++++
DIFFICULTY_CHOICES = {
    1: 'Very easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very hard'
}


class Recipe(BaseModel):
    __tablename__ = 'recipes'

    # מפתח זר (Foreign Key): מקשר למשתמש שיצר את המתכון
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # שדות ליבה
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)  # Text מאפשר יותר תוכן מ-String
    instructions = db.Column(db.Text, nullable=False)  # הוראות הכנה - חובה
    notes = db.Column(db.Text, nullable=True)  # הערות - אופציונלי
    servings = db.Column(db.Integer, nullable=True)#כמות מנות
    main_image_path = db.Column(db.String(255), nullable=False)  # נתיב התמונה המקורית
    variation_paths = db.Column(db.Text, nullable=True)    # נתיבים לתמונות הווריאציה (יישמר כ-JSON String)
    # שדות למיון וסינון
    preparation_time = db.Column(db.Integer, nullable=True)  # זמן הכנה בדקות
    kashrut = db.Column(db.Integer, default=0)# כשרות: 0=פרווה, 1=חלבי, 2=בשרי
    # נשמור ב-DB את המספר (0, 1, 2, וכו') כדי לחסוך מקום ולזרז שאילתות
    category = db.Column(db.Integer, default=0)    # קטגורית מתכון
    # 1: Easy, 2: Medium, 3: Hard (אנו שומרים את המספר)
    difficulty = db.Column(db.Integer, default=1)# דרגת קושי

    # יחסים:
    # קשר One-to-Many: מתכון אחד יכול להכיל רכיבים רבים
    ingredients = db.relationship('Ingredient', backref='recipe', lazy=True, cascade="all, delete-orphan")
    # קשר One-to-Many: מתכון אחד יכול לקבל דירוגים רבים
    ratings = db.relationship('Rating', backref='recipe_rated', lazy=True, cascade="all, delete-orphan")
    #מתכון אחד יכול לקבל תגובות רבות
    comments = db.relationship('Comment', backref='recipe_commented', lazy=True, cascade="all, delete-orphan")

    # +++++ פונקציה להחזרת הקטגוריה בצורה קריאה למשתמש +++++
    @hybrid_property
    def category_name(self):
        """מחזיר את שם הקטגוריה המלא במקום ה-ID."""
        # אם ה-ID קיים במילון, נחזיר את השם, אחרת נחזיר "Unknown"
        return CATEGORY_CHOICES.get(self.category, 'Unknown')

    # +++++ פונקציה להחזרת דרגת הקושי בצורה קריאה למשתמש +++++
    @hybrid_property
    def difficulty_name(self):
        """מחזיר את שם דרגת הקושי המלא במקום ה-ID."""
        return DIFFICULTY_CHOICES.get(self.difficulty, 'Unknown')

    # +++++ פונקציה לחישוב הדירוג הממוצע ב-Python +++++
    @hybrid_property
    def average_rating(self):
        """מחזיר את הדירוג הממוצע של המתכון."""
        # self.ratings - הגישה לכל אובייקטי ה-Rating שמקושרים למתכון הזה
        total_ratings = len(self.ratings)
        if total_ratings == 0:
            return 0.0
        # sum(r.rating for r in self.ratings) - סכימת כל עמודות ה-rating
        return sum(r.score for r in self.ratings) / total_ratings

    # +++++ פונקציה לאפשרות שאילתות DB לפי הדירוג הממוצע +++++
    @average_rating.expression
    def average_rating(cls):
        """מאפשר שימוש ב-average_rating בשאילתות SQLAlchemy (כמו Order By)."""
        return db.session.query(func.avg(Rating.score)). \
            filter(Rating.recipe_id == cls.id). \
            scalar_subquery()

    def __repr__(self):
        return f'<Recipe {self.title}>'
