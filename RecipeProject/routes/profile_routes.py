# 5. ניתוב בדיקה מוגן (דוגמה 1): /api/auth/profile




from flask import Blueprint, request, jsonify, session  # ייבוא המחלקות הנדרשות
from database import db  #  ייבוא אובייקט ה-DB (לטיפול בשגיאות)
from models.user import User  #  ייבוא מודל המשתמש
from utils.decorators import login_required, role_required # ייבוא הדקורטורים


# 1. הגדרת ה-Blueprint
# 'auth' הוא מודול הניתובים שאחראי על אימות המשתמשים.
profile = Blueprint('profile', __name__)
#זה מבטיח שכל OPTIONS preflight ל‑login יקבל את ה‑headers הנכונים.


@profile.route('/profileId', methods=['GET'])
@login_required # הדרך המקצועית: כל מה שצריך לעשות כדי להגן על הניתוב!
def get_user_profile(current_user):
    """
    ניתוב הנגיש לכל משתמש מחובר (Role 1, 2, או 3).
    ה-Decorator מעביר אלינו את current_user.
    """
    return jsonify({
        'message': 'Welcome to your profile!',
        'id': current_user.id,
        'username': current_user.username,
        'role': current_user.role,
        'email': current_user.email,
        'is_approved_uploader': current_user.is_approved_uploader,
        'pending_content_role_request':current_user.pending_content_role_request,
        'phone': current_user.phone,
        'address': current_user.address,
        'status': 'You are successfully authenticated'
    }), 200


# 7. ניתוב: הגשת בקשה למשתמש תוכן (Role 1 -> Pending)
# POST /api/auth/request-content-role
@profile.route('/request-content-role', methods=['POST'])
@login_required  # חובה להתחברות
def request_content_role(current_user):
    """משתמש רגיל (Role 1) מגיש בקשה למנהל להפוך למשתמש תוכן."""
    if current_user.role > 1:
        return jsonify({'message': 'You already have content creation permissions.'}), 400
    # 2. עדכון השדה החדש
    try:
        current_user.pending_content_role_request = True
        current_user.save()
        return jsonify({'message': 'Request submitted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error setting content role request: {e}")
        return jsonify({'message': 'Failed to submit request.'}), 500


# =================================================================
# 8. ניתוב: הצגת כל המשתמשים הממתינים (Admin Role 3)
# GET /api/auth/pending-content-requests
# =================================================================
@profile.route('/admin/pending-content-requests', methods=['GET'])
@role_required(min_role=3)  # רק למנהלים
def get_pending_content_requests(current_user):
    """מחזיר רשימה של משתמשים עם בקשת תוכן ממתינה."""
    try:
        # שליפת כל המשתמשים עם pending_content_role_request=True
        pending_users = User.query.filter(
            (User.pending_content_role_request == True),
            (User.role == 1)  # אופציונלי: מסנן רק משתמשי בסיס
        ).all()

        # בניית רשימת JSON להחזרה
        users_list = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'address': user.address,
            'is_approved_uploader':user.is_approved_uploader,
            'pending_content_role_request':user.pending_content_role_request,
            'created_at': user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for user in pending_users]

        return jsonify(users_list), 200
    except Exception as e:
        print(f"❌ Error fetching pending users: {e}")
        return jsonify({'message': 'Failed to fetch pending requests.'}), 500


# =================================================================
# 9. ניתוב: אישור בקשת מועמדות (Admin Role 3)
# POST /api/auth/approve-content-user
# =================================================================
@profile.route('/admin/approve-content-user', methods=['POST'])
@role_required(min_role=3)  # רק למנהלים
def approve_content_user(current_user):
    """מאשר משתמש רגיל כמשתמש תוכן (Role 2) ומנקה את סטטוס הבקשה."""
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    user_to_approve = User.query.get(user_id)
    if not user_to_approve:
        return jsonify({'message': 'User not found.'}), 404

    try:
        # עדכון הרול ל-2 (משתמש תוכן)
        user_to_approve.role = 2
        # ניקוי סטטוס הבקשה
        user_to_approve.pending_content_role_request = False
        user_to_approve.is_approved_uploader=True
        user_to_approve.save()  #

        return jsonify({'message': f'User {user_id} approved as content user (Role 2).'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error approving user: {e}")
        return jsonify({'message': 'Failed to approve user.'}), 500


# =================================================================
# 10. ניתוב: דחיית בקשת מועמדות (Admin Role 3)
# POST /api/auth/reject-content-user
# =================================================================
@profile.route('/admin/reject-content-user', methods=['POST'])
@role_required(min_role=3)  # רק למנהלים
def reject_content_user(current_user):
    """דוחה בקשה של משתמש, משאיר את הרול שלו כ-1 ומנקה את סטטוס הבקשה."""
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    user_to_reject = User.query.get(user_id)
    if not user_to_reject:
        return jsonify({'message': 'User not found.'}), 404

    try:
        # לא משנים את הרול (נשאר 1)
        # מנקים את סטטוס הבקשה
        user_to_reject.pending_content_role_request = False
        user_to_reject.is_approved_uploader=False
        user_to_reject.save()  #

        return jsonify({'message': f'Request for user {user_id} rejected.'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error rejecting user request: {e}")
        return jsonify({'message': 'Failed to reject user request.'}), 500