from functools import wraps
from flask import session, jsonify
from models.user import User


# =================================================================
# 1. דקורטור: login_required
# =================================================================
def login_required(f):
    """
    Decorator שמבטיח שהמשתמש מחובר.
    שולף את אובייקט המשתמש (current_user) מה-Session ומעביר אותו לניתוב.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. בדיקה האם יש מזהה משתמש ב-Session
        user_id = session.get('user_id')
        if not user_id:
            # דורשת: החזרת 403 Forbidden אם לא מאומת
            return jsonify({'message': 'Access Forbidden: Login required'}), 403

            # 2. שליפת אובייקט המשתמש
        user = User.query.get(user_id)
        if not user:
            # אם ה-ID קיים אבל המשתמש נמחק (ניקוי Session)
            session.pop('user_id', None)
            return jsonify({'message': 'Access Forbidden: Invalid user session'}), 403

        # 3. העברת אובייקט המשתמש המחובר לניתוב המקורי
        return f(current_user=user, *args, **kwargs)

    return decorated_function


# =================================================================
# 2. דקורטור: role_required
# =================================================================
def role_required(min_role):
    """
    Decorator שמבטיח שהמשתמש המחובר מחזיק ברול מינימלי.
    הבדיקה היא: user.role >= min_role.
    """

    def decorator(f):
        @wraps(f)
        @login_required  # חובה: מפעיל קודם את בדיקת ההתחברות (login_required)
        def decorated_function(current_user, *args, **kwargs):
            print(f"🔍 role_required check:")
            print(f"   Required min_role: {min_role}")
            print(f"   User {current_user.id} has role: {current_user.role}")
            # 1. בדיקה מדויקת של הרול (required_role הוא פרמטר שהועבר לדקורטור)
            if current_user.role < min_role:
                print(f"   ❌ Role {current_user.role} < {min_role} - returning 403")
                # הרול לא תואם
                return jsonify(
                    {'message': f'Access Forbidden: Insufficient permissions (Role {current_user.role})'}), 403

                # 2. אם הרול תקין, ממשיך לפונקציה המקורית
            print(f"   ✅ Role check passed")
            return f(current_user=current_user, *args, **kwargs)

        return decorated_function

    return decorator