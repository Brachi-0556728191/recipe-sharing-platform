import os  # ייבוא מובנה: לטיפול בנתיבי מערכת קבצים
import json  # ייבוא מובנה: לטיפול בנתוני ה-JSON מה-Request
from flask import Blueprint, request, jsonify, current_app, send_from_directory, session
# Blueprint ליצירת מודול ניתובים
# request לקבלת נתונים
# jsonify להחזרת תגובות
# current_app - הוא משתנה קסם של פלסק שאומר: "תן לי גישה לאפליקציה שכרגע רצה".
# למה צריך אותו? אנחנו משתמשים בו כדי לגשת להגדרות (Configuration) ששמנו ב-app.py, כמו:
# איפה התיקייה של התמונות (UPLOAD_FOLDER)?
# איך לרשום לוגים (logger)?

# send_from_directory:
# זו פונקציה חכמה ומאובטחת של Flask.
# היא לוקחת שם של תיקייה ושם של קובץ.
# היא מוודאת שאף אחד לא מנסה "לרמות" ולבקש קובץ מחוץ לתיקייה (למשל, לנסות לגנוב סיסמאות מהשרת).
# היא מחזירה את הקובץ בצורה שהדפדפן יודע להציג (כתמונה).

from database import db  # ייבוא פנימי: אובייקט מסד הנתונים של SQLAlchemy
from models.ingredient import Ingredient  # ייבוא פנימי: מודל הרכיבים
from models.recipe import Recipe  # ייבוא פנימי: מודל המתכון
from models.rating import Rating  # ייבוא פנימי: מודל הדירוגים
from models.user import User  # ✅ ייבוא פנימי: מודל המשתמש (נדרש לפונקציית העזר)
from utils.decorators import login_required, role_required  # ייבוא פנימי: דקורטורים לאימות משתמשים
from utils.validetor_add_Rrecipe import validate_ingredient  # בדיקות תקינות של הרכיבים
from utils.file_handler import save_image, delete_all_user_images_on_fail, \
    delete_files_by_path  # ייבוא פנימי: פונקציות לטיפול בקבצים

# =================================================================
#  הגדרת ה-Blueprint
# =================================================================
# 'recipes' הוא מודול הניתובים שאחראי על המתכונים.
# Blueprint() - פונקציה מ-Flask שיוצרת מודול ניתובים (recipes הוגדר מקומית)
recipes = Blueprint('recipes', __name__)

# הגדרת התיקייה לשמירת תמונות - משתנה גלובלי (מוגדר בראש הקובץ)
# os.getcwd() - מחזיר את הנתיב הנוכחי של התיקייה הראשית.
# os.path.join() - מחבר את חלקי הנתיב (Path) בצורה נכונה למערכת ההפעלה.
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'images', 'recipes')


# =================================================================
# פונקציית עזר: קבלת current_user (אופציונלי)
# =================================================================
def get_current_user_optional():
    """
    ✅ פונקציית עזר חדשה!
    מחזיר את המשתמש הנוכחי אם הוא מחובר, אחרת None.
    שימושי לניתובים שצריכים להבדיל בין מחובר ללא מחובר.

    למשל:
    - משתמש מחובר יראה את הדירוג האישי שלו
    - משתמש לא מחובר יראה רק את הדירוג הממוצע
    """
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None


# =================================================================
# ניתוב 1: יצירת מתכון חדש - POST /api/recipes/add
# =================================================================
# @recipes.route -HTTP דקורטור המגדיר את הנתיב ואת שיטת ה-.
# @role_required -כארגומנט current_user  דקורטור חיצוני: מוודא שהמשתמש מחובר ומורשה ושולח את
@recipes.route('/add', methods=['POST'])
@role_required(min_role=2)  # ✅ נשאר מוגן - רק משתמשי תוכן (Role 2) ומנהלים (Role 3)
def add_recipe(current_user):  # current_user הגיע כארגומנט מהדקורטור login_required
    """
    מטפל בהוספת מתכון חדש.
    כולל שמירת תמונה ורכיבים
    נגיש רק למשתמשים עם role >= 2 (Uploader או Admin).
    """

    # uploaded_filenames: משתנה מקומי: רשימה ריקה שנועדה לאסוף את שמות כל הקבצים שנוצרו.
    # המטרה: למחוק אותם במקרה של שגיאה ב-DB (Rollback) כדי למנוע זבל קבצים.
    uploaded_filenames = []

    try:
        # 1. קליטת נתוני הטופס וה-JSON מה-Request
        # request.form.get('data') - request הגיע כייבוא, form היא מילון של נתוני טקסט ב-FormData.
        recipe_data_json = request.form.get('data')  # משתנה מקומי: מחרוזת JSON
        # json.loads() - ממיר את מחרוזת ה-JSON למילון פייתון.
        data = json.loads(recipe_data_json)  # משתנה מקומי: מילון נתוני המתכון (כגון title, description וכו')

        # קליטת נתוני התמונה
        # request.files.get('image') - מקבל את אובייקט קובץ התמונה.
        recipe_image = request.files.get('image')  # משתנה מקומי: אובייקט קובץ התמונה

        # 2. שמירת תמונה ויצירת וריאציות
        # save_image: פונקציה שיובאה מ-utils/file_handler.py.
        main_filename, variation_paths_json = save_image(recipe_image, UPLOAD_FOLDER,
                                                         current_user.id)  # משתנים מקומיים: שם הקובץ ומחרוזת ה-JSON
        # הגדרת נתיב: תיקיית התמונה ושם התמונה
        if main_filename:
            relative_path = f"user_{current_user.id}/{main_filename}"
        else:
            relative_path = None  # או טיפול שגיאה מתאים

        # 3. וולידציה על התמונה
        # אם main_filename הוא None, זה אומר שהקובץ חסר או לא חוקי.
        if not main_filename:
            return jsonify(
                {'message': 'Image file is missing or not allowed (PNG, JPG, JPEG, GIF, WEBP are allowed).'}), 400

        # הוספת שם הקובץ המקורי לרשימת הניקוי
        uploaded_filenames.append(main_filename)  # משתנה מקומי: main_filename

        # 4. יצירת אובייקט מתכון (Recipe הגיע כייבוא)
        new_recipe = Recipe(  # משתנה מקומי: מופע חדש של מודל Recipe
            user_id=current_user.id,  # current_user הגיע כארגומנט מהדקורטור
            title=data.get('title'),  # data הוגדר מקומית
            description=data.get('description'),  # תיאור קצר בלבד
            instructions=data.get('instructions'),  # ✅ שדה נפרד
            notes=data.get('notes'),  # ✅ שדה נפרד (אופציונלי)
            servings=data.get('servings'),
            preparation_time=data.get('preparation_time'),  # data הוגדר מקומית
            kashrut=data.get('kashrut'),  # data הוגדר מקומית
            category=data.get('category'),  # data הוגדר מקומית
            difficulty=data.get('difficulty'),  # data הוגדר מקומית
            main_image_path=relative_path,  # relative_path הוגדר מקומית
            variation_paths=variation_paths_json  # variation_paths_json הוגדר מקומית

        )

        # 5. טיפול ברכיבים עם בדיקות תקינות
        ingredients_list = data.get('ingredients', [])
        all_errors = []

        for idx, ingredient_data in enumerate(ingredients_list, start=1):  # אינדקס אנושי
            errors = validate_ingredient(ingredient_data, idx)
            if errors:
                all_errors.extend(errors)
            else:
                new_ingredient = Ingredient(
                    name=ingredient_data['name'],
                    amount=ingredient_data['amount'],
                    unit=ingredient_data['unit']
                )
                new_recipe.ingredients.append(new_ingredient)

        if all_errors:
            # החזרת שגיאות מובנות ללקוח
            return jsonify({'message': 'Validation errors', 'errors': all_errors}), 400

        # 6. שמירת המתכון והרכיבים ל-DB
        new_recipe.save()  # קריאה לפונקציה השמירה

        # 7. הצלחה: אחזור שמות קבצי הווריאציות (כדי להכניס לרשימת הניקוי, במקרה שנצטרך למחוק בעתיד)
        variation_names = json.loads(new_recipe.variation_paths)  # משתנה מקומי: מילון שמות קבצי הווריאציות
        # uploaded_filenames.extend(): מוסיף פריטים מרשימה/מילון קיים לרשימה המקומית uploaded_filenames.
        # variation_names.values(): מחזיר את רשימת שמות הקבצים (הערכים במילון).
        uploaded_filenames.extend(variation_names.values())

        # 8. החזרת תגובה חיובית
        return jsonify({  # jsonify הגיע כייבוא
            'message': 'Recipe added successfully!',
            'recipe_id': new_recipe.id,
            'image_file': main_filename,
            'image_base_url': f"static/images/recipes/user_{current_user.id}/"  # current_user הגיע כארגומנט
        }), 201

    except Exception as e:
        # מנגנון Rollback (ניקוי) במקרה של שגיאה ב-DB או בלוגיקה
        print(f"FATAL ERROR during recipe creation: {e}")  # מדפיס את השגיאה ללוג השרת
        db.session.rollback()
        # מחיקת כל הקבצים שנוצרו על השרת
        # delete_all_user_images_on_fail - פונקציה שיובאה מ-utils/file_handler.py.
        delete_all_user_images_on_fail(UPLOAD_FOLDER, current_user.id,
                                       uploaded_filenames)  # UPLOAD_FOLDER גלובלי, current_user ארגומנט, uploaded_filenames מקומי

        # החזרת שגיאה ללקוח
        return jsonify({'message': f'Server Error: Failed to add recipe. Error: {e}'}), 500


# =================================================================
# ניתוב 2: קבלת כל המתכונים (עבור הגלריה)
# GET /api/recipes/all
# =================================================================
@recipes.route('/all', methods=['GET'])
def get_all_recipes():  # ✅ הסרנו current_user מהחתימה - כבר לא דרוש!
    """
    שליפת כל המתכונים עם סינונים.
    ✅ נגיש לכל המשתמשים (מחוברים ולא מחוברים).
    """
    try:
        # ✅ קבלת המשתמש הנוכחי (אופציונלי)
        # אם מחובר - נחזיר גם את הדירוג האישי שלו
        # אם לא מחובר - current_user יהיה None
        current_user = get_current_user_optional()

        # 1. קבלת פרמטרים לסינון מה-URL
        # לדוגמה: /api/recipes/all?kashrut=1&max_time=60&min_rating=4
        kashrut_param = request.args.get('kashrut')
        max_time_param = request.args.get('max_time')
        min_rating_param = request.args.get('min_rating')
        category_param = request.args.get('category')

        # 2. התחלת בניית השאילתה (עדיין לא רצה ב-DB)
        query = Recipe.query

        # --- סינון כשרות (אם נשלח פרמטר שהוא לא 'all') ---
        if kashrut_param and kashrut_param != 'all':
            query = query.filter(Recipe.kashrut == int(kashrut_param))

        # --- סינון זמן מקסימלי ---
        if max_time_param:
            query = query.filter(Recipe.preparation_time <= int(max_time_param))

        # --- סינון קטגוריה ---
        if category_param and category_param != 'all':
            query = query.filter(Recipe.category == int(category_param))

        # ביצוע השאילתה הראשונית ל-DB
        filtered_recipes = query.all()

        # --- סינון לפי דירוג (נעשה בפייתון כי זה שדה מחושב) ---
        # אם נרצה לעשות זאת ב-SQL זה מורכב יותר, אז לבינתיים נסנן את הרשימה שחזרה
        if min_rating_param:
            min_rating = float(min_rating_param)
            # נשאיר רק מתכונים שהדירוג שלהם גבוה או שווה למה שהתבקש
            # (אם אין דירוג בכלל, נחשיב אותו כ-0)
            filtered_recipes = [r for r in filtered_recipes if r.average_rating >= min_rating]

        # ✅ בדיקה אם המשתמש מחובר ומנהל
        # אם לא מחובר (current_user = None), is_admin יהיה False
        is_admin = current_user.role == 3 if current_user else False

        # ✅ שליפת דירוגי המשתמש (רק אם מחובר)
        user_ratings_map = {}
        if current_user:
            user_ratings = Rating.query.filter_by(user_id=current_user.id).all()
            # המרה למילון: recipe_id -> score
            user_ratings_map = {r.recipe_id: r.score for r in user_ratings}

        # הכנסת כל המתכונים לרשימה אחת אותה הוא יחזיר
        recipes_list = []
        for recipe in filtered_recipes:
            # הרכבת הכתובת המלאה לתמונה
            # הכתובת הזו תפעיל את ניתוב מספר 3 למטה!
            image_url = f"http://localhost:5000/api/recipes/image/{recipe.main_image_path}"

            recipes_list.append({
                'id': recipe.id,
                'user_id': recipe.user_id,  # כדי שנוכל לשלוף את כל המתכונים של משתמש מסוים
                'title': recipe.title,
                'description': recipe.description,
                'kashrut': recipe.kashrut,
                'difficulty': recipe.difficulty,
                'prep_time': recipe.preparation_time,
                'category': recipe.category,
                # נבדוק אם יש דירוגים לפני שמשתמשים ב-average_rating (למרות שהפונקציה כבר עושה את זה),
                # ונחזיר 0 אם אין דירוגים כלל.
                'rating': recipe.average_rating if recipe.ratings else 0,
                'image_url': image_url,  # הלינק לתמונה
                'is_admin': is_admin,  # האם להציג כפתור מחיקה
                'user_rating': user_ratings_map.get(recipe.id, 0)  # ✅ דירוג אישי של המשתמש (0 אם לא מחובר)
            })

        return jsonify(recipes_list), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching recipes: {e}")
        return jsonify({'message': 'Error fetching recipes'}), 500


# =================================================================
# ניתוב 3: שליפת תמונה (ה"מלצר")
# GET /api/recipes/image/<path:filename>
# =================================================================
@recipes.route('/image/<path:filename>', methods=['GET'])
def get_recipe_image(filename):
    """
    מנגנון מאובטח להצגת קבצים (תמונות) השמורים בשרת.
    """
    # משיג את נתיב התיקייה מתוך ההגדרות
    # current_app: אובייקט היישום הנוכחי של Flask (Global Context)
    # config['UPLOAD_FOLDER']: שליפת נתיב התיקייה המוגדרת לשמירת קבצים מתוך הגדרות האפליקציה
    image_dir = current_app.config.get('UPLOAD_FOLDER', 'static/images/recipes')

    # ה-filename נראה ככה: "user_1/mycake.jpg"
    # אנחנו מפרידים אותו לתיקייה וקובץ
    # send_from_directory: פונקציה מאובטחת של Flask לשליחת קובץ מתיקייה ספציפית
    # היא מחזירה את הקובץ המבוקש (filename) מתוך תיקיית הקבצים (upload_folder)
    try:
        directory, file = filename.rsplit('/', 1)
        # הפונקציה ששולחת את הקובץ פיזית לדפדפן
        return send_from_directory(
            directory=f"{image_dir}/{directory}",
            path=file
        )
    # החזרת תגובה עם קוד 404 (לא נמצא) או שגיאה פנימית
    except ValueError:
        return jsonify({'message': 'Invalid file path'}), 404


# =================================================================
# ניתוב 4: מחיקת מתכון (DELETE)
# DELETE /api/recipes/<int:recipe_id>
# ✅ נשאר מוגן - רק משתמשי תוכן ומנהלים
# =================================================================
@recipes.route('/<int:recipe_id>', methods=['DELETE'])
@role_required(min_role=2)  # רק מנהל או כותב המתכון בעצמו! (role=2)
def delete_recipe(current_user, recipe_id):
    """
    מבצע מחיקה של מתכון ממסד הנתונים ושל קובצי התמונה הקשורים אליו.
    """
    print("SESSION user_id:", session.get('user_id'))
    print("CURRENT USER:", current_user.id, "ROLE:", current_user.role)

    try:
        # 1. מציאת המתכון
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            current_app.logger.warning(f"Deletion attempt failed: Recipe ID {recipe_id} not found.")
            return jsonify({'message': f'Recipe with ID {recipe_id} not found.'}), 404

        # בדיקה שמדובר בכותב המתכון / במנהל
        if recipe.user_id != current_user.id and current_user.role != 3:
            return jsonify({'message': 'Unauthorized to edit this recipe'}), 403

        # 2. טיפול במחיקת קבצים פיזיים
        # ✅ תיקון: השדה הנכון הוא main_image_path
        if recipe.main_image_path:
            # recipe.main_image_path נראה ככה: "user_1/abc123.jpg"
            # נפריד לתיקייה וקובץ
            try:
                # פיצול הנתיב: "user_1/abc123.jpg" -> ["user_1", "abc123.jpg"]
                path_parts = recipe.main_image_path.split('/')

                if len(path_parts) != 2:
                    # אם הפורמט לא תקין, דלג על מחיקת קבצים
                    current_app.logger.warning(f"Invalid main_image_path format: {recipe.main_image_path}")
                    # אבל נמשיך למחוק את המתכון מה-DB
                else:
                    user_folder_name = path_parts[0]  # "user_1"
                    main_filename = path_parts[1]  # "abc123.jpg"

                    # בניית הנתיב המלא לתיקיית המשתמש
                    full_upload_folder = os.path.join(
                        current_app.config.get('UPLOAD_FOLDER', 'static/images/recipes'),
                        user_folder_name
                    )

                    # רשימת הקבצים למחיקה
                    files_to_delete = [main_filename]  # התמונה הראשית

                    # אם יש וריאציות, הוסף אותן לרשימה
                    if recipe.variation_paths:
                        try:
                            variation_data = json.loads(recipe.variation_paths)
                            # variation_data = {"grayscale": "img_gs.jpg", "blur": "img_blur.jpg", ...}
                            files_to_delete.extend(variation_data.values())
                        except json.JSONDecodeError as json_e:
                            current_app.logger.error(f"Error decoding variation_paths for recipe {recipe_id}: {json_e}")

                    # מחיקת הקבצים
                    delete_files_by_path(full_upload_folder, files_to_delete)

            except Exception as file_err:
                current_app.logger.error(f"Error deleting files for recipe {recipe_id}: {file_err}")
                # נמשיך למחוק את המתכון מה-DB גם אם מחיקת הקבצים נכשלה

        # 3. מחיקת המתכון ממסד הנתונים
        db.session.delete(recipe)
        db.session.commit()

        current_app.logger.info(f"Recipe ID {recipe_id} deleted by Admin (User ID: {current_user.id})")
        return jsonify({'message': f'Recipe "{recipe.title}" deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to delete recipe {recipe_id}: {e}", exc_info=True)
        return jsonify({'message': f'An internal server error occurred: {str(e)}'}), 500


# =================================================================
# ניתוב 5: קבלת פרטי מתכון מלאים לפי ID
# GET /api/recipes/<int:recipe_id>
# =================================================================
@recipes.route('/<int:recipe_id>', methods=['GET'])
def get_recipe_details(recipe_id):  # ✅ הסרנו current_user מהחתימה
    """
    שליפת פרטי מתכון מלאים, כולל רכיבים, דירוג ממוצע ודירוג אישי (אם משתמש מחובר).
    ✅ נגיש לכל המשתמשים (מחוברים ולא מחוברים).
    """
    try:
        # ✅ קבלת המשתמש הנוכחי (אופציונלי)
        current_user = get_current_user_optional()

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'message': 'Recipe not found'}), 404

        # המרת רשימת הרכיבים
        ingredients_data = []
        for ing in recipe.ingredients:
            ingredients_data.append({
                'name': ing.name,
                'amount': ing.amount,
                'unit': ing.unit
            })

        # טיפול בווריאציות (תמונות נוספות)
        variation_urls = []
        if recipe.variation_paths:
            try:
                # המרה מ-JSON למילון
                variations_dict = json.loads(recipe.variation_paths)
                # בניית URL לכל וריאציה
                base_url = f"http://localhost:5000/api/recipes/image/user_{recipe.user_id}/"
                for effect, filename in variations_dict.items():
                    variation_urls.append({
                        'effect': effect,
                        'url': base_url + filename
                    })
            except Exception as e:
                current_app.logger.error(f"Error parsing variations: {e}")

        # ✅ בדיקה האם המשתמש הנוכחי כבר דירג את המתכון הזה (רק אם מחובר)
        current_user_score = 0
        if current_user:
            user_rating = Rating.query.filter_by(user_id=current_user.id, recipe_id=recipe_id).first()
            current_user_score = user_rating.score if user_rating else 0

        # בניית אובייקט התגובה
        recipe_data = {
            'id': recipe.id,
            'title': recipe.title,
            'description': recipe.description,  # תיאור קצר בלבד
            'instructions': recipe.instructions,  # ✅ הוראות הכנה
            'notes': recipe.notes,  # ✅ הערות
            'servings': recipe.servings,
            'kashrut': recipe.kashrut,
            'difficulty': recipe.difficulty,
            'prep_time': recipe.preparation_time,
            'category': recipe.category,
            'average_rating': recipe.average_rating,  # משתמש ב-property שקיים במודל
            'user_rating': current_user_score,  # הדירוג האישי של המשתמש (0 אם לא מחובר)
            'main_image_url': f"http://localhost:5000/api/recipes/image/{recipe.main_image_path}",
            'ingredients': ingredients_data,
            'variations': variation_urls,
            # יש למודל מתכון מאפיין כותב שנוצר בעקבות היחס בין משתמש למתכון שיצרנו במודל משתמש
            'author': f"{recipe.author.first_name} {recipe.author.last_name}"
        }

        return jsonify(recipe_data), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching recipe details: {e}")
        return jsonify({'message': 'Server error fetching recipe'}), 500


# =================================================================
# ניתוב 6: חיפוש מתכונים לפי רכיבים
# POST /api/recipes/search-by-ingredients
# =================================================================
@recipes.route('/search-by-ingredients', methods=['POST'])
def search_recipes_by_ingredients():
    """
    חיפוש מתכונים לפי רכיבים עם דירוג התאמה.
    ✅ נגיש לכל המשתמשים (מחוברים ולא מחוברים).
    """
    try:
        # ✅ קבלת המשתמש הנוכחי (אופציונלי)
        current_user = get_current_user_optional()

        # =============================
        # שלב 1: קבלת נתונים
        # =============================
        data = request.get_json()
        user_ingredients_list = data.get('ingredients', [])
        # כדי להסתמך על סינונים קודמים מקבלים גם את הסינונים שבחר המשתמש
        kashrut = data.get('kashrut')
        category=data.get('category')
        max_time = data.get('max_time')
        min_rating = data.get('min_rating')

        print(f"🔍 Searching for ingredients: {user_ingredients_list}")

        if not user_ingredients_list:
            print("❌ No ingredients provided")
            return jsonify([]), 200

        # המרת לקטן וניקוי
        user_ingredients_set = set(
            ing.strip().lower() for ing in user_ingredients_list if ing.strip()
        )

        print(f"✅ Normalized user ingredients: {user_ingredients_set}")

        # שליפת כל המתכונים עם סינונים
        query = Recipe.query

        if kashrut != 'all':
            query = query.filter(Recipe.kashrut == int(kashrut))
            print(f"📦 Total recipes in DB: {kashrut}")

        if category!='all':
            query=query.filter(Recipe.category==int(category))
        if max_time:
            query = query.filter(Recipe.preparation_time <= int(max_time))

        all_recipes = query.all()
        print(f"📦 Total recipes in DB: {len(all_recipes)}")

        results = []

        # =============================
        # שלב 2: חישוב התאמה לכל מתכון
        # =============================
        for recipe in all_recipes:
            # בדיקה אם יש רכיבים
            if not recipe.ingredients:
                continue

            # המרת רכיבי המתכון ל-Set (קטן)
            recipe_ingredients_set = {
                ing.name.strip().lower() for ing in recipe.ingredients
            }

            print(f"\n🍳 Recipe '{recipe.title}' ingredients: {recipe_ingredients_set}")

            # חיתוך בין הרכיבים
            common_ingredients = user_ingredients_set & recipe_ingredients_set

            print(f"   Common: {common_ingredients}")

            # חישוב ציון ההתאמה
            match_score = len(common_ingredients) / len(recipe_ingredients_set)

            print(f"   Match score: {match_score * 100:.1f}%")

            # סינון תוצאות חלשות (פחות מ-20%)
            if match_score < 0.2:
                print(f"   ❌ Below threshold, skipping")
                continue

            results.append({
                'recipe': recipe,
                'score': match_score
            })

        # מיון לפי ציון התאמה (מהגבוה לנמוך)
        results.sort(key=lambda x: x['score'], reverse=True)

        print(f"\n✅ Found {len(results)} matching recipes")

        if min_rating:
            results = [
                r for r in results
                if r['recipe'].average_rating >= float(min_rating)
            ]

        # =============================
        # שלב 3: בניית JSON לתשובה
        # =============================
        # ✅ בדיקה אם המשתמש מחובר ומנהל
        is_admin = current_user.role == 3 if current_user else False

        response = []

        for item in results:
            recipe = item['recipe']
            match_percent = round(item['score'] * 100, 1)

            image_url = f"http://localhost:5000/api/recipes/image/{recipe.main_image_path}"

            response.append({
                'id': recipe.id,
                'title': recipe.title,
                'description': recipe.description,
                'servings': recipe.servings,
                'rating': recipe.average_rating if recipe.ratings else 0,
                'prep_time': recipe.preparation_time,
                'kashrut': recipe.kashrut,
                'category': recipe.category,
                'difficulty': recipe.difficulty,
                'match_score': match_percent,
                'image_url': image_url,
                'is_admin': is_admin
            })

        print(f"\n📤 Returning {len(response)} recipes to client")
        return jsonify(response), 200

    except Exception as e:
        print(f"❌ ERROR in search_recipes_by_ingredients: {e}")
        import traceback
        traceback.print_exc()
        current_app.logger.error(f"Ingredient search error: {e}")
        return jsonify({'message': 'Search failed', 'error': str(e)}), 500


# =================================================================
# ניתוב 7: עריכת מתכון קיים (UPDATE)
# PUT /api/recipes/<int:recipe_id>
# ✅ נשאר מוגן - רק משתמשי תוכן ומנהלים
# =================================================================
@recipes.route('/<int:recipe_id>', methods=['PUT'])
@login_required
def update_recipe(current_user, recipe_id):
    """
    מעדכן מתכון קיים.
    אם נשלחה תמונה חדשה - הישנה נמחקת והחדשה נשמרת.
    רכיבים מתעדכנים ע"י מחיקת הישנים ויצירת חדשים (Full Replace).
    """
    try:
        # 1. שליפת המתכון מה-DB
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'message': 'Recipe not found'}), 404

        # 2. בדיקת הרשאות (רק הבעלים או מנהל יכולים לערוך)
        if recipe.user_id != current_user.id and current_user.role != 3:
            return jsonify({'message': 'Unauthorized to edit this recipe'}), 403

        # 3. קליטת הנתונים (בדיוק כמו ב-add_recipe)
        # הנתונים מגיעים ב-FormData בתוך שדה 'data'
        recipe_data_json = request.form.get('data')

        # אם לא נשלח JSON, אי אפשר לעדכן
        if not recipe_data_json:
            return jsonify({'message': 'No data provided'}), 400

        data = json.loads(recipe_data_json)

        # 4. עדכון שדות טקסטואליים (רק אם נשלחו)
        recipe.title = data.get('title', recipe.title)
        recipe.description = data.get('description', recipe.description)
        recipe.instructions = data.get('instructions', recipe.instructions)  # ✅ הוסף
        recipe.notes = data.get('notes', recipe.notes)  # ✅ הוסף
        recipe.servings = data.get('servings', recipe.servings)
        recipe.preparation_time = data.get('preparation_time', recipe.preparation_time)
        recipe.kashrut = data.get('kashrut', recipe.kashrut)
        recipe.category = data.get('category', recipe.category)
        recipe.difficulty = data.get('difficulty', recipe.difficulty)

        # 5. טיפול בתמונה (רק אם המשתמש העלה תמונה חדשה)
        new_image = request.files.get('image')
        if new_image:
            # א. מחיקת התמונה הישנה (כדי למנוע זבל)
            if recipe.main_image_path:
                try:
                    path_parts = recipe.main_image_path.split('/')
                    if len(path_parts) == 2:
                        user_folder_name = path_parts[0]
                        old_main_filename = path_parts[1]

                        full_upload_folder = os.path.join(
                            current_app.config.get('UPLOAD_FOLDER', 'static/images/recipes'),
                            user_folder_name
                        )

                        files_to_delete = [old_main_filename]
                        # הוספת הווריאציות הישנות לרשימת המחיקה
                        if recipe.variation_paths:
                            old_variations = json.loads(recipe.variation_paths)
                            files_to_delete.extend(old_variations.values())

                        # קריאה לפונקציה שלך מ-file_handler למחיקה פיזית
                        delete_files_by_path(full_upload_folder, files_to_delete)
                except Exception as del_err:
                    print(f"Warning: Failed to delete old image files: {del_err}")

            # ב. שמירת התמונה החדשה (באמצעות הפונקציה שלך)
            main_filename, variation_paths_json = save_image(new_image, UPLOAD_FOLDER, recipe.user_id)

            if main_filename:
                recipe.main_image_path = f"user_{recipe.user_id}/{main_filename}"
                recipe.variation_paths = variation_paths_json

        # 6. עדכון רכיבים (Ingredients)
        # השיטה הכי בטוחה: מחיקת כל הרכיבים הישנים והוספת החדשים
        ingredients_list = data.get('ingredients', [])

        # אם הרשימה לא ריקה, נבצע ולידציה והחלפה
        if ingredients_list:
            # ולידציה (שימוש בפונקציה שלך)
            all_errors = []
            for idx, ingredient_data in enumerate(ingredients_list, start=1):
                errors = validate_ingredient(ingredient_data, idx)
                if errors:
                    all_errors.extend(errors)

            if all_errors:
                return jsonify({'message': 'Validation errors', 'errors': all_errors}), 400

            # ניקוי הרשימה הישנה ב-DB
            recipe.ingredients.clear()

            # הוספת הרכיבים החדשים
            for ingredient_data in ingredients_list:
                new_ingredient = Ingredient(
                    name=ingredient_data['name'],
                    amount=ingredient_data['amount'],
                    unit=ingredient_data['unit']
                )
                recipe.ingredients.append(new_ingredient)

        # 7. שמירה סופית ב-DB
        db.session.commit()

        return jsonify({'message': 'Recipe updated successfully!'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating recipe: {e}")
        return jsonify({'message': f'Error updating recipe: {str(e)}'}), 500