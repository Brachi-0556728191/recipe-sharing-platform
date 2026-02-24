# routes/auth_routes.py

from flask import Blueprint, request, jsonify, session  # ייבוא המחלקות הנדרשות
from database import db  #  ייבוא אובייקט ה-DB (לטיפול בשגיאות)
from models.user import User  #  ייבוא מודל המשתמש
from utils.decorators import login_required, role_required # ייבוא הדקורטורים


# 1. הגדרת ה-Blueprint
# 'auth' הוא מודול הניתובים שאחראי על אימות המשתמשים.
auth = Blueprint('auth', __name__)
#זה מבטיח שכל OPTIONS preflight ל‑login יקבל את ה‑headers הנכונים.

#----------------------------------------------
# 2. ניתוב הרשמה: POST /api/auth/register
#---------------------------------------------
@auth.route('/register', methods=['POST'])
def register():
    """
    מטפל בבקשת הרשמה של משתמש חדש.
    בודק כפילות לפי אימייל ומצפין סיסמה אוטומטית.
    """

    #קולטת את מחרוזת ה-JSON וממירה אותה אוטומטית למילון Python.
    data = request.get_json()

    # 1. וולידציה: בדיקה האם כל שדות החובה קיימים
    required_fields = ['first_name', 'last_name', 'email', 'password']
    if not data or not all(data.get(field) for field in required_fields):
        return jsonify({'message': 'Missing required fields in request'}), 400

    # 2. קליטת נתונים (first_name, last_name, email, password - חובה)
    first_name = data['first_name']
    last_name = data['last_name']
    email = data['email']
    password = data['password']
    # טלפון וכתובת הם אופציונליים (nullable=True במודל)
    phone = data.get('phone')
    address = data.get('address')

    # 3. בדיקת כפילות (בדיקה רק על האימייל, כיוון שהוא השדה הייחודי)
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 409  # 409 Conflict

    # 4. יצירת המשתמש החדש (username יחושב אוטומטית מהשם הפרטי והמשפחה)
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        address=address,
        email=email,
        password=password,  # הסיסמה מוצפנת אוטומטית במודל User
        role=1  # רול ברירת מחדל: משתמש רגיל
    )

    # 5. שמירה במסד הנתונים וטיפול בשגיאות
    try:
        new_user.save()
    except Exception as e:
        db.session.rollback()  # מבטל את הפעולה במקרה של כשל DB
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    session['user_id'] = new_user.id
    session.modified = True
    print(f"✅ User {new_user.id} logged in. Session: {session.get('user_id')}")

    # 6. החזרת תגובת הצלחה (201 Created)
    return jsonify({
        'message': 'User registered successfully!',
        'user_id': new_user.id,
        'username': new_user.username,
        'email': new_user.email
    }), 201


@auth.route('/login', methods=['POST'])
def login():
    session.clear()
    data = request.get_json()

    if not data or not all(data.get(field) for field in ['username', 'email', 'password']):
        return jsonify({'message': 'חסרים פרטים: שם משתמש, אימייל או סיסמה', 'field': 'general'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # 1. בדיקה האם האימייל קיים בכלל
    user = User.query.filter_by(email=email).first()

    if not user:
        # אימייל לא נמצא
        return jsonify({'message': 'כתובת האימייל אינה רשומה במערכת, יש לבצע רישום', 'field': 'email'}), 401

    # 2. אימות שם משתמש (הדרישה החדשה שלך)
    # מוודאים ששם המשתמש שהוזן תואם למה ששמור בבסיס הנתונים עבור האימייל הזה
    if user.username != username:
        return jsonify({
            'message': 'שם המשתמש אינו תואם לכתובת האימייל הזו',
            'field': 'username'
        }), 401

    # 3. בדיקת סיסמה
    if not user.check_password(password):
        return jsonify({'message': 'הסיסמה שגויה', 'field': 'password'}), 401

    # 4. התחברות מוצלחת
    session['user_id'] = user.id
    session.modified = True

    return jsonify({
        'message': 'Login successful',
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    }), 200


# 4. ניתוב התנתקות: POST /api/auth/logout
@auth.route('/logout', methods=['POST'])
def logout():
    """
    מבטל את ה-Session של המשתמש הנוכחי (התנתקות).
    """
    session.pop('user_id', None)  # מסיר את מזהה המשתמש מה-Session
    session.modified = True  # ✅ חוב! אמור לפלסק לשמור את השינוי
    return jsonify({'message': 'Logged out successfully'}), 200
