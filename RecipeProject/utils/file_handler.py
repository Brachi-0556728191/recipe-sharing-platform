import os # ספרייה מובנית (Built-in) לניהול אינטראקציה עם מערכת הקבצים (כמו נתיבים)
import uuid # ספרייה מובנית (Built-in) ליצירת מזהים ייחודיים (UUIDs)
import json  # ספרייה מובנית (Built-in) לטיפול בפורמט JSON
from werkzeug.utils import secure_filename # ייבוא חיצוני: פונקציה מ-Flask/Werkzeug לניקוי שם הקובץ
from PIL import Image, ImageFilter, ImageOps  # ייבוא חיצוני: ספריית Pillow לטיפול בתמונות

# הגדרת סוגי קבצים מותרים (תמונות בלבד) - משתנה גלובלי (מוגדר בראש הקובץ)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# מפת האפקטים שבחרת: מקשר שם קצר לתוספת הסיומת - משתנה גלובלי (מוגדר בראש הקובץ)
VARIATION_MAP = {
    'grayscale': '_gs',  # תוספת לשם הקובץ עבור שחור-לבן
    'blur': '_blur',  # תוספת לשם הקובץ עבור טשטוש
    'contour': '_cntr',  # תוספת לשם הקובץ עבור קווי מתאר
}

def allowed_file(filename):
    """
    בודק האם לקובץ יש סיומת חוקית ע"י השוואה לרשימת הסיומות המותרות.

    Args:
        filename (str): שם הקובץ המקורי. (הגיע כארגומנט לפונקציה)

    Returns:
        bool: True אם הסיומת חוקית, False אחרת.
    """
    # התנאי הראשון: בודק אם יש נקודה בשם הקובץ.
    # התנאי השני:
    # filename.rsplit('.', 1)[1] - מפריד את המחרוזת פעם אחת מהסוף לפי הנקודה ומחזיר את החלק השני (הסיומת).
    # .lower() - ממיר את הסיומת לאותיות קטנות (למשל: PNG -> png).
    # in ALLOWED_EXTENSIONS - בודק אם הסיומת נמצאת בסט המשתנה הגלובלי (ALLOWED_EXTENSIONS).
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def create_variations(original_path, output_folder, base_filename):
    """
    מייצרת את 3 הוריאציות הנדרשות (Grayscale, Blur, Contour) ושומרת אותן.

    Args:
        original_path (str): הנתיב המלא לקובץ המקורי השמור על השרת. (הגיע כארגומנט לפונקציה)
        output_folder (str): הנתיב המלא לתיקייה שבה יש לשמור את הווריאציות. (הגיע כארגומנט לפונקציה)
        base_filename (str): שם הקובץ המקורי הייחודי (עם הסיומת). (הגיע כארגומנט לפונקציה)

    Returns:
        str: מחרוזת JSON של מילון המכיל את שמות קבצי הווריאציות החדשים.
    """
    # Image.open(original_path) - טוען את התמונה מהנתיב הפיזי לתוך אובייקט של Pillow.
    img = Image.open(original_path) # משתנה מקומי: אובייקט התמונה המקורי

    variation_paths = {} # משתנה מקומי: מילון שישמור את שמות קבצי הווריאציות
    # os.path.splitext() - מפריד בין שם הקובץ לסיומת שלו.
    main_name, main_ext = os.path.splitext(base_filename) # משתנים מקומיים: שם הקובץ ללא סיומת, והסיומת (כגון .jpg)

    # 1. Grayscale (שחור-לבן)
    # ImageOps.grayscale(img) - פונקציה מובנית ב-ImageOps הממירה תמונה לאפור.
    gs_img = ImageOps.grayscale(img) # משתנה מקומי: אובייקט תמונה בשחור-לבן
    gs_filename = main_name + VARIATION_MAP['grayscale'] + main_ext # משתנה מקומי: שם הקובץ החדש (משתמש בגלובלי VARIATION_MAP)
    # os.path.join() - מחבר את נתיב התיקייה לשם הקובץ.
    gs_path = os.path.join(output_folder, gs_filename) # משתנה מקומי: הנתיב המלא לשמירת הקובץ
    gs_img.save(gs_path) # שומר את התמונה לנתיב הפיזי
    variation_paths['grayscale'] = gs_filename # מוסיף את שם הקובץ החדש למילון

    # 2. Blur (טשטוש)
    blur_img = img.copy() # משתנה מקומי: יוצר עותק של התמונה המקורית.
    # blur_img.filter(ImageFilter.BLUR) - מפעיל את פילטר הטשטוש של Pillow.
    blur_img = blur_img.filter(ImageFilter.BLUR) # משתנה מקומי: הפעלת אפקט הטשטוש
    blur_filename = main_name + VARIATION_MAP['blur'] + main_ext # משתנה מקומי: שם הקובץ החדש
    blur_path = os.path.join(output_folder, blur_filename) # משתנה מקומי: הנתיב המלא לשמירת הקובץ
    blur_img.save(blur_path) # שומר את התמונה המטושטשת
    variation_paths['blur'] = blur_filename # מוסיף את שם הקובץ החדש למילון

    # 3. Contour (קווי מתאר)
    contour_img = img.copy() # משתנה מקומי: יוצר עותק של התמונה המקורית.
    # contour_img.filter(ImageFilter.CONTOUR) - מפעיל את פילטר קווי המתאר של Pillow.
    contour_img = contour_img.filter(ImageFilter.CONTOUR) # משתנה מקומי: הפעלת אפקט קווי המתאר
    contour_filename = main_name + VARIATION_MAP['contour'] + main_ext # משתנה מקומי: שם הקובץ החדש
    contour_path = os.path.join(output_folder, contour_filename) # משתנה מקומי: הנתיב המלא לשמירת הקובץ
    contour_img.save(contour_path) # שומר את התמונה עם קווי המתאר
    variation_paths['contour'] = contour_filename # מוסיף את שם הקובץ החדש למילון

    # json.dumps() - ממיר את מילון הנתיבים למחרוזת בפורמט JSON.
    return json.dumps(variation_paths) # מחזיר את מחרוזת ה-JSON


def save_image(file, upload_folder, user_id):
    """
    שומר את התמונה המקורית בתיקיית המשתמש, מייצר וריאציות, ומחזיר את שמות הקבצים לשמירה ב-DB.

    Args:
        file (FileStorage): אובייקט הקובץ שנשלח מהלקוח (request.files['image']). (הגיע כארגומנט לפונקציה)
        upload_folder (str): הנתיב הבסיסי לתיקיית השמירה (למשל: 'static/images/recipes'). (הגיע כארגומנט לפונקציה)
        user_id (int): מזהה המשתמש (ID) היוצר את המתכון. (הגיע כארגומנט לפונקציה)

    Returns:
        tuple[str, str] or tuple[None, None]: טאפל המכיל את שם הקובץ המקורי הייחודי
                                                ואת מחרוזת ה-JSON של נתיבי הווריאציות.
    """
    # 1. בדיקה שהקובץ קיים ושיש לו שם
    if not file or file.filename == '': # משתנה file הגיע כארגומנט
        return None, None # מחזיר None, None אם אין קובץ או שהשם ריק

    # 2. בדיקה שהסיומת מותרת (שימוש בפונקציה allowed_file)
    if allowed_file(file.filename): # משתנה file הגיע כארגומנט
        # 3. יצירת שם קובץ נקי ובטוח
        original_filename = secure_filename(file.filename) # משתנה מקומי: שם הקובץ מנוקה (משתמש בייבוא secure_filename)
        # 4. חילוץ סיומת הקובץ ויצירת שם ייחודי
        file_ext = os.path.splitext(original_filename)[1] # משתנה מקומי: סיומת הקובץ
        # f"{uuid.uuid4().hex}" - יוצר מחרוזת של מזהה ייחודי של 32 תווים.
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"  # משתנה מקומי: שם קובץ רנדומלי

        # 5. יצירת התיקייה הספציפית למשתמש
        user_folder_name = f"user_{user_id}"  # משתנה מקומי: שם התיקייה (משתמש ב-user_id שהגיע כארגומנט)
        full_upload_folder = os.path.join(upload_folder, user_folder_name) # משתנה מקומי: הנתיב המלא לשמירת הקבצים

        # 6. וידוא שהתיקייה קיימת (יוצר אותה אם לא)
        if not os.path.exists(full_upload_folder): # os.path.exists - בודק אם הנתיב קיים
            os.makedirs(full_upload_folder) # os.makedirs - יוצר את התיקייה (אם אינה קיימת)

        # 7. שמירת הקובץ המקורי פיזית בשרת
        original_file_path = os.path.join(full_upload_folder, unique_filename) # משתנה מקומי: הנתיב המלא לקובץ המקורי
        file.save(original_file_path) # file.save - פונקציה המבצעת את השמירה הפיזית לדיסק (משתמש ב-file שהגיע כארגומנט)

        # 8. יצירת וריאציות התמונה
        variation_json = create_variations(
            original_file_path, full_upload_folder, unique_filename
        ) # משתנה מקומי: מחרוזת JSON של נתיבי הווריאציות

        # 9. מחזיר את שם הקובץ הייחודי ואת מחרוזת ה-JSON
        return unique_filename, variation_json # מחזיר את התוצאה

    # אם הקובץ לא חוקי
    return None, None # מחזיר None, None


def delete_all_user_images_on_fail(base_upload_folder, user_id, filenames_list):
    """
    מנגנון ניקוי: מוחק קבצים שנוצרו על השרת אם הוספת המתכון נכשלה ב-DB (Rollback).

    Args:
        base_upload_folder (str): הנתיב הבסיסי לתיקיית העלאה. (הגיע כארגומנט לפונקציה)
        user_id (int): ה-ID של המשתמש שיצר את הקובץ. (הגיע כארגומנט לפונקציה)
        filenames_list (list[str]): רשימה של שמות הקבצים שנוצרו (המקורי + וריאציות). (הגיע כארגומנט לפונקציה)

    Returns:
        None: הפונקציה לא מחזירה ערך.
    """
    # 1. יצירת נתיב התיקייה הספציפית למשתמש
    user_folder_name = f"user_{user_id}" # משתנה מקומי: שם התיקייה
    full_upload_folder = os.path.join(base_upload_folder, user_folder_name) # משתנה מקומי: הנתיב המלא

    # 2. וידוא שהתיקייה של המשתמש קיימת
    if not os.path.exists(full_upload_folder): # בודק אם התיקייה קיימת
        return # אם לא קיימת, יציאה

    # 3. מוחק את כל הקבצים ברשימה
    for filename in filenames_list: # לולאה על כל שם קובץ ברשימה (filenames_list הגיע כארגומנט)
        if filename: # בודק ששם הקובץ אינו ריק
            file_path = os.path.join(full_upload_folder, filename) # משתנה מקומי: הנתיב המלא לקובץ הנוכחי
            try:
                # 4. אם הקובץ קיים בנתיב, מוחקים אותו
                if os.path.exists(file_path): # בדיקה סופית
                    os.remove(file_path) # os.remove - פונקציה מובנית למחיקת קובץ
            except Exception as e:
                # מדפיס שגיאה אבל ממשיך, כדי לנסות למחוק את כל הקבצים האחרים
                print(f"Error deleting file {filename}: {e}")

# def delete_files_by_path(full_upload_folder, filenames_list):
#     """
#     מוחק קבצים פיזיים מתיקיית השרת.
#
#     :param full_upload_folder: הנתיב המלא לתיקייה ממנה יש למחוק (כולל תיקיית המשתמש).
#     :param filenames_list: רשימת שמות קבצים (רק השם, למשל: ['mycake.jpg', 'mycake_gs.jpg']).
#     """
#     # 3. מוחק את כל הקבצים ברשימה
#     for filename in filenames_list: # לולאה על כל שם קובץ ברשימה
#         if filename: # בודק ששם הקובץ אינו ריק
#             # יוצר את הנתיב המלא לקובץ: full_upload_folder + filename
#             file_path = os.path.join(full_upload_folder, filename)
#             try:
#                 # 4. אם הקובץ קיים בנתיב, מוחקים אותו
#                 if os.path.exists(file_path): # בדיקה סופית
#                     os.remove(file_path) # פונקציה מובנית למחיקת קובץ
#                     print(f"Successfully deleted file: {file_path}") # לוג למעקב
#             except Exception as e:
#                 # מדפיס שגיאה אבל ממשיך, כדי לנסות למחוק את כל הקבצים האחרים
#                 print(f"Error deleting file {filename}: {e}")


def delete_files_by_path(full_upload_folder, filenames_list):
    """
    מוחק קבצים פיזיים מתיקיית השרת.

    :param full_upload_folder: הנתיב המלא לתיקייה (כולל user_X).
    :param filenames_list: רשימת שמות קבצים (רק שמות, לא נתיבים).
    """
    if not os.path.exists(full_upload_folder):
        print(f"⚠️ Warning: Folder does not exist: {full_upload_folder}")
        return

    for filename in filenames_list:
        if filename:
            file_path = os.path.join(full_upload_folder, filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"✅ Successfully deleted: {file_path}")
                else:
                    print(f"⚠️ File not found (skipping): {file_path}")
            except Exception as e:
                print(f"❌ Error deleting {filename}: {e}")



#  הסבר קצר על מושגים חדשים
# import uuid
# ,"ספרייה ליצירת מזהים ייחודיים (Universally Unique Identifier).
# אנו משתמשים בה כדי לתת לכל תמונה שם רנדומלי לחלוטין, כך שאין סיכוי להתנגשות שמות."

# secure_filename
# ,פונקציה של werkzeug (הספרייה ש-Flask בנוי עליה).
# היא מנקה את שם הקובץ מתווים מסוכנים שיכולים לשמש לפריצה לשרת (כמו ../../passwords.txt).

# ALLOWED_EXTENSIONS
# ,סט (Set) המגדיר אילו קבצים אנו מוכנים לקבל.
# זה מונע ממשתמשים להעלות קבצי קוד זדוניים (כמו .py או .exe).

# save_image
# ,"הפונקציה הראשית.
# היא מקבלת את הקובץ,
# מוודאת שהוא תמונה,
# יוצרת לו שם חדש (למשל 5f3a2...jpg),
# שומרת אותו בתיקיית static/images/recipes,
# ומחזירה את השם החדש כדי שנשמור אותו ב-Database."

# os.makedirs
# ,"אם התיקייה לא קיימת במחשב שלך, הפקודה הזו תיצור אותה אוטומטית כדי שהתוכנה לא תקרוס."
