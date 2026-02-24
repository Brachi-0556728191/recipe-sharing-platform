# models/base_model.py

from datetime import datetime
from database import db # נשתמש ב-db שנגדיר בקובץ database.py

class BaseModel(db.Model):
    # הגדרת הטבלה הזו כ'Abstract' - היא לא תהיה טבלה בפני עצמה, רק תבנית
    __abstract__ = True

    # שדות חובה לכל הטבלאות:
    # 1. מזהה ייחודי (Primary Key)
    id = db.Column(db.Integer, primary_key=True)

    # 2. תאריך יצירה (שדה שהוספנו מסיבות של מקצועיות ומיון)
    # default=datetime.utcnow: נותן את השעה הנוכחית ב-UTC כערך ברירת מחדל
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- פונקציות בסיסיות לניהול מסד נתונים ---
    # שמירת אובייקט חדש או קיים למסד הנתונים
    def save(self):
        db.session.add(self)
        db.session.commit()

    # מחיקת אובייקט ממסד הנתונים
    def delete(self):
        db.session.delete(self)
        db.session.commit()


# --- שאלות המורה: למה בחרת דווקא בקוד הזה? ---
# 1. למה השתמשת ב-__abstract__ = True?
#    תשובה: כדי למנוע יצירת טבלה נפרדת ל-BaseModel. זה רק טמפלט לשאר המודלים.
# 2. למה השתמשת ב-db.session.commit() בתוך הפונקציות save() ו-delete()?
#    תשובה: כל שינוי שנעשה במסד הנתונים (כמו הוספה או מחיקה) דורש אישור סופי (commit) כדי שהשינוי יופיע בפועל.
# 3. למה השדה id הוא מסוג db.Integer ו-primary_key=True?
#    תשובה: זהו מזהה ייחודי לכל שורה (Entity). Integer הוא קל ויעיל, ו-primary_key מבטיח שכל ערך יהיה יחיד ושאי אפשר יהיה להשאיר אותו ריק.
# 4. למה בחרת ב-datetime.utcnow כברירת מחדל ל-created_at?
#    תשובה: UTC (זמן אוניברסלי מתואם) הוא הדרך הטובה ביותר לשמור זמנים בשרת. זה מונע בלבול בין אזורי זמן שונים בעולם.