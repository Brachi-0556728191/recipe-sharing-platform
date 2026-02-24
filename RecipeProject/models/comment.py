# models/comment.py

from database import db
from models.base_model import BaseModel


class Comment(BaseModel):
    """
    מודל התגובה על מתכון.

    הגדרות חשובות:
    - כל תגובה קשורה למשתמש (user_id) ולמתכון (recipe_id)
    - created_at מגיע מ-BaseModel ומחזיק את הזמן של יצירת התגובה
    """
    __tablename__ = 'comments'

    # ===================== מפתחות זרים =====================
    # מקשר לסדרת המשתמש שכתב את התגובה
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # מקשר למתכון שעליו הכתבנו את התגובה
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

    # ===================== תוכן התגובה =====================
    # תוכן התגובה (טקסט חופשי, יכול להיות ארוך)
    content = db.Column(db.Text, nullable=False)

    # ===================== Meta Data =====================
    # אחרון עדכון (אם המשתמש יערוך תגובה בעתיד)
    # עכשיו לא נשתמש בו, אבל טוב לתכנון עתיד
    updated_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<Comment by User {self.user_id} on Recipe {self.recipe_id}>'

# ===================== הסברים מפורטים =====================
#
# 1. למה BaseModel?
#    ✅ BaseModel מעניק לנו את:
#       - id (Primary Key)
#       - created_at (זמן יצירה אוטומטי)
#       - methods: save(), delete()
#    זה חוסך חזרה על קוד ומבטיח עקביות בכל המודלים
#
# 2. למה ForeignKey?
#    ✅ ForeignKey יוצר קישור חזק בין טבלאות:
#       - מונע הוספת comment עם user_id שלא קיים
#       - מאפשר "cascade delete" - אם משתמש מתחזק, כל התגובות שלו נמחקות אוטומטית
#
# 3. nullable=False על content?
#    ✅ כי לא יכול להיות comment ריק! זה חסר משמעות
#
# 4. למה content הוא Text ולא String?
#    ✅ String מוגבל ל-255 תווים בדרך כלל
#    ✅ Text מאפשר תגובות ארוכות (עד גודל הבסיס)
#    זה דומה למה שעשינו גם ב-Recipe.description
#
# 5. למה updated_at הוא nullable?
#    ✅ כי בשלב הראשון לא נתמוך בעריכת תגובות
#    ✅ אם בעתיד נוסיף edits, נעדכן את הוא כל edit
#    זה תכנון טוב למדוד - לא נוסיף יכולות שלא צריך עכשיו