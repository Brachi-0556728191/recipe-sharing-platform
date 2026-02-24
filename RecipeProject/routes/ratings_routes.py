from flask import Blueprint, request, jsonify
from database import db
from models.recipe import Recipe
from models.rating import Rating
from utils.decorators import login_required

# יצירת Blueprint חדש לדירוגים
ratings = Blueprint('ratings', __name__)

# =================================================================
# ניתוב: דירוג מתכון (Rate Recipe)
# URL: /api/ratings/<int:recipe_id>
# Method: POST
# =================================================================
@ratings.route('/<int:recipe_id>', methods=['POST'])
@login_required
def rate_recipe(current_user, recipe_id):
    """
    מאפשר למשתמש לדרג מתכון, או לעדכן דירוג קיים.
    הנתיב הופרד מקובץ המתכונים לניהול נקי יותר.
    """
    try:
        data = request.get_json()  # קבלת נתונים שנשלחו בגוף הבקשה כ-JSON
        score = data.get('score')  # שליפת הדירוג (score) מתוך הנתונים

        # בדיקת ולידציה בסיסית: ציון חייב להיות קיים ובין 1 ל-5
        if not score or not (1 <= score <= 5):
            return jsonify({'message': 'Invalid score. Must be between 1 and 5'}), 400

        # בדיקה האם המתכון קיים
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'message': 'Recipe not found'}), 404

        # בדיקה האם המשתמש כבר דירג - אם כן, נעדכן את הדירוג
        existing_rating = Rating.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()

        if existing_rating:  # אם נמצא דירוג קיים
            existing_rating.score = score  # עדכון ציון הדירוג
            message = 'Rating updated successfully'
        else:  # אם לא קיים דירוג
            # יצירת מופע חדש של דירוג
            new_rating = Rating(user_id=current_user.id, recipe_id=recipe_id, score=score)
            db.session.add(new_rating)
            message = 'Rating added successfully'

        db.session.commit()

        # מחזירים את הממוצע החדש כדי לעדכן את הממשק מיידית
        return jsonify({'message': message, 'new_average': recipe.average_rating}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error rating recipe: {e}")  # הדפסה ללוג
        return jsonify({'message': 'Error saving rating'}), 500

