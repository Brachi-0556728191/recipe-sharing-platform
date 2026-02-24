from flask import Blueprint, jsonify, session
from models.user import User

# הגדרת ה-Blueprint
connection_status = Blueprint('connection_status', __name__)


# ניתוב בדיקת סטטוס: GET /api/status/check
@connection_status.route('/check', methods=['GET'])
def check_status():
    """
    בודק האם המשתמש מחובר ע"י בדיקת ה-Session.
    אם המשתמש מחובר, מחזיר את הפרטים שלו.
    מופעל בכל טעינה של Angular כדי לשחזר את מצב ההתחברות.

    Returns:
        JSON: {'logged_in': bool, 'user_id': int, 'username': str, 'email': str, 'role': int}
        HTTP Status: 200 (תמיד, גם אם לא מחובר)
    """
    # שלב 1: בדיקה האם יש user_id ב-Session
    # session - מילון שמנוהל על ידי Flask, נשמר ב-Cookie בצד הלקוח
    # session.get('user_id') - מנסה לקרוא את המפתח 'user_id'
    # אם לא קיים, מחזיר None
    user_id = session.get('user_id')

    # אם אין user_id (כלומר, המשתמש לא מחובר)
    if not user_id:
        # מחזיר תשובה עם סטטוס 200 (בקשה תקינה)
        # אבל logged_in=False (לא מחובר)
        return jsonify({'logged_in': False}), 200

    # שלב 2: שליפת המשתמש ממסד הנתונים
    # User.query - ממשק של SQLAlchemy לשאילתות על טבלת users
    # .get(user_id) - שולף רשומה לפי Primary Key (id)
    # מחזיר אובייקט User או None אם לא נמצא
    user = User.query.get(user_id)

    # אם המשתמש לא קיים במסד (למשל, נמחק אחרי שהוא התחבר)
    if not user:
        # ניקוי: מסירים את user_id מה-Session
        # session.pop('key', None) - מוחק מפתח, None אומר "אל תזרוק שגיאה אם לא קיים"
        session.pop('user_id', None)

        # מחזיר logged_in=False
        return jsonify({'logged_in': False}), 200

    # שלב 3: המשתמש קיים וה-Session תקף
    # מחזיר נתוני המשתמש ללקוח
    return jsonify({
        'logged_in': True,  # סטטוס: מחובר
        'user_id': user.id,  # מזהה המשתמש
        'username': user.username,  # שם המשתמש (מחושב מ-first_name + last_name)
        'email': user.email,  # אימייל
        'role': user.role,  # רמת הרשאה (1, 2, או 3)
    }), 200  # קוד 200 = הבקשה עברה בהצלחה

