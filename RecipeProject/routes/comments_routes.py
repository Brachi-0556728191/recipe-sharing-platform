import json
from flask import Blueprint, request, jsonify, current_app, session
from database import db
from models.comment import Comment
from models.recipe import Recipe
from models.user import User
from utils.decorators import login_required

# ===================================================================
# יצירת Blueprint לניתובי התגובות
# ===================================================================
comments = Blueprint('comments', __name__)


# ===================================================================
# פונקציית עזר: קבלת current_user (אופציונלי)
# ===================================================================
def get_current_user_optional():
    """
    מחזיר את המשתמש הנוכחי אם הוא מחובר, אחרת None.
    """
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None


# ===================================================================
# ניתוב 1: הוספת תגובה חדשה
#  מוגן - רק משתמשים מחוברים יכולים להוסיף תגובה
# ===================================================================
@comments.route('', methods=['POST'])
@login_required
def add_comment(current_user):
    """
    הוספת תגובה חדשה על מתכון.
    נגיש רק למשתמשים מחוברים.
    """
    try:
        data = request.get_json()
        recipe_id = data.get('recipe_id')
        content = data.get('content', '').strip()

        if not recipe_id:
            return jsonify({'message': 'Recipe ID is required'}), 400

        if not content:
            return jsonify({'message': 'Comment cannot be empty'}), 400

        if len(content) > 5000:
            return jsonify({'message': 'Comment is too long (max 5000 characters)'}), 400

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'message': 'Recipe not found'}), 404

        new_comment = Comment(
            user_id=current_user.id,
            recipe_id=recipe_id,
            content=content
        )

        new_comment.save()

        response_data = {
            'id': new_comment.id,
            'user_id': new_comment.user_id,
            'recipe_id': new_comment.recipe_id,
            'content': new_comment.content,
            'created_at': new_comment.created_at.isoformat(),
            'author': current_user.username
        }

        return jsonify(response_data), 201

    except Exception as e:
        current_app.logger.error(f"Error adding comment: {e}")
        return jsonify({'message': 'Error adding comment'}), 500


# ===================================================================
# ניתוב 2: קבלת כל התגובות של מתכון מסוים
# גם משתמש לא מחובר יכול לראות תגובות
# ===================================================================
@comments.route('/<int:recipe_id>', methods=['GET'])
def get_recipe_comments(recipe_id):
    """
    שליפת כל התגובות של מתכון מסוים, ממוינות לפי תאריך.
    נגיש לכל המשתמשים (מחוברים ולא מחוברים).
    """
    try:
        # ✅ קבלת המשתמש הנוכחי (אופציונלי)
        current_user = get_current_user_optional()

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'message': 'Recipe not found'}), 404

        recipe_comments = Comment.query.filter_by(recipe_id=recipe_id).order_by(
            Comment.created_at.asc()
        ).all()

        comments_list = []
        for comment in recipe_comments:
            comments_list.append({
                'id': comment.id,
                'user_id': comment.user_id,
                'recipe_id': comment.recipe_id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'author': comment.commenter.username,
                'author_first_letter': comment.commenter.first_name[0].upper(),
                #  בדיקה אם זה תגובה של המשתמש הנוכחי (רק אם מחובר)
                'is_owner': comment.user_id == current_user.id if current_user else False
            })

        return jsonify(comments_list), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching comments: {e}")
        return jsonify({'message': 'Error fetching comments'}), 500


# ===================================================================
# ניתוב 3: מחיקת תגובה (DELETE)
# מוגן - רק בעלים או מנהל יכולים למחוק
# ===================================================================
@comments.route('/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(current_user, comment_id):
    """
    מחיקת תגובה.
    נגיש רק לבעלים של התגובה או למנהל.
    """
    try:
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'message': 'Comment not found'}), 404

        if comment.user_id != current_user.id and current_user.role != 3:
            return jsonify({'message': 'Unauthorized to delete this comment'}), 403

        comment.delete()

        return jsonify({'message': 'Comment deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting comment: {e}")
        return jsonify({'message': 'Error deleting comment'}), 500