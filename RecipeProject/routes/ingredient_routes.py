import json  # ייבוא מובנה: לטיפול בנתוני ה-JSON מה-Request
from flask import Blueprint, request, jsonify, current_app

from database import db  # ייבוא פנימי: אובייקט מסד הנתונים של SQLAlchemy
from models.ingredient import Ingredient  # ייבוא פנימי: מודל הרכיבים
from models.recipe import Recipe  # ייבוא פנימי: מודל המתכון

ingredient = Blueprint('ingredient', __name__)


# =================================================================
# ניתוב 8: קבלת רשימת כל הרכיבים הייחודיים (לצורך Autocomplete)
# GET /api/recipes/ingredients/all
# =================================================================
@ingredient.route('/all', methods=['GET'])
def get_all_ingredients():
    """
    מחזיר רשימה של כל הרכיבים הייחודיים במערכת עם ספירת הופעות.
    ✅ נגיש לכולם (לא דורש התחברות).

    אלגוריתם:
    1. שליפת כל הרכיבים מטבלת ingredients
    2. ניקוי כפילויות (case-insensitive) + ספירה
    3. מיון אלפביתי
    4. החזרה כ-JSON

    דוגמת תשובה:
    [
      {"name": "קמח", "count": 45},
      {"name": "סוכר", "count": 38}
    ]

    📌 הערה חשובה:
    אנחנו משתמשים במודל Ingredient הקיים (לא צריך מחלקה חדשה!)
    אבל לא מחזירים אובייקטי SQLAlchemy ישירות - מכינים מילונים פשוטים.
    """
    try:
        # ===== שלב 1: שליפת נתונים =====

        # Ingredient.query.all() - שאילתת SQL: SELECT * FROM ingredients
        # מחזיר רשימה של אובייקטי Ingredient (מופעי המחלקה)
        all_ingredients = Ingredient.query.all()

        # דוגמה למה שחוזר:
        # [
        #   <Ingredient id=1 name="קמח" recipe_id=5>,
        #   <Ingredient id=2 name="קמח" recipe_id=8>,
        #   <Ingredient id=3 name="סוכר" recipe_id=5>
        # ]

        # ===== שלב 2: בניית מבנה נתונים לספירה =====

        # נשתמש במילון (dictionary) כדי לספור כפילויות
        # המבנה: {שם_באותיות_קטנות: (שם_מקורי, ספירה)}
        ingredients_map = {}

        # לולאה על כל הרכיבים
        for ing in all_ingredients:
            # ניקוי וסטנדרטיזציה של השם:
            # 1. .strip() - מסיר רווחים מיותרים בהתחלה/סוף
            # 2. .lower() - המרה לאותיות קטנות (עובד גם על עברית!)
            name_lower = ing.name.strip().lower()

            # דוגמה:
            # "  קמח  " -> "קמח" -> "קמח" (lowercase)
            # "קֶמַח" -> "קמח" (ניקוד מוסר אוטומטית ב-.lower())

            # ===== בדיקה: האם הרכיב כבר קיים? =====
            if name_lower in ingredients_map:
                # הרכיב כבר קיים - נגדיל את הספירה

                # פירוק ה-tuple:
                # ingredients_map[name_lower] מחזיר: ("קמח", 3)
                original_name, count = ingredients_map[name_lower]
                # original_name = "קמח"
                # count = 3

                # עדכון: מגדילים את count ב-1
                ingredients_map[name_lower] = (original_name, count + 1)
                # עכשיו: ("קמח", 4)

            else:
                # רכיב חדש - נוסיף אותו למילון
                # שומרים את השם המקורי (עם רישיות!) והספירה מתחילה מ-1
                ingredients_map[name_lower] = (ing.name.strip(), 1)

                # למה לשמור את השם המקורי?
                # כי אנחנו רוצים להציג "קמח" ולא "קמח" (lowercase)

        # ===== דוגמה למבנה הסופי של ingredients_map: =====
        # {
        #   "קמח": ("קמח", 45),
        #   "סוכר": ("סוכר", 38),
        #   "שוקולד מריר חום": ("שוקולד מריר חום", 12)
        # }

        # ===== שלב 3: המרה לרשימת מילונים (JSON-ready) =====

        # .values() מחזיר את כל הערכים (values) מהמילון - רק ה-tuples
        # דוגמה: [("קמח", 45), ("סוכר", 38), ...]

        # List Comprehension - בונה רשימה חדשה של מילונים
        ingredients_list = [
            {
                'name': original_name,   # השם המקורי (עם רישיות)
                'count': count           # מספר ההופעות
            }
            for original_name, count in ingredients_map.values()
            # ^ לולאה שעוברת על כל tuple ופורקת אותו ל-2 משתנים
        ]

        # דוגמה לתוצאה:
        # [
        #   {'name': 'קמח', 'count': 45},
        #   {'name': 'סוכר', 'count': 38}
        # ]

        # ===== שלב 4: מיון אלפביתי =====

        # .sort() - ממיין את הרשימה **במקום** (in-place)
        # key= - פונקציה שמגדירה "לפי מה למיין"
        # lambda x: x['name'].lower() - פונקציה אנונימית:
        #   - x הוא כל פריט ברשימה (מילון)
        #   - x['name'] הוא שם הרכיב
        #   - .lower() למיון נכון של עברית (אבקת אפייה < ביצים)
        ingredients_list.sort(key=lambda x: x['name'].lower())

        # ===== שלב 5: רישום ללוג (Debug) =====

        # current_app.logger - הלוגר של Flask
        # .info() - רמת חומרה INFO (לא שגיאה, רק מידע)
        current_app.logger.info(
            f"✅ Returning {len(ingredients_list)} unique ingredients to client"
        )

        # ===== שלב 6: החזרת התשובה =====

        # jsonify() - המרה למבנה JSON + הגדרת headers מתאימים
        # 200 - קוד סטטוס HTTP (הצלחה)
        return jsonify(ingredients_list), 200

    except Exception as e:
        # ===== טיפול בשגיאות =====

        # רישום השגיאה ללוג
        current_app.logger.error(f"❌ Error in get_all_ingredients: {e}")

        # החזרת תשובת שגיאה ללקוח
        return jsonify({
            'message': 'Failed to fetch ingredients',
            'error': str(e)  # פירוט השגיאה (רק לפיתוח! בייצור להסיר)
        }), 500  # 500 = Internal Server Error